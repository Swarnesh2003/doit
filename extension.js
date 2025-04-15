const vscode = require('vscode');
const axios = require('axios');
const { exec } = require('child_process');

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  // Create a named output channel
  const outputChannel = vscode.window.createOutputChannel("Gemini Executor");

  const disposable = vscode.commands.registerCommand('extension.geminiSearch', async () => {
    const input = await vscode.window.showInputBox({
      placeHolder: 'What do you want to do? (e.g., create sample.java)'
    });

    if (!input) return;

    try {
      outputChannel.clear(); // Clear previous output
      outputChannel.show(); // Show the output channel to the user
      outputChannel.appendLine(`User input: ${input}`);

      const response = await axios.post('http://localhost:5000/process', { query: input });
      let data = response.data;

      if (typeof data === 'string') {
        data = JSON.parse(data);
      }

      outputChannel.appendLine(`Received response from server: ${JSON.stringify(data, null, 2)}`);

      const commands = data.commands;

      if (!commands || commands.length === 0) {
        vscode.window.showInformationMessage('No commands received.');
        outputChannel.appendLine('No commands received.');
        return;
      }

      const workspaceFolders = vscode.workspace.workspaceFolders;
      const workspacePath = workspaceFolders ? workspaceFolders[0].uri.fsPath : undefined;

      if (!workspacePath) {
        const msg = 'No workspace folder found. Please open a folder in VS Code.';
        vscode.window.showErrorMessage(msg);
        outputChannel.appendLine(msg);
        return;
      }

      commands.forEach(cmd => {
        outputChannel.appendLine(`Executing command: "${cmd}" in ${workspacePath}`);
        exec(cmd, { cwd: workspacePath }, (error, stdout, stderr) => {
          if (error) {
            outputChannel.appendLine(`❌ Error executing "${cmd}": ${error.message}`);
            vscode.window.showErrorMessage(`Error: ${error.message}`);
            return;
          }

          if (stderr) {
            outputChannel.appendLine(`⚠️ stderr: ${stderr}`);
          }

          if (stdout) {
            outputChannel.appendLine(`✅ Output: ${stdout}`);
          }

          outputChannel.appendLine(`--- Finished "${cmd}" ---\n`);
        });
      });

      vscode.window.showInformationMessage('Commands execution started. See "Gemini Executor" output.');
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
