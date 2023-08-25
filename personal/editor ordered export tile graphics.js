/**
🖽
@file editor ordered export tile graphics
@summary Tile graphics are exported in bipsi-ui order.  Animation frames are consecutive.
@license MIT
@author Violgamba (Jon Heard)

@description
By default, bipsi exports tile graphics in an internally stored order.  This can be problematic as
animation frames can be separated and any organization the user puts into ordering their tiles is
discarded.  This plugin modifies the "export tile graphics" feature so that tiles are exported in
the order they are placed in the bipsi ui, including consecutive animation frames.

If the plugin "editor suboptions" is already loaded, then this plugin will add it's feature as a new
suboption.  Otherwise it will replace the normal "export tile graphics" functionality.


HOW TO USE - WITHOUT THE "EDITOR SUBOPTIONS" PLUGIN:
1. Import this plugin into your game.
2. Run a playtest, then click the "export tile graphics" button.
3. Open the downloaded image and note that the tile order matches what's shown in the bipsi ui.


HOW TO USE - WITH THE "EDITOR SUBOPTIONS" PLUGIN:
1. Import this plugin into your game.
2. Run a playtest, then click the "export tile graphics" button.
3. Click the "to file in tile order" button.
4. Open the downloaded image and note that the tile order matches what's shown in the bipsi ui.
5. Click the "to clipboard in tile order" button.
6. Open the copied image and note that the tile order matches what's shown in the bipsi ui.
*/

//! CODE_EDITOR

function setupEditorPlugin() {
	BipsiEditor.prototype.makeOrderedTileset = function makeOrderedTileset() {
		const { tileset: src }  = window.EDITOR.getSelections();
		const dst = window.createRendering2D(src.canvas.width, src.canvas.height);
		const { tiles } = this.stateManager.present;
		let dstIndex = 0;
		tiles.forEach(tile => {
			tile.frames.forEach(frameId => {
				const { x: sx, y: sy, size: tileSize } = window.getTileCoords(src.canvas, frameId);
				const { x: dx, y: dy } = window.getTileCoords(dst.canvas, dstIndex);
				dst.drawImage(src.canvas, sx, sy, tileSize, tileSize, dx, dy, tileSize, tileSize);
				dstIndex++;
			});
		});
		return dst;
	};

	// If suboptions editor plugin is available, add this to the options.  Else, replace the original "tile graphics export" functionality.
	if (!window.EDITOR.loadedEditorPlugins?.has('suboptions')) {
		wrap.splice(BipsiEditor.prototype, 'exportTileset', async function exportTileset(original) {
			const tileset = this.makeOrderedTileset();
			return new Promise((resolve, reject) => {
				const name = 'bipsi-tileset.png';
				tileset.canvas.toBlob(blob => {
					maker.saveAs(blob, name);
					resolve();
				});
			});
		});
	} else {
		window.suboptions.exportTileGraphics.set('to file in tile order', async () => {
			const tileset = EDITOR.makeOrderedTileset();
			return new Promise((resolve, reject) => {
				const name = 'bipsi-tileset.png';
				tileset.canvas.toBlob(blob => {
					maker.saveAs(blob, name);
					resolve();
				});
			});
		});

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

		window.suboptions.exportTileGraphics.set('to clipboard in tile order', async () => {
			if (!checkIfClipboardIsAvailable()) return;
			const tileset = EDITOR.makeOrderedTileset();
			tileset.canvas.toBlob(blob => {
				const item = new window.ClipboardItem({ 'image/png': blob });
				navigator.clipboard.write([item]);
			});
		});
	}

	// Prevent repeating this setup
	window.EDITOR.loadedEditorPlugins ||= new Set();
	window.EDITOR.loadedEditorPlugins.add('orderedExportTileGraphics');
}
if (!window.EDITOR.loadedEditorPlugins?.has('orderedExportTileGraphics')) {
	setupEditorPlugin();
}
