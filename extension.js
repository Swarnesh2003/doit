const vscode = require('vscode');

function activate(context) {
  console.log('Extension "vscode-extension-example" is now active!');

  let disposable = vscode.commands.registerCommand('extension.openSearchTab', function () {
    // Create Webview Panel
    const panel = vscode.window.createWebviewPanel(
      'searchTab', // Unique ID for the webview
      'Search Tab', // Tab Title
      vscode.ViewColumn.One, // Where to display the webview (in the left panel)
      {
        enableScripts: true // Allow scripts in the webview
      }
    );

    // Set the HTML content of the webview
    panel.webview.html = getWebviewContent();

    // Listen for messages from the webview (button click)
    panel.webview.onDidReceiveMessage(
      async (message) => {
        if (message.command === 'search') {
          const input = message.text.trim().toLowerCase();

          try {
            switch (input) {
              case 'create':
                // Create a new file
                const createUri = vscode.Uri.file(`${vscode.workspace.rootPath}/newFile.txt`);
                await vscode.workspace.fs.writeFile(createUri, Buffer.from('New file content'));
                vscode.window.showInformationMessage('File created!');
                break;

              case 'read':
                // Read the content of the file
                const readUri = vscode.Uri.file(`${vscode.workspace.rootPath}/newFile.txt`);
                const content = await vscode.workspace.fs.readFile(readUri);
                vscode.window.showInformationMessage(`File content: ${content.toString()}`);
                break;

              case 'delete':
                // Delete the file
                const deleteUri = vscode.Uri.file(`${vscode.workspace.rootPath}/newFile.txt`);
                await vscode.workspace.fs.delete(deleteUri);
                vscode.window.showInformationMessage('File deleted!');
                break;

              case 'list':
                // List contents of the folder
                const folderUri = vscode.Uri.file(vscode.workspace.rootPath);
                const files = await vscode.workspace.fs.readDirectory(folderUri);
                vscode.window.showInformationMessage(
                  `Folder contents: ${files.map((file) => file[0]).join(', ')}`
                );
                break;

              default:
                vscode.window.showErrorMessage('Unknown command!');
                break;
            }
          } catch (error) {
            vscode.window.showErrorMessage(`Error: ${error.message}`);
          }
        }
      },
      undefined,
      context.subscriptions
    );
  });

  context.subscriptions.push(disposable);
}

function getWebviewContent() {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Search Tab</title>
    </head>
    <body>
      <h1>Search Tab</h1>
      <input type="text" id="searchInput" placeholder="Enter command (create, read, delete, list)" />
      <button id="searchButton">Submit</button>

      <script>
        const vscode = acquireVsCodeApi();

        document.getElementById('searchButton').addEventListener('click', () => {
          const input = document.getElementById('searchInput').value.trim();
          vscode.postMessage({ command: 'search', text: input });
        });
      </script>
    </body>
    </html>
  `;
}

function deactivate() {}

module.exports = {
  activate,
  deactivate
};
