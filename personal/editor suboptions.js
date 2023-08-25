/*
⌥
@file editor suboptions
@summary Add extra options for imports, exports and 'clear project'.
@license MIT
@author Violgamba (Jon Heard)

@description
By default, bipsi's importing and exporting options are limited to files.  This adds various options
such as clipboard import & export, loading plugins from bipsi-hacks, etc.  It's also extensible so
that other plugins can add more options.


HOW TO USE:
1. Import this plugin into your game.
2. Try 'import plugin'.  Note that there are additional options.
3. Run the game.
4. Try 'import playable'.  Note that there are additional options.
5. Try 'export playable'.  Note that there are additional options.
6. Try 'export data'.  Note that there are additional options.
7. Try 'export tile graphics'.  Note that there are additional options.
8. Note that 'clear project' has no additional options, but more can be added by subsequent plugins.


HOW TO USE - CUSTOM LISTS
You can create custom lists of plugins and playables.  These are urls pointing to files of plugins
and playables on the internet that you'd like quick access to.  Here's how you add them.
1. Open this 'editor suboptions' plugin's event
2. Go to the 'plugins-list' field or the 'playables-list' field.
3. For each custom url you want to add, create a block separated by empty new lines.  The first line
	of the block should be a name, the second should be a url, and subsequent lines should be a
	description.  Here's an example:
	...
	Editor fullscreen
	https://raw.githubusercontent.com/seleb/bipsi-hacks/main/dist/editor-fullscreen.js
	Toggle fullscreen while playtesting the game.
	Add a ui button and hotkey to the editor.
	...
4. You can select the item(s) added in step 3 from the 'from custom list' sub-option of the
	'import plugin' and 'import playable' buttons


//!CONFIG plugins-list (text) ""
//!CONFIG playables-list (text) ""
*/

//! CODE_EDITOR

