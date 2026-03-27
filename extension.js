const vscode = require('vscode');
const path = require('path');
const fs = require('fs');

/**
 * Helper function to convert 'dot.notation.view' into an actual file path
 */
function getViewFilePath(document, viewName) {
    // 1. Identify which workspace folder contains the current file
    const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
    if (!workspaceFolder) return null;

    // 2. Read user configurations
    const config = vscode.workspace.getConfiguration('filament-goto-view');
    const viewPathDir = config.get('viewPath') || 'resources/views';
    const fileExt = config.get('extension') || '.blade.php';
    const subFolder = config.get('projectSubFolder') || '';

    // 3. Convert Laravel dots to directory slashes (/)
    const fileName = viewName.replace(/\./g, '/') + fileExt;

    // 4. Construct the final path
    return path.join(
        workspaceFolder.uri.fsPath,
        subFolder,
        viewPathDir,
        fileName
    );
}

function activate(context) {
    const diagnosticCollection = vscode.languages.createDiagnosticCollection('filament-views');

    // --- FEATURE 1: GOTO VIEW (DOCUMENT LINK) ---
    // This provider controls exactly which text is clickable.
    let linkProvider = vscode.languages.registerDocumentLinkProvider('php', {
        provideDocumentLinks(document) {
            const text = document.getText();
            const links = [];
            // Global regex to find all occurrences of $view = '...'
            const regex = /\$view\s*=\s*['"]([^'"]+)['"]/g; 
            let match;

            while ((match = regex.exec(text)) !== null) {
                const viewPath = match[1]; // e.g., filament.pages.biorressonancia
                const fullPath = getViewFilePath(document, viewPath);

                if (fullPath && fs.existsSync(fullPath)) {
                    // Find where the view name starts within the matched string
                    const viewNameIndex = match[0].indexOf(viewPath);
                    
                    // Calculate the exact start and end position of the view name
                    const startPos = document.positionAt(match.index + viewNameIndex);
                    const endPos = startPos.translate(0, viewPath.length);
                    
                    // Create the Range that encompasses the entire string
                    const range = new vscode.Range(startPos, endPos);

                    // Create the link: (clickable range, destination URI)
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
                // Same logic to calculate Range to underline only the string
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

    // Events to validate errors in real-time
    context.subscriptions.push(
        vscode.workspace.onDidChangeTextDocument(e => updateDiagnostics(e.document)),
        vscode.workspace.onDidOpenTextDocument(updateDiagnostics),
        linkProvider,
        diagnosticCollection
    );

    // Run once when the editor is opened
    if (vscode.window.activeTextEditor) {
        updateDiagnostics(vscode.window.activeTextEditor.document);
    }
}

function deactivate() {}

module.exports = { activate, deactivate };