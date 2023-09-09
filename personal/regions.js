/**
TODO
Make this work with smooth-move
Change back to a select-box. for region select.
	- allow adding a comment to a region.  Make it saved as part of the project.
Make a random character walk plugin - "?" means walk in random direction
	- have random character movement plugin include json field "walk-region" to determine where random will go/not go.
	- have random character movement plugin include bool field "walk-region-is-suggestion".  Determine if region is adhered to only by random, or adhered to by every action.

HOW TO - CREATE A REGION TAG AT RUNTIME

*/

//! CODE_EDITOR

async function setupEditorPlugin() {
	// #region CSS
	const style = document.createElement('style');
	document.head.append(style);
	style.id = 'regionEditorStyles';
	style.innerHTML = `
		.regionSelectItem {
			display: inline-block !important;
			width: 39px;
			height: 31px;
			margin: .25rem;
			text-align: center;
		}
		.regionSelectItem > div {
			position: relative;
			width: 39px;
			display: inline-block;
			top: 6px;
		}
	`;
	// #endregion

	// #region EDITOR RENDERING
	window.EDITOR.NUM_TILES = await loadImage('data:image/gif;base64,R0lGODlhRgAOAKEBAAAAAP///////////yH5BAEKAAIALAAAAABGAA4AAAK4lIBmCHqpoIOMzVTta1GCAHJfwB0guYSTOqop2rKnOJsM2dI3gqM2jKMEN7yiMdhrfCq+pU14VPoi01XxCbw6bQtMdQnOlraOlDaJlerK3IcY6SJbzeKw2sx2jmin4FlDNTYV84c31wWzU4JVE0g3FtUm1+ZoGAi2lZllpdf0VWU5aSfpeYfXuRaaSmmGauh6isQ0m4GGmIFa2KopKNPH82vyGZJDFTdcWqaByyyySJSh7CHRBelQAAA7');
	const tileDrawCode = `
		if (wall > 1 && wall < 11) {
			rendering.drawImage(
				this.NUM_TILES,
				7 * (wall - 1), 0,
				7, 14,
				x * TILE_PX * 2 + 5, y * TILE_PX * 2 + 1,
				7, 14,
			);
		} else if (wall >= 11) {
			rendering.drawImage(
				this.NUM_TILES,
				7 * Math.trunc(((wall - 1) / 10)), 0,
				7, 14,
				x * TILE_PX * 2 + 1, y * TILE_PX * 2 + 1,
				7, 14,
			);
			rendering.drawImage(
				this.NUM_TILES,
				7 * ((wall - 1) % 10), 0,
				7, 14,
				x * TILE_PX * 2 + 8, y * TILE_PX * 2 + 1,
				7, 14,
			);
		} else if (wall === 1) {
	`;
	// Code injection - update "BipsiEditor.prototype.redraw" - drawing walls and regions.
	let redrawSrc = BipsiEditor.prototype.redraw.toString();
	redrawSrc = redrawSrc.replace('redraw()', 'BipsiEditor.prototype.redraw = function redraw()');
	redrawSrc = redrawSrc.replaceAll('if (wall > 0) {', tileDrawCode);
	new Function(redrawSrc)();
	// #endregion

	// #region EDITOR UI ELEMENTS
	document.querySelector('input[name=room-paint-tool][value=wall]').title = 'draw walls and regions'
	function addRegionSelectItem(parent, text, value) {
		const itemLabel = document.createElement('label');
		parent.append(itemLabel);
		itemLabel.classList.add('toggle', 'regionSelectItem');
		const itemRadio = document.createElement('input');
		itemLabel.append(itemRadio);
		itemRadio.type = 'radio';
		itemRadio.name = 'region-select';
		itemRadio.value = value;
		const itemText = document.createElement('div');
		itemLabel.append(itemText);
		itemText.innerText = text;
		return itemLabel;
	}
	function addBr(parent) {
		parent.append(document.createElement('br'));
	}
	const tabContainer = document.querySelector('#draw-room-tab-controls > .controls-tab-body');
	const regionEditor = document.createElement('div');
	tabContainer.append(regionEditor);
	regionEditor.id = 'draw-room-region-controls';
	regionEditor.hidden = true;
	window.EDITOR.roomPaintTool.tab(ONE("#draw-room-region-controls"), "wall");
	const wallItem = addRegionSelectItem(regionEditor, 'Wall', 1);
	wallItem.style.width = '85px';
	wallItem.querySelector('div').style.width = '85px';
	wallItem.querySelector('input').checked = true;
	addBr(regionEditor);
	for (let i = 1; i < 100; i++) {
		addRegionSelectItem(regionEditor, i, i + 1);
		if (i % 10 == 0) {
			addBr(regionEditor);
		}
	}
	window.EDITOR.regionSelect = ui.radio("region-select");
	// #endregion

	// #region DRAWING LOGIC
	let latestTrackCanvasStroke = null;
	wrap.splice(window, 'trackCanvasStroke', (original, canvas, drag) => {
		if (window.EDITOR.roomPaintTool.value !== 'wall') {
			return original(canvas, drag);
		} else {
			latestTrackCanvasStroke = original(canvas, drag);
			return latestTrackCanvasStroke;
		}
	});
	// Modify wall drawing for region drawing
	const onRoomPointer = async (event, canvas, forcePick=false) => {
		if (window.EDITOR.roomPaintTool.value !== 'wall') return;

		const factor = ROOM_SIZE / canvas.width;
		const round = position => {
			return {
				x: Math.floor(position.x * factor),
				y: Math.floor(position.y * factor),
			};
		};

		const drag = ui.drag(event);
		const { room } = window.EDITOR.getSelections();
		const { x, y } = round(latestTrackCanvasStroke[0]);
		const nextWall = room.wallmap[y][x] > 0 ? parseInt(window.EDITOR.regionSelect.value, 10) : 0;
		const setIfWithin = (map, x, y, value) => {
			if (x >= 0 && x < ROOM_SIZE && y >= 0 && y < ROOM_SIZE) map[y][x] = value ?? 0;
		}
		const plot = (x, y) => setIfWithin(room.wallmap, x, y, nextWall);
		plot(x, y);
		drag.addEventListener("move", event => {
			const positions = latestTrackCanvasStroke;
			const { x: x0, y: y0 } = round(positions[positions.length - 2]);
			const { x: x1, y: y1 } = round(positions[positions.length - 1]);
			window.lineplot(x0, y0, x1, y1, plot);
			window.EDITOR.requestRedraw();
		});
		drag.addEventListener("up", (event) => {
			const positions = latestTrackCanvasStroke;
			const { x, y } = round(positions[positions.length - 1]);
			plot(x, y);
			window.EDITOR.requestRedraw();
			window.EDITOR.stateManager.changed();
		});
	}
	window.EDITOR.renderings.tileMapPaint.canvas.addEventListener("pointerdown", (event) => onRoomPointer(event, window.EDITOR.renderings.tileMapPaint.canvas));
	// #endregion

	// Prevent repeating this setup
	window.EDITOR.loadedEditorPlugins ||= new Set();
	window.EDITOR.loadedEditorPlugins.add('regions');
}
if (!window.EDITOR.loadedEditorPlugins?.has('regions')) {
	setupEditorPlugin();
}

