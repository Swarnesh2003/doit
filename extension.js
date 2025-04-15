const vscode = require('vscode');
const axios = require('axios');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  const outputChannel = vscode.window.createOutputChannel("Gemini Executor");

  const disposable = vscode.commands.registerCommand('extension.geminiSearch', async () => {
    const input = await vscode.window.showInputBox({
      placeHolder: 'What do you want to do? (e.g., create a Flask app)'
    });

    if (!input) return;

    try {
      outputChannel.clear();
      outputChannel.show();
      outputChannel.appendLine(`User input: ${input}`);

      const response = await axios.post('http://localhost:5000/process', { query: input });
      let data = response.data;

      if (typeof data === 'string') {
        data = JSON.parse(data);
      }

      outputChannel.appendLine(`Server response:\n${JSON.stringify(data, null, 2)}`);

      const workspaceFolders = vscode.workspace.workspaceFolders;
      const workspacePath = workspaceFolders ? workspaceFolders[0].uri.fsPath : undefined;

      if (!workspacePath) {
        const msg = 'No workspace folder found. Please open a folder in VS Code.';
        vscode.window.showErrorMessage(msg);
        outputChannel.appendLine(msg);
        return;
      }

      // Handle file creation
      if (Array.isArray(data.files)) {
        data.files.forEach(file => {
          const filePath = path.join(workspacePath, file.filename);
          fs.writeFileSync(filePath, file.content, 'utf8');
          outputChannel.appendLine(`✅ Created file: ${file.filename}`);
        });
      }

      // Handle command execution
      const commands = data.commands || [];
      if (commands.length === 0 && (!data.files || data.files.length === 0)) {
        vscode.window.showInformationMessage('Nothing to execute or create.');
        outputChannel.appendLine('No commands or files received.');
        return;
      }

      commands.forEach(cmd => {
        outputChannel.appendLine(`Executing command: "${cmd}" in ${workspacePath}`);
        exec(cmd, { cwd: workspacePath }, (error, stdout, stderr) => {
          if (error) {
            outputChannel.appendLine(`❌ Error: ${error.message}`);
            vscode.window.showErrorMessage(`Error: ${error.message}`);
            return;
          }
          if (stderr) outputChannel.appendLine(`⚠️ stderr: ${stderr}`);
          if (stdout) outputChannel.appendLine(`✅ Output: ${stdout}`);
          outputChannel.appendLine(`--- Finished "${cmd}" ---\n`);
        });
      });

      vscode.window.showInformationMessage('Gemini execution complete. See "Gemini Executor" output.');
    } catch (error) {
      const errMsg = `Failed to contact server: ${error.message}`;
      vscode.window.showErrorMessage(errMsg);
      outputChannel.appendLine(`❌ ${errMsg}`);
    }
  });

  context.subscriptions.push(disposable);
}

function deactivate() {}

module.exports = {
  activate,
  deactivate
};
