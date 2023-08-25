/**
☁️
@file editor plugin cloud storage
@summary Add importing plugins from a web-server.
@license MIT
@author Violgamba (Jon Heard)

@description
Add importing plugins from a web-server.  This is useful for cloud storage / backup of your plugins.
This requires a web server with the following urls:
1. a url for getting a list of files, separated by unix newline
2. a url for getting the content of one of the files

NOTE: this plugin REQUIRES the "event suboptions" plugin to work.


HOW TO USE:
1. Import this plugin into your game.
2. Assign the CONFIG parameter fields in the plugin event to your server's urls.  Note that the read
	url will require a filename (to know what to read).  Putting '$1' in the url will tell this
	plugin where to put the filename.
3. Run the program 
4. Click the "import plugin" button, click on the "from server" button, choose a plugin file to
	import.  The plugin should import from the server as normal.

Here is an example PHP server file that this plugin could interact with:
<?php
    define("FILE_PATH", "./bipsiplugins");
    if ($_REQUEST["act"] == "list") {
        $files = array_diff(scandir(FILE_PATH), array(".", ".."));
        foreach ($files as $file) { echo("$file\n"); }
    }
    if ($_REQUEST["act"] == "read") {
        $name = FILE_PATH . "/" . $_REQUEST["name"];
        if (!file_exists($name)) { die("FILE NOT FOUND"); }
        echo(file_get_contents($name));
    }
?>



// Specify the urls for interacting with the cloud.  The '$1' is auto-replaced with the a filename.
//!CONFIG server-url-file-list-parameter (text)  "https://jonheard.net/personal/bipsi/pluginsAccess.php?act=list"
//!CONFIG server-url-file-read-parameter (text)  "https://jonheard.net/personal/bipsi/pluginsAccess.php?act=read&name=$1"
*/

//! CODE_EDITOR

function setupEditorPlugin() {

	// #region HELPER FUNCTIONS

	async function getTextFromUrl(url, failMessage) {
		failMessage ||= 'Unable to resolve the url.';
		const result = await new Promise(resolve => {
			try {
				let request = new XMLHttpRequest();
				request.open('GET', url, true);
				request.onloadend = () => {
					resolve(request.status === 200 ? request.responseText : null);
				}
				request.send();
			}
			catch (e) {
				resolve(null);
			}
		});
		if (!result) {
			window.popup.showAlert(failMessage);
		}
		return result;
	}

	async function serverFileChoose() {
		const url = FIELD(CONFIG, 'server-url-file-list-parameter', 'text');
		if (!url) {
			window.popup.showAlert('"server-url-file-list-parameter" not set.');
			return;
		}
		const fileListRaw = await getTextFromUrl(url, 'Unable to connect to server.');
		if (!fileListRaw) return;
		const filesInfo = new Map();
		fileListRaw.split('\n').filter(Boolean).forEach(name => {
			filesInfo.set(name, name);
		});
		return await window.popup.showSelectList("select a file", filesInfo);
	}

	// #endregion

	window.suboptions.importPlugin.set('from server', async () => {
		const url = FIELD(CONFIG, 'server-url-file-read-parameter', 'text');
		if (!url) {
			window.popup.showAlert('"server-url-file-read-parameter" not set.');
			return;
		}
		const fileName = await serverFileChoose();
		if (!fileName) {
			return;
		}
		const fileContent = await getTextFromUrl(url.replace('$1', fileName));
		if (!fileContent) {
			return;
		}
		window.EDITOR.eventEditor.createPluginFromSource(fileContent);
		return fileName;
	});

	// Prevent repeating this setup
	window.EDITOR.loadedEditorPlugins ||= new Set();
	window.EDITOR.loadedEditorPlugins.add('pluginCloudStorage');
}
if (!window.EDITOR.loadedEditorPlugins?.has('pluginCloudStorage')) {
	setupEditorPlugin();
}