//! CODE_PLAYBACK

wrap.after(window, 'start', () => {
	// Region-events are stored in PLAYBACK in case they needs to be manually modified, such as for creating a region-event at runtime
	window.PLAYBACK.regionEvents = {};
	// Region-events are defined by a tag "region-X" where X is a region number.  This is not easily referenced though (due to the X), so we append a more easily referenced tag: "is-region-event".
	window.allEvents(window.PLAYBACK.data).forEach(event => {
		// If the "is-region-event" tag is already set, do nothing
		if (eventIsTagged(event, 'is-region-event')) return;
		// If the event has a "region-X" tag, append an "is-region-event" tag AND add the event to the regionEvents collection
		for (const field of event.fields) {
			const match = field.key.match(/^region-([0-9]+)/);
			if (!match) continue;
			event.fields.push({ key: 'is-region-event', type: 'tag', data: true });
			window.PLAYBACK.regionEvents[parseInt(match[1], 10) + 1] = event;
			break;
		}
	});
});

// #region REGION TOUCH HANDLING
function getRegionEventAt(room, x, y) {
	// Find the region at the coordinates
	const regionId = room.wallmap[y][x];
	if (regionId <= 1) return null;
	// Return the associated regionEvent, or null if none available
	return window.PLAYBACK.regionEvents[regionId] || null;
}
// A wall is region #1.  Region-events should be ignored for solid-cell, though regions should not.  A region is solid if its region-event is solid.
window.cellIsSolid = function cellIsSolid(room, x, y) {
	const wall = room.wallmap[y][x] == 1;
	const solid = getEventsAt(room.events, x, y).some((event) => eventIsTagged(event, 'solid') && !eventIsTagged(event, 'is-region-event'));
	const regionEvent = getRegionEventAt(room, x, y);
	const regionEventIsSolid = regionEvent && eventIsTagged(regionEvent, 'solid');
	return solid || wall || regionEventIsSolid;
};
// Region-events should be ignored for touching
window.getEventsAt = function(events, x, y, ignore=undefined) {
    return events.filter((event) => event.position[0] === x 
                                 && event.position[1] === y 
                                 && event !== ignore
								 && !eventIsTagged(event, 'is-region-event'));
};
wrap.splice(BipsiPlayback.prototype, 'move', async function move(original, dx, dy) {
	if (!this.canMove || this.busy) { // Extra 'this.busy' check for compatibility with 'smooth-move' plugin
		if (this.ended) this.proceed();
		return;
	}

	this.busy = true;
	const avatar = getEventById(this.data, this.avatarId);
	const room = roomFromEvent(this.data, avatar);
	const [tx, ty] = [avatar.position[0] + dx, avatar.position[1] + dy];

	this.busy = false;
	await original.call(this, dx, dy);
	this.busy = true;

	let event = (tx < 0 || tx >= ROOM_SIZE || ty < 0 || ty >= ROOM_SIZE) ? null : getRegionEventAt(room, tx, ty);
	if (!event) {
		const [fx, fy] = avatar.position;
		if (fx !== tx || fy !== ty) {
			event = getRegionEventAt(room, fx, fy);
		}
	}
	if (event) await this.touch(event);
	this.busy = false;
});
// #endregion
