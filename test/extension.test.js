const assert = require('assert');
const path = require('path');
const fs = require('fs');
const vscode = require('vscode');
const { scanViewFiles, isInsideViewAssignment, createViewFile, VIEW_TEMPLATE } = require('../extension');

const FIXTURES_DIR = path.join(__dirname, 'fixtures');
const VIEWS_DIR = path.join(FIXTURES_DIR, 'resources', 'views');
const FILE_EXT = '.blade.php';
const TEMP_DIR = path.join(FIXTURES_DIR, 'temp_views');

suite('Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	// --- scanViewFiles ---
	suite('scanViewFiles', () => {
		test('should find all 5 blade files', () => {
			const views = scanViewFiles(VIEWS_DIR, FILE_EXT);
			assert.strictEqual(views.length, 5);
		});

		test('should return dot notation names', () => {
			const views = scanViewFiles(VIEWS_DIR, FILE_EXT);
			const names = views.map(v => v.name).sort();
			assert.deepStrictEqual(names, [
				'components.button',
				'filament.pages.dashboard',
				'filament.pages.settings',
				'filament.widgets.stats-overview',
				'welcome'
			]);
		});

		test('should return correct relative paths', () => {
			const views = scanViewFiles(VIEWS_DIR, FILE_EXT);
			const dashboardView = views.find(v => v.name === 'filament.pages.dashboard');
			assert.strictEqual(dashboardView.relativePath, 'filament/pages/dashboard.blade.php');
		});

		test('should return correct relative path for root-level view', () => {
			const views = scanViewFiles(VIEWS_DIR, FILE_EXT);
			const welcomeView = views.find(v => v.name === 'welcome');
			assert.strictEqual(welcomeView.relativePath, 'welcome.blade.php');
		});

		test('should return empty array for non-existent directory', () => {
			const views = scanViewFiles('/nonexistent/path', FILE_EXT);
			assert.strictEqual(views.length, 0);
		});

		test('should handle custom file extension', () => {
			const views = scanViewFiles(VIEWS_DIR, '.html');
			assert.strictEqual(views.length, 0);
		});
	});

	// --- isInsideViewAssignment ---
	suite('isInsideViewAssignment', () => {
		function mockDocument(lineText) {
			return {
				lineAt: () => ({ text: lineText })
			};
		}

		function mockPosition(character) {
			return { line: 0, character };
		}

		test('should detect single-quote $view assignment', () => {
			const line = "    protected static string $view = 'filament.pages.";
			assert.strictEqual(isInsideViewAssignment(mockDocument(line), mockPosition(line.length)), true);
		});

		test('should detect double-quote $view assignment', () => {
			const line = '    protected static string $view = "filament.pages.';
			assert.strictEqual(isInsideViewAssignment(mockDocument(line), mockPosition(line.length)), true);
		});

		test('should detect empty string start', () => {
			const line = "    protected static string $view = '";
			assert.strictEqual(isInsideViewAssignment(mockDocument(line), mockPosition(line.length)), true);
		});

		test('should NOT trigger outside $view context', () => {
			const line = "    $name = 'some.value";
			assert.strictEqual(isInsideViewAssignment(mockDocument(line), mockPosition(line.length)), false);
		});

		test('should NOT trigger after string is closed', () => {
			const line = "    $view = 'filament.pages.dashboard'";
			assert.strictEqual(isInsideViewAssignment(mockDocument(line), mockPosition(line.length)), false);
		});

		test('should handle $view with extra spaces', () => {
			const line = "    $view   =   '";
			assert.strictEqual(isInsideViewAssignment(mockDocument(line), mockPosition(line.length)), true);
		});

		test('should detect cursor mid-string', () => {
			const line = "    $view = 'filament.pa";
			assert.strictEqual(isInsideViewAssignment(mockDocument(line), mockPosition(line.length)), true);
		});
	});

	// --- getViewStringStartColumn (duplicate prefix fix) ---
	suite('getViewStringStartColumn', () => {
		const { getViewStringStartColumn } = require('../extension');

		test('should return position after single quote', () => {
			//                                        ^ col 37 (after the quote)
			const line = "    protected static string $view = '";
			const result = getViewStringStartColumn(line, line.length);
			assert.strictEqual(result, 37);
		});

		test('should return position after quote when text already typed', () => {
			// The user typed "filament." — cursor is at col 45
			// The replace range must start at col 37 (after the quote)
			const line = "    protected static string $view = 'filament.";
			const result = getViewStringStartColumn(line, line.length);
			assert.strictEqual(result, 37);
		});

		test('should prevent duplicate prefix — simulated scenario', () => {
			// Bug scenario: user types "filament." then selects "filament.pages.dashboard"
			// The replacement range must cover "filament." (cols 37-46)
			// so "filament.pages.dashboard" replaces it entirely, NOT appends after it
			const line = "    protected static string $view = 'filament.";
			const cursorCol = line.length; // 46
			const startCol = getViewStringStartColumn(line, cursorCol);
			const typedText = line.substring(startCol, cursorCol); // what's between quote and cursor
			const selectedItem = 'filament.pages.dashboard';

			// After replacement: the range [startCol, cursorCol] is replaced by selectedItem
			const result = line.substring(0, startCol) + selectedItem;
			assert.strictEqual(result, "    protected static string $view = 'filament.pages.dashboard");
			assert.ok(!result.includes('filament.filament'), 'Should NOT have duplicate prefix');
		});

		test('should work with double quotes', () => {
			const line = '    $view = "filament.pages.';
			const result = getViewStringStartColumn(line, line.length);
			assert.strictEqual(result, 13); // right after the "
		});

		test('should return cursor position if not inside $view', () => {
			const line = "    $name = 'something";
			const result = getViewStringStartColumn(line, line.length);
			assert.strictEqual(result, line.length);
		});
	});

	// --- Quick Fix: createViewFile ---
	suite('createViewFile', () => {
		teardown(() => {
			if (fs.existsSync(TEMP_DIR)) {
				fs.rmSync(TEMP_DIR, { recursive: true });
			}
		});

		test('VIEW_TEMPLATE should contain correct Filament page structure', () => {
			assert.ok(VIEW_TEMPLATE.includes('<x-filament-panels::page>'));
			assert.ok(VIEW_TEMPLATE.includes('{{-- Page content --}}'));
			assert.ok(VIEW_TEMPLATE.includes('</x-filament-panels::page>'));
		});

		test('VIEW_TEMPLATE should have correct line structure', () => {
			const lines = VIEW_TEMPLATE.split('\n');
			assert.strictEqual(lines[0], '<x-filament-panels::page>');
			assert.strictEqual(lines[1], '    {{-- Page content --}}');
			assert.strictEqual(lines[2], '</x-filament-panels::page>');
			assert.strictEqual(lines[3], '');
		});

		test('should create file with correct template content', () => {
			const filePath = path.join(TEMP_DIR, 'test-view.blade.php');
			createViewFile(filePath);

			assert.strictEqual(fs.existsSync(filePath), true);
			const content = fs.readFileSync(filePath, 'utf-8');
			assert.strictEqual(content, VIEW_TEMPLATE);
		});

		test('should create nested directories recursively', () => {
			const filePath = path.join(TEMP_DIR, 'filament', 'pages', 'custom', 'deep-view.blade.php');
			createViewFile(filePath);

			assert.strictEqual(fs.existsSync(filePath), true);
			assert.strictEqual(fs.existsSync(path.join(TEMP_DIR, 'filament', 'pages', 'custom')), true);
		});

		test('should create file in already existing directory', () => {
			fs.mkdirSync(TEMP_DIR, { recursive: true });
			const filePath = path.join(TEMP_DIR, 'simple.blade.php');
			createViewFile(filePath);

			assert.strictEqual(fs.existsSync(filePath), true);
			const content = fs.readFileSync(filePath, 'utf-8');
			assert.strictEqual(content, VIEW_TEMPLATE);
		});
	});

	// --- Integration ---
	suite('Integration', () => {
		test('every scanned view should resolve to an existing file', () => {
			const views = scanViewFiles(VIEWS_DIR, FILE_EXT);
			for (const view of views) {
				const filePath = path.join(VIEWS_DIR, view.name.replace(/\./g, '/') + FILE_EXT);
				assert.strictEqual(fs.existsSync(filePath), true, `File not found for view: ${view.name}`);
			}
		});
	});
});
