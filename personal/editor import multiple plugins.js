
//! CODE_EDITOR

function setupEditorPlugin() {
console.log('!');
	// #region NEW SYSTEMS

	// Popup - This should be called before a plugin's code that uses the popup dialogues
	function preparePopup() {
		const VERSION = 1;
		if (window.popup && window.popup.version >= VERSION) return;
		window.popup = { version: VERSION };
		// Root
		const container = document.createElement('div');
		document.getElementById('editor').append(container);
		container.id = 'suboptions';
		container.setAttribute('style', 'position:fixed;z-index:100;display:none;');
		// Dimmer
		const dimmer = document.createElement('div');
		container.append(dimmer);
		dimmer.setAttribute('style', 'position:fixed;background-color:black;opacity:60%;left:0;top:0;right:0;bottom:0;');
		// Dialog ui
		window.popup.uiDialog = document.createElement('div');
		container.append(window.popup.uiDialog);
		window.popup.uiDialog.setAttribute('style', 'background-color:var(--frame-color);border-radius:1rem;padding:1rem;position:fixed;width:490px;top:50%;left:50%;margin:-200px -245px;');
		// Title
		window.popup.uiTitle = document.createElement('div');
		window.popup.uiDialog.append(window.popup.uiTitle);
		window.popup.uiTitle.setAttribute('style', 'text-align:center;margin-bottom:.5rem;font-size:125%;');
		// Select list
		window.popup.uiSelectList = document.createElement('div');
		window.popup.uiDialog.append(window.popup.uiSelectList);
		window.popup.uiSelectList.setAttribute('style', 'display: flex;gap:0.75rem;');
		window.popup.uiSelectListItems = document.createElement('select');
		window.popup.uiSelectList.append(window.popup.uiSelectListItems);
		window.popup.uiSelectListItems.setAttribute('style', 'margin-bottom:1rem;');
		window.popup.uiSelectListItems.setAttribute('size', 10);
		window.popup.uiSelectListDescription = document.createElement('div');
		window.popup.uiSelectList.append(window.popup.uiSelectListDescription);
		window.popup.uiSelectListDescription.setAttribute('style', 'display:inline-block;border:1px solid black;margin-bottom:1em;flex:1;padding: 0.5rem;border-radius:1rem;');
		window.popup.uiSelectListItems.addEventListener('change', () => {
			window.popup.uiSelectListDescription.innerHTML = window.popup.uiSelectListItems.selectedOptions[0].dataset.description.replaceAll('\n', '<br/>');
		});
		// Text input
		window.popup.uiInput = document.createElement('input');
		window.popup.uiDialog.append(window.popup.uiInput);
		window.popup.uiInput.setAttribute('style', 'margin-bottom:.75rem;width:100%;');
		window.popup.uiInput.setAttribute('type', 'text');
		// Options
		window.popup.uiOptions = document.createElement('div');
		window.popup.uiDialog.append(window.popup.uiOptions);
		window.popup.uiOptions.setAttribute('style', 'display:flex;flex-direction:row;flex-wrap:wrap;gap:0.5rem;display:none;');
		// Methods
		window.popup.addOptionButton = (name, action) => {
			const button = document.createElement('button');
			window.popup.uiOptions.append(button);
			button.style.padding = '.5em .7em';
			button.innerText = name;
			button.addEventListener('click', () => {
				window.popup.hide();
				action();
			});
			return button;
		};
		window.popup.hide = () => {
			container.style.display = 'none';
		};
		window.popup.show = (okButtonText, cancelButtonText, onClose) => {
			if (okButtonText || cancelButtonText) {
				window.popup.uiOptions.innerHTML = '';
				window.popup.uiOptions.style.display = 'flex';
			}
			const result = [];
			if (okButtonText) {
				result.push(window.popup.addOptionButton(okButtonText, () => onClose(true)));
			}
			if (cancelButtonText) {
				result.push(window.popup.addOptionButton(cancelButtonText, () => onClose(false)));
			}
			container.style.display = 'block';
			return result;
		};
		window.popup.showAlert = message => {
			return new Promise(resolve => {
				window.popup.uiTitle.innerHTML = message.replaceAll('\n', '<br/>');
				window.popup.uiSelectList.style.display = 'none';
				window.popup.uiInput.style.display = 'none';
				window.popup.show('Ok', null, result => resolve(result));
			});
		};
		window.popup.showConfirm = message => {
			return new Promise(resolve => {
				window.popup.uiTitle.innerHTML = message.replaceAll('\n', '<br/>');
				window.popup.uiSelectList.style.display = 'none';
				window.popup.uiInput.style.display = 'none';
				window.popup.show('Ok', 'Cancel', result => resolve(result));
			});
		};
		window.popup.showBinaryChoice = (message, trueName, falseName) => {
			return new Promise(resolve => {
				window.popup.uiTitle.innerHTML = message.replaceAll('\n', '<br/>');
				window.popup.uiSelectList.style.display = 'none';
				window.popup.uiInput.style.display = 'none';
				window.popup.show(trueName, falseName, result => resolve(result));
			});
		};
		window.popup.showPrompt = title => {
			return new Promise(resolve => {
				window.popup.uiTitle.innerHTML = title.replaceAll('\n', '<br/>');
				window.popup.uiInput.value = '';
				window.popup.uiSelectList.style.display = 'none';
				window.popup.uiInput.style.display = 'block';
				window.popup.show('Ok', 'Cancel', isAccepted => resolve(isAccepted ? window.popup.uiInput.value : null));
			});
		};
		window.popup.showSelectList = (title, items, allowMultiselect) => {
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

				window.popup.uiSelectListItems.multiple = allowMultiselect;
				window.popup.uiSelectListItems.innerHTML = '';
				let i = 0;
				items.forEach((value, key) => {
					window.popup.uiSelectListItems[i] = new Option(key, i);
					window.popup.uiSelectListItems[i].dataset.description = value.description || '';
					i++;
				});
				window.popup.uiSelectListItems.value = 0;
				window.popup.uiSelectListItems.dispatchEvent(new Event('change'));
				window.popup.uiSelectList.style.display = 'flex';
				window.popup.uiInput.style.display = 'none';

				function getSelection() {
					const values = Array.from(items.values());
					if (!allowMultiselect) {
						return [values[window.popup.uiSelectListItems.value]];
					} else {
						return [values[window.popup.uiSelectListItems.value]];
					}
				}
				window.popup.show('Ok', 'Cancel', isAccepted => resolve(isAccepted ? getSelection() : null));
			});
		};
		window.popup.showOptions = (title, actions, noCancelButton) => {
			console.assert(actions instanceof Map);
			if (actions.size === 0) return;
			if (actions.size === 1) {
				// Auto-run the single action (no ui needed)
				actions.values().next().value();
				return;
			}
			// Setup the ui
			window.popup.uiTitle.innerHTML = title.replaceAll('\n', '<br/>');
			window.popup.uiOptions.innerHTML = '';
			actions.forEach((value, key) => {
				window.popup.addOptionButton(key, value);
			});
			if (!noCancelButton) {
				window.popup.addOptionButton('Cancel', () => window.popup.hide);
			}
			window.popup.uiSelectList.style.display = 'none';
			window.popup.uiInput.style.display = 'none';
			window.popup.uiOptions.style.display = 'flex';
			window.popup.show();
		};
	}
	preparePopup();

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

	// #endregion

	// #region PLUGIN LOGIC
	
	// Track whether 'createEventPluginFile' is currently running.
	let isInFunctionCreateEventPluginFile = false;
	wrap.splice(EventEditor.prototype, 'createEventPluginFile', async (original) => {
		isInFunctionCreateEventPluginFile = true;
		await original.bind(window.EDITOR.eventEditor)();
		isInFunctionCreateEventPluginFile = false;
	});

	wrap.after(EventEditor.prototype, 'createEventPluginFile', async () => {
		// If more than one file is picked, ask user what to do
		if (EDITOR.latestFilePick.length <= 1) return;
		const majorDirection = await new Promise(resolve => {
			const onChoose = choice => {
				resolve(choice);
			};
			const options = new Map([['to the right', () => onChoose(0)], ['downwards', () => onChoose(1)], ['Only add one plugin', () => onChoose(-1)]]);
			window.popup.showOptions("You've selected multiple plugins.\nWhere to add extra plugins?", options, true);
		});
		if (majorDirection === -1) return;
		// Setup vars to do this multi-file loading
		const filePick = EDITOR.latestFilePick;
		const minorDirection = 1 - majorDirection;
		const { room, event: firstEvent } = window.EDITOR.getSelections();
		const events = room.events;
		let position = [...firstEvent.position];
		// Start with the second file as the first is already loaded
		let fileIndex = 1;
		// Temporarily mock the file picker.  It works normally, except when run (repeatedly) by
		// 'createEventPluginFile'.  For that it returns the next selected file.  Mock ends when
		// all selected files have been loaded.
		const originalPickFilesFnc = maker.pickFiles;
		maker.pickFiles = () => {
			if (isInFunctionCreateEventPluginFile) {
				return new Promise((resolve) => {
					EDITOR.latestFilePick = [filePick[fileIndex]];
					resolve(EDITOR.latestFilePick);
				});
			} else {
				return originalPickFilesFnc();
			}
		};

		async function loadNextPickedPluginFile() {
			// Find the next valid empty position
			let positionIsValid;
			do {
				position[majorDirection] += 1;
				positionIsValid = true;
				if (position[majorDirection] >= ROOM_SIZE) {
					positionIsValid = false;
					position[majorDirection] = -1;
					position[minorDirection]++;
					if (position[minorDirection] >= ROOM_SIZE) {
						position[minorDirection] = 0;
					}
				}
				else if (window.getEventsAt(events, position[0], position[1]).length) {
					positionIsValid = false;
				}
			} while (!positionIsValid);
			// Load the file
			EDITOR.selectedEventCell.x = position[0];
			EDITOR.selectedEventCell.y = position[1];
			await EDITOR.eventEditor.createEventPluginFile();
			// Move to the next file and, if there is one, start loading it.  Otherwise revert
			// 'maker.pickfiles' to normal and we're done.
			fileIndex++;
			if (fileIndex < filePick.length) {
				setTimeout(loadNextPickedPluginFile, 0);
			} else {
				maker.pickFiles = originalPickFilesFnc;
			}
		}
		// Kick off loading the other files after a small delay
		setTimeout(loadNextPickedPluginFile, 0);
	});

	// If the plugin "editor suboptions" is loaded, modify plugin imports for that too
	if (window.EDITOR.loadedEditorPlugins?.has('suboptions') {
		// Make it known that this is happening so that "editor suboptions" will allow multi-select
		window.EDITOR.loadedEditorPlugins.add('importMultiplePlugins.suboptions');
		
	}

	// #endregion

	// Prevent repeating this setup
	window.EDITOR.loadedEditorPlugins ||= new Set();
	window.EDITOR.loadedEditorPlugins.add('importMultiplePlugins');
}
if (!window.EDITOR.loadedEditorPlugins?.has('importMultiplePlugins')) {
	setupEditorPlugin();
}
