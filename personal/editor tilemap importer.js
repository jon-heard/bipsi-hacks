
//! CODE_EDITOR

function setupTilemapImporter() {
	const CONFIRM_CANVAS_SIZE = 128;
	const BUTTON_ICON = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z"></path></svg>';

	const tabEl = document.getElementById('play-tab-body');

	// #region IMPORT LOGIC

	async function readBitsyTilemap(file) {
		const gameData = await file.text();
		if (!gameData.includes('\n# BITSY VERSION ')) {
			console.error("Invalid bitsy file: " + file.name);
			return null;
		}
		const tileHeadingRegex = /TIL|SPR/g;
		const tileCodeIndices = [];
		let nextMatch;
		while (nextMatch = tileHeadingRegex.exec(gameData)) {
			tileCodeIndices.push(nextMatch.index);
		}
		const result = [];
		const validTileCharsRegex = /[0-9]|\r|\n|>/;
		const tilePixelCharsRegex = /[0-9]/;
		for (const tileCodeIndex of tileCodeIndices) {
			const tileData = [[]];
			let frameId = 0;
			let cursor = gameData.indexOf('\n', tileCodeIndex) + 1;
			while (gameData[cursor].match(validTileCharsRegex)) {
				if (gameData[cursor].match(tilePixelCharsRegex)) {
					tileData[frameId].push(parseInt(gameData[cursor]));
				} else if(gameData[cursor] == '>') {
					tileData.push([]);
					frameId++;
				}
				cursor++;
			}
			result.push(tileData);
		}
		return result;
	}

	async function readBipsiTilemap(file) {
		const dataUrl = await new Promise(promiseResolve => {
			const reader = new FileReader();
			reader.onloadend = () => promiseResolve(reader.result);
			reader.onerror = () => promiseResolve(null);
			reader.readAsDataURL(file);
		});
		if (!dataUrl) {
			console.error("Failed to load file: " + file.name);
			return;
		}
		const image = await new Promise(promiseResolve => {
			const result = new Image();
			result.onload = () => promiseResolve(result);
			result.onerror = () => promiseResolve(null);
			result.src = dataUrl;
		});
		if (!image) {
			console.error("Failed to read image file: " + file.name);
			return;
		}
		const tileSize = image.width / 16;
		const canvas = document.createElement('canvas');
		canvas.width = image.width;
		canvas.height = image.height;
		var ctx = canvas.getContext("2d");
		ctx.drawImage(image, 0, 0);
		const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
		const framesData = [];
		for (let ty = 0; ty < canvas.height - tileSize + 1; ty += tileSize) {
			for (let tx = 0; tx < canvas.width - tileSize + 1; tx += tileSize) {
				const frameData = { x: tx, y: ty, data: [] };
				let tileIsEmpty = true;
				for (let py = 0; py < tileSize; py++) {
					for (let px = 0; px < tileSize; px++) {
						pixelIndex = (tx + px) + (ty + py) * canvas.width;
						if (imgData[pixelIndex * 4 + 3]) {
							frameData.data.push(1);
							tileIsEmpty = false;
						} else {
							frameData.data.push(0);
						}
					}
				}
				if (!tileIsEmpty) {
					framesData.push(frameData);
				}
			}
		}

		// Ask user which frames go together
		const result = [];
		const confirmPopup = document.createElement('div');
		document.getElementById('editor').append(confirmPopup);
		confirmPopup.id = 'tileImportUi';
		confirmPopup.setAttribute('style', 'position:fixed;z-index:100;width:400px');
		confirmPopup.innerHTML = `
			<div style="position:fixed;background-color:black;opacity:60%;left:0;top:0;right:0;bottom:0;"></div>
			<div style="position:fixed;width:400px;top:100px;background-color:var(--frame-color);border-radius:1rem;padding:1em;">
				<div style="text-align: center;font-size:140%;">Are these frames together?</div>
				<div style="text-align:center;">
					<canvas id="tileImportUi_frame1" width="${CONFIRM_CANVAS_SIZE}" height="${CONFIRM_CANVAS_SIZE}" style="margin:1em;"></canvas>
					<canvas id="tileImportUi_frame2" width="${CONFIRM_CANVAS_SIZE}" height="${CONFIRM_CANVAS_SIZE}" style="margin:1em;"></canvas>
				</div>
				<div style="display:flex;flex-direction:row;gap:0.5rem;height:32px;">
					<button id="tileImportUi_yes">YES</button>
					<button id="tileImportUi_no">NO</button>
					<button id="tileImportUi_cancel">CANCEL</button>
				</div>
			</div>`;
		let inputPromiseResolve;
		document.getElementById('tileImportUi_yes').addEventListener('click', () => {
			inputPromiseResolve('yes');
		});
		document.getElementById('tileImportUi_no').addEventListener('click', () => {
			inputPromiseResolve('no');
		});
		document.getElementById('tileImportUi_cancel').addEventListener('click', () => {
			inputPromiseResolve(null);
		});
		const frameCanvasCtxs = [
			document.getElementById('tileImportUi_frame1').getContext('2d'),
			document.getElementById('tileImportUi_frame2').getContext('2d')
		];
		frameCanvasCtxs[0].fillStyle = frameCanvasCtxs[1].fillStyle = "black";
		frameCanvasCtxs[0].imageSmoothingEnabled = frameCanvasCtxs[1].imageSmoothingEnabled = false;
		for (let i = 1; i < framesData.length; i++) {
			frameCanvasCtxs[0].fillRect(0, 0, CONFIRM_CANVAS_SIZE, CONFIRM_CANVAS_SIZE);
			frameCanvasCtxs[0].drawImage(image, framesData[i-1].x, framesData[i-1].y, tileSize, tileSize, 0, 0, CONFIRM_CANVAS_SIZE, CONFIRM_CANVAS_SIZE);
			frameCanvasCtxs[1].fillRect(0, 0, CONFIRM_CANVAS_SIZE, CONFIRM_CANVAS_SIZE);
			frameCanvasCtxs[1].drawImage(image, framesData[i].x, framesData[i].y, tileSize, tileSize, 0, 0, CONFIRM_CANVAS_SIZE, CONFIRM_CANVAS_SIZE);
			const answer = await new Promise(promiseResolve => {
				inputPromiseResolve = promiseResolve;
			});
			switch (answer) {
				case 'yes':
					result.push([ framesData[i-1].data, framesData[i].data ]);
					i++
					break;
				case 'no':
					result.push([ framesData[i-1].data ]);
					if (i === framesData.length - 1) {
						result.push([ framesData[i].data ]);
					}
					break;
				default:
					confirmPopup.remove();
					return null;
			}
		}
		confirmPopup.remove();
		return result;
	}

	async function importTilesetFile() {
        // ask the browser to provide a file
        const [file] = await maker.pickFiles('.png,.txt');
		if (!file) {
			return;
		}
		let tilesData;
		switch (file.type) {
			case 'text/plain':
				tilesData = await readBitsyTilemap(file);
				break;
			case 'image/png':
				tilesData = await readBipsiTilemap(file);
				break;
		}
		if (!tilesData) {
			return;
		}
		await EDITOR.stateManager.makeChange(async (data) => {
			// Update data structures to fit imported tilemap
			const framesToRender = {};
			for (tileData of tilesData) {
				const id = nextTileId(data);
				const frames = [];
				data.tiles.push({ id, frames });
				for (frameData of tileData) {
					const newFrameId = findFreeFrame(data.tiles);
					frames.push(newFrameId);
					framesToRender[newFrameId] = frameData;
				}
			}
			const tilesetCtx = EDITOR.stateManager.resources.get(EDITOR.stateManager.present.tileset);
			resizeTileset(tilesetCtx, data.tiles);

			// Draw imported frames
			const tilesetCanvas = tilesetCtx.canvas;
			const imgData = tilesetCtx.getImageData(0, 0, tilesetCanvas.width, tilesetCanvas.height);
			for (frameId in framesToRender) {
				const { x: dstX, y: dstY, size: dstSize } = getTileCoords(tilesetCanvas, frameId);
				let srcSize = Math.sqrt(framesToRender[frameId].length);
				let blitSize = Math.min(srcSize, dstSize);
				for (let x = 0; x < blitSize; x++) {
					for (let y = 0; y < blitSize; y++) {
						const srcIndex = x + y * srcSize;
						const pixVal = framesToRender[frameId][srcIndex] ? 255 : 0;
						const dstIndex = (dstX + x) + (dstY + y) * tilesetCanvas.width;
						imgData.data[dstIndex * 4 + 0] = pixVal;
						imgData.data[dstIndex * 4 + 1] = pixVal;
						imgData.data[dstIndex * 4 + 2] = pixVal;
						imgData.data[dstIndex * 4 + 3] = pixVal;
					}
				}
			}
			tilesetCtx.putImageData(imgData, 0, 0);
		});
	}

	// #endregion

	// #region SETUP BUTTON

	// Clear up vertical space for the new button (remove the "info" label)
	if (tabEl.children[1].innerText == 'info') {
		tabEl.children[1].remove();
	}
	if (!tabEl.children[3].classList.contains('info-action-list')) {
		console.error('Failed adding tilemap export button to DOM');
		return;
	}
	const button = document.createElement('button');
	tabEl.children[3].append(button);
	button.name = 'import-tileset';
	button.title = 'import tiles - from png or bitsy data file';
	button.innerHTML = BUTTON_ICON + 'import tile graphics';

	exportTileset: ui.action("import-tileset", () => importTilesetFile())

	// #endregion
}

if (!document.getElementById('tilemapImportButton')) {
	setupTilemapImporter();
}