function setupEditorPlugin() {
	// #region HELPER FUNCTIONS

	// https://stackoverflow.com/questions/29998343/limiting-the-times-that-split-splits-rather-than-truncating-the-resulting-ar
	window.splitUpToNTimes(src, separator, n) {
		n = n ?? -1;
		const output = [];
		let finalIndex = 0;
		while (n--) {
			// eslint-disable-next-line prefer-destructuring
			const lastIndex = separator.lastIndex;
			const search = separator.exec(src);
			if (search === null) {
				break;
			}
			finalIndex = separator.lastIndex;
			output.push(src.slice(lastIndex, search.index));
		}
		output.push(src.slice(finalIndex));
		return output;
	}

	async function getTextFromUrl(url, failMessage) {
		failMessage ||= 'Unable to resolve the url.';
		const result = await new Promise(resolve => {
			try {
				const request = new XMLHttpRequest();
				request.open('GET', url, true);
				request.onloadend = () => {
					resolve(request.status === 200 ? request.responseText : null);
				};
				request.send();
			} catch (e) {
				resolve(null);
			}
		});
		if (!result) {
			window.popup.showAlert(failMessage);
		}
		return result;
	}

	async function getBipsiHacksInfo() {
		if (window.suboptionsBipsiHacksInfo) return window.suboptionsBipsiHacksInfo;

		const readme = await getTextFromUrl('https://raw.githubusercontent.com/seleb/bipsi-hacks/main/README.md', 'Unable to connect to bipsi-hacks.');
		if (!readme) return null;

		window.suboptionsBipsiHacksInfo = new Map();
		const pluginsDataList = readme
			.match(/## Contents\n\n([\S\s]+)## How to use/m)[1]
			.split('\n')
			.filter(Boolean);
		pluginsDataList.forEach(data => {
			const match = data.match(/- ([^ ]+) \[([^\]]+)]\(([^)]+)\): (.*)/);
			window.suboptionsBipsiHacksInfo.set(match[2], { name: match[2], url: `https://raw.githubusercontent.com/seleb/bipsi-hacks/main${match[3]}`, description: `${match[1]} - ${match[4]}` });
		});

		return window.suboptionsBipsiHacksInfo;
	}

	function parseCustomUrlList(listText) {
		if (!listText) return null;
		const datasRaw = listText.split(/\n\n+/).filter(Boolean);
		if (datasRaw.length === 0) return null;
		const result = new Map();
		datasRaw.forEach(dataRaw => {
			const lines = splitUpToNTimes(dataRaw, /\n/g, 2).map(line => line.trim());
			if (lines.length < 2) return;
			result.set(lines[0], { name: lines[0], url: lines[1], description: lines[2] || '' });
		});
		if (result.size === 0) {
			return null;
		}
		return result;
	}

	function checkIfClipboardIsAvailable() {
		if (!navigator.clipboard) {
			if (!window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
				window.popup.showAlert('Clipboard access is unavailable due to\nInsecure connection (not HTTPS or localhost).');
			} else {
				window.popup.showAlert('Clipboard access is unavailable.\nPerhaps due to browser incompatibility.');
			}
			return false;
		}
		return true;
	}

	// #endregion

	// #region SUBOPTIONS

	window.suboptions = {};

	// Suboptions - import playable
	window.suboptions.importPlayable = new Map();
	window.suboptions.importPlayable.set('from clipboard', async () => {
		if (!checkIfClipboardIsAvailable()) return;
		const text = await navigator.clipboard.readText();
		window.EDITOR.importProjectFromString(text);
	});
	window.suboptions.importPlayable.set('from url', async () => {
		const url = await window.popup.showPrompt('enter url');
		if (!url) return;
		const text = await getTextFromUrl(url, `Unable to resolve the url.`);
		if (!text) return;
		window.EDITOR.importProjectFromString(text);
		return url;
	});
	window.suboptions.importPlayable.set('from custom list', async () => {
		const pluginsInfo = parseCustomUrlList(FIELD(CONFIG, 'playables-list', 'text'));
		if (!pluginsInfo) {
			window.popup.showAlert('Custom playable list is empty.');
			return;
		}
		const selectedPluginInfos = await window.popup.showSelectList('select a plugin', pluginsInfo);
		if (!selectedPluginInfos) return;
		const text = await getTextFromUrl(selectedPluginInfos[0].url, `Unable to resolve the url for "${selectedPluginInfo.name}".`);
		if (!text) return;
		window.EDITOR.importProjectFromString(text);
		return selectedPluginInfos;
	});

	// Suboptions - clear project
	window.suboptions.clearProject = new Map();
	window.suboptions.clearProject.set('test', async () => {
		console.log('clear project test');
	});

	// Suboptions - export playable
	window.suboptions.exportPlayable = new Map();
	window.suboptions.exportPlayable.set('to clipboard', async () => {
		if (!checkIfClipboardIsAvailable()) return;
		navigator.clipboard.writeText(await window.EDITOR.makeExportHTML());
	});

	// Suboptions - export data
	window.suboptions.exportData = new Map();
	window.suboptions.exportData.set('to clipboard', async () => {
		if (!checkIfClipboardIsAvailable()) return;
		navigator.clipboard.writeText(JSON.stringify(await window.EDITOR.stateManager.makeBundle()));
	});

	// Suboptions - export tile graphics
	window.suboptions.exportTileGraphics = new Map();
	// Based on BipsiEditor.exportTileset()
	window.suboptions.exportTileGraphics.set('to clipboard', () => {
		if (!checkIfClipboardIsAvailable()) return;
		const rendering = window.EDITOR.stateManager.resources.get(window.EDITOR.stateManager.present.tileset);
		rendering.canvas.toBlob(blob => {
			const item = new window.ClipboardItem({ 'image/png': blob });
			navigator.clipboard.write([item]);
		});
	});

	// Suboptions - import plugin
	window.suboptions.importPlugin = new Map();
	window.suboptions.importPlugin.set('from clipboard', async () => {
		if (!checkIfClipboardIsAvailable()) return;
		const js = await navigator.clipboard.readText();
		window.EDITOR.eventEditor.createPluginFromSource(js);
	});
	window.suboptions.importPlugin.set('from url', async () => {
		const url = await window.popup.showPrompt('enter url');
		if (!url) return;
		const js = await getTextFromUrl(url, `Unable to resolve the url.`);
		if (!js) return;
		window.EDITOR.eventEditor.createPluginFromSource(js);
		return url;
	});
	window.suboptions.importPlugin.set('from bipsi-hacks', async () => {
		const bipsiHacksInfo = await getBipsiHacksInfo();
		if (!bipsiHacksInfo) return;
		// Pick from the bipsi-hacks list.  If plugin "import multiple plugins" is loaded, allow multi-select
		const multi = window.EDITOR.loadedEditorPlugins?.has('importMultiplePlugins.suboptions');
		const selectedPluginInfos = await window.popup.showSelectList(!multi ? 'select a plugin' : 'select one or more plugins\n(control key to multiselect)', bipsiHacksInfo, multi);
		if (!selectedPluginInfos) return;
		const js = await getTextFromUrl(selectedPluginInfos[0].url, `Unable to resolve the url for "${selectedPluginInfos[0].name}".`);
		if (!js) return;
		window.EDITOR.eventEditor.createPluginFromSource(js);
		console.log(selectedPluginInfos);
		return selectedPluginInfos;
	});
	window.suboptions.importPlugin.set('from custom list', async () => {
		const pluginsInfo = parseCustomUrlList(FIELD(CONFIG, 'plugins-list', 'text'));
		if (!pluginsInfo) {
			window.popup.showAlert('Custom plugin list is empty.');
			return;
		}
		// Pick from the custom list.  If plugin "import multiple plugins" is loaded, allow multi-select
		const multi = window.EDITOR.loadedEditorPlugins?.has('importMultiplePlugins.suboptions');
		const selectedPluginInfos = await window.popup.showSelectList(!multi ? 'select a plugin' : 'select one or more plugins\n(control key to multiselect)', pluginsInfo, multi);
		if (!selectedPluginInfos) return;
		const js = await getTextFromUrl(selectedPluginInfos[0].url, `Unable to resolve the url for "${selectedPluginInfos[0].name}".`);
		if (!js) return;
		window.EDITOR.eventEditor.createPluginFromSource(js);
		return selectedPluginInfos;
	});

	// #endregion

	// #region NEW SYSTEMS

	// Wrappable create-event fnc - This should be called before a plugin's code that wraps the 'create-event-plugin-file' button action
	function prepareWrapableVersionOfCreateEventPluginFile() {
		if (window.EDITOR.eventEditor.createEventPluginFile) return;
		function parseOrNull(json) {
			try {
				return JSON.parse(json);
			} catch {
				return null;
			}
		}
		function fieldsFromPluginCode(code) {
			const regex = /\/\/!CONFIG\s+([\w-]+)\s+\(([\w-]+)\)\s*(.*)/g;
			const fields = Array.from(code.matchAll(regex)).map(([, key, type, json]) => ({ key, type, data: parseOrNull(json) }));
			return fields;
		}
		// Recreation of "create-event-plugin-file" listener (or it should be), but split into two functions and attached to ButtonAction indirectly so it can be wrapped
		EventEditor.prototype.createEventPluginFile = async function createEventPluginFile() {
			const [file] = await maker.pickFiles('application/javascript');
			if (!file) return;
			const js = await maker.textFromFile(file);
			this.createPluginFromSource(js);
		};
		EventEditor.prototype.createPluginFromSource = function createPluginFromSource(js) {
			const fields = [
				{ key: 'is-plugin', type: 'tag', data: true },
				{ key: 'plugin-order', type: 'json', data: 0 },
				{ key: 'plugin', type: 'javascript', data: js },
				...fieldsFromPluginCode(js),
			];
			const id = nextEventId(window.EDITOR.stateManager.present);

			window.EDITOR.createEvent(fields);

			// Run EDITOR code for the new plugin
			const editorCode = window.getRunnableJavascriptForOnePlugin({ id, fields }, ['EDITOR']);
			new Function(editorCode)();
		};
		// Replace original "create-event-plugin-file" listener with a call to EventEditor's wrappable version
		ui.actions.get('create-event-plugin-file').detach();
		ui.action('create-event-plugin-file', () => window.EDITOR.eventEditor.createEventPluginFile());
	}
	prepareWrapableVersionOfCreateEventPluginFile();

	// Modified from BipsiEditor.importProject()
	BipsiEditor.prototype.importProjectFromString = async function importProjectFromString(text) {
		// Just check for "<".  Expected "<html", "<HTML", "<!DOCTYPE".
		if (!text.match(/^\s*</)) {
			await this.loadBundle(JSON.parse(text));
		} else {
			const html = await maker.htmlFromText(text);
			// extract the bundle from the imported page
			const bundle = maker.bundleFromHTML(html);
			// load the contents of the bundle into the editor
			await this.loadBundle(bundle);
		}

		// Run EDITOR code for all plugins
		const editorCode = await window.EDITOR.gatherPluginsJavascript(['EDITOR']);
		new Function(editorCode)();
	};

	// #endregion

	// #BIPSI MODIFICATIONS

	// Setup each ui option to show its suboptions
	window.setupSuboptions = function setupSuboptions(
		actionContainer,
		actionNameInContainer,
		actionName,
		functionContainer,
		originalFunctionName,
		suboptionsName,
		suboptionsLabel,
		originalFunctionLabel
	) {
		const suboptionsFunctionName = `${suboptionsName}Suboptions`;
		functionContainer[suboptionsFunctionName] = function unnamedReplacement() {
			let actions = new Map([[originalFunctionLabel, functionContainer[originalFunctionName].bind(functionContainer)]]);
			actions = new Map([...actions, ...window.suboptions[suboptionsName]]);
			window.popup.showOptions(suboptionsLabel, actions);
		};
		ui.actions.get(actionName).detach();
		const newAction = ui.action(actionName, () => functionContainer[suboptionsFunctionName]());
		if (actionContainer) {
			actionContainer[actionNameInContainer] = newAction;
		}
	};
	window.setupSuboptions(null, null, 'create-event-plugin-file', window.EDITOR.eventEditor, 'createEventPluginFile', 'importPlugin', 'import plugin', 'from file');
	window.setupSuboptions(window.EDITOR.actions, 'import_', 'import', window.EDITOR, 'importProject', 'importPlayable', 'import playable', 'from file');
	window.setupSuboptions(window.EDITOR.actions, 'reset', 'reset', window.EDITOR, 'resetProject', 'clearProject', 'clear project', 'to empty');
	window.setupSuboptions(window.EDITOR.actions, 'export_', 'export', window.EDITOR, 'exportProject', 'exportPlayable', 'export playable', 'to file');
	window.setupSuboptions(window.EDITOR.actions, 'exportGamedata', 'export-gamedata', window.EDITOR, 'exportGamedata', 'exportData', 'export data', 'to file');
	window.setupSuboptions(window.EDITOR.actions, 'exportTileset', 'export-tileset', window.EDITOR, 'exportTileset', 'exportTileGraphics', 'export tile graphics', 'to file');

	// #endregion

	// Prevent repeating this setup
	window.EDITOR.loadedEditorPlugins ||= new Set();
	window.EDITOR.loadedEditorPlugins.add('suboptions');
}
if (!window.EDITOR.loadedEditorPlugins?.has('suboptions')) {
	setupEditorPlugin();
}
