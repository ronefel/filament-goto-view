const vscode = require('vscode');
const path = require('path');
const fs = require('fs');

/**
 * Helper function to convert 'dot.notation.view' into an actual file path
 */
function getViewFilePath(document, viewName) {
    const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
    if (!workspaceFolder) return null;

    const config = vscode.workspace.getConfiguration('filament-goto-view');
    const viewPathDir = config.get('viewPath') || 'resources/views';
    const fileExt = config.get('extension') || '.blade.php';
    const subFolder = config.get('projectSubFolder') || '';

    const fileName = viewName.replace(/\./g, '/') + fileExt;

    return path.join(
        workspaceFolder.uri.fsPath,
        subFolder,
        viewPathDir,
        fileName
    );
}

/**
 * Recursively scan the views directory and return all view names in dot notation
 */
function scanViewFiles(viewsDir, fileExt, prefix = '') {
    const views = [];

    if (!fs.existsSync(viewsDir)) return views;

    const entries = fs.readdirSync(viewsDir, { withFileTypes: true });

    for (const entry of entries) {
        const currentPrefix = prefix ? `${prefix}.${entry.name}` : entry.name;

        if (entry.isDirectory()) {
            views.push(...scanViewFiles(
                path.join(viewsDir, entry.name),
                fileExt,
                currentPrefix
            ));
        } else if (entry.name.endsWith(fileExt)) {
            const viewName = currentPrefix.slice(0, -fileExt.length);
            views.push({
                name: viewName,
                relativePath: prefix ? `${prefix.replace(/\./g, '/')}/${entry.name}` : entry.name
            });
        }
    }

    return views;
}

/**
 * Check if cursor is inside a $view = '...' string context
 */
function isInsideViewAssignment(document, position) {
    const lineText = document.lineAt(position.line).text;
    const textBeforeCursor = lineText.substring(0, position.character);

    // Match: $view = '...<cursor> (single or double quotes, string not yet closed)
    const singleQuoteMatch = /\$view\s*=\s*'[^']*$/.test(textBeforeCursor);
    const doubleQuoteMatch = /\$view\s*=\s*"[^"]*$/.test(textBeforeCursor);

    return singleQuoteMatch || doubleQuoteMatch;
}

function activate(context) {
    const diagnosticCollection = vscode.languages.createDiagnosticCollection('filament-views');

    // --- FEATURE 1: GOTO VIEW (DOCUMENT LINK) ---
    const linkProvider = vscode.languages.registerDocumentLinkProvider('php', {
        provideDocumentLinks(document) {
            const text = document.getText();
            const links = [];
            const regex = /\$view\s*=\s*['"]([^'"]+)['"]/g;
            let match;

            while ((match = regex.exec(text)) !== null) {
                const viewPath = match[1];
                const fullPath = getViewFilePath(document, viewPath);

                if (fullPath && fs.existsSync(fullPath)) {
                    const viewNameIndex = match[0].indexOf(viewPath);
                    const startPos = document.positionAt(match.index + viewNameIndex);
                    const endPos = startPos.translate(0, viewPath.length);
                    const range = new vscode.Range(startPos, endPos);

                    links.push(new vscode.DocumentLink(range, vscode.Uri.file(fullPath)));
                }
            }
            return links;
        }
    });

    // --- FEATURE 2: SHOW ERROR IF VIEW DOES NOT EXIST (DIAGNOSTICS) ---
    const updateDiagnostics = (document) => {
        if (document.languageId !== 'php') return;

        const diagnostics = [];
        const text = document.getText();
        const regex = /\$view\s*=\s*['"]([^'"]+)['"]/g;
        let match;

        while ((match = regex.exec(text)) !== null) {
            const viewPath = match[1];
            const fullPath = getViewFilePath(document, viewPath);

            if (!fullPath || !fs.existsSync(fullPath)) {
                const viewNameIndex = match[0].indexOf(viewPath);
                const startPos = document.positionAt(match.index + viewNameIndex);
                const endPos = startPos.translate(0, viewPath.length);
                const range = new vscode.Range(startPos, endPos);

                diagnostics.push(new vscode.Diagnostic(
                    range,
                    `FilamentGotoView Error: View "${viewPath}" not found in the specified views directory.`,
                    vscode.DiagnosticSeverity.Error
                ));
            }
        }
        diagnosticCollection.set(document.uri, diagnostics);
    };

    // --- FEATURE 3: AUTOCOMPLETE VIEW NAMES ---
    const completionProvider = vscode.languages.registerCompletionItemProvider('php', {
        provideCompletionItems(document, position) {
            if (!isInsideViewAssignment(document, position)) return undefined;

            const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
            if (!workspaceFolder) return undefined;

            const config = vscode.workspace.getConfiguration('filament-goto-view');
            const viewPathDir = config.get('viewPath') || 'resources/views';
            const fileExt = config.get('extension') || '.blade.php';
            const subFolder = config.get('projectSubFolder') || '';

            const viewsDir = path.join(workspaceFolder.uri.fsPath, subFolder, viewPathDir);
            const viewFiles = scanViewFiles(viewsDir, fileExt);

            return viewFiles.map((view) => {
                const item = new vscode.CompletionItem(view.name, vscode.CompletionItemKind.File);
                item.detail = view.relativePath;
                item.insertText = view.name;
                item.filterText = view.name;
                item.sortText = view.name;
                return item;
            });
        }
    }, "'", '"', '.');

    // Events to validate errors in real-time
    context.subscriptions.push(
        vscode.workspace.onDidChangeTextDocument(e => updateDiagnostics(e.document)),
        vscode.workspace.onDidOpenTextDocument(updateDiagnostics),
        linkProvider,
        completionProvider,
        diagnosticCollection
    );

    // Run once when the editor is opened
    if (vscode.window.activeTextEditor) {
        updateDiagnostics(vscode.window.activeTextEditor.document);
    }
}

function deactivate() {}

module.exports = { activate, deactivate };