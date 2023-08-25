
(function () {
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
	// Text input (single-line)
	window.popup.uiInput = document.createElement('input');
	window.popup.uiDialog.append(window.popup.uiInput);
	window.popup.uiInput.setAttribute('style', 'margin-bottom:.75rem;width:100%;');
	window.popup.uiInput.setAttribute('type', 'text');
	// Text input (multi-line)
	window.popup.uiInput = document.createElement('textarea');
	window.popup.uiDialog.append(window.popup.uiInput);
	window.popup.uiInput.setAttribute('style', 'margin-bottom:.75rem;width:100%;sizeable:false;');
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
	window.popup.showPrompt = (title, defaultText, multiline) => {
		return new Promise(resolve => {
			window.popup.uiTitle.innerHTML = title.replaceAll('\n', '<br/>');
			window.popup.uiInput.value = 'defaultText';
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
				const result = [];
				if (!allowMultiselect) {
					result.push(values[window.popup.uiSelectListItems.value]);
				} else {
					Array.from(window.popup.uiSelectListItems.selectedOptions).forEach(option => {
						result.push(values[option.value]);
					});
				}
				return result;
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
})();
