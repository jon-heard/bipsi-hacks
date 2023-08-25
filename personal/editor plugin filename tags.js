/**
📛
@file editor plugin filename tags
@summary Each plugin will begin with a tag named after the filename the plugin was loaded from.
	This lets one quickly identify plugin events.
@license MIT
@author Violgamba (Jon Heard)

@description
It can be difficult, with many plugins, to determine which is which.  This usually resorts to either
recognizing the settings, or peeking at the source code.  This plugin adds the plugin's filename to
the top of the event, so one can quickly see which plugin they have selected.

If the plugin "editor suboptions" is loaded, this also adds names to plugins imported from it's
suboptions.


HOW TO USE - WITHOUT THE "EDITOR SUBOPTIONS" PLUGIN:
1. Import this plugin into your game.
2. Import another plugin from a js file.
3. Note that the plugin from step 2 has a tag that matches the filename the plugin was loaded from.
*/

//! CODE_EDITOR

function setupEditorPlugin() {
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
		ui.action('create-event-plugin-file', () => window.EDITOR.eventEditor.createEventPluginFile.bind(window.EDITOR.eventEditor)());
	}
	prepareWrapableVersionOfCreateEventPluginFile();

	// File pick tracker - This should be called before a plugin's code that uses the latest file picks
	function prepareFilePickTracker() {
		if (EDITOR.latestFilePick) return;
		wrap.splice(maker, 'pickFiles', async function pickFiles(original, accept = "*", multiple = false) {
			// Recreation of 'maker.pickFiles' (or it should be), but with picked files stored in EDITOR.latestFilePick
			return new Promise((resolve) => {
				const fileInput = html("input", { type: "file", accept, multiple });
				fileInput.addEventListener("change", () => {
					EDITOR.latestFilePick = fileInput.files;
					resolve(Array.from(fileInput.files))
				});
				fileInput.click();
			});
		});
		EDITOR.latestFilePick = [];
	}
	prepareFilePickTracker();

	wrap.splice(EventEditor.prototype, 'createEventPluginFile', async (original) => {
		const newEventId = nextEventId(window.EDITOR.stateManager.present);
		await original.bind(window.EDITOR.eventEditor)();
		const newEvent = findEventById(EDITOR.stateManager.present, newEventId);
		if (!newEvent) return;
		newEvent.fields.unshift({ key: EDITOR.latestFilePick[0].name, type: 'tag', data: true });
		EDITOR.eventEditor.refresh();
	});

	// Manually add this plugin's filename to its own event (hopefully the filename doesn't change)
	CONFIG.fields.unshift({ key: 'editor-plugin-filename-tags.js', type: 'tag', data: true });
	
	// If the plugin "editor suboptions" is loaded, modify plugin creation functions for that too
	if (window.EDITOR.loadedEditorPlugins?.has('suboptions')) {
		const importPluginSuboptions = Object.fromEntries(window.suboptions.importPlugin);

		// From clipboard
		wrap.splice(importPluginSuboptions, 'from clipboard', async (original) => {
			const newEventId = nextEventId(window.EDITOR.stateManager.present);
			await original();
			const newEvent = findEventById(EDITOR.stateManager.present, newEventId);
			if (!newEvent) return;
			newEvent.fields.unshift({ key: 'src: clipboard', type: 'tag', data: true });
			EDITOR.eventEditor.refresh();
		});

		// From url
		wrap.splice(importPluginSuboptions, 'from url', async (original) => {
			const newEventId = nextEventId(window.EDITOR.stateManager.present);
			await original();
			const newEvent = findEventById(EDITOR.stateManager.present, newEventId);
			if (!newEvent) return;
			newEvent.fields.unshift({ key: 'src: url', type: 'tag', data: true });
			EDITOR.eventEditor.refresh();
		});

		// From bipsi-hacks - a rewrite of the function to get the plugin name
		wrap.splice(importPluginSuboptions, 'from bipsi-hacks', async (original) => {
			const newEventId = nextEventId(window.EDITOR.stateManager.present);
			const selectedPluginInfos = await original();
			const pluginName = selectedPluginInfos[0].name;
			const newEvent = findEventById(EDITOR.stateManager.present, newEventId);
			if (!newEvent) return;
			newEvent.fields.unshift({ key: pluginName, type: 'tag', data: true });
			EDITOR.eventEditor.refresh();
			return selectedPluginInfos;
		});

		// From custom list
		wrap.splice(importPluginSuboptions, 'from custom list', async (original) => {
			const newEventId = nextEventId(window.EDITOR.stateManager.present);
			const selectedPluginInfos = await original();
			const pluginName = selectedPluginInfos[0].name;
			const newEvent = findEventById(EDITOR.stateManager.present, newEventId);
			if (!newEvent) return;
			newEvent.fields.unshift({ key: pluginName, type: 'tag', data: true });
			EDITOR.eventEditor.refresh();
			return selectedPluginInfos;
		});

		Object.entries(importPluginSuboptions).forEach(entry => {
			window.suboptions.importPlugin.set(entry[0], entry[1]);
		});
	}

	// Prevent repeating this setup
	window.EDITOR.loadedEditorPlugins ||= new Set();
	window.EDITOR.loadedEditorPlugins.add('pluginFilenameTags');
}
if (!window.EDITOR.loadedEditorPlugins?.has('pluginFilenameTags')) {
	setupEditorPlugin();
}
