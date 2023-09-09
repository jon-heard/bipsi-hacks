/**
📁
@file editor file viewer
@summary View and download files fields.
@license MIT
@author Violgamba (Jon Heard)


@description
The file field ui has a new button to open the file in a file-viewer: a separate browser tab with
the following features:
- Option to download the file.
- Zooming.
- A selectable background style.
- Option to pick whether the file-viewer gets the focus when a new file is viewed.


HOW TO USE:
1. Import this plugin into your game.
2. If you don't already have one, create a file field in an event.
3. Set the file field of step 2 to a file that is viewable from a browser (image, sound, text, etc).
4. While the file field of step 2 is selected, click on the button with the eye icon, just to the
   right of the file's name.
5. Note that a new tab opens showing the file stored in the file field of step 2.
*/

//! CODE_EDITOR

async function setupEditorPlugin() {

	function createViewerWindow() {
		const result = window.open('', 'bipsiFileViewer');
		result.document.write(`
			<!DOCTYPE html><html><head>
				<title>bipsi file viewer</title>
				<link rel="icon" type="image/png" href="${document.querySelector('link[rel=icon]').href}"/>
				<style>
					html { height: 100%; }
					body#outer { display: flex; flex-direction: column; height: 100%; margin: 0; }
					body#inner { display: inline-block; image-rendering: pixelated; }
					body#inner img { border: 1px solid black; }
					body#inner * { transform-origin: left top; }
					iframe { flex: 1; }
					.spacer { display: inline-block; width: 2rem; }
					.smallSpacer { display: inline-block; width: 1rem; }
					.bold { font-weight: bold; }
					.checkerboard {
						background-image: linear-gradient(45deg, grey 25%, transparent 25%), linear-gradient(45deg, transparent 75%, grey 75%), linear-gradient(45deg, transparent 75%, grey 75%), linear-gradient(45deg, grey 25%, lightgrey 25%);
						background-size:16px 16px;       
						background-position:0 0, 0 0, -8px -8px, 8px 8px;
					}
					.white { background-color: white; }
					.black { background-color: black; }
					.grey { background-color: grey; }
					.red { background-color: red; }
					.green { background-color: green; }
					.blue { background-color: blue; }
				</style>
				<script>
					let scale = 1.0;
					const currentContent = { data: null, fieldname: '', fieldId: '', filename: '', mimeType: '', scalable: true };
					function setContent(data, fieldname, fieldId, filename, mimeType, scalable) {
						currentContent.data = data;
						currentContent.fieldname = fieldname;
						currentContent.fieldId = fieldId;
						currentContent.filename = filename;
						currentContent.mimeType = mimeType;
						currentContent.scalable = scalable;
						document.getElementById('fieldnameUi').innerText = currentContent.fieldname;
						document.getElementById('filenameUi').innerText = currentContent.filename;
						document.getElementById('fieldIdUi').innerText = currentContent.fieldId;
						document.getElementById('mimeTypeUi').innerText = currentContent.mimeType;
						const iframe = document.getElementsByTagName('iframe')[0];
						iframe.onload = () => {
							// Copy the CSS from page to iframe
							const iframeCss = iframe.contentDocument.createElement('style');
							iframe.contentDocument.getElementsByTagName('head')[0].append(iframeCss);
							iframeCss.innerHTML = document.getElementsByTagName('style')[0].innerHTML;
							// Setup iframe DOM
							iframe.contentDocument.body.id = 'inner';
							refreshScale();
						};
						iframe.src = currentContent.data;
						if (document.getElementById('focusOnNewContent').checked) {
							window.focus();
						}
					}
					function refreshScale() {
						if (currentContent.scalable) {
							const viewables = document.getElementsByTagName('iframe')[0].contentDocument.body.querySelectorAll('*');
							viewables.forEach(viewable => {
								viewable.style.transform = \`scale(\${scale})\`;
							});
						}
						document.getElementById('zoomValueUi').innerText = \`\${Math.trunc(scale * 100)}%\`;
					}
					function zoomOut() {
						scale *= 0.8;
						refreshScale();
					}
					function resetZoom() {
						scale = 1.0;
						refreshScale();
					}
					function zoomIn() {
						scale *= 1.25;
						refreshScale();
					}
					function setStyle(className) {
						document.body.className = className;
					}
					function saveStyle() {
						localStorage['bipsiFileViewer_style'] = document.getElementById('styleSelect').value;
					}
					function downloadFile() {
						const a = document.createElement('a');
						a.href = currentContent.data;
						a.download = currentContent.filename;
						a.click();
					}
					function onViewerLoaded() {
						const defaultStyle = localStorage['bipsiFileViewer_style'] || 'checkerboard';
						document.body.className = defaultStyle;
						document.getElementById('styleSelect').value = defaultStyle;
					}
				// closing script tags break bipsi, unless disrupted
				</s${'c'}ript>
			</head><body id="outer" onload='onViewerLoaded(); console.log("here1");'>
				<div id="info" class="white">
					<span class="smallSpacer"></span>
					Field: <span id="fieldnameUi" class="bold"></span>
					<span class="spacer"></span>
					Filename: <span id="filenameUi" class="bold"></span>
					<span class="spacer"></span>
					Field id: <span id="fieldIdUi" class="bold"></span>
					<span class="spacer"></span>
					Mime type: <span id="mimeTypeUi" class="bold"></span>
				</div>
				<div class="white">
					<span class="smallSpacer"></span>
					<button onclick="downloadFile()" title="download the current file">Download file</button>

					<span class="spacer"></span>
					<button onclick="zoomOut()" title="zoom out">🗛</button>
					<button onclick="resetZoom()" title="reset zoom">🄐</button>
					<button onclick="zoomIn()" title="zoom in">🗚</button>
					<span id="zoomValueUi" title="current zoom">100%</span>

					<span class="spacer"></span>
					Background
					<select id="styleSelect" onchange="setStyle(this.value)" title="set background style">
						<option>checkerboard</option>
						<option>white</option>
						<option>black</option>
						<option>grey</option>
						<option>red</option>
						<option>green</option>
						<option>blue</option>
					</select>
					<button onclick="saveStyle()" title="set style as the default">📌</button>

					<span class="spacer"></span>
					<input id="focusOnNewContent" type="checkbox" checked title="Select whether to switch to this browser tab when a file is viewed">Focus when file is viewed</input>
				</div>
				<iframe/>
			</body></html>
		`);
		result.onViewerLoaded();
		return result;
	}

	// Add viewer button to the file field ui
	const fileFieldUi = document.getElementById('field-file-editor');
	const fileViewerButton = document.createElement('button');
	fileFieldUi.append(fileViewerButton);
	fileViewerButton.title = 'view file';
	fileViewerButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8zM1.173 8a13.133 13.133 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.133 13.133 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5c-2.12 0-3.879-1.168-5.168-2.457A13.134 13.134 0 0 1 1.172 8z"></path><path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0z"></path></svg>';

	// Button logic
	window.viewerWindow = null;
	fileViewerButton.addEventListener('click', () => {
		const { field } = EDITOR.eventEditor.getSelections();
		if (!field || field.type !== 'file' || !field.data) return;
		const fileToView = window.EDITOR.stateManager.resources.resources.get(field.data)?.instance;
		if (!fileToView) return
		
		// Setup the viewer browser tab
		if (!viewerWindow || viewerWindow.closed) {
			viewerWindow = createViewerWindow();
		}
		const scalable = !fileToView.type.startsWith('audio');
		viewerWindow.setContent(URL.createObjectURL(fileToView), field.key || '???', field.data || '???', fileToView.name || '???', fileToView.type || '???', scalable);
	});

	// Prevent repeating this setup
	window.EDITOR.loadedEditorPlugins ||= new Set();
	window.EDITOR.loadedEditorPlugins.add('fileViewer');
}
if (!window.EDITOR.loadedEditorPlugins?.has('fileViewer')) {
	setupEditorPlugin();
}

// End with CODE_PLAYBACK for compatibility with build-added IIFE wrapper
//! CODE_PLAYBACK
