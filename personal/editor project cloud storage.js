/**
☁️
@file editor project cloud storage
@summary Add exporting and importing projects to/from a web-server.
@license MIT
@author Violgamba (Jon Heard)

@description
Add exporting and importing projects to/from a web-server.  This is useful if frequently switching
devices or for cloud storage / backup.  This requires a web server with the following urls:
1. a url for getting a list of files, separated by unix newline
2. a url for getting the content of one of the files
3. a url for posting new file content (which will be attached as a POST parameter)

NOTE: this plugin REQUIRES the "event suboptions" plugin to work.


HOW TO USE:
1. Import this plugin into your game.
2. Assign the CONFIG parameter fields in the plugin event to your server's urls.  Note that the read
	and write urls will require a filename (to know what to read or write).  Putting '$1' in the url
	will tell this plugin where to put the filename.
3. The "new-file-content-post-name" needs to be set to the name of the POST parameter where the
	server expects the posted file contents to be when sending the "write" url.
4. Run the program 
5. Click the "export data" button, click on the "to server" button, choose a filename to save to,
	or enter a new filename.  The bipsi project should be saved to the chosen filename on the server.
6. Click the "import playable" button, "from server" button, choose a file to import.  the bipsi
	project should be imported from the server as normal.
NOTE: An imported project might not have this plugin, or the required "event suboptions" plugin.
If so, the plugin may not work after importing.

Here is an example PHP server file that this plugin could interact with.
<?php
    define("FILE_PATH", "./bipsiprojects");
    if ($_REQUEST["act"] == "list") {
        $files = array_diff(scandir(FILE_PATH), array(".", ".."));
        foreach ($files as $file) { echo("$file\n"); }
    }
    if ($_REQUEST["act"] == "read") {
        $name = FILE_PATH . "/" . $_REQUEST["name"];
        if (!file_exists($name)) { die("FILE NOT FOUND"); }
        echo(file_get_contents($name));
    }
    if ($_REQUEST["act"] == "write") {
        if (!$_REQUEST["name"]) { die("INVALID NAME GIVEN"); }
        if (!$_REQUEST["content"]) { die("INVALID CONTENT GIVEN"); }
        $name = FILE_PATH . "/" . $_REQUEST["name"];
        file_put_contents($name, $_REQUEST["content"]);
    }
?>



// Specify the urls for interacting with the cloud.  The '$1' is auto-replaced with the a filename.
//!CONFIG server-url-file-list-parameter (text)  "https://jonheard.net/personal/notes/index.php?act=rea"
//!CONFIG server-url-file-read-parameter (text)  "https://jonheard.net/personal/notes/index.php?act=rea&name=$1"
//!CONFIG server-url-file-write-parameter (text) "https://jonheard.net/personal/notes/index.php?act=sav&name=$1"

// When sending new file content, this is the title to give the POST parameter containing the content
//!CONFIG new-file-content-post-name (text) "text"
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

	async function sendPostDataToUrl(url, dataName, data, failMessage) {
		failMessage ||= 'Unable to resolve the url.';
		const result = await new Promise(resolve => {
			try {
				let request = new XMLHttpRequest();
				request.open('POST', url, true);
				request.onloadend = () => {
					resolve(request.status === 200 ? request.responseText || '' : null);
				}
				var postData = new FormData();
				postData.append(dataName, data);
				request.send(postData);
			}
			catch (e) {
				resolve(null);
			}
		});
		if (result === null) {
			window.popup.showAlert(failMessage);
		}
		return result;
	}

	async function serverFileChoose(allowCustomName) {
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
		if (allowCustomName) {
			return await window.popup.showEditableSelectList("select a file or enter a new file name", filesInfo);
		} else {
			return await window.popup.showSelectList("select a file", filesInfo);
		}
	}

	// An addition to the popup system to allow selecting a text from a list OR entering your own text
	window.popup.showEditableSelectList = (title, items) => {
		return new Promise(resolve => {
			window.popup.uiTitle.innerHTML = title.replaceAll('\n', '<br/>');

			// If there are descriptions, show the descriptions ui
			let hideDescription = true;
			items.forEach(value => {
				if (value.description) {
					hideDescription = false;
				}
			});
			window.popup.uiSelectListDescription.style.display = hideDescription ? 'none' : 'inline-block';
			window.popup.uiSelectListItems.style.width = hideDescription ? '100%' : 'auto';

			window.popup.uiSelectListItems.innerHTML = '';
			let i = 0;
			items.forEach((value, key) => {
				window.popup.uiSelectListItems[i] = new Option(key, i);
				window.popup.uiSelectListItems[i].dataset.description = value.description || '';
				i++;
			});
			window.popup.uiSelectListDescription.innerHTML = ''
			window.popup.uiInput.value = '';
			window.popup.uiSelectList.style.display = 'flex';
			window.popup.uiInput.style.display = 'block';

			let okButton;
			const onInputChanged = () => {
				okButton.disabled = !window.popup.uiInput.value.trim();
			};
			const onSelectChanged = () => {
				window.popup.uiInput.value = window.popup.uiSelectListItems.selectedOptions[0].text;
				window.popup.uiInput.dispatchEvent(new Event('input'));
			};
			[ okButton ] = window.popup.show('Ok', 'Cancel', isAccepted => {
				window.popup.uiInput.removeEventListener('input', onInputChanged);
				window.popup.uiSelectListItems.removeEventListener('change', onSelectChanged);
				resolve(isAccepted ? window.popup.uiInput.value : null)
			});
			okButton.disabled = true;
			window.popup.uiInput.addEventListener('input', onInputChanged);
			window.popup.uiSelectListItems.addEventListener('change', onSelectChanged);
			window.popup.uiSelectListItems.value = 0;
			window.popup.uiSelectListItems.dispatchEvent(new Event('change'));
		});
	};

	// #endregion

	window.suboptions.importPlayable.set('from server', async () => {
		const url = FIELD(CONFIG, 'server-url-file-read-parameter', 'text');
		if (!url) {
			window.popup.showAlert('"server-url-file-read-parameter" not set.');
			return;
		}
		const fileName = await serverFileChoose(false);
		if (!fileName) {
			return;
		}
		const fileContent = await getTextFromUrl(url.replace('$1', fileName));
		if (!fileContent) {
			return;
		}
		EDITOR.importProjectFromString(fileContent);
		return fileName;
	});

	window.suboptions.exportData.set('to server', async () => {
		const url = FIELD(CONFIG, 'server-url-file-write-parameter', 'text');
		const postDataName = FIELD(CONFIG, 'new-file-content-post-name', 'text');
		if (!url) {
			window.popup.showAlert('"server-url-file-write-parameter" not set.');
			return;
		}
		if (!postDataName) {
			window.popup.showAlert('"new-file-content-post-name" not set.');
			return;
		}
		const fileName = await serverFileChoose(true);
		if (!fileName) {
			return;
		}
		const projectData = JSON.stringify(await window.EDITOR.stateManager.makeBundle());
		const result = await sendPostDataToUrl(url.replace('$1', fileName), postDataName, projectData);
		if (result) {
			window.popup.showAlert(`Server error: ${result}`);
		}
	});

	// Prevent repeating this setup
	window.EDITOR.loadedEditorPlugins ||= new Set();
	window.EDITOR.loadedEditorPlugins.add('ProjectCloudStorage');
}
if (!window.EDITOR.loadedEditorPlugins?.has('ProjectCloudStorage')) {
	setupEditorPlugin();
}
