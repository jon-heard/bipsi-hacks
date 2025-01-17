//! CODE_RUNTIME_DEV
const BEHAVIOUR_DIALOGUE_TRACK_SPEAKER = `
let id = FIELD(EVENT, "say-shared-id", "text") ?? "SAY-ITERATORS/" + EVENT_ID(EVENT);
let mode = FIELD(EVENT, "say-mode", "text") ?? "cycle";
let say = SAMPLE(id, mode, FIELDS(EVENT, "say", "dialogue"));
if (say) {
	PLAYBACK.speakerEvent = EVENT;
	await SAY(say, FIELD(EVENT, "say-style", "json"));
	PLAYBACK.speakerEvent = null;
} else if (say === undefined) {
	let nosays = FIELD(EVENT, "no-says", "javascript");
	if (nosays) {
		await RUN_JS(nosays);
	}
}`;
for (let i = 0; i < STANDARD_SCRIPTS.length; i++) {
	if (STANDARD_SCRIPTS[i] === BEHAVIOUR_DIALOGUE) {
		STANDARD_SCRIPTS[i] = BEHAVIOUR_DIALOGUE_TRACK_SPEAKER;
		break;
	}
}


//! CODE_EDITOR

// TODO
// try using canvas "title" to show tooltips for different things
// Cleanup and document logic of audiorecorderui

if (!window.soundRecording) {

const SVG_SOUND_RECORDING = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewbox="0 0 16 16" stroke="currentColor" stroke-linecap="round" fill="none">
	<line x1="5" y1="15" x2="11" y2="15" />
	<line x1="8" y1="15" x2="8" y2="13" />
	<path d="M4 9 c0 5 8 5 8 0" />
	<path d="M5.5 4 v4 c0 4 5 4 5 0 v-4 c0 -4 -5 -4 -5 0" />
</svg>`;
const SVG_BACK = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
	<path fill-rule="evenodd" d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z"></path>
</svg>`;

class SoundRecording {
	constructor() {
		// UI container - editor
		const controlTab = document.getElementById('draw-room-tab-controls').children[0];
		this.editorRoot = document.createElement('div');
		controlTab.append(this.editorRoot);
		this.editorRoot.id = 'soundRec-controls-editor';
		this.editorRoot.setAttribute('hidden', '');

		// UI container - playback
		this.playtestTab = document.getElementById('play-tab-body');
		this.playtestSoundRecTab = document.createElement('div');
		this.playtestTab.parentNode.insertBefore(this.playtestSoundRecTab, this.playtestTab);
		this.playtestSoundRecTab.id = 'soundRec-controls-playtest';
		this.playtestSoundRecTab.classList.add('controls-tab-body');
		this.playtestSoundRecTab.setAttribute('hidden', '');

		// UI toolbar - editor
		const editorToolbar = document.getElementById('tile-map-toolbar').children[0];
		const editorToolbutton = document.createElement('label');
		editorToolbar.append(editorToolbutton);
		editorToolbutton.id = 'editorSoundRecordButton';
		editorToolbutton.innerHTML = `<input type="radio" name="room-paint-tool" value="soundRec" title="record sound">${SVG_SOUND_RECORDING}`;
		EDITOR.roomPaintTool.add(editorToolbutton.children[0]);
		EDITOR.roomPaintTool.tab(ONE('#soundRec-controls-editor'), 'soundRec');

		// UI toolbar - playtest
		const playtestToolbar = document.getElementById('play-tab-view').children[1];
		const playtestToggleBbutton = document.createElement('button');
		playtestToolbar.append(playtestToggleBbutton);
		playtestToggleBbutton.classList.add('icon-button');
		playtestToggleBbutton.title = 'record sound';
		playtestToggleBbutton.innerHTML = SVG_SOUND_RECORDING;
		playtestToggleBbutton.addEventListener('click', this.togglePlaytestTab.bind(this));

		// UI - editor
		this.editorAudioRecorderUi = new AudioRecorderUi(478, 150, this.onEditorSaved.bind(this));
		this.editorRoot.append(this.editorAudioRecorderUi.domUi);
		this.editorMessageUi = document.createElement('div');
		this.editorRoot.append(this.editorMessageUi);
		this.editorMessageUi.setAttribute('style', 'margin-top: 1em; text-align: center; font-size: 125%');
		EDITOR.roomPaintTool.addEventListener("change", this.onEditorTypeChanged.bind(this));

		// UI - playback
		this.playbackAudioRecorderUi = new AudioRecorderUi(478, 150, this.onPlaybackSaved.bind(this));
		this.playtestSoundRecTab.append(this.playbackAudioRecorderUi.domUi);
		this.playtestMessageUi = document.createElement('div');
		this.playtestSoundRecTab.append(this.playtestMessageUi);
		this.playtestMessageUi.setAttribute('style', 'margin-top: 1em; text-align: center; font-size: 125%');
		const playtestBackButton = document.createElement('button');
		this.playtestSoundRecTab.append(playtestBackButton);
		playtestBackButton.classList.add('icon-button');
		playtestBackButton.title = 'end sound recording';
		playtestBackButton.innerHTML = SVG_BACK;
		playtestBackButton.addEventListener('click', this.togglePlaytestTab.bind(this));
		playtestBackButton.setAttribute('style', 'position: absolute; bottom: 1em; width: 478px;');
		this.playtestSoundRecTab.style.position = 'relative';
		EDITOR.modeSelect.addEventListener("change", this.onEditorModeChanged.bind(this));
/*
		EDITOR.orig_editor_gatherPluginsJavascript = EDITOR.gatherPluginsJavascript;
		EDITOR.gatherPluginsJavascript = function(codeType) {
			let result = this.orig_editor_gatherPluginsJavascript.bind(this)(codeType);
			result += `
				const BEHAVIOUR_DIALOGUE_TRACK_SPEAKER = \`
				let id = FIELD(EVENT, "say-shared-id", "text") ?? "SAY-ITERATORS/" + EVENT_ID(EVENT);
				let mode = FIELD(EVENT, "say-mode", "text") ?? "cycle";
				let say = SAMPLE(id, mode, FIELDS(EVENT, "say", "dialogue"));
				if (say) {
					PLAYBACK.speakerEvent = EVENT;
					await SAY(say, FIELD(EVENT, "say-style", "json"));
					PLAYBACK.speakerEvent = null;
				} else if (say === undefined) {
					let nosays = FIELD(EVENT, "no-says", "javascript");
					if (nosays) {
						await RUN_JS(nosays);
					}
				}\`;

				for (let i = 0; i < STANDARD_SCRIPTS.length; i++) {
					if (STANDARD_SCRIPTS[i] === BEHAVIOUR_DIALOGUE) {
						STANDARD_SCRIPTS[i] = BEHAVIOUR_DIALOGUE_TRACK_SPEAKER;
						break;
					}
				}
			`;
			return result;
		}
*/
	}

	onEditorTypeChanged() {
		if (EDITOR.roomPaintTool.value === 'soundRec') {
			const libraryEvent = findEventByTag(EDITOR.stateManager.present, 'is-library');
			if (!libraryEvent) {
				this.editorAudioRecorderUi.domUi.setAttribute('hidden', '');
				this.editorMessageUi.innerHTML = 'A library event is required for sound recording<br/>as recorded sounds will be stored in the library.<br/><br/>Add an event tagged "is-library" and try again.';
			} else {
				this.editorAudioRecorderUi.domUi.removeAttribute('hidden');
				let librarySoundFileKeys = libraryEvent.fields.filter(field => field.type == 'file').filter(field => this.fileIsAudio(field.data)).map(field => field.key);
				let table = '<table style="width: 100%; table-layout: fixed;"></tr>';
				for (let i = 0; i < librarySoundFileKeys.length; i++) {
					table += `<td><a href='javascript:window.soundRecording.loadSound("${librarySoundFileKeys[i]}")'>${librarySoundFileKeys[i]}</a> &nbsp;`;
					table += `<button style="display: inline;" onclick='window.soundRecording.renameSound("${librarySoundFileKeys[i]}")'>r</button> `;
					table += `<button style="display: inline;" onclick='window.soundRecording.removeSound("${librarySoundFileKeys[i]}")'>x</button></td>`;
					if (i%3==2) {
						table += '</tr><tr>';
					}
				}
				table += '</tr></table>';
				this.editorMessageUi.innerHTML = `Library sounds:<br/><br/>${table}`;
			}
		}
	}

	onEditorModeChanged() {
		if (this.playtestSoundRecTab.getAttribute('hidden') != '') {
			this.playtestSoundRecTab.setAttribute('hidden', '');
		}
		if (EDITOR.modeSelect.value === "playtest") {
			this.inPlaytest = true;
		}
		else if (this.inPlaytest) {
			this.inPlaytest = false;
			this.updateEditorWithPlaytestChanges();
			this.onEditorTypeChanged();
		}
	}

	togglePlaytestTab() {
		this.playbackAudioRecorderUi.clear();
		if (this.playtestTab.getAttribute('hidden') == '') {
			this.playtestTab.removeAttribute('hidden');
			this.playtestSoundRecTab.setAttribute('hidden', '');
		} else {
			this.playtestTab.setAttribute('hidden', '');
			this.playtestSoundRecTab.removeAttribute('hidden');
			const libraryEvent = findEventByTag(EDITOR.stateManager.present, 'is-library');
			if (!libraryEvent) {
				this.playtestMessageUi.innerHTML = 'A library event is required for sound recording<br/>as recorded sounds will be stored in the library.<br/><br/>Add an event tagged "is-library" and try again.';
				this.playbackAudioRecorderUi.domUi.setAttribute('hidden', '');
			} else if (!EDITOR.playtestIframe.contentWindow.PLAYBACK.speakerEvent) {
				this.playtestMessageUi.innerHTML = 'A speaking event is required for sound recording<br/>as recorded sounds will be attached to that event.<br/><br/>Touch an event in the game to make it speak<br/>then try again.';
				this.playbackAudioRecorderUi.domUi.setAttribute('hidden', '');
			} else {
				this.currentSpeaker = EDITOR.playtestIframe.contentWindow.PLAYBACK.speakerEvent;
				const textDialogue = FIELD(this.currentSpeaker, 'say', 'dialogue').replace(/^&&.+&&/, "");
				this.playtestMessageUi.innerHTML = `Dialogue to being recorded for:<br/><br/>${textDialogue}`;
				this.playbackAudioRecorderUi.domUi.removeAttribute('hidden');
			}
		}
	}

	onEditorSaved(blob) {
		EDITOR.stateManager.resources.lastId = 0;
		const resourceId = EDITOR.stateManager.resources.generateId();
		const name = prompt('What name to give this recording?', `rec_${resourceId}`);
		if (!name) {
			return;
		}
		const libraryEvent = findEventByTag(EDITOR.stateManager.present, 'is-library');
		for (const field of libraryEvent.fields) {
			if (field.key == name) {
				alert('The name "' + name + "' is unavailable.");
				return;
			}
		}
		const file = new File([blob], 'bipsiRecording.mp3', { type: 'audio/mpeg' });
		EDITOR.stateManager.resources.resources.set(resourceId, {type: 'file-datauri', instance: file});
		libraryEvent.fields.push({ key: name, type: 'file', data: resourceId });
		this.editorAudioRecorderUi.clear();
		this.onEditorTypeChanged();
	}

	onPlaybackSaved(blob) {
		const file = new File([blob], 'bipsiRecording.mp3', { type: 'audio/mpeg' });
		const playtest = EDITOR.playtestIframe.contentWindow;
		const playback = playtest.PLAYBACK;
		const fileId = playback.stateManager.resources.add(file, 'file-datauri');
		const library = playtest.getEventById(playback.data, playback.libraryId);
		library.fields.push({ key: `dlg_${fileId}`, type: 'file', data: fileId });
		for (const field of this.currentSpeaker.fields) {
			if (field.key !== "say" || field.type !== "dialogue") {
				continue;
			}
			const oldSayData = field.data;
			const oldSoundMatch = field.data.match(/^&&(.+)&&/);
			this.soundsToAdd ||= new Set();
			if (oldSoundMatch) {
				if (oldSoundMatch[1].startsWith('dlg_')) {
					this.soundsToRemove ||= new Set();
					if (this.soundsToAdd.has(oldSoundMatch[1])) {
						this.soundsToAdd.delete(oldSoundMatch[1]);
					}
					else
					{
						this.soundsToRemove.add(oldSoundMatch[1]);
					}
				}
				field.data = field.data.slice(oldSoundMatch[0].length);
			}
			field.data = `&&dlg_${fileId}&&${field.data}`;
			this.soundsToAdd.add(`dlg_${fileId}`);
			this.eventsToModify ||= new Set();
			this.eventsToModify.add({ id: this.currentSpeaker.id, oldSayData: oldSayData, newSayData: field.data });
			playback.variables.delete("SAY-ITERATORS/" + this.currentSpeaker.id);
			break;
		}
		this.togglePlaytestTab();
	}

	updateEditorWithPlaytestChanges() {
		const libraryId = EDITOR.playtestIframe.contentWindow.PLAYBACK.libraryId;
		const editorResources = EDITOR.stateManager.resources;
		const editorData = EDITOR.stateManager.present;
		const editorLibrary = getEventById(editorData, libraryId);
		if (this.eventsToModify) {
			if (this.eventsToModify.size > 0) {
				// "eventsToModify" is better determinor for whether resources have changed
				// than "soundsToRemove" and "soundsToAdd" are individually
				editorResources.lastId = 0;
				this.eventsToModify.forEach(eventInfo => {
					const event = getEventById(editorData, eventInfo.id, "file");
					event.fields.forEach(field => {
						if (field.key == "say" && field.data == eventInfo.oldSayData) {
							field.data = eventInfo.newSayData;
						}
					});
				});
				this.eventsToModify.clear();
			}
		}
		if (this.soundsToRemove) {
			this.soundsToRemove.forEach(soundName => {
				let resourceId = null;
				for (let i = 0; i < editorLibrary.fields.length; i++) {
					if (editorLibrary.fields[i].key == soundName) {
						resourceId = editorLibrary.fields[i].data;
						editorLibrary.fields.splice(i,1);
						break;
					}
				}
				if (resourceId !== null) {
					editorResources.resources.delete(resourceId);
				}
			});
			this.soundsToRemove.clear();
		}
		if (this.soundsToAdd) {
			const playtest = EDITOR.playtestIframe.contentWindow;
			const playback = playtest.PLAYBACK;
			const playbackLibrary = playtest.getEventById(playback.data, libraryId);
			const playbackResources = playback.stateManager.resources;
			this.soundsToAdd.forEach(soundName => {
				let resourceId = null;
				for (const field of playbackLibrary.fields) {
					if (field.key == soundName) {
						resourceId = field.data;
						editorLibrary.fields.push(field);
						break;
					}
				}
				editorResources.resources.set(resourceId, playbackResources.resources.get(resourceId));
			});
			this.soundsToAdd.clear();
		}
	}

	fileIsAudio(id) {
		const type = EDITOR.stateManager.resources.resources.get(id).instance.type;
		return type.startsWith('audio');
	}

	loadSound(id) {
		const libraryEvent = findEventByTag(EDITOR.stateManager.present, 'is-library');
		const fileId = FIELD(libraryEvent, id, 'file');
		const file = EDITOR.stateManager.resources.resources.get(fileId).instance;
		const blob = new Blob([file], { type: file.type });
		this.editorAudioRecorderUi.loadAudioBlob(blob, true);
	}

	removeSound(id) {
		if (!confirm(`Are you sure you want to remove sound "${id}"?`)) {
			return;
		}
		const libraryEvent = findEventByTag(EDITOR.stateManager.present, 'is-library');
		const fileId = FIELD(libraryEvent, id, 'file');
		for (let i = 0; i < libraryEvent.fields.length; i++) {
			if (libraryEvent.fields[i].key == id) {
				libraryEvent.fields.splice(i,1);
				break;
			}
		}
		EDITOR.stateManager.resources.resources.delete(fileId);
		this.onEditorTypeChanged()
	}

	renameSound(id) {
		const newId = prompt(`Enter a new name for sound "${id}".`, id);
		if (!newId) {
			return;
		}
		const libraryEvent = findEventByTag(EDITOR.stateManager.present, 'is-library');
		for (let field of libraryEvent.fields) {
			if (field.key == id) {
				field.key = newId;
				break;
			}
		}
		this.onEditorTypeChanged()
	}
}

class AudioRecorderUi {
	domUi;
	constructor(width, height, onSaved) {
		this.#init(width, height, onSaved);
	}
	clear() {
		this.#audioBufferData = null;
		this.#buttons[1].state = this.#BTN_STATES.DISABLED;
		this.#buttons[2].state = this.#BTN_STATES.DISABLED;
		this.#refreshAudioDisplay();
	}
	async loadAudioBlob(audioBlob, zeroDefaultTrim) {
		// Stop any playing Audio
		if (this.#audioPlayingSource) {
			this.#onPlayBtn();
		}

		// Load audio data
		this.#audioContext ||= new AudioContext();
		const arrayBuffer = await audioBlob.arrayBuffer();
		this.#audioBuffer = await this.#audioContext.decodeAudioData(arrayBuffer);
		this.#audioBufferData = this.#audioBuffer.getChannelData(0);

		// Refresh ui
		this.#trims[0] = zeroDefaultTrim ? 0 : this.#DEFAULT_TRIM_INDENT;
		this.#trims[1] = this.#audioBufferData.length - (zeroDefaultTrim ? 0 : this.#DEFAULT_TRIM_INDENT);
		this.#buttons.forEach(btn => btn.state = this.#BTN_STATES.IDLE);
		this.#refreshAudioDisplay();
	}

	#DEFAULT_TRIM_INDENT = 10000;
	#COLOR_BORDER = 'white';
	#COLOR_AUDIO = 'yellow';
	#COLOR_AUDIO_BACK = 'black';
	#COLOR_AUDIO_BACK_EMPTY = 'slategrey';
	#COLOR_AUDIO_TRIM = 'yellow';
	#COLOR_AUDIO_CURSOR = 'yellow';
	#COLOR_BUTTON_BACK = 'lightgrey';
	#COLOR_BUTTON_BACK_HIGHLIGHT = 'white';
	#COLOR_BUTTON_BACK_LOWLIGHT = 'slategrey';
	#COLOR_BUTTON_BACK_PRESS = 'yellow';
	#COLOR_BUTTON_ICON = 'black';
	#COLOR_BUTTON_ICON_DISABLE = 'slategrey';
	#COLOR_BUTTON_ICON_HOVER = 'yellow';
	#BIT_RATE = 48000;
	#MIN_SAMPLES = 1000;
	#BTN_STATES = { IDLE: 0, HOVERED: 1, PRESSED: 2, TOGGLED: 3, DISABLED: 4 };
	#BUTTON_ICONS = {
		RECORD: [[.4, .25], [.6, .25], [.75, .4], [.75, .6], [.6, .75], [.4,.75], [.25, .6], [.25,.4], [.4, .25]],
		PLAY: [[.25, .25], [.75, .5], [.25, .75], [.25, .25]],
		STOP: [[.30, .30], [.70, .30], [.70, .70], [.30, .70], [.30, .30]],
		SAVE: [[.5, .25], [.75, .25], [.75, .75], [.25, .75], [.25, .25], [.5, .25], [.5,.6], [.35,.45], [.5,.6], [.65,.45]],
		AXISARROWS: [
			[.50, .20], [.70, .40], [.55, .40], [.55, .60], [.70, .60], [.50, .80], [.30, .60],
			[.45, .60], [.45, .40], [.30, .40], [.50, .20]
		]
	};

	#BTN_SIZE;
	#onSaved;
	#audioDisplay;
	#trims;
	#buttons;
	#audioData;
	#audioContext;
	#audioStream;
	#recorder;
	#audioBuffer;
	#audioBufferData;
	#audioPlayingSource;
	#draggedTrim;
	#btnDown;
	#playTime;
	#playPosition;
	#oldHoveredBtn = -1
	#oldMouseDown = false;

	#init(width, height, onSaved) {
		this.#BTN_SIZE = height / 3;
		this.#onSaved = onSaved;
		this.domUi = document.createElement('canvas');
			this.domUi.width = width;
			this.domUi.height = height;
			this.domUi.onselectstart = function () { return false; }
			this.domUi.style.border = `1px solid ${this.#COLOR_BORDER}`;
		this.#audioDisplay = document.createElement('canvas');
			this.#audioDisplay.width = width - this.#BTN_SIZE;
			this.#audioDisplay.height = height;
		this.#trims = [ 0, 0 ];
		this.#buttons = [
			{ id: 'record', position: [ 0, this.#BTN_SIZE * 0 ], icon: this.#BUTTON_ICONS.RECORD, state: this.#BTN_STATES.IDLE, onClick: this.#onRecordBtn.bind(this) },
			{ id: 'play',   position: [ 0, this.#BTN_SIZE * 1 ], icon: this.#BUTTON_ICONS.PLAY,   state: this.#BTN_STATES.DISABLED, onClick: this.#onPlayBtn.bind(this) },
			{ id: 'save',   position: [ 0, this.#BTN_SIZE * 2 ], icon: this.#BUTTON_ICONS.SAVE,   state: this.#BTN_STATES.DISABLED, onClick: this.#onSaveBtn.bind(this) },
		];
		this.#audioData = [];
		this.#draggedTrim = -1;
		this.#btnDown = -1;
		this.#playTime = -1;
		this.#playPosition = -1;
		this.#oldHoveredBtn = -1
		this.#oldMouseDown = false;
		this.domUi.addEventListener('mousemove',  this.#onMouse.bind(this));
		this.domUi.addEventListener('mousedown',  this.#onMouse.bind(this));
		this.domUi.addEventListener('mouseup',    this.#onMouse.bind(this));
		this.domUi.addEventListener('mouseleave', this.#onMouseLeave.bind(this));

		this.#refreshAudioDisplay();
	}

	#onRecordBtn() {
		if (!this.#recorder) {
			this.#buttons[0].icon = this.#BUTTON_ICONS.STOP;
			this.#buttons[1].state = this.#BTN_STATES.DISABLED;
			this.#buttons[2].state = this.#BTN_STATES.DISABLED;
			this.#startRecording();
		}
		else {
			this.#buttons[0].icon = this.#BUTTON_ICONS.RECORD;
			this.#buttons[0].state = this.#BTN_STATES.DISABLED;
			this.#stopRecording();
		}
	}

	#onPlayBtn(alreadyStopping) {
		if (!this.#audioPlayingSource) {
			this.#buttons[0].state = this.#BTN_STATES.DISABLED;
			this.#buttons[1].icon = this.#BUTTON_ICONS.STOP;
			this.#buttons[2].state = this.#BTN_STATES.DISABLED;
			this.#startPlaying();
		} else {
			this.#buttons[0].state = this.#BTN_STATES.IDLE;
			this.#buttons[1].icon = this.#BUTTON_ICONS.PLAY;
			this.#buttons[2].state = this.#BTN_STATES.IDLE;
			if (!alreadyStopping) {
				this.#stopPlaying();
			}
		}
	}

	#onSaveBtn() {
		this.#save();
	}

	async #startRecording() {
		try {
			this.#audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
		} catch(e)
		{
			console.error(e);
			this.#audioStream = null;
		}
		if (!this.#audioStream) {
			return false;
		}
		this.#audioBufferData = null;
		this.#recorder = new MediaRecorder(this.#audioStream);
		this.#recorder.ondataavailable = e => {
			this.#audioData.push(e.data);
		}
		this.#recorder.onstop = this.#processRecording.bind(this);
		this.#recorder.start();
		return true;
	}

	async #stopRecording() {
		this.#recorder.stop();
		this.#audioStream.getTracks().forEach(function(track) {
			track.stop();
		});
		this.#recorder = null;
		this.#audioStream = null;
	}

	#startPlaying() {
		this.#audioPlayingSource = this.#audioContext.createBufferSource();
		this.#audioPlayingSource.buffer = this.#audioBuffer;
		this.#audioPlayingSource.connect(this.#audioContext.destination);
		this.#audioPlayingSource.addEventListener("ended", () =>
		{
			this.#onPlayBtn(true);
			this.#refreshUi();
			this.#audioPlayingSource = null;
			this.#playTime = -1;
			this.#playPosition = -1;
		});
		this.#audioPlayingSource.start(this.#audioContext.currentTime, this.#trims[0] / this.#BIT_RATE, (this.#trims[1]-this.#trims[0]) / this.#BIT_RATE);
		this.#playTime = this.#audioContext.currentTime;
		requestAnimationFrame(this.#animateAudioDisplay.bind(this));
	}

	#stopPlaying() {
		this.#audioPlayingSource.stop();
	}

	#save() {
		const trimmedLength = this.#trims[1] - this.#trims[0];

		// Only save if of sufficient size
		if (trimmedLength < this.#MIN_SAMPLES) {
			return;
		}

		// Convert from float32 to int16
		const int16Buffer = new Int16Array(trimmedLength);
		for (let i = 0, len = trimmedLength; i < len; i++) {
			if (this.#audioBufferData[ i + this.#trims[0] ] < 0) {
				int16Buffer[i] = 0x8000 * this.#audioBufferData[ i + this.#trims[0] ];
			} else {
				int16Buffer[i] = 0x7FFF * this.#audioBufferData[ i + this.#trims[0] ];
			}
		}

		// Encode the data
		const mp3Data = [];
		const mp3encoder = new lamejs.Mp3Encoder(1, this.#BIT_RATE, 128);
		const sampleBlockSize = 1152;
		for (let i = 0; i < int16Buffer.length; i += sampleBlockSize) {
			const sampleChunk = int16Buffer.subarray(i, i + sampleBlockSize);
			let mp3buffer = mp3encoder.encodeBuffer(sampleChunk);
			if (mp3buffer.length > 0) {
				mp3Data.push(mp3buffer);
			}
		}

		// Convert the data to base64 and send to user
		var mp3Blob = new Blob(mp3Data, {type: 'audio/mp3'});
		this.#onSaved(mp3Blob);
	}

	#animateAudioDisplay() {
		if (this.#playTime == -1) {
			this.#refreshUi();
			return;
		}
		this.#playPosition = (this.#audioContext.currentTime - this.#playTime) * this.#BIT_RATE + this.#trims[0];
		this.#refreshUi();
		requestAnimationFrame(this.#animateAudioDisplay.bind(this));
	}

	#processRecording() {
		const audioBlob = new Blob(this.#audioData, { type: 'audio/wav' });
		this.#audioData = [];
		this.loadAudioBlob(audioBlob);
	}

	#drawButton(gCtx, btn) {
		// Back
			gCtx.fillStyle = (btn.state == this.#BTN_STATES.PRESSED) ? this.#COLOR_BUTTON_BACK_PRESS : this.#COLOR_BUTTON_BACK;
			gCtx.fillRect(btn.position[0], btn.position[1], this.#BTN_SIZE, this.#BTN_SIZE);
		// border
			gCtx.lineWidth = 3;
			gCtx.strokeStyle = (btn.state == this.#BTN_STATES.PRESSED || btn.state == this.#BTN_STATES.TOGGLED) ? this.#COLOR_BUTTON_BACK_HIGHLIGHT : this.#COLOR_BUTTON_BACK_LOWLIGHT;
			gCtx.beginPath();
			gCtx.moveTo(.05 * this.#BTN_SIZE + btn.position[0], .95 * this.#BTN_SIZE + btn.position[1]);
			gCtx.lineTo(.95 * this.#BTN_SIZE + btn.position[0], .95 * this.#BTN_SIZE + btn.position[1]);
			gCtx.lineTo(.95 * this.#BTN_SIZE + btn.position[0], .05 * this.#BTN_SIZE + btn.position[1]);
			gCtx.stroke();
			gCtx.strokeStyle = (btn.state == this.#BTN_STATES.PRESSED || btn.state == this.#BTN_STATES.TOGGLED) ? this.#COLOR_BUTTON_BACK_LOWLIGHT : this.#COLOR_BUTTON_BACK_HIGHLIGHT;
			gCtx.beginPath();
			gCtx.moveTo(.05 * this.#BTN_SIZE + btn.position[0], .95 * this.#BTN_SIZE + btn.position[1]);
			gCtx.lineTo(.05 * this.#BTN_SIZE + btn.position[0], .05 * this.#BTN_SIZE + btn.position[1]);
			gCtx.lineTo(.95 * this.#BTN_SIZE + btn.position[0], .05 * this.#BTN_SIZE + btn.position[1]);
			gCtx.stroke();
		// Icon
			gCtx.lineWidth = 2;
			gCtx.strokeStyle =
				(btn.state == this.#BTN_STATES.HOVERED) ? this.#COLOR_BUTTON_ICON_HOVER :
				(btn.state == this.#BTN_STATES.DISABLED) ? this.#COLOR_BUTTON_ICON_DISABLE :
				this.#COLOR_BUTTON_ICON;
			const lhs = btn.rotate ? 1 : 0;
			const rhs = btn.rotate ? 0 : 1;
			gCtx.beginPath();
			gCtx.moveTo(btn.icon[0][lhs] * this.#BTN_SIZE + btn.position[0], btn.icon[0][rhs] * this.#BTN_SIZE + btn.position[1]);
			for (let i = 1; i < btn.icon.length; i++) {
				gCtx.lineTo(btn.icon[i][lhs] * this.#BTN_SIZE + btn.position[0], btn.icon[i][rhs] * this.#BTN_SIZE + btn.position[1]);
			}
			gCtx.stroke();
	}

	#refreshUi() {
		const gCtx = this.domUi.getContext('2d');

		// Buttons
		this.#buttons.forEach(btn => this.#drawButton(gCtx, btn));

		// Audio display
		gCtx.drawImage(this.#audioDisplay, this.#BTN_SIZE, 0);

		if (this.#audioBufferData) {
			const pointDistance = this.#audioDisplay.width / this.#audioBufferData.length;
			gCtx.lineWidth = 1;

			// Trim bars
			gCtx.strokeStyle = this.#COLOR_AUDIO_TRIM;
			for (let i = 0; i < this.#trims.length; i++) {
				gCtx.beginPath();
				gCtx.moveTo(this.#trims[i] * pointDistance + this.#BTN_SIZE, 0);
				gCtx.lineTo(this.#trims[i] * pointDistance + this.#BTN_SIZE, this.#audioDisplay.height);
				gCtx.stroke();
			}

			// Play position
			gCtx.strokeStyle = this.#COLOR_AUDIO_CURSOR;
			if (this.#playPosition !== -1) {
				gCtx.beginPath();
				gCtx.moveTo(this.#playPosition * pointDistance + this.#BTN_SIZE, 0);
				gCtx.lineTo(this.#playPosition * pointDistance + this.#BTN_SIZE, this.#audioDisplay.height);
				gCtx.stroke();
			}
		}
	}

	#refreshAudioDisplay() {
		const gCtx = this.#audioDisplay.getContext('2d');

		// Background
		gCtx.fillStyle = this.#audioBufferData ? this.#COLOR_AUDIO_BACK : this.#COLOR_AUDIO_BACK_EMPTY;
		gCtx.fillRect(0, 0, this.#audioDisplay.width, this.#audioDisplay.height);

		if (this.#audioBufferData) {
			// Audio shape
			const pointDistance = this.#audioDisplay.width / this.#audioBufferData.length;
			gCtx.lineWidth = 1;
			gCtx.strokeStyle = this.#COLOR_AUDIO;
			const halfDisplayHeight = this.#audioDisplay.height / 2;
			gCtx.beginPath();
			gCtx.moveTo(0, (this.#audioBufferData[0] + 1) * halfDisplayHeight);
			for (let i = 1; i < this.#audioBufferData.length; i++) {
				gCtx.lineTo(pointDistance * i, (this.#audioBufferData[i] + 1) * halfDisplayHeight);
			}
			gCtx.stroke();
		}

		this.#refreshUi();
	}

	#onMouse(e) {
		const rect = this.domUi.getBoundingClientRect();
		const x = e.clientX - rect.left;
		const y = e.clientY - rect.top;
		if (x < this.#BTN_SIZE) {
			let newHoveredBtn = Math.trunc(y / this.#BTN_SIZE);
			newHoveredBtn = (newHoveredBtn < this.#buttons.length) ? newHoveredBtn : -1;
			const newMouseDown = (e.buttons & 1);
			if (newHoveredBtn != this.#oldHoveredBtn || newMouseDown != this.#oldMouseDown) {
				if (this.#oldHoveredBtn != -1 && this.#oldHoveredBtn != newHoveredBtn && this.#buttons[this.#oldHoveredBtn].state !== this.#BTN_STATES.DISABLED)
				{
					this.#buttons[this.#oldHoveredBtn].state = this.#BTN_STATES.IDLE;
				}
				if (newHoveredBtn != -1 && this.#buttons[newHoveredBtn].state !== this.#BTN_STATES.DISABLED)
				{
					if (this.#buttons[newHoveredBtn].state == this.#BTN_STATES.PRESSED && !newMouseDown) {
						this.#buttons[newHoveredBtn].onClick();
					}
					if (!this.#oldMouseDown && newMouseDown) {
						this.#btnDown = newHoveredBtn;
					}
					if (this.#oldMouseDown && !newMouseDown) {
						this.#btnDown = -1;
					}
					this.#buttons[newHoveredBtn].state = (this.#btnDown == newHoveredBtn) ? this.#BTN_STATES.PRESSED : this.#BTN_STATES.HOVERED;
				}
				this.#oldHoveredBtn = newHoveredBtn;
				this.#oldMouseDown = newMouseDown;
				this.#refreshUi();
			}
		} else {
			if (this.#audioBufferData) {
				if ((e.buttons & 1)) {
					const mousePos = Math.trunc(((x - this.#BTN_SIZE) / (this.domUi.width - this.#BTN_SIZE)) * this.#audioBufferData.length);
					if (this.#draggedTrim == -1) {
						this.#draggedTrim = (Math.abs(mousePos - this.#trims[0]) <= Math.abs(mousePos - this.#trims[1])) ? 0 : 1;
					}
					if (this.#draggedTrim == 0) {
						this.#trims[this.#draggedTrim] = Math.min(mousePos, this.#trims[1] - 1);
					}
					if (this.#draggedTrim == 1) {
						this.#trims[this.#draggedTrim] = Math.max(mousePos, this.#trims[0] + 1);
					}
					this.#refreshUi();
				} else {
					this.#draggedTrim = -1;
				}
			}
			if ((e.buttons & 1)) {
				this.#oldMouseDown = true;
			} else {
				this.#oldMouseDown = false;
				this.#btnDown = -1;
			}
			if (this.#oldHoveredBtn != -1 && this.#buttons[this.#oldHoveredBtn].state !== this.#BTN_STATES.DISABLED) {
				this.#buttons[this.#oldHoveredBtn].state = this.#BTN_STATES.IDLE;
				this.#oldHoveredBtn = -1;
				this.#refreshUi();
			}
		}
	}

	#onMouseLeave(e) {
		this.#buttons.forEach(btn => {
			if (btn.state !== this.#BTN_STATES.DISABLED) {
				btn.state = this.#BTN_STATES.IDLE;
			}
		});
		this.#oldHoveredBtn = -1;
		this.#oldMouseDown = false;
		this.#refreshUi();
	}
}

// LameJS - lame.min.js - https://github.com/zhuker/lamejs
function lamejs(){function X(c){return new Int32Array(c)}function K(c){return new Float32Array(c)}function ca(c){if(1==c.length)return K(c[0]);var k=c[0];c=c.slice(1);for(var n=[],u=0;u<k;u++)n.push(ca(c));return n}function Ia(c){if(1==c.length)return X(c[0]);var k=c[0];c=c.slice(1);for(var n=[],u=0;u<k;u++)n.push(Ia(c));return n}function dc(c){if(1==c.length)return new Int16Array(c[0]);var k=c[0];c=c.slice(1);for(var n=[],u=0;u<k;u++)n.push(dc(c));return n}function Ob(c){if(1==c.length)return Array(c[0]);
var k=c[0];c=c.slice(1);for(var n=[],u=0;u<k;u++)n.push(Ob(c));return n}function ra(c){this.ordinal=c}function G(c){this.ordinal=c}function la(c){this.ordinal=function(){return c}}function mc(){this.getLameVersion=function(){return"3.98.4"};this.getLameShortVersion=function(){return"3.98.4"};this.getLameVeryShortVersion=function(){return"LAME3.98r"};this.getPsyVersion=function(){return"0.93"};this.getLameUrl=function(){return"http://www.mp3dev.org/"};this.getLameOsBitness=function(){return"32bits"}}
function Y(){function c(f,b,c,a,m,k){for(;0!=m--;)c[a]=1E-10+f[b+0]*k[0]-c[a-1]*k[1]+f[b-1]*k[2]-c[a-2]*k[3]+f[b-2]*k[4]-c[a-3]*k[5]+f[b-3]*k[6]-c[a-4]*k[7]+f[b-4]*k[8]-c[a-5]*k[9]+f[b-5]*k[10]-c[a-6]*k[11]+f[b-6]*k[12]-c[a-7]*k[13]+f[b-7]*k[14]-c[a-8]*k[15]+f[b-8]*k[16]-c[a-9]*k[17]+f[b-9]*k[18]-c[a-10]*k[19]+f[b-10]*k[20],++a,++b}function k(f,b,c,a,m,k){for(;0!=m--;)c[a]=f[b+0]*k[0]-c[a-1]*k[1]+f[b-1]*k[2]-c[a-2]*k[3]+f[b-2]*k[4],++a,++b}function n(f){return f*f}var V=Y.RMS_WINDOW_TIME_NUMERATOR,
E=Y.RMS_WINDOW_TIME_DENOMINATOR,B=[[.038575994352,-3.84664617118067,-.02160367184185,7.81501653005538,-.00123395316851,-11.34170355132042,-9.291677959E-5,13.05504219327545,-.01655260341619,-12.28759895145294,.02161526843274,9.4829380631979,-.02074045215285,-5.87257861775999,.00594298065125,2.75465861874613,.00306428023191,-.86984376593551,1.2025322027E-4,.13919314567432,.00288463683916],[.0541865640643,-3.47845948550071,-.02911007808948,6.36317777566148,-.00848709379851,-8.54751527471874,-.00851165645469,
9.4769360780128,-.00834990904936,-8.81498681370155,.02245293253339,6.85401540936998,-.02596338512915,-4.39470996079559,.01624864962975,2.19611684890774,-.00240879051584,-.75104302451432,.00674613682247,.13149317958808,-.00187763777362],[.15457299681924,-2.37898834973084,-.09331049056315,2.84868151156327,-.06247880153653,-2.64577170229825,.02163541888798,2.23697657451713,-.05588393329856,-1.67148153367602,.04781476674921,1.00595954808547,.00222312597743,-.45953458054983,.03174092540049,.16378164858596,
-.01390589421898,-.05032077717131,.00651420667831,.0234789740702,-.00881362733839],[.30296907319327,-1.61273165137247,-.22613988682123,1.0797749225997,-.08587323730772,-.2565625775407,.03282930172664,-.1627671912044,-.00915702933434,-.22638893773906,-.02364141202522,.39120800788284,-.00584456039913,-.22138138954925,.06276101321749,.04500235387352,-8.28086748E-6,.02005851806501,.00205861885564,.00302439095741,-.02950134983287],[.33642304856132,-1.49858979367799,-.2557224142557,.87350271418188,-.11828570177555,
.12205022308084,.11921148675203,-.80774944671438,-.07834489609479,.47854794562326,-.0046997791438,-.12453458140019,-.0058950022444,-.04067510197014,.05724228140351,.08333755284107,.00832043980773,-.04237348025746,-.0163538138454,.02977207319925,-.0176017656815],[.4491525660845,-.62820619233671,-.14351757464547,.29661783706366,-.22784394429749,-.372563729424,-.01419140100551,.00213767857124,.04078262797139,-.42029820170918,-.12398163381748,.22199650564824,.04097565135648,.00613424350682,.10478503600251,
.06747620744683,-.01863887810927,.05784820375801,-.03193428438915,.03222754072173,.00541907748707],[.56619470757641,-1.04800335126349,-.75464456939302,.29156311971249,.1624213774223,-.26806001042947,.16744243493672,.00819999645858,-.18901604199609,.45054734505008,.3093178284183,-.33032403314006,-.27562961986224,.0673936833311,.00647310677246,-.04784254229033,.08647503780351,.01639907836189,-.0378898455484,.01807364323573,-.00588215443421],[.58100494960553,-.51035327095184,-.53174909058578,-.31863563325245,
-.14289799034253,-.20256413484477,.17520704835522,.1472815413433,.02377945217615,.38952639978999,.15558449135573,-.23313271880868,-.25344790059353,-.05246019024463,.01628462406333,-.02505961724053,.06920467763959,.02442357316099,-.03721611395801,.01818801111503,-.00749618797172],[.53648789255105,-.2504987195602,-.42163034350696,-.43193942311114,-.00275953611929,-.03424681017675,.04267842219415,-.04678328784242,-.10214864179676,.26408300200955,.14590772289388,.15113130533216,-.02459864859345,-.17556493366449,
-.11202315195388,-.18823009262115,-.04060034127,.05477720428674,.0478866554818,.0470440968812,-.02217936801134]],w=[[.98621192462708,-1.97223372919527,-1.97242384925416,.97261396931306,.98621192462708],[.98500175787242,-1.96977855582618,-1.97000351574484,.9702284756635,.98500175787242],[.97938932735214,-1.95835380975398,-1.95877865470428,.95920349965459,.97938932735214],[.97531843204928,-1.95002759149878,-1.95063686409857,.95124613669835,.97531843204928],[.97316523498161,-1.94561023566527,-1.94633046996323,
.94705070426118,.97316523498161],[.96454515552826,-1.92783286977036,-1.92909031105652,.93034775234268,.96454515552826],[.96009142950541,-1.91858953033784,-1.92018285901082,.92177618768381,.96009142950541],[.95856916599601,-1.9154210807478,-1.91713833199203,.91885558323625,.95856916599601],[.94597685600279,-1.88903307939452,-1.89195371200558,.89487434461664,.94597685600279]];this.InitGainAnalysis=function(f,b){a:{for(var c=0;c<MAX_ORDER;c++)f.linprebuf[c]=f.lstepbuf[c]=f.loutbuf[c]=f.rinprebuf[c]=
f.rstepbuf[c]=f.routbuf[c]=0;switch(0|b){case 48E3:f.reqindex=0;break;case 44100:f.reqindex=1;break;case 32E3:f.reqindex=2;break;case 24E3:f.reqindex=3;break;case 22050:f.reqindex=4;break;case 16E3:f.reqindex=5;break;case 12E3:f.reqindex=6;break;case 11025:f.reqindex=7;break;case 8E3:f.reqindex=8;break;default:b=INIT_GAIN_ANALYSIS_ERROR;break a}f.sampleWindow=0|(b*V+E-1)/E;f.lsum=0;f.rsum=0;f.totsamp=0;na.ill(f.A,0);b=INIT_GAIN_ANALYSIS_OK}if(b!=INIT_GAIN_ANALYSIS_OK)return INIT_GAIN_ANALYSIS_ERROR;
f.linpre=MAX_ORDER;f.rinpre=MAX_ORDER;f.lstep=MAX_ORDER;f.rstep=MAX_ORDER;f.lout=MAX_ORDER;f.rout=MAX_ORDER;na.fill(f.B,0);return INIT_GAIN_ANALYSIS_OK};this.AnalyzeSamples=function(f,b,v,a,m,u,e){if(0==u)return GAIN_ANALYSIS_OK;var l=0;var d=u;switch(e){case 1:a=b;m=v;break;case 2:break;default:return GAIN_ANALYSIS_ERROR}u<MAX_ORDER?(T.arraycopy(b,v,f.linprebuf,MAX_ORDER,u),T.arraycopy(a,m,f.rinprebuf,MAX_ORDER,u)):(T.arraycopy(b,v,f.linprebuf,MAX_ORDER,MAX_ORDER),T.arraycopy(a,m,f.rinprebuf,MAX_ORDER,
MAX_ORDER));for(;0<d;){var g=d>f.sampleWindow-f.totsamp?f.sampleWindow-f.totsamp:d;if(l<MAX_ORDER){e=f.linpre+l;var q=f.linprebuf;var D=f.rinpre+l;var p=f.rinprebuf;g>MAX_ORDER-l&&(g=MAX_ORDER-l)}else e=v+l,q=b,D=m+l,p=a;c(q,e,f.lstepbuf,f.lstep+f.totsamp,g,B[f.reqindex]);c(p,D,f.rstepbuf,f.rstep+f.totsamp,g,B[f.reqindex]);k(f.lstepbuf,f.lstep+f.totsamp,f.loutbuf,f.lout+f.totsamp,g,w[f.reqindex]);k(f.rstepbuf,f.rstep+f.totsamp,f.routbuf,f.rout+f.totsamp,g,w[f.reqindex]);e=f.lout+f.totsamp;q=f.loutbuf;
D=f.rout+f.totsamp;p=f.routbuf;for(var r=g%8;0!=r--;)f.lsum+=n(q[e++]),f.rsum+=n(p[D++]);for(r=g/8;0!=r--;)f.lsum+=n(q[e+0])+n(q[e+1])+n(q[e+2])+n(q[e+3])+n(q[e+4])+n(q[e+5])+n(q[e+6])+n(q[e+7]),e+=8,f.rsum+=n(p[D+0])+n(p[D+1])+n(p[D+2])+n(p[D+3])+n(p[D+4])+n(p[D+5])+n(p[D+6])+n(p[D+7]),D+=8;d-=g;l+=g;f.totsamp+=g;f.totsamp==f.sampleWindow&&(e=10*Y.STEPS_per_dB*Math.log10((f.lsum+f.rsum)/f.totsamp*.5+1E-37),e=0>=e?0:0|e,e>=f.A.length&&(e=f.A.length-1),f.A[e]++,f.lsum=f.rsum=0,T.arraycopy(f.loutbuf,
f.totsamp,f.loutbuf,0,MAX_ORDER),T.arraycopy(f.routbuf,f.totsamp,f.routbuf,0,MAX_ORDER),T.arraycopy(f.lstepbuf,f.totsamp,f.lstepbuf,0,MAX_ORDER),T.arraycopy(f.rstepbuf,f.totsamp,f.rstepbuf,0,MAX_ORDER),f.totsamp=0);if(f.totsamp>f.sampleWindow)return GAIN_ANALYSIS_ERROR}u<MAX_ORDER?(T.arraycopy(f.linprebuf,u,f.linprebuf,0,MAX_ORDER-u),T.arraycopy(f.rinprebuf,u,f.rinprebuf,0,MAX_ORDER-u),T.arraycopy(b,v,f.linprebuf,MAX_ORDER-u,u),T.arraycopy(a,m,f.rinprebuf,MAX_ORDER-u,u)):(T.arraycopy(b,v+u-MAX_ORDER,
f.linprebuf,0,MAX_ORDER),T.arraycopy(a,m+u-MAX_ORDER,f.rinprebuf,0,MAX_ORDER));return GAIN_ANALYSIS_OK};this.GetTitleGain=function(f){var b=f.A;var c=f.A.length,a,m=0;for(a=0;a<c;a++)m+=b[a];if(0==m)b=GAIN_NOT_ENOUGH_SAMPLES;else{m=0|Math.ceil(m*(1-.95));for(a=c;0<a--&&!(0>=(m-=b[a])););b=64.82-a/Y.STEPS_per_dB}for(c=0;c<f.A.length;c++)f.B[c]+=f.A[c],f.A[c]=0;for(c=0;c<MAX_ORDER;c++)f.linprebuf[c]=f.lstepbuf[c]=f.loutbuf[c]=f.rinprebuf[c]=f.rstepbuf[c]=f.routbuf[c]=0;f.totsamp=0;f.lsum=f.rsum=0;return b}}
function wc(){function c(b,c,a,f,k,e,l,d,g,q,D,p,r,t,J){this.vbr_q=b;this.quant_comp=c;this.quant_comp_s=a;this.expY=f;this.st_lrm=k;this.st_s=e;this.masking_adj=l;this.masking_adj_short=d;this.ath_lower=g;this.ath_curve=q;this.ath_sensitivity=D;this.interch=p;this.safejoint=r;this.sfb21mod=t;this.msfix=J}function k(b,c,a,f,k,e,l,d,g,q,D,p,r,t){this.quant_comp=c;this.quant_comp_s=a;this.safejoint=f;this.nsmsfix=k;this.st_lrm=e;this.st_s=l;this.nsbass=d;this.scale=g;this.masking_adj=q;this.ath_lower=
D;this.ath_curve=p;this.interch=r;this.sfscale=t}function n(b,c,a){var f=b.VBR==G.vbr_rh?B:w,k=b.VBR_q_frac,e=f[c];f=f[c+1];e.st_lrm+=k*(f.st_lrm-e.st_lrm);e.st_s+=k*(f.st_s-e.st_s);e.masking_adj+=k*(f.masking_adj-e.masking_adj);e.masking_adj_short+=k*(f.masking_adj_short-e.masking_adj_short);e.ath_lower+=k*(f.ath_lower-e.ath_lower);e.ath_curve+=k*(f.ath_curve-e.ath_curve);e.ath_sensitivity+=k*(f.ath_sensitivity-e.ath_sensitivity);e.interch+=k*(f.interch-e.interch);e.msfix+=k*(f.msfix-e.msfix);f=
e.vbr_q;0>f&&(f=0);9<f&&(f=9);b.VBR_q=f;b.VBR_q_frac=0;0!=a?b.quant_comp=e.quant_comp:0<Math.abs(b.quant_comp- -1)||(b.quant_comp=e.quant_comp);0!=a?b.quant_comp_short=e.quant_comp_s:0<Math.abs(b.quant_comp_short- -1)||(b.quant_comp_short=e.quant_comp_s);0!=e.expY&&(b.experimentalY=0!=e.expY);0!=a?b.internal_flags.nsPsy.attackthre=e.st_lrm:0<Math.abs(b.internal_flags.nsPsy.attackthre- -1)||(b.internal_flags.nsPsy.attackthre=e.st_lrm);0!=a?b.internal_flags.nsPsy.attackthre_s=e.st_s:0<Math.abs(b.internal_flags.nsPsy.attackthre_s-
-1)||(b.internal_flags.nsPsy.attackthre_s=e.st_s);0!=a?b.maskingadjust=e.masking_adj:0<Math.abs(b.maskingadjust-0)||(b.maskingadjust=e.masking_adj);0!=a?b.maskingadjust_short=e.masking_adj_short:0<Math.abs(b.maskingadjust_short-0)||(b.maskingadjust_short=e.masking_adj_short);0!=a?b.ATHlower=-e.ath_lower/10:0<Math.abs(10*-b.ATHlower)||(b.ATHlower=-e.ath_lower/10);0!=a?b.ATHcurve=e.ath_curve:0<Math.abs(b.ATHcurve- -1)||(b.ATHcurve=e.ath_curve);0!=a?b.athaa_sensitivity=e.ath_sensitivity:0<Math.abs(b.athaa_sensitivity-
-1)||(b.athaa_sensitivity=e.ath_sensitivity);0<e.interch&&(0!=a?b.interChRatio=e.interch:0<Math.abs(b.interChRatio- -1)||(b.interChRatio=e.interch));0<e.safejoint&&(b.exp_nspsytune|=e.safejoint);0<e.sfb21mod&&(b.exp_nspsytune|=e.sfb21mod<<20);0!=a?b.msfix=e.msfix:0<Math.abs(b.msfix- -1)||(b.msfix=e.msfix);0==a&&(b.VBR_q=c,b.VBR_q_frac=k)}function V(b,c,a){var m=E.nearestBitrateFullIndex(c);b.VBR=G.vbr_abr;b.VBR_mean_bitrate_kbps=c;b.VBR_mean_bitrate_kbps=Math.min(b.VBR_mean_bitrate_kbps,320);b.VBR_mean_bitrate_kbps=
Math.max(b.VBR_mean_bitrate_kbps,8);b.brate=b.VBR_mean_bitrate_kbps;320<b.VBR_mean_bitrate_kbps&&(b.disable_reservoir=!0);0<f[m].safejoint&&(b.exp_nspsytune|=2);0<f[m].sfscale&&(b.internal_flags.noise_shaping=2);if(0<Math.abs(f[m].nsbass)){var k=int(4*f[m].nsbass);0>k&&(k+=64);b.exp_nspsytune|=k<<2}0!=a?b.quant_comp=f[m].quant_comp:0<Math.abs(b.quant_comp- -1)||(b.quant_comp=f[m].quant_comp);0!=a?b.quant_comp_short=f[m].quant_comp_s:0<Math.abs(b.quant_comp_short- -1)||(b.quant_comp_short=f[m].quant_comp_s);
0!=a?b.msfix=f[m].nsmsfix:0<Math.abs(b.msfix- -1)||(b.msfix=f[m].nsmsfix);0!=a?b.internal_flags.nsPsy.attackthre=f[m].st_lrm:0<Math.abs(b.internal_flags.nsPsy.attackthre- -1)||(b.internal_flags.nsPsy.attackthre=f[m].st_lrm);0!=a?b.internal_flags.nsPsy.attackthre_s=f[m].st_s:0<Math.abs(b.internal_flags.nsPsy.attackthre_s- -1)||(b.internal_flags.nsPsy.attackthre_s=f[m].st_s);0!=a?b.scale=f[m].scale:0<Math.abs(b.scale- -1)||(b.scale=f[m].scale);0!=a?b.maskingadjust=f[m].masking_adj:0<Math.abs(b.maskingadjust-
0)||(b.maskingadjust=f[m].masking_adj);0<f[m].masking_adj?0!=a?b.maskingadjust_short=.9*f[m].masking_adj:0<Math.abs(b.maskingadjust_short-0)||(b.maskingadjust_short=.9*f[m].masking_adj):0!=a?b.maskingadjust_short=1.1*f[m].masking_adj:0<Math.abs(b.maskingadjust_short-0)||(b.maskingadjust_short=1.1*f[m].masking_adj);0!=a?b.ATHlower=-f[m].ath_lower/10:0<Math.abs(10*-b.ATHlower)||(b.ATHlower=-f[m].ath_lower/10);0!=a?b.ATHcurve=f[m].ath_curve:0<Math.abs(b.ATHcurve- -1)||(b.ATHcurve=f[m].ath_curve);0!=
a?b.interChRatio=f[m].interch:0<Math.abs(b.interChRatio- -1)||(b.interChRatio=f[m].interch);return c}var E;this.setModules=function(b){E=b};var B=[new c(0,9,9,0,5.2,125,-4.2,-6.3,4.8,1,0,0,2,21,.97),new c(1,9,9,0,5.3,125,-3.6,-5.6,4.5,1.5,0,0,2,21,1.35),new c(2,9,9,0,5.6,125,-2.2,-3.5,2.8,2,0,0,2,21,1.49),new c(3,9,9,1,5.8,130,-1.8,-2.8,2.6,3,-4,0,2,20,1.64),new c(4,9,9,1,6,135,-.7,-1.1,1.1,3.5,-8,0,2,0,1.79),new c(5,9,9,1,6.4,140,.5,.4,-7.5,4,-12,2E-4,0,0,1.95),new c(6,9,9,1,6.6,145,.67,.65,-14.7,
6.5,-19,4E-4,0,0,2.3),new c(7,9,9,1,6.6,145,.8,.75,-19.7,8,-22,6E-4,0,0,2.7),new c(8,9,9,1,6.6,145,1.2,1.15,-27.5,10,-23,7E-4,0,0,0),new c(9,9,9,1,6.6,145,1.6,1.6,-36,11,-25,8E-4,0,0,0),new c(10,9,9,1,6.6,145,2,2,-36,12,-25,8E-4,0,0,0)],w=[new c(0,9,9,0,4.2,25,-7,-4,7.5,1,0,0,2,26,.97),new c(1,9,9,0,4.2,25,-5.6,-3.6,4.5,1.5,0,0,2,21,1.35),new c(2,9,9,0,4.2,25,-4.4,-1.8,2,2,0,0,2,18,1.49),new c(3,9,9,1,4.2,25,-3.4,-1.25,1.1,3,-4,0,2,15,1.64),new c(4,9,9,1,4.2,25,-2.2,.1,0,3.5,-8,0,2,0,1.79),new c(5,
9,9,1,4.2,25,-1,1.65,-7.7,4,-12,2E-4,0,0,1.95),new c(6,9,9,1,4.2,25,-0,2.47,-7.7,6.5,-19,4E-4,0,0,2),new c(7,9,9,1,4.2,25,.5,2,-14.5,8,-22,6E-4,0,0,2),new c(8,9,9,1,4.2,25,1,2.4,-22,10,-23,7E-4,0,0,2),new c(9,9,9,1,4.2,25,1.5,2.95,-30,11,-25,8E-4,0,0,2),new c(10,9,9,1,4.2,25,2,2.95,-36,12,-30,8E-4,0,0,2)],f=[new k(8,9,9,0,0,6.6,145,0,.95,0,-30,11,.0012,1),new k(16,9,9,0,0,6.6,145,0,.95,0,-25,11,.001,1),new k(24,9,9,0,0,6.6,145,0,.95,0,-20,11,.001,1),new k(32,9,9,0,0,6.6,145,0,.95,0,-15,11,.001,1),
new k(40,9,9,0,0,6.6,145,0,.95,0,-10,11,9E-4,1),new k(48,9,9,0,0,6.6,145,0,.95,0,-10,11,9E-4,1),new k(56,9,9,0,0,6.6,145,0,.95,0,-6,11,8E-4,1),new k(64,9,9,0,0,6.6,145,0,.95,0,-2,11,8E-4,1),new k(80,9,9,0,0,6.6,145,0,.95,0,0,8,7E-4,1),new k(96,9,9,0,2.5,6.6,145,0,.95,0,1,5.5,6E-4,1),new k(112,9,9,0,2.25,6.6,145,0,.95,0,2,4.5,5E-4,1),new k(128,9,9,0,1.95,6.4,140,0,.95,0,3,4,2E-4,1),new k(160,9,9,1,1.79,6,135,0,.95,-2,5,3.5,0,1),new k(192,9,9,1,1.49,5.6,125,0,.97,-4,7,3,0,0),new k(224,9,9,1,1.25,5.2,
125,0,.98,-6,9,2,0,0),new k(256,9,9,1,.97,5.2,125,0,1,-8,10,1,0,0),new k(320,9,9,1,.9,5.2,125,0,1,-10,12,0,0,0)];this.apply_preset=function(b,c,a){switch(c){case W.R3MIX:c=W.V3;b.VBR=G.vbr_mtrh;break;case W.MEDIUM:c=W.V4;b.VBR=G.vbr_rh;break;case W.MEDIUM_FAST:c=W.V4;b.VBR=G.vbr_mtrh;break;case W.STANDARD:c=W.V2;b.VBR=G.vbr_rh;break;case W.STANDARD_FAST:c=W.V2;b.VBR=G.vbr_mtrh;break;case W.EXTREME:c=W.V0;b.VBR=G.vbr_rh;break;case W.EXTREME_FAST:c=W.V0;b.VBR=G.vbr_mtrh;break;case W.INSANE:return c=
320,b.preset=c,V(b,c,a),b.VBR=G.vbr_off,c}b.preset=c;switch(c){case W.V9:return n(b,9,a),c;case W.V8:return n(b,8,a),c;case W.V7:return n(b,7,a),c;case W.V6:return n(b,6,a),c;case W.V5:return n(b,5,a),c;case W.V4:return n(b,4,a),c;case W.V3:return n(b,3,a),c;case W.V2:return n(b,2,a),c;case W.V1:return n(b,1,a),c;case W.V0:return n(b,0,a),c}if(8<=c&&320>=c)return V(b,c,a);b.preset=0;return c}}function qb(){function u(a){this.bits=0|a}function k(a,d,p,b,e,c){d=.5946/d;for(a>>=1;0!=a--;)e[c++]=d>p[b++]?
0:1,e[c++]=d>p[b++]?0:1}function n(a,d,b,e,c,l){a>>=1;var h=a%2;for(a>>=1;0!=a--;){var p=b[e++]*d;var r=b[e++]*d;var t=0|p;var f=b[e++]*d;var g=0|r;var J=b[e++]*d;var D=0|f;p+=B.adj43[t];t=0|J;r+=B.adj43[g];c[l++]=0|p;f+=B.adj43[D];c[l++]=0|r;J+=B.adj43[t];c[l++]=0|f;c[l++]=0|J}0!=h&&(p=b[e++]*d,r=b[e++]*d,p+=B.adj43[0|p],r+=B.adj43[0|r],c[l++]=0|p,c[l++]=0|r)}function V(a,d,b,e){var p,c=d,h=p=0;do{var r=a[c++],l=a[c++];p<r&&(p=r);h<l&&(h=l)}while(c<b);p<h&&(p=h);switch(p){case 0:return p;case 1:c=
d;d=0;p=w.ht[1].hlen;do h=2*a[c+0]+a[c+1],c+=2,d+=p[h];while(c<b);e.bits+=d;return 1;case 2:case 3:c=d;d=f[p-1];p=0;h=w.ht[d].xlen;r=2==d?w.table23:w.table56;do l=a[c+0]*h+a[c+1],c+=2,p+=r[l];while(c<b);a=p&65535;p>>=16;p>a&&(p=a,d++);e.bits+=p;return d;case 4:case 5:case 6:case 7:case 8:case 9:case 10:case 11:case 12:case 13:case 14:case 15:c=d;d=f[p-1];r=h=p=0;l=w.ht[d].xlen;var g=w.ht[d].hlen,D=w.ht[d+1].hlen,q=w.ht[d+2].hlen;do{var m=a[c+0]*l+a[c+1];c+=2;p+=g[m];h+=D[m];r+=q[m]}while(c<b);a=d;
p>h&&(p=h,a++);p>r&&(p=r,a=d+2);e.bits+=p;return a;default:if(p>ia.IXMAX_VAL)return e.bits=ia.LARGE_BITS,-1;p-=15;for(c=24;32>c&&!(w.ht[c].linmax>=p);c++);for(h=c-8;24>h&&!(w.ht[h].linmax>=p);h++);p=h;r=65536*w.ht[p].xlen+w.ht[c].xlen;h=0;do l=a[d++],g=a[d++],0!=l&&(14<l&&(l=15,h+=r),l*=16),0!=g&&(14<g&&(g=15,h+=r),l+=g),h+=w.largetbl[l];while(d<b);a=h&65535;h>>=16;h>a&&(h=a,p=c);e.bits+=h;return p}}function E(a,d,p,b,e,l,h,g){for(var r=d.big_values,f=2;f<c.SBMAX_l+1;f++){var x=a.scalefac_band.l[f];
if(x>=r)break;var t=e[f-2]+d.count1bits;if(p.part2_3_length<=t)break;t=new u(t);x=V(b,x,r,t);t=t.bits;p.part2_3_length<=t||(p.assign(d),p.part2_3_length=t,p.region0_count=l[f-2],p.region1_count=f-2-l[f-2],p.table_select[0]=h[f-2],p.table_select[1]=g[f-2],p.table_select[2]=x)}}var B=null;this.qupvt=null;this.setModules=function(a){B=this.qupvt=a};var ha=[[0,0],[0,0],[0,0],[0,0],[0,0],[0,1],[1,1],[1,1],[1,2],[2,2],[2,3],[2,3],[3,4],[3,4],[3,4],[4,5],[4,5],[4,6],[5,6],[5,6],[5,7],[6,7],[6,7]],f=[1,2,
5,7,7,10,10,13,13,13,13,13,13,13,13];this.noquant_count_bits=function(a,d,p){var b=d.l3_enc,e=Math.min(576,d.max_nonzero_coeff+2>>1<<1);null!=p&&(p.sfb_count1=0);for(;1<e&&0==(b[e-1]|b[e-2]);e-=2);d.count1=e;for(var l=0,h=0;3<e&&!(1<((b[e-1]|b[e-2]|b[e-3]|b[e-4])&2147483647));e-=4){var f=2*(2*(2*b[e-4]+b[e-3])+b[e-2])+b[e-1];l+=w.t32l[f];h+=w.t33l[f]}f=l;d.count1table_select=0;l>h&&(f=h,d.count1table_select=1);d.count1bits=f;d.big_values=e;if(0==e)return f;d.block_type==c.SHORT_TYPE?(l=3*a.scalefac_band.s[3],
l>d.big_values&&(l=d.big_values),h=d.big_values):d.block_type==c.NORM_TYPE?(l=d.region0_count=a.bv_scf[e-2],h=d.region1_count=a.bv_scf[e-1],h=a.scalefac_band.l[l+h+2],l=a.scalefac_band.l[l+1],h<e&&(f=new u(f),d.table_select[2]=V(b,h,e,f),f=f.bits)):(d.region0_count=7,d.region1_count=c.SBMAX_l-1-7-1,l=a.scalefac_band.l[8],h=e,l>h&&(l=h));l=Math.min(l,e);h=Math.min(h,e);0<l&&(f=new u(f),d.table_select[0]=V(b,0,l,f),f=f.bits);l<h&&(f=new u(f),d.table_select[1]=V(b,l,h,f),f=f.bits);2==a.use_best_huffman&&
(d.part2_3_length=f,best_huffman_divide(a,d),f=d.part2_3_length);if(null!=p&&d.block_type==c.NORM_TYPE){for(b=0;a.scalefac_band.l[b]<d.big_values;)b++;p.sfb_count1=b}return f};this.count_bits=function(a,d,e,b){var p=e.l3_enc,l=ia.IXMAX_VAL/B.IPOW20(e.global_gain);if(e.xrpow_max>l)return ia.LARGE_BITS;l=B.IPOW20(e.global_gain);var h,f=0,g=0,r=0,D=0,m=0,q=p,v=0,C=d,I=0;var Q=null!=b&&e.global_gain==b.global_gain;var S=e.block_type==c.SHORT_TYPE?38:21;for(h=0;h<=S;h++){var u=-1;if(Q||e.block_type==c.NORM_TYPE)u=
e.global_gain-(e.scalefac[h]+(0!=e.preflag?B.pretab[h]:0)<<e.scalefac_scale+1)-8*e.subblock_gain[e.window[h]];if(Q&&b.step[h]==u)0!=g&&(n(g,l,C,I,q,v),g=0),0!=r&&(k(r,l,C,I,q,v),r=0);else{var Z=e.width[h];f+e.width[h]>e.max_nonzero_coeff&&(h=e.max_nonzero_coeff-f+1,na.fill(p,e.max_nonzero_coeff,576,0),Z=h,0>Z&&(Z=0),h=S+1);0==g&&0==r&&(q=p,v=m,C=d,I=D);null!=b&&0<b.sfb_count1&&h>=b.sfb_count1&&0<b.step[h]&&u>=b.step[h]?(0!=g&&(n(g,l,C,I,q,v),g=0,q=p,v=m,C=d,I=D),r+=Z):(0!=r&&(k(r,l,C,I,q,v),r=0,q=
p,v=m,C=d,I=D),g+=Z);if(0>=Z){0!=r&&(k(r,l,C,I,q,v),r=0);0!=g&&(n(g,l,C,I,q,v),g=0);break}}h<=S&&(m+=e.width[h],D+=e.width[h],f+=e.width[h])}0!=g&&n(g,l,C,I,q,v);0!=r&&k(r,l,C,I,q,v);if(0!=(a.substep_shaping&2))for(l=0,S=.634521682242439/B.IPOW20(e.global_gain+e.scalefac_scale),f=0;f<e.sfbmax;f++)if(Q=e.width[f],0==a.pseudohalf[f])l+=Q;else for(g=l,l+=Q;g<l;++g)p[g]=d[g]>=S?p[g]:0;return this.noquant_count_bits(a,e,b)};this.best_huffman_divide=function(a,d){var e=new rb,b=d.l3_enc,l=X(23),f=X(23),
h=X(23),g=X(23);if(d.block_type!=c.SHORT_TYPE||1!=a.mode_gr){e.assign(d);if(d.block_type==c.NORM_TYPE){for(var y=d.big_values,m=0;22>=m;m++)l[m]=ia.LARGE_BITS;for(m=0;16>m;m++){var D=a.scalefac_band.l[m+1];if(D>=y)break;var q=0,k=new u(q),v=V(b,0,D,k);q=k.bits;for(var C=0;8>C;C++){var I=a.scalefac_band.l[m+C+2];if(I>=y)break;k=q;k=new u(k);I=V(b,D,I,k);k=k.bits;l[m+C]>k&&(l[m+C]=k,f[m+C]=m,h[m+C]=v,g[m+C]=I)}}E(a,e,d,b,l,f,h,g)}y=e.big_values;if(!(0==y||1<(b[y-2]|b[y-1])||(y=d.count1+2,576<y))){e.assign(d);
e.count1=y;for(D=m=0;y>e.big_values;y-=4)q=2*(2*(2*b[y-4]+b[y-3])+b[y-2])+b[y-1],m+=w.t32l[q],D+=w.t33l[q];e.big_values=y;e.count1table_select=0;m>D&&(m=D,e.count1table_select=1);e.count1bits=m;e.block_type==c.NORM_TYPE?E(a,e,d,b,l,f,h,g):(e.part2_3_length=m,m=a.scalefac_band.l[8],m>y&&(m=y),0<m&&(a=new u(e.part2_3_length),e.table_select[0]=V(b,0,m,a),e.part2_3_length=a.bits),y>m&&(a=new u(e.part2_3_length),e.table_select[1]=V(b,m,y,a),e.part2_3_length=a.bits),d.part2_3_length>e.part2_3_length&&d.assign(e))}}};
var b=[1,1,1,1,8,2,2,2,4,4,4,8,8,8,16,16],v=[1,2,4,8,1,2,4,8,2,4,8,2,4,8,4,8],a=[0,0,0,0,3,1,1,1,2,2,2,3,3,3,4,4],m=[0,1,2,3,0,1,2,3,1,2,3,1,2,3,2,3];qb.slen1_tab=a;qb.slen2_tab=m;this.best_scalefac_store=function(d,e,p,l){var f=l.tt[e][p],g,h,r=0;for(g=h=0;g<f.sfbmax;g++){var y=f.width[g];h+=y;for(y=-y;0>y&&0==f.l3_enc[y+h];y++);0==y&&(f.scalefac[g]=r=-2)}if(0==f.scalefac_scale&&0==f.preflag){for(g=h=0;g<f.sfbmax;g++)0<f.scalefac[g]&&(h|=f.scalefac[g]);if(0==(h&1)&&0!=h){for(g=0;g<f.sfbmax;g++)0<
f.scalefac[g]&&(f.scalefac[g]>>=1);f.scalefac_scale=r=1}}if(0==f.preflag&&f.block_type!=c.SHORT_TYPE&&2==d.mode_gr){for(g=11;g<c.SBPSY_l&&!(f.scalefac[g]<B.pretab[g]&&-2!=f.scalefac[g]);g++);if(g==c.SBPSY_l){for(g=11;g<c.SBPSY_l;g++)0<f.scalefac[g]&&(f.scalefac[g]-=B.pretab[g]);f.preflag=r=1}}for(g=0;4>g;g++)l.scfsi[p][g]=0;if(2==d.mode_gr&&1==e&&l.tt[0][p].block_type!=c.SHORT_TYPE&&l.tt[1][p].block_type!=c.SHORT_TYPE){e=l.tt[1][p];h=l.tt[0][p];for(r=0;r<w.scfsi_band.length-1;r++){for(g=w.scfsi_band[r];g<
w.scfsi_band[r+1]&&!(h.scalefac[g]!=e.scalefac[g]&&0<=e.scalefac[g]);g++);if(g==w.scfsi_band[r+1]){for(g=w.scfsi_band[r];g<w.scfsi_band[r+1];g++)e.scalefac[g]=-1;l.scfsi[p][r]=1}}for(g=l=p=0;11>g;g++)-1!=e.scalefac[g]&&(l++,p<e.scalefac[g]&&(p=e.scalefac[g]));for(y=h=0;g<c.SBPSY_l;g++)-1!=e.scalefac[g]&&(y++,h<e.scalefac[g]&&(h=e.scalefac[g]));for(r=0;16>r;r++)p<b[r]&&h<v[r]&&(g=a[r]*l+m[r]*y,e.part2_length>g&&(e.part2_length=g,e.scalefac_compress=r));r=0}for(g=0;g<f.sfbmax;g++)-2==f.scalefac[g]&&
(f.scalefac[g]=0);0!=r&&(2==d.mode_gr?this.scale_bitcount(f):this.scale_bitcount_lsf(d,f))};var z=[0,18,36,54,54,36,54,72,54,72,90,72,90,108,108,126],e=[0,18,36,54,51,35,53,71,52,70,88,69,87,105,104,122],l=[0,10,20,30,33,21,31,41,32,42,52,43,53,63,64,74];this.scale_bitcount=function(a){var d,g=0,f=0,t=a.scalefac;if(a.block_type==c.SHORT_TYPE){var m=z;0!=a.mixed_block_flag&&(m=e)}else if(m=l,0==a.preflag){for(d=11;d<c.SBPSY_l&&!(t[d]<B.pretab[d]);d++);if(d==c.SBPSY_l)for(a.preflag=1,d=11;d<c.SBPSY_l;d++)t[d]-=
B.pretab[d]}for(d=0;d<a.sfbdivide;d++)g<t[d]&&(g=t[d]);for(;d<a.sfbmax;d++)f<t[d]&&(f=t[d]);a.part2_length=ia.LARGE_BITS;for(d=0;16>d;d++)g<b[d]&&f<v[d]&&a.part2_length>m[d]&&(a.part2_length=m[d],a.scalefac_compress=d);return a.part2_length==ia.LARGE_BITS};var d=[[15,15,7,7],[15,15,7,0],[7,3,0,0],[15,31,31,0],[7,7,7,0],[3,3,0,0]];this.scale_bitcount_lsf=function(a,e){var b,f,l,m,h=X(4),x=e.scalefac;a=0!=e.preflag?2:0;for(l=0;4>l;l++)h[l]=0;if(e.block_type==c.SHORT_TYPE){var y=1;var k=B.nr_of_sfb_block[a][y];
for(b=m=0;4>b;b++){var q=k[b]/3;for(l=0;l<q;l++,m++)for(f=0;3>f;f++)x[3*m+f]>h[b]&&(h[b]=x[3*m+f])}}else for(y=0,k=B.nr_of_sfb_block[a][y],b=m=0;4>b;b++)for(q=k[b],l=0;l<q;l++,m++)x[m]>h[b]&&(h[b]=x[m]);q=!1;for(b=0;4>b;b++)h[b]>d[a][b]&&(q=!0);if(!q){e.sfb_partition_table=B.nr_of_sfb_block[a][y];for(b=0;4>b;b++)e.slen[b]=g[h[b]];y=e.slen[0];b=e.slen[1];h=e.slen[2];f=e.slen[3];switch(a){case 0:e.scalefac_compress=(5*y+b<<4)+(h<<2)+f;break;case 1:e.scalefac_compress=400+(5*y+b<<2)+h;break;case 2:e.scalefac_compress=
500+3*y+b;break;default:T.err.printf("intensity stereo not implemented yet\n")}}if(!q)for(b=e.part2_length=0;4>b;b++)e.part2_length+=e.slen[b]*e.sfb_partition_table[b];return q};var g=[0,1,2,2,3,3,3,3,4,4,4,4,4,4,4,4];this.huffman_init=function(a){for(var d=2;576>=d;d+=2){for(var e=0,b;a.scalefac_band.l[++e]<d;);for(b=ha[e][0];a.scalefac_band.l[b+1]>d;)b--;0>b&&(b=ha[e][0]);a.bv_scf[d-2]=b;for(b=ha[e][1];a.scalefac_band.l[b+a.bv_scf[d-2]+2]>d;)b--;0>b&&(b=ha[e][1]);a.bv_scf[d-1]=b}}}function xc(){var c;
this.setModules=function(k){c=k};this.ResvFrameBegin=function(k,n){var u=k.internal_flags,E=u.l3_side,B=c.getframebits(k);n.bits=(B-8*u.sideinfo_len)/u.mode_gr;var w=2048*u.mode_gr-8;if(320<k.brate)var f=8*int(1E3*k.brate/(k.out_samplerate/1152)/8+.5);else f=11520,k.strict_ISO&&(f=8*int(32E4/(k.out_samplerate/1152)/8+.5));u.ResvMax=f-B;u.ResvMax>w&&(u.ResvMax=w);if(0>u.ResvMax||k.disable_reservoir)u.ResvMax=0;k=n.bits*u.mode_gr+Math.min(u.ResvSize,u.ResvMax);k>f&&(k=f);E.resvDrain_pre=0;null!=u.pinfo&&
(u.pinfo.mean_bits=n.bits/2,u.pinfo.resvsize=u.ResvSize);return k};this.ResvMaxBits=function(c,n,u,E){var k=c.internal_flags,w=k.ResvSize,f=k.ResvMax;0!=E&&(w+=n);0!=(k.substep_shaping&1)&&(f*=.9);u.bits=n;10*w>9*f?(E=w-9*f/10,u.bits+=E,k.substep_shaping|=128):(E=0,k.substep_shaping&=127,c.disable_reservoir||0!=(k.substep_shaping&1)||(u.bits-=.1*n));c=w<6*k.ResvMax/10?w:6*k.ResvMax/10;c-=E;0>c&&(c=0);return c};this.ResvAdjust=function(c,n){c.ResvSize-=n.part2_3_length+n.part2_length};this.ResvFrameEnd=
function(c,n){var k,u=c.l3_side;c.ResvSize+=n*c.mode_gr;n=0;u.resvDrain_post=0;u.resvDrain_pre=0;0!=(k=c.ResvSize%8)&&(n+=k);k=c.ResvSize-n-c.ResvMax;0<k&&(n+=k);k=Math.min(8*u.main_data_begin,n)/8;u.resvDrain_pre+=8*k;n-=8*k;c.ResvSize-=8*k;u.main_data_begin-=k;u.resvDrain_post+=n;c.ResvSize-=n}}function qa(){function u(a,e,b){for(;0<b;){if(0==D){D=8;q++;if(a.header[a.w_ptr].write_timing==g){var c=a;T.arraycopy(c.header[c.w_ptr].buf,0,d,q,c.sideinfo_len);q+=c.sideinfo_len;g+=8*c.sideinfo_len;c.w_ptr=
c.w_ptr+1&da.MAX_HEADER_BUF-1}d[q]=0}c=Math.min(b,D);b-=c;D-=c;d[q]|=e>>b<<D;g+=c}}function k(a,d){var b=a.internal_flags,c;8<=d&&(u(b,76,8),d-=8);8<=d&&(u(b,65,8),d-=8);8<=d&&(u(b,77,8),d-=8);8<=d&&(u(b,69,8),d-=8);if(32<=d){var h=e.getLameShortVersion();if(32<=d)for(c=0;c<h.length&&8<=d;++c)d-=8,u(b,h.charAt(c),8)}for(;1<=d;--d)u(b,b.ancillary_flag,1),b.ancillary_flag^=a.disable_reservoir?0:1}function n(a,d,e){for(var b=a.header[a.h_ptr].ptr;0<e;){var h=Math.min(e,8-(b&7));e-=h;a.header[a.h_ptr].buf[b>>
3]|=d>>e<<8-(b&7)-h;b+=h}a.header[a.h_ptr].ptr=b}function V(a,d){a<<=8;for(var e=0;8>e;e++)a<<=1,d<<=1,0!=((d^a)&65536)&&(d^=32773);return d}function E(a,d){var e=w.ht[d.count1table_select+32],b,h=0,c=d.big_values,g=d.big_values;for(b=(d.count1-d.big_values)/4;0<b;--b){var l=0,f=0;var p=d.l3_enc[c+0];0!=p&&(f+=8,0>d.xr[g+0]&&l++);p=d.l3_enc[c+1];0!=p&&(f+=4,l*=2,0>d.xr[g+1]&&l++);p=d.l3_enc[c+2];0!=p&&(f+=2,l*=2,0>d.xr[g+2]&&l++);p=d.l3_enc[c+3];0!=p&&(f++,l*=2,0>d.xr[g+3]&&l++);c+=4;g+=4;u(a,l+e.table[f],
e.hlen[f]);h+=e.hlen[f]}return h}function B(a,d,e,b,h){var c=w.ht[d],g=0;if(0==d)return g;for(;e<b;e+=2){var l=0,f=0,p=c.xlen,r=c.xlen,m=0,C=h.l3_enc[e],k=h.l3_enc[e+1];0!=C&&(0>h.xr[e]&&m++,l--);15<d&&(14<C&&(m|=C-15<<1,f=p,C=15),14<k&&(r=k-15,m<<=p,m|=r,f+=p,k=15),r=16);0!=k&&(m<<=1,0>h.xr[e+1]&&m++,l--);C=C*r+k;f-=l;l+=c.hlen[C];u(a,c.table[C],l);u(a,m,f);g+=l+f}return g}function K(a,d){var e=3*a.scalefac_band.s[3];e>d.big_values&&(e=d.big_values);var b=B(a,d.table_select[0],0,e,d);return b+=B(a,
d.table_select[1],e,d.big_values,d)}function f(a,d){var e=d.big_values;var b=d.region0_count+1;var h=a.scalefac_band.l[b];b+=d.region1_count+1;var c=a.scalefac_band.l[b];h>e&&(h=e);c>e&&(c=e);b=B(a,d.table_select[0],0,h,d);b+=B(a,d.table_select[1],h,c,d);return b+=B(a,d.table_select[2],c,e,d)}function b(){this.total=0}function v(d,e){var b=d.internal_flags;var c=b.w_ptr;var h=b.h_ptr-1;-1==h&&(h=da.MAX_HEADER_BUF-1);var l=b.header[h].write_timing-g;e.total=l;if(0<=l){var f=1+h-c;h<c&&(f=1+h-c+da.MAX_HEADER_BUF);
l-=8*f*b.sideinfo_len}d=a.getframebits(d);l+=d;e.total+=d;e.total=0!=e.total%8?1+e.total/8:e.total/8;e.total+=q+1;0>l&&T.err.println("strange error flushing buffer ... \n");return l}var a=this,m=null,z=null,e=null,l=null;this.setModules=function(a,d,b,c){m=a;z=d;e=b;l=c};var d=null,g=0,q=0,D=0;this.getframebits=function(a){var d=a.internal_flags;return 8*(0|72E3*(a.version+1)*(0!=d.bitrate_index?w.bitrate_table[a.version][d.bitrate_index]:a.brate)/a.out_samplerate+d.padding)};this.CRC_writeheader=
function(a,d){var e=V(d[2]&255,65535);e=V(d[3]&255,e);for(var b=6;b<a.sideinfo_len;b++)e=V(d[b]&255,e);d[4]=byte(e>>8);d[5]=byte(e&255)};this.flush_bitstream=function(a){var d=a.internal_flags,e;var c=d.l3_side;0>(e=v(a,new b))||(k(a,e),d.ResvSize=0,c.main_data_begin=0,d.findReplayGain&&(c=m.GetTitleGain(d.rgdata),d.RadioGain=Math.floor(10*c+.5)|0),d.findPeakSample&&(d.noclipGainChange=Math.ceil(200*Math.log10(d.PeakSample/32767))|0,0<d.noclipGainChange?EQ(a.scale,1)||EQ(a.scale,0)?d.noclipScale=
Math.floor(32767/d.PeakSample*100)/100:d.noclipScale=-1:d.noclipScale=-1))};this.add_dummy_byte=function(a,e,b){a=a.internal_flags;for(var c;0<b--;){c=e;for(var h=8;0<h;){0==D&&(D=8,q++,d[q]=0);var l=Math.min(h,D);h-=l;D-=l;d[q]|=c>>h<<D;g+=l}for(c=0;c<da.MAX_HEADER_BUF;++c)a.header[c].write_timing+=8}};this.format_bitstream=function(a){var d=a.internal_flags;var e=d.l3_side;var l=this.getframebits(a);k(a,e.resvDrain_pre);var h=a.internal_flags,p,y;var m=h.l3_side;h.header[h.h_ptr].ptr=0;na.fill(h.header[h.h_ptr].buf,
0,h.sideinfo_len,0);16E3>a.out_samplerate?n(h,4094,12):n(h,4095,12);n(h,a.version,1);n(h,1,2);n(h,a.error_protection?0:1,1);n(h,h.bitrate_index,4);n(h,h.samplerate_index,2);n(h,h.padding,1);n(h,a.extension,1);n(h,a.mode.ordinal(),2);n(h,h.mode_ext,2);n(h,a.copyright,1);n(h,a.original,1);n(h,a.emphasis,2);a.error_protection&&n(h,0,16);if(1==a.version){n(h,m.main_data_begin,9);2==h.channels_out?n(h,m.private_bits,3):n(h,m.private_bits,5);for(y=0;y<h.channels_out;y++)for(p=0;4>p;p++)n(h,m.scfsi[y][p],
1);for(p=0;2>p;p++)for(y=0;y<h.channels_out;y++){var q=m.tt[p][y];n(h,q.part2_3_length+q.part2_length,12);n(h,q.big_values/2,9);n(h,q.global_gain,8);n(h,q.scalefac_compress,4);q.block_type!=c.NORM_TYPE?(n(h,1,1),n(h,q.block_type,2),n(h,q.mixed_block_flag,1),14==q.table_select[0]&&(q.table_select[0]=16),n(h,q.table_select[0],5),14==q.table_select[1]&&(q.table_select[1]=16),n(h,q.table_select[1],5),n(h,q.subblock_gain[0],3),n(h,q.subblock_gain[1],3),n(h,q.subblock_gain[2],3)):(n(h,0,1),14==q.table_select[0]&&
(q.table_select[0]=16),n(h,q.table_select[0],5),14==q.table_select[1]&&(q.table_select[1]=16),n(h,q.table_select[1],5),14==q.table_select[2]&&(q.table_select[2]=16),n(h,q.table_select[2],5),n(h,q.region0_count,4),n(h,q.region1_count,3));n(h,q.preflag,1);n(h,q.scalefac_scale,1);n(h,q.count1table_select,1)}}else for(n(h,m.main_data_begin,8),n(h,m.private_bits,h.channels_out),y=p=0;y<h.channels_out;y++)q=m.tt[p][y],n(h,q.part2_3_length+q.part2_length,12),n(h,q.big_values/2,9),n(h,q.global_gain,8),n(h,
q.scalefac_compress,9),q.block_type!=c.NORM_TYPE?(n(h,1,1),n(h,q.block_type,2),n(h,q.mixed_block_flag,1),14==q.table_select[0]&&(q.table_select[0]=16),n(h,q.table_select[0],5),14==q.table_select[1]&&(q.table_select[1]=16),n(h,q.table_select[1],5),n(h,q.subblock_gain[0],3),n(h,q.subblock_gain[1],3),n(h,q.subblock_gain[2],3)):(n(h,0,1),14==q.table_select[0]&&(q.table_select[0]=16),n(h,q.table_select[0],5),14==q.table_select[1]&&(q.table_select[1]=16),n(h,q.table_select[1],5),14==q.table_select[2]&&
(q.table_select[2]=16),n(h,q.table_select[2],5),n(h,q.region0_count,4),n(h,q.region1_count,3)),n(h,q.scalefac_scale,1),n(h,q.count1table_select,1);a.error_protection&&CRC_writeheader(h,h.header[h.h_ptr].buf);m=h.h_ptr;h.h_ptr=m+1&da.MAX_HEADER_BUF-1;h.header[h.h_ptr].write_timing=h.header[m].write_timing+l;h.h_ptr==h.w_ptr&&T.err.println("Error: MAX_HEADER_BUF too small in bitstream.c \n");h=8*d.sideinfo_len;var D=0,B=a.internal_flags,z=B.l3_side;if(1==a.version)for(m=0;2>m;m++)for(y=0;y<B.channels_out;y++){var C=
z.tt[m][y],I=qb.slen1_tab[C.scalefac_compress],Q=qb.slen2_tab[C.scalefac_compress];for(p=q=0;p<C.sfbdivide;p++)-1!=C.scalefac[p]&&(u(B,C.scalefac[p],I),q+=I);for(;p<C.sfbmax;p++)-1!=C.scalefac[p]&&(u(B,C.scalefac[p],Q),q+=Q);q=C.block_type==c.SHORT_TYPE?q+K(B,C):q+f(B,C);q+=E(B,C);D+=q}else for(y=m=0;y<B.channels_out;y++){C=z.tt[m][y];var S=0;Q=p=q=0;if(C.block_type==c.SHORT_TYPE){for(;4>Q;Q++){var w=C.sfb_partition_table[Q]/3,Z=C.slen[Q];for(I=0;I<w;I++,p++)u(B,Math.max(C.scalefac[3*p],0),Z),u(B,
Math.max(C.scalefac[3*p+1],0),Z),u(B,Math.max(C.scalefac[3*p+2],0),Z),S+=3*Z}q+=K(B,C)}else{for(;4>Q;Q++)for(w=C.sfb_partition_table[Q],Z=C.slen[Q],I=0;I<w;I++,p++)u(B,Math.max(C.scalefac[p],0),Z),S+=Z;q+=f(B,C)}q+=E(B,C);D+=S+q}h+=D;k(a,e.resvDrain_post);h+=e.resvDrain_post;e.main_data_begin+=(l-h)/8;v(a,new b)!=d.ResvSize&&T.err.println("Internal buffer inconsistency. flushbits <> ResvSize");8*e.main_data_begin!=d.ResvSize&&(T.err.printf("bit reservoir error: \nl3_side.main_data_begin: %d \nResvoir size:             %d \nresv drain (post)         %d \nresv drain (pre)          %d \nheader and sideinfo:      %d \ndata bits:                %d \ntotal bits:               %d (remainder: %d) \nbitsperframe:             %d \n",
8*e.main_data_begin,d.ResvSize,e.resvDrain_post,e.resvDrain_pre,8*d.sideinfo_len,h-e.resvDrain_post-8*d.sideinfo_len,h,h%8,l),T.err.println("This is a fatal error.  It has several possible causes:"),T.err.println("90%%  LAME compiled with buggy version of gcc using advanced optimizations"),T.err.println(" 9%%  Your system is overclocked"),T.err.println(" 1%%  bug in LAME encoding library"),d.ResvSize=8*e.main_data_begin);if(1E9<g){for(a=0;a<da.MAX_HEADER_BUF;++a)d.header[a].write_timing-=g;g=0}return 0};
this.copy_buffer=function(a,e,b,c,h){var g=q+1;if(0>=g)return 0;if(0!=c&&g>c)return-1;T.arraycopy(d,0,e,b,g);q=-1;D=0;if(0!=h&&(c=X(1),c[0]=a.nMusicCRC,l.updateMusicCRC(c,e,b,g),a.nMusicCRC=c[0],0<g&&(a.VBR_seek_table.nBytesWritten+=g),a.decode_on_the_fly)){c=ca([2,1152]);h=g;for(var f=-1,p;0!=f;)if(f=z.hip_decode1_unclipped(a.hip,e,b,h,c[0],c[1]),h=0,-1==f&&(f=0),0<f){if(a.findPeakSample){for(p=0;p<f;p++)c[0][p]>a.PeakSample?a.PeakSample=c[0][p]:-c[0][p]>a.PeakSample&&(a.PeakSample=-c[0][p]);if(1<
a.channels_out)for(p=0;p<f;p++)c[1][p]>a.PeakSample?a.PeakSample=c[1][p]:-c[1][p]>a.PeakSample&&(a.PeakSample=-c[1][p])}if(a.findReplayGain&&m.AnalyzeSamples(a.rgdata,c[0],0,c[1],0,f,a.channels_out)==Y.GAIN_ANALYSIS_ERROR)return-6}}return g};this.init_bit_stream_w=function(a){d=new Int8Array(W.LAME_MAXMP3BUFFER);a.h_ptr=a.w_ptr=0;a.header[a.h_ptr].write_timing=0;q=-1;g=D=0}}function zb(){function c(a,b){var d=a[b+0]&255;d=d<<8|a[b+1]&255;d=d<<8|a[b+2]&255;return d=d<<8|a[b+3]&255}function k(a,b,d){a[b+
0]=d>>24&255;a[b+1]=d>>16&255;a[b+2]=d>>8&255;a[b+3]=d&255}function n(a,b,d){a[b+0]=d>>8&255;a[b+1]=d&255}function V(a,b,d){return 255&(a<<b|d&~(-1<<b))}function E(a,b){var d=a.internal_flags;b[0]=V(b[0],8,255);b[1]=V(b[1],3,7);b[1]=V(b[1],1,16E3>a.out_samplerate?0:1);b[1]=V(b[1],1,a.version);b[1]=V(b[1],2,1);b[1]=V(b[1],1,a.error_protection?0:1);b[2]=V(b[2],4,d.bitrate_index);b[2]=V(b[2],2,d.samplerate_index);b[2]=V(b[2],1,0);b[2]=V(b[2],1,a.extension);b[3]=V(b[3],2,a.mode.ordinal());b[3]=V(b[3],
2,d.mode_ext);b[3]=V(b[3],1,a.copyright);b[3]=V(b[3],1,a.original);b[3]=V(b[3],2,a.emphasis);b[0]=255;d=b[1]&241;var e=1==a.version?128:16E3>a.out_samplerate?32:64;a.VBR==G.vbr_off&&(e=a.brate);e=a.free_format?0:255&16*K.BitrateIndex(e,a.version,a.out_samplerate);b[1]=1==a.version?255&(d|10):255&(d|2);d=b[2]&13;b[2]=255&(e|d)}function B(a,b){return b=b>>8^z[(b^a)&255]}var K,f,b;this.setModules=function(a,c,d){K=a;f=c;b=d};var v=zb.NUMTOCENTRIES,a=zb.MAXFRAMESIZE,m=v+4+4+4+4+4+9+1+1+8+1+1+3+1+1+2+
4+2+2,z=[0,49345,49537,320,49921,960,640,49729,50689,1728,1920,51009,1280,50625,50305,1088,52225,3264,3456,52545,3840,53185,52865,3648,2560,51905,52097,2880,51457,2496,2176,51265,55297,6336,6528,55617,6912,56257,55937,6720,7680,57025,57217,8E3,56577,7616,7296,56385,5120,54465,54657,5440,55041,6080,5760,54849,53761,4800,4992,54081,4352,53697,53377,4160,61441,12480,12672,61761,13056,62401,62081,12864,13824,63169,63361,14144,62721,13760,13440,62529,15360,64705,64897,15680,65281,16320,16E3,65089,64001,
15040,15232,64321,14592,63937,63617,14400,10240,59585,59777,10560,60161,11200,10880,59969,60929,11968,12160,61249,11520,60865,60545,11328,58369,9408,9600,58689,9984,59329,59009,9792,8704,58049,58241,9024,57601,8640,8320,57409,40961,24768,24960,41281,25344,41921,41601,25152,26112,42689,42881,26432,42241,26048,25728,42049,27648,44225,44417,27968,44801,28608,28288,44609,43521,27328,27520,43841,26880,43457,43137,26688,30720,47297,47489,31040,47873,31680,31360,47681,48641,32448,32640,48961,32E3,48577,
48257,31808,46081,29888,30080,46401,30464,47041,46721,30272,29184,45761,45953,29504,45313,29120,28800,45121,20480,37057,37249,20800,37633,21440,21120,37441,38401,22208,22400,38721,21760,38337,38017,21568,39937,23744,23936,40257,24320,40897,40577,24128,23040,39617,39809,23360,39169,22976,22656,38977,34817,18624,18816,35137,19200,35777,35457,19008,19968,36545,36737,20288,36097,19904,19584,35905,17408,33985,34177,17728,34561,18368,18048,34369,33281,17088,17280,33601,16640,33217,32897,16448];this.addVbrFrame=
function(a){var b=a.internal_flags;var d=b.VBR_seek_table;a=w.bitrate_table[a.version][b.bitrate_index];d.nVbrNumFrames++;d.sum+=a;d.seen++;if(!(d.seen<d.want)&&(d.pos<d.size&&(d.bag[d.pos]=d.sum,d.pos++,d.seen=0),d.pos==d.size)){for(a=1;a<d.size;a+=2)d.bag[a/2]=d.bag[a];d.want*=2;d.pos/=2}};this.getVbrTag=function(a){var b=new VBRTagData,d=0;b.flags=0;var e=a[d+1]>>3&1,f=a[d+2]>>2&3,m=a[d+3]>>6&3,p=a[d+2]>>4&15;p=w.bitrate_table[e][p];b.samprate=14==a[d+1]>>4?w.samplerate_table[2][f]:w.samplerate_table[e][f];
f=d=0!=e?3!=m?d+36:d+21:3!=m?d+21:d+13;if(!(new String(a,f,4(),null)).equals("Xing")&&!(new String(a,f,4(),null)).equals("Info"))return null;d+=4;b.hId=e;f=b.flags=c(a,d);d+=4;0!=(f&1)&&(b.frames=c(a,d),d+=4);0!=(f&2)&&(b.bytes=c(a,d),d+=4);if(0!=(f&4)){if(null!=b.toc)for(m=0;m<v;m++)b.toc[m]=a[d+m];d+=v}b.vbrScale=-1;0!=(f&8)&&(b.vbrScale=c(a,d),d+=4);b.headersize=72E3*(e+1)*p/b.samprate;d+=21;e=a[d+0]<<4;e+=a[d+1]>>4;p=(a[d+1]&15)<<8;p+=a[d+2]&255;if(0>e||3E3<e)e=-1;if(0>p||3E3<p)p=-1;b.encDelay=
e;b.encPadding=p;return b};this.InitVbrTag=function(b){var e=b.internal_flags;var d=1==b.version?128:16E3>b.out_samplerate?32:64;b.VBR==G.vbr_off&&(d=b.brate);d=72E3*(b.version+1)*d/b.out_samplerate;var c=e.sideinfo_len+m;e.VBR_seek_table.TotalFrameSize=d;if(d<c||d>a)b.bWriteVbrTag=!1;else for(e.VBR_seek_table.nVbrNumFrames=0,e.VBR_seek_table.nBytesWritten=0,e.VBR_seek_table.sum=0,e.VBR_seek_table.seen=0,e.VBR_seek_table.want=1,e.VBR_seek_table.pos=0,null==e.VBR_seek_table.bag&&(e.VBR_seek_table.bag=
new int[400],e.VBR_seek_table.size=400),d=new Int8Array(a),E(b,d),e=e.VBR_seek_table.TotalFrameSize,c=0;c<e;++c)f.add_dummy_byte(b,d[c]&255,1)};this.updateMusicCRC=function(a,b,d,c){for(var e=0;e<c;++e)a[0]=B(b[d+e],a[0])};this.getLameTagFrame=function(a,c){var d=a.internal_flags;if(!a.bWriteVbrTag||d.Class_ID!=W.LAME_ID||0>=d.VBR_seek_table.pos)return 0;if(c.length<d.VBR_seek_table.TotalFrameSize)return d.VBR_seek_table.TotalFrameSize;na.fill(c,0,d.VBR_seek_table.TotalFrameSize,0);E(a,c);var e=new Int8Array(v);
if(a.free_format)for(var l=1;l<v;++l)e[l]=255&255*l/100;else{var m=d.VBR_seek_table;if(!(0>=m.pos))for(l=1;l<v;++l){var p=0|Math.floor(l/v*m.pos);p>m.pos-1&&(p=m.pos-1);p=0|256*m.bag[p]/m.sum;255<p&&(p=255);e[l]=255&p}}p=d.sideinfo_len;a.error_protection&&(p-=2);c[p++]=0;c[p++]=0;c[p++]=0;c[p++]=0;k(c,p,15);p+=4;k(c,p,d.VBR_seek_table.nVbrNumFrames);p+=4;m=d.VBR_seek_table.nBytesWritten+d.VBR_seek_table.TotalFrameSize;k(c,p,0|m);p+=4;T.arraycopy(e,0,c,p,e.length);p+=e.length;a.error_protection&&f.CRC_writeheader(d,
c);var r=0;for(l=0;l<p;l++)r=B(c[l],r);e=p;l=r;var t=a.internal_flags;p=0;r=a.encoder_delay;var u=a.encoder_padding,h=100-10*a.VBR_q-a.quality,x=b.getLameVeryShortVersion();var y=[1,5,3,2,4,0,3];var A=0|(255<a.lowpassfreq/100+.5?255:a.lowpassfreq/100+.5),z=0,w=0,O=a.internal_flags.noise_shaping,F=0,C,I=0!=(a.exp_nspsytune&1);var Q=0!=(a.exp_nspsytune&2);var S=C=!1,ma=a.internal_flags.nogap_total,Z=a.internal_flags.nogap_current,L=a.ATHtype;switch(a.VBR){case vbr_abr:var V=a.VBR_mean_bitrate_kbps;
break;case vbr_off:V=a.brate;break;default:V=a.VBR_min_bitrate_kbps}y=0+(a.VBR.ordinal()<y.length?y[a.VBR.ordinal()]:0);t.findReplayGain&&(510<t.RadioGain&&(t.RadioGain=510),-510>t.RadioGain&&(t.RadioGain=-510),w=11264,w=0<=t.RadioGain?w|t.RadioGain:w|512|-t.RadioGain);t.findPeakSample&&(z=Math.abs(0|t.PeakSample/32767*Math.pow(2,23)+.5));-1!=ma&&(0<Z&&(S=!0),Z<ma-1&&(C=!0));I=L+((I?1:0)<<4)+((Q?1:0)<<5)+((C?1:0)<<6)+((S?1:0)<<7);0>h&&(h=0);switch(a.mode){case MONO:Q=0;break;case STEREO:Q=1;break;
case DUAL_CHANNEL:Q=2;break;case JOINT_STEREO:Q=a.force_ms?4:3;break;default:Q=7}C=32E3>=a.in_samplerate?0:48E3==a.in_samplerate?2:48E3<a.in_samplerate?3:1;if(a.short_blocks==ra.short_block_forced||a.short_blocks==ra.short_block_dispensed||-1==a.lowpassfreq&&-1==a.highpassfreq||a.scale_left<a.scale_right||a.scale_left>a.scale_right||a.disable_reservoir&&320>a.brate||a.noATH||a.ATHonly||0==L||32E3>=a.in_samplerate)F=1;O=O+(Q<<2)+(F<<5)+(C<<6);t=t.nMusicCRC;k(c,e+p,h);p+=4;for(h=0;9>h;h++)c[e+p+h]=
255&x.charAt(h);p+=9;c[e+p]=255&y;p++;c[e+p]=255&A;p++;k(c,e+p,z);p+=4;n(c,e+p,w);p+=2;n(c,e+p,0);p+=2;c[e+p]=255&I;p++;c[e+p]=255<=V?255:255&V;p++;c[e+p]=255&r>>4;c[e+p+1]=255&(r<<4)+(u>>8);c[e+p+2]=255&u;p+=3;c[e+p]=255&O;p++;c[e+p++]=0;n(c,e+p,a.preset);p+=2;k(c,e+p,m);p+=4;n(c,e+p,t);p+=2;for(a=0;a<p;a++)l=B(c[e+a],l);n(c,e+p,l);return d.VBR_seek_table.TotalFrameSize};this.putVbrTag=function(b,c){if(0>=b.internal_flags.VBR_seek_table.pos)return-1;c.seek(c.length());if(0==c.length())return-1;c.seek(0);
var d=new Int8Array(10);c.readFully(d);d=(new String(d,"ISO-8859-1")).startsWith("ID3")?0:((d[6]&127)<<21|(d[7]&127)<<14|(d[8]&127)<<7|d[9]&127)+d.length;c.seek(d);d=new Int8Array(a);b=getLameTagFrame(b,d);if(b>d.length)return-1;if(1>b)return 0;c.write(d,0,b);return 0}}function U(c,k,n,w){this.xlen=c;this.linmax=k;this.table=n;this.hlen=w}function xa(c){this.bits=c}function yc(){this.setModules=function(c,k){}}function sb(){this.bits=this.over_SSD=this.over_count=this.max_noise=this.tot_noise=this.over_noise=
0}function zc(){this.scale_right=this.scale_left=this.scale=this.out_samplerate=this.in_samplerate=this.num_channels=this.num_samples=this.class_id=0;this.decode_only=this.bWriteVbrTag=this.analysis=!1;this.quality=0;this.mode=la.STEREO;this.write_id3tag_automatic=this.decode_on_the_fly=this.findReplayGain=this.free_format=this.force_ms=!1;this.error_protection=this.emphasis=this.extension=this.original=this.copyright=this.compression_ratio=this.brate=0;this.disable_reservoir=this.strict_ISO=!1;this.quant_comp_short=
this.quant_comp=0;this.experimentalY=!1;this.preset=this.exp_nspsytune=this.experimentalZ=0;this.VBR=null;this.maskingadjust_short=this.maskingadjust=this.highpasswidth=this.lowpasswidth=this.highpassfreq=this.lowpassfreq=this.VBR_hard_min=this.VBR_max_bitrate_kbps=this.VBR_min_bitrate_kbps=this.VBR_mean_bitrate_kbps=this.VBR_q=this.VBR_q_frac=0;this.noATH=this.ATHshort=this.ATHonly=!1;this.athaa_sensitivity=this.athaa_loudapprox=this.athaa_type=this.ATHlower=this.ATHcurve=this.ATHtype=0;this.short_blocks=
null;this.useTemporal=!1;this.msfix=this.interChRatio=0;this.tune=!1;this.lame_allocated_gfp=this.frameNum=this.framesize=this.encoder_padding=this.encoder_delay=this.version=this.tune_value_a=0;this.internal_flags=null}function Ac(){this.linprebuf=K(2*Y.MAX_ORDER);this.linpre=0;this.lstepbuf=K(Y.MAX_SAMPLES_PER_WINDOW+Y.MAX_ORDER);this.lstep=0;this.loutbuf=K(Y.MAX_SAMPLES_PER_WINDOW+Y.MAX_ORDER);this.lout=0;this.rinprebuf=K(2*Y.MAX_ORDER);this.rinpre=0;this.rstepbuf=K(Y.MAX_SAMPLES_PER_WINDOW+Y.MAX_ORDER);
this.rstep=0;this.routbuf=K(Y.MAX_SAMPLES_PER_WINDOW+Y.MAX_ORDER);this.first=this.freqindex=this.rsum=this.lsum=this.totsamp=this.sampleWindow=this.rout=0;this.A=X(0|Y.STEPS_per_dB*Y.MAX_dB);this.B=X(0|Y.STEPS_per_dB*Y.MAX_dB)}function Bc(u){this.quantize=u;this.iteration_loop=function(k,n,u,w){var B=k.internal_flags,E=K(sa.SFBMAX),f=K(576),b=X(2),v=B.l3_side;var a=new xa(0);this.quantize.rv.ResvFrameBegin(k,a);a=a.bits;for(var m=0;m<B.mode_gr;m++){var z=this.quantize.qupvt.on_pe(k,n,b,a,m,m);B.mode_ext==
c.MPG_MD_MS_LR&&(this.quantize.ms_convert(B.l3_side,m),this.quantize.qupvt.reduce_side(b,u[m],a,z));for(z=0;z<B.channels_out;z++){var e=v.tt[m][z];if(e.block_type!=c.SHORT_TYPE){var l=0;l=B.PSY.mask_adjust-l}else l=0,l=B.PSY.mask_adjust_short-l;B.masking_lower=Math.pow(10,.1*l);this.quantize.init_outer_loop(B,e);this.quantize.init_xrpow(B,e,f)&&(this.quantize.qupvt.calc_xmin(k,w[m][z],e,E),this.quantize.outer_loop(k,e,E,f,z,b[z]));this.quantize.iteration_finish_one(B,m,z)}}this.quantize.rv.ResvFrameEnd(B,
a)}}function Cc(){this.floor=this.decay=this.adjustLimit=this.adjust=this.aaSensitivityP=this.useAdjust=0;this.l=K(c.SBMAX_l);this.s=K(c.SBMAX_s);this.psfb21=K(c.PSFB21);this.psfb12=K(c.PSFB12);this.cb_l=K(c.CBANDS);this.cb_s=K(c.CBANDS);this.eql_w=K(c.BLKSIZE/2)}function za(u,k,n,w){this.l=X(1+c.SBMAX_l);this.s=X(1+c.SBMAX_s);this.psfb21=X(1+c.PSFB21);this.psfb12=X(1+c.PSFB12);var E=this.l,B=this.s;4==arguments.length&&(this.arrL=arguments[0],this.arrS=arguments[1],this.arr21=arguments[2],this.arr12=
arguments[3],T.arraycopy(this.arrL,0,E,0,Math.min(this.arrL.length,this.l.length)),T.arraycopy(this.arrS,0,B,0,Math.min(this.arrS.length,this.s.length)),T.arraycopy(this.arr21,0,this.psfb21,0,Math.min(this.arr21.length,this.psfb21.length)),T.arraycopy(this.arr12,0,this.psfb12,0,Math.min(this.arr12.length,this.psfb12.length)))}function ia(){function u(a,b){b=E.ATHformula(b,a);return b=Math.pow(10,(b-100)/10+a.ATHlower)}function k(a){this.s=a}var n=null,w=null,E=null;this.setModules=function(a,b,d){n=
a;w=b;E=d};this.IPOW20=function(b){return a[b]};var B=ia.IXMAX_VAL+2,ha=ia.Q_MAX,f=ia.Q_MAX2;this.nr_of_sfb_block=[[[6,5,5,5],[9,9,9,9],[6,9,9,9]],[[6,5,7,3],[9,9,12,6],[6,9,12,6]],[[11,10,0,0],[18,18,0,0],[15,18,0,0]],[[7,7,7,0],[12,12,12,0],[6,15,12,0]],[[6,6,6,3],[12,9,9,6],[6,12,9,6]],[[8,8,5,0],[15,12,9,0],[6,18,9,0]]];var b=[0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,2,2,3,3,3,2,0];this.pretab=b;this.sfBandIndex=[new za([0,6,12,18,24,30,36,44,54,66,80,96,116,140,168,200,238,284,336,396,464,522,576],[0,4,
8,12,18,24,32,42,56,74,100,132,174,192],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0]),new za([0,6,12,18,24,30,36,44,54,66,80,96,114,136,162,194,232,278,332,394,464,540,576],[0,4,8,12,18,26,36,48,62,80,104,136,180,192],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0]),new za([0,6,12,18,24,30,36,44,54,66,80,96,116,140,168,200,238,284,336,396,464,522,576],[0,4,8,12,18,26,36,48,62,80,104,134,174,192],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0]),new za([0,4,8,12,16,20,24,30,36,44,52,62,74,90,110,134,162,196,238,288,342,418,576],[0,4,8,12,16,22,
30,40,52,66,84,106,136,192],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0]),new za([0,4,8,12,16,20,24,30,36,42,50,60,72,88,106,128,156,190,230,276,330,384,576],[0,4,8,12,16,22,28,38,50,64,80,100,126,192],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0]),new za([0,4,8,12,16,20,24,30,36,44,54,66,82,102,126,156,194,240,296,364,448,550,576],[0,4,8,12,16,22,30,42,58,78,104,138,180,192],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0]),new za([0,6,12,18,24,30,36,44,54,66,80,96,116,140,168,200,238,284,336,396,464,522,576],[0,4,8,12,18,26,36,48,62,80,104,
134,174,192],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0]),new za([0,6,12,18,24,30,36,44,54,66,80,96,116,140,168,200,238,284,336,396,464,522,576],[0,4,8,12,18,26,36,48,62,80,104,134,174,192],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0]),new za([0,12,24,36,48,60,72,88,108,132,160,192,232,280,336,400,476,566,568,570,572,574,576],[0,8,16,24,36,52,72,96,124,160,162,164,166,192],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0])];var v=K(ha+f+1),a=K(ha),m=K(B),z=K(B);this.adj43=z;this.iteration_init=function(b){var e=b.internal_flags,d=e.l3_side;
if(0==e.iteration_init_init){e.iteration_init_init=1;d.main_data_begin=0;d=b.internal_flags.ATH.l;for(var g=b.internal_flags.ATH.psfb21,q=b.internal_flags.ATH.s,k=b.internal_flags.ATH.psfb12,p=b.internal_flags,r=b.out_samplerate,t=0;t<c.SBMAX_l;t++){var J=p.scalefac_band.l[t],h=p.scalefac_band.l[t+1];for(d[t]=Ma.MAX_VALUE;J<h;J++){var x=J*r/1152;x=u(b,x);d[t]=Math.min(d[t],x)}}for(t=0;t<c.PSFB21;t++)for(J=p.scalefac_band.psfb21[t],h=p.scalefac_band.psfb21[t+1],g[t]=Ma.MAX_VALUE;J<h;J++)x=J*r/1152,
x=u(b,x),g[t]=Math.min(g[t],x);for(t=0;t<c.SBMAX_s;t++){J=p.scalefac_band.s[t];h=p.scalefac_band.s[t+1];for(q[t]=Ma.MAX_VALUE;J<h;J++)x=J*r/384,x=u(b,x),q[t]=Math.min(q[t],x);q[t]*=p.scalefac_band.s[t+1]-p.scalefac_band.s[t]}for(t=0;t<c.PSFB12;t++){J=p.scalefac_band.psfb12[t];h=p.scalefac_band.psfb12[t+1];for(k[t]=Ma.MAX_VALUE;J<h;J++)x=J*r/384,x=u(b,x),k[t]=Math.min(k[t],x);k[t]*=p.scalefac_band.s[13]-p.scalefac_band.s[12]}if(b.noATH){for(t=0;t<c.SBMAX_l;t++)d[t]=1E-20;for(t=0;t<c.PSFB21;t++)g[t]=
1E-20;for(t=0;t<c.SBMAX_s;t++)q[t]=1E-20;for(t=0;t<c.PSFB12;t++)k[t]=1E-20}p.ATH.floor=10*Math.log10(u(b,-1));m[0]=0;for(d=1;d<B;d++)m[d]=Math.pow(d,4/3);for(d=0;d<B-1;d++)z[d]=d+1-Math.pow(.5*(m[d]+m[d+1]),.75);z[d]=.5;for(d=0;d<ha;d++)a[d]=Math.pow(2,-.1875*(d-210));for(d=0;d<=ha+f;d++)v[d]=Math.pow(2,.25*(d-210-f));n.huffman_init(e);d=b.exp_nspsytune>>2&63;32<=d&&(d-=64);g=Math.pow(10,d/4/10);d=b.exp_nspsytune>>8&63;32<=d&&(d-=64);q=Math.pow(10,d/4/10);d=b.exp_nspsytune>>14&63;32<=d&&(d-=64);k=
Math.pow(10,d/4/10);d=b.exp_nspsytune>>20&63;32<=d&&(d-=64);b=k*Math.pow(10,d/4/10);for(d=0;d<c.SBMAX_l;d++)p=6>=d?g:13>=d?q:20>=d?k:b,e.nsPsy.longfact[d]=p;for(d=0;d<c.SBMAX_s;d++)p=5>=d?g:10>=d?q:11>=d?k:b,e.nsPsy.shortfact[d]=p}};this.on_pe=function(a,b,d,c,f,m){var e=a.internal_flags,g=0,l=X(2),q;g=new xa(g);a=w.ResvMaxBits(a,c,g,m);g=g.bits;var h=g+a;h>da.MAX_BITS_PER_GRANULE&&(h=da.MAX_BITS_PER_GRANULE);for(q=m=0;q<e.channels_out;++q)d[q]=Math.min(da.MAX_BITS_PER_CHANNEL,g/e.channels_out),l[q]=
0|d[q]*b[f][q]/700-d[q],l[q]>3*c/4&&(l[q]=3*c/4),0>l[q]&&(l[q]=0),l[q]+d[q]>da.MAX_BITS_PER_CHANNEL&&(l[q]=Math.max(0,da.MAX_BITS_PER_CHANNEL-d[q])),m+=l[q];if(m>a)for(q=0;q<e.channels_out;++q)l[q]=a*l[q]/m;for(q=0;q<e.channels_out;++q)d[q]+=l[q],a-=l[q];for(q=m=0;q<e.channels_out;++q)m+=d[q];if(m>da.MAX_BITS_PER_GRANULE)for(q=0;q<e.channels_out;++q)d[q]*=da.MAX_BITS_PER_GRANULE,d[q]/=m;return h};this.reduce_side=function(a,b,d,c){b=.33*(.5-b)/.5;0>b&&(b=0);.5<b&&(b=.5);b=0|.5*b*(a[0]+a[1]);b>da.MAX_BITS_PER_CHANNEL-
a[0]&&(b=da.MAX_BITS_PER_CHANNEL-a[0]);0>b&&(b=0);125<=a[1]&&(125<a[1]-b?(a[0]<d&&(a[0]+=b),a[1]-=b):(a[0]+=a[1]-125,a[1]=125));b=a[0]+a[1];b>c&&(a[0]=c*a[0]/b,a[1]=c*a[1]/b)};this.athAdjust=function(a,b,d){b=aa.FAST_LOG10_X(b,10);a*=a;var c=0;b-=d;1E-20<a&&(c=1+aa.FAST_LOG10_X(a,10/90.30873362));0>c&&(c=0);return Math.pow(10,.1*(b*c+(d+90.30873362-94.82444863)))};this.calc_xmin=function(a,b,d,f){var e=0,g=a.internal_flags,m,l=0,k=0,v=g.ATH,h=d.xr,x=a.VBR==G.vbr_mtrh?1:0,y=g.masking_lower;if(a.VBR==
G.vbr_mtrh||a.VBR==G.vbr_mt)y=1;for(m=0;m<d.psy_lmax;m++){var A=a.VBR==G.vbr_rh||a.VBR==G.vbr_mtrh?athAdjust(v.adjust,v.l[m],v.floor):v.adjust*v.l[m];var n=d.width[m];var u=A/n;var B=2.220446049250313E-16;var z=n>>1;var C=0;do{var I=h[l]*h[l];C+=I;B+=I<u?I:u;l++;I=h[l]*h[l];C+=I;B+=I<u?I:u;l++}while(0<--z);C>A&&k++;m==c.SBPSY_l&&(u=A*g.nsPsy.longfact[m],B<u&&(B=u));0!=x&&(A=B);a.ATHonly||(B=b.en.l[m],0<B&&(u=C*b.thm.l[m]*y/B,0!=x&&(u*=g.nsPsy.longfact[m]),A<u&&(A=u)));0!=x?f[e++]=A:f[e++]=A*g.nsPsy.longfact[m]}C=
575;if(d.block_type!=c.SHORT_TYPE)for(A=576;0!=A--&&qa.EQ(h[A],0);)C=A;d.max_nonzero_coeff=C;for(var Q=d.sfb_smin;m<d.psymax;Q++,m+=3){var S;var w=a.VBR==G.vbr_rh||a.VBR==G.vbr_mtrh?athAdjust(v.adjust,v.s[Q],v.floor):v.adjust*v.s[Q];n=d.width[m];for(S=0;3>S;S++){C=0;z=n>>1;u=w/n;B=2.220446049250313E-16;do I=h[l]*h[l],C+=I,B+=I<u?I:u,l++,I=h[l]*h[l],C+=I,B+=I<u?I:u,l++;while(0<--z);C>w&&k++;Q==c.SBPSY_s&&(u=w*g.nsPsy.shortfact[Q],B<u&&(B=u));A=0!=x?B:w;a.ATHonly||a.ATHshort||(B=b.en.s[Q][S],0<B&&(u=
C*b.thm.s[Q][S]*y/B,0!=x&&(u*=g.nsPsy.shortfact[Q]),A<u&&(A=u)));0!=x?f[e++]=A:f[e++]=A*g.nsPsy.shortfact[Q]}a.useTemporal&&(f[e-3]>f[e-3+1]&&(f[e-3+1]+=(f[e-3]-f[e-3+1])*g.decay),f[e-3+1]>f[e-3+2]&&(f[e-3+2]+=(f[e-3+1]-f[e-3+2])*g.decay))}return k};this.calc_noise_core=function(a,b,d,c){var e=0,f=b.s,g=a.l3_enc;if(f>a.count1)for(;0!=d--;){var l=a.xr[f];f++;e+=l*l;l=a.xr[f];f++;e+=l*l}else if(f>a.big_values){var k=K(2);k[0]=0;for(k[1]=c;0!=d--;)l=Math.abs(a.xr[f])-k[g[f]],f++,e+=l*l,l=Math.abs(a.xr[f])-
k[g[f]],f++,e+=l*l}else for(;0!=d--;)l=Math.abs(a.xr[f])-m[g[f]]*c,f++,e+=l*l,l=Math.abs(a.xr[f])-m[g[f]]*c,f++,e+=l*l;b.s=f;return e};this.calc_noise=function(a,c,d,f,m){var e=0,g=0,l,q=0,u=0,h=0,x=-20,y=0,A=a.scalefac,n=0;for(l=f.over_SSD=0;l<a.psymax;l++){var B=a.global_gain-(A[n++]+(0!=a.preflag?b[l]:0)<<a.scalefac_scale+1)-8*a.subblock_gain[a.window[l]];if(null!=m&&m.step[l]==B){var z=m.noise[l];y+=a.width[l];d[e++]=z/c[g++];z=m.noise_log[l]}else{z=v[B+ia.Q_MAX2];var w=a.width[l]>>1;y+a.width[l]>
a.max_nonzero_coeff&&(w=a.max_nonzero_coeff-y+1,w=0<w?w>>1:0);y=new k(y);z=this.calc_noise_core(a,y,w,z);y=y.s;null!=m&&(m.step[l]=B,m.noise[l]=z);z=d[e++]=z/c[g++];z=aa.FAST_LOG10(Math.max(z,1E-20));null!=m&&(m.noise_log[l]=z)}null!=m&&(m.global_gain=a.global_gain);h+=z;0<z&&(B=Math.max(0|10*z+.5,1),f.over_SSD+=B*B,q++,u+=z);x=Math.max(x,z)}f.over_count=q;f.tot_noise=h;f.over_noise=u;f.max_noise=x;return q};this.set_pinfo=function(a,f,d,g,m){var e=a.internal_flags,l,k,q=0==f.scalefac_scale?.5:1,
v=f.scalefac,h=K(sa.SFBMAX),x=K(sa.SFBMAX),y=new sb;calc_xmin(a,d,f,h);calc_noise(f,h,x,y,null);var u=0;var n=f.sfb_lmax;f.block_type!=c.SHORT_TYPE&&0==f.mixed_block_flag&&(n=22);for(l=0;l<n;l++){var B=e.scalefac_band.l[l],z=e.scalefac_band.l[l+1],w=z-B;for(k=0;u<z;u++)k+=f.xr[u]*f.xr[u];k/=w;var C=1E15;e.pinfo.en[g][m][l]=C*k;e.pinfo.xfsf[g][m][l]=C*h[l]*x[l]/w;k=0<d.en.l[l]&&!a.ATHonly?k/d.en.l[l]:0;e.pinfo.thr[g][m][l]=C*Math.max(k*d.thm.l[l],e.ATH.l[l]);e.pinfo.LAMEsfb[g][m][l]=0;0!=f.preflag&&
11<=l&&(e.pinfo.LAMEsfb[g][m][l]=-q*b[l]);l<c.SBPSY_l&&(e.pinfo.LAMEsfb[g][m][l]-=q*v[l])}if(f.block_type==c.SHORT_TYPE)for(n=l,l=f.sfb_smin;l<c.SBMAX_s;l++){B=e.scalefac_band.s[l];z=e.scalefac_band.s[l+1];w=z-B;for(var I=0;3>I;I++){k=0;for(C=B;C<z;C++)k+=f.xr[u]*f.xr[u],u++;k=Math.max(k/w,1E-20);C=1E15;e.pinfo.en_s[g][m][3*l+I]=C*k;e.pinfo.xfsf_s[g][m][3*l+I]=C*h[n]*x[n]/w;k=0<d.en.s[l][I]?k/d.en.s[l][I]:0;if(a.ATHonly||a.ATHshort)k=0;e.pinfo.thr_s[g][m][3*l+I]=C*Math.max(k*d.thm.s[l][I],e.ATH.s[l]);
e.pinfo.LAMEsfb_s[g][m][3*l+I]=-2*f.subblock_gain[I];l<c.SBPSY_s&&(e.pinfo.LAMEsfb_s[g][m][3*l+I]-=q*v[n]);n++}}e.pinfo.LAMEqss[g][m]=f.global_gain;e.pinfo.LAMEmainbits[g][m]=f.part2_3_length+f.part2_length;e.pinfo.LAMEsfbits[g][m]=f.part2_length;e.pinfo.over[g][m]=y.over_count;e.pinfo.max_noise[g][m]=10*y.max_noise;e.pinfo.over_noise[g][m]=10*y.over_noise;e.pinfo.tot_noise[g][m]=10*y.tot_noise;e.pinfo.over_SSD[g][m]=y.over_SSD}}function Dc(){this.sfb_count1=this.global_gain=0;this.step=X(39);this.noise=
K(39);this.noise_log=K(39)}function rb(){this.xr=K(576);this.l3_enc=X(576);this.scalefac=X(sa.SFBMAX);this.mixed_block_flag=this.block_type=this.scalefac_compress=this.global_gain=this.count1=this.big_values=this.part2_3_length=this.xrpow_max=0;this.table_select=X(3);this.subblock_gain=X(4);this.sfbdivide=this.psymax=this.sfbmax=this.psy_lmax=this.sfb_smin=this.sfb_lmax=this.part2_length=this.count1table_select=this.scalefac_scale=this.preflag=this.region1_count=this.region0_count=0;this.width=X(sa.SFBMAX);
this.window=X(sa.SFBMAX);this.count1bits=0;this.sfb_partition_table=null;this.slen=X(4);this.max_nonzero_coeff=0;var c=this;this.assign=function(k){c.xr=new Float32Array(k.xr);c.l3_enc=new Int32Array(k.l3_enc);c.scalefac=new Int32Array(k.scalefac);c.xrpow_max=k.xrpow_max;c.part2_3_length=k.part2_3_length;c.big_values=k.big_values;c.count1=k.count1;c.global_gain=k.global_gain;c.scalefac_compress=k.scalefac_compress;c.block_type=k.block_type;c.mixed_block_flag=k.mixed_block_flag;c.table_select=new Int32Array(k.table_select);
c.subblock_gain=new Int32Array(k.subblock_gain);c.region0_count=k.region0_count;c.region1_count=k.region1_count;c.preflag=k.preflag;c.scalefac_scale=k.scalefac_scale;c.count1table_select=k.count1table_select;c.part2_length=k.part2_length;c.sfb_lmax=k.sfb_lmax;c.sfb_smin=k.sfb_smin;c.psy_lmax=k.psy_lmax;c.sfbmax=k.sfbmax;c.psymax=k.psymax;c.sfbdivide=k.sfbdivide;c.width=new Int32Array(k.width);c.window=new Int32Array(k.window);c.count1bits=k.count1bits;c.sfb_partition_table=k.sfb_partition_table.slice(0);
c.slen=new Int32Array(k.slen);c.max_nonzero_coeff=k.max_nonzero_coeff}}function Ec(){function u(c){this.ordinal=c}function k(c){for(var b=0;b<c.sfbmax;b++)if(0==c.scalefac[b]+c.subblock_gain[c.window[b]])return!1;return!0}var n;this.rv=null;var w;this.qupvt=null;var E,B=new yc,ha;this.setModules=function(c,b,k,a){n=c;this.rv=w=b;this.qupvt=E=k;ha=a;B.setModules(E,ha)};this.ms_convert=function(c,b){for(var f=0;576>f;++f){var a=c.tt[b][0].xr[f],m=c.tt[b][1].xr[f];c.tt[b][0].xr[f]=.5*(a+m)*aa.SQRT2;
c.tt[b][1].xr[f]=.5*(a-m)*aa.SQRT2}};this.init_xrpow=function(c,b,k){var a=0|b.max_nonzero_coeff;b.xrpow_max=0;na.fill(k,a,576,0);for(var f,v=f=0;v<=a;++v){var e=Math.abs(b.xr[v]);f+=e;k[v]=Math.sqrt(e*Math.sqrt(e));k[v]>b.xrpow_max&&(b.xrpow_max=k[v])}if(1E-20<f){k=0;0!=(c.substep_shaping&2)&&(k=1);for(a=0;a<b.psymax;a++)c.pseudohalf[a]=k;return!0}na.fill(b.l3_enc,0,576,0);return!1};this.init_outer_loop=function(f,b){b.part2_3_length=0;b.big_values=0;b.count1=0;b.global_gain=210;b.scalefac_compress=
0;b.table_select[0]=0;b.table_select[1]=0;b.table_select[2]=0;b.subblock_gain[0]=0;b.subblock_gain[1]=0;b.subblock_gain[2]=0;b.subblock_gain[3]=0;b.region0_count=0;b.region1_count=0;b.preflag=0;b.scalefac_scale=0;b.count1table_select=0;b.part2_length=0;b.sfb_lmax=c.SBPSY_l;b.sfb_smin=c.SBPSY_s;b.psy_lmax=f.sfb21_extra?c.SBMAX_l:c.SBPSY_l;b.psymax=b.psy_lmax;b.sfbmax=b.sfb_lmax;b.sfbdivide=11;for(var k=0;k<c.SBMAX_l;k++)b.width[k]=f.scalefac_band.l[k+1]-f.scalefac_band.l[k],b.window[k]=3;if(b.block_type==
c.SHORT_TYPE){var a=K(576);b.sfb_smin=0;b.sfb_lmax=0;0!=b.mixed_block_flag&&(b.sfb_smin=3,b.sfb_lmax=2*f.mode_gr+4);b.psymax=b.sfb_lmax+3*((f.sfb21_extra?c.SBMAX_s:c.SBPSY_s)-b.sfb_smin);b.sfbmax=b.sfb_lmax+3*(c.SBPSY_s-b.sfb_smin);b.sfbdivide=b.sfbmax-18;b.psy_lmax=b.sfb_lmax;var m=f.scalefac_band.l[b.sfb_lmax];T.arraycopy(b.xr,0,a,0,576);for(k=b.sfb_smin;k<c.SBMAX_s;k++)for(var n=f.scalefac_band.s[k],e=f.scalefac_band.s[k+1],l=0;3>l;l++)for(var d=n;d<e;d++)b.xr[m++]=a[3*d+l];a=b.sfb_lmax;for(k=
b.sfb_smin;k<c.SBMAX_s;k++)b.width[a]=b.width[a+1]=b.width[a+2]=f.scalefac_band.s[k+1]-f.scalefac_band.s[k],b.window[a]=0,b.window[a+1]=1,b.window[a+2]=2,a+=3}b.count1bits=0;b.sfb_partition_table=E.nr_of_sfb_block[0][0];b.slen[0]=0;b.slen[1]=0;b.slen[2]=0;b.slen[3]=0;b.max_nonzero_coeff=575;na.fill(b.scalefac,0);k=f.ATH;a=b.xr;if(b.block_type!=c.SHORT_TYPE)for(b=!1,m=c.PSFB21-1;0<=m&&!b;m--)for(n=f.scalefac_band.psfb21[m],e=f.scalefac_band.psfb21[m+1],l=E.athAdjust(k.adjust,k.psfb21[m],k.floor),1E-12<
f.nsPsy.longfact[21]&&(l*=f.nsPsy.longfact[21]),--e;e>=n;e--)if(Math.abs(a[e])<l)a[e]=0;else{b=!0;break}else for(l=0;3>l;l++)for(b=!1,m=c.PSFB12-1;0<=m&&!b;m--)for(n=3*f.scalefac_band.s[12]+(f.scalefac_band.s[13]-f.scalefac_band.s[12])*l+(f.scalefac_band.psfb12[m]-f.scalefac_band.psfb12[0]),e=n+(f.scalefac_band.psfb12[m+1]-f.scalefac_band.psfb12[m]),d=E.athAdjust(k.adjust,k.psfb12[m],k.floor),1E-12<f.nsPsy.shortfact[12]&&(d*=f.nsPsy.shortfact[12]),--e;e>=n;e--)if(Math.abs(a[e])<d)a[e]=0;else{b=!0;
break}};u.BINSEARCH_NONE=new u(0);u.BINSEARCH_UP=new u(1);u.BINSEARCH_DOWN=new u(2);this.trancate_smallspectrums=function(f,b,k,a){var m=K(sa.SFBMAX);if((0!=(f.substep_shaping&4)||b.block_type!=c.SHORT_TYPE)&&0==(f.substep_shaping&128)){E.calc_noise(b,k,m,new sb,null);for(var n=0;576>n;n++){var e=0;0!=b.l3_enc[n]&&(e=Math.abs(b.xr[n]));a[n]=e}n=0;e=8;b.block_type==c.SHORT_TYPE&&(e=6);do{var l,d,g=b.width[e];n+=g;if(!(1<=m[e]||(na.sort(a,n-g,g),qa.EQ(a[n-1],0)))){var q=(1-m[e])*k[e];var v=l=0;do{for(d=
1;v+d<g&&!qa.NEQ(a[v+n-g],a[v+n+d-g]);d++);var p=a[v+n-g]*a[v+n-g]*d;if(q<p){0!=v&&(l=a[v+n-g-1]);break}q-=p;v+=d}while(v<g);if(!qa.EQ(l,0)){do Math.abs(b.xr[n-g])<=l&&(b.l3_enc[n-g]=0);while(0<--g)}}}while(++e<b.psymax);b.part2_3_length=ha.noquant_count_bits(f,b,null)}};this.outer_loop=function(f,b,n,a,m,B){var e=f.internal_flags,l=new rb,d=K(576),g=K(sa.SFBMAX),q=new sb,v=new Dc,p=9999999,r=!1,t=!1,w=0,h,x=e.CurrentStep[m],y=!1,A=e.OldValue[m];var z=u.BINSEARCH_NONE;b.global_gain=A;for(h=B-b.part2_length;;){var H=
ha.count_bits(e,a,b,null);if(1==x||H==h)break;H>h?(z==u.BINSEARCH_DOWN&&(y=!0),y&&(x/=2),z=u.BINSEARCH_UP,H=x):(z==u.BINSEARCH_UP&&(y=!0),y&&(x/=2),z=u.BINSEARCH_DOWN,H=-x);b.global_gain+=H;0>b.global_gain&&(b.global_gain=0,y=!0);255<b.global_gain&&(b.global_gain=255,y=!0)}for(;H>h&&255>b.global_gain;)b.global_gain++,H=ha.count_bits(e,a,b,null);e.CurrentStep[m]=4<=A-b.global_gain?4:2;e.OldValue[m]=b.global_gain;b.part2_3_length=H;if(0==e.noise_shaping)return 100;E.calc_noise(b,n,g,q,v);q.bits=b.part2_3_length;
l.assign(b);m=0;for(T.arraycopy(a,0,d,0,576);!r;){do{h=new sb;y=255;x=0!=(e.substep_shaping&2)?20:3;if(e.sfb21_extra){if(1<g[l.sfbmax])break;if(l.block_type==c.SHORT_TYPE&&(1<g[l.sfbmax+1]||1<g[l.sfbmax+2]))break}A=l;H=a;z=f.internal_flags;var O=A,F=g,C=H,I=f.internal_flags;var Q=0==O.scalefac_scale?1.2968395546510096:1.6817928305074292;for(var S=0,ma=0;ma<O.sfbmax;ma++)S<F[ma]&&(S=F[ma]);ma=I.noise_shaping_amp;3==ma&&(ma=t?2:1);switch(ma){case 2:break;case 1:S=1<S?Math.pow(S,.5):.95*S;break;default:S=
1<S?1:.95*S}var Z=0;for(ma=0;ma<O.sfbmax;ma++){var L=O.width[ma];Z+=L;if(!(F[ma]<S)){if(0!=(I.substep_shaping&2)&&(I.pseudohalf[ma]=0==I.pseudohalf[ma]?1:0,0==I.pseudohalf[ma]&&2==I.noise_shaping_amp))break;O.scalefac[ma]++;for(L=-L;0>L;L++)C[Z+L]*=Q,C[Z+L]>O.xrpow_max&&(O.xrpow_max=C[Z+L]);if(2==I.noise_shaping_amp)break}}if(Q=k(A))A=!1;else if(Q=2==z.mode_gr?ha.scale_bitcount(A):ha.scale_bitcount_lsf(z,A)){if(1<z.noise_shaping)if(na.fill(z.pseudohalf,0),0==A.scalefac_scale){Q=A;for(F=O=0;F<Q.sfbmax;F++){I=
Q.width[F];C=Q.scalefac[F];0!=Q.preflag&&(C+=E.pretab[F]);O+=I;if(0!=(C&1))for(C++,I=-I;0>I;I++)H[O+I]*=1.2968395546510096,H[O+I]>Q.xrpow_max&&(Q.xrpow_max=H[O+I]);Q.scalefac[F]=C>>1}Q.preflag=0;Q.scalefac_scale=1;Q=!1}else if(A.block_type==c.SHORT_TYPE&&0<z.subblock_gain){b:{Q=z;O=A;F=H;C=O.scalefac;for(H=0;H<O.sfb_lmax;H++)if(16<=C[H]){H=!0;break b}for(I=0;3>I;I++){ma=S=0;for(H=O.sfb_lmax+I;H<O.sfbdivide;H+=3)S<C[H]&&(S=C[H]);for(;H<O.sfbmax;H+=3)ma<C[H]&&(ma=C[H]);if(!(16>S&&8>ma)){if(7<=O.subblock_gain[I]){H=
!0;break b}O.subblock_gain[I]++;S=Q.scalefac_band.l[O.sfb_lmax];for(H=O.sfb_lmax+I;H<O.sfbmax;H+=3)if(ma=O.width[H],Z=C[H],Z-=4>>O.scalefac_scale,0<=Z)C[H]=Z,S+=3*ma;else{C[H]=0;Z=E.IPOW20(210+(Z<<O.scalefac_scale+1));S+=ma*(I+1);for(L=-ma;0>L;L++)F[S+L]*=Z,F[S+L]>O.xrpow_max&&(O.xrpow_max=F[S+L]);S+=ma*(3-I-1)}Z=E.IPOW20(202);S+=O.width[H]*(I+1);for(L=-O.width[H];0>L;L++)F[S+L]*=Z,F[S+L]>O.xrpow_max&&(O.xrpow_max=F[S+L])}}H=!1}Q=H||k(A)}Q||(Q=2==z.mode_gr?ha.scale_bitcount(A):ha.scale_bitcount_lsf(z,
A));A=!Q}else A=!0;if(!A)break;0!=l.scalefac_scale&&(y=254);A=B-l.part2_length;if(0>=A)break;for(;(l.part2_3_length=ha.count_bits(e,a,l,v))>A&&l.global_gain<=y;)l.global_gain++;if(l.global_gain>y)break;if(0==q.over_count){for(;(l.part2_3_length=ha.count_bits(e,a,l,v))>p&&l.global_gain<=y;)l.global_gain++;if(l.global_gain>y)break}E.calc_noise(l,n,g,h,v);h.bits=l.part2_3_length;z=b.block_type!=c.SHORT_TYPE?f.quant_comp:f.quant_comp_short;y=q;A=h;Q=l;H=g;switch(z){default:case 9:0<y.over_count?(z=A.over_SSD<=
y.over_SSD,A.over_SSD==y.over_SSD&&(z=A.bits<y.bits)):z=0>A.max_noise&&10*A.max_noise+A.bits<=10*y.max_noise+y.bits;break;case 0:z=A.over_count<y.over_count||A.over_count==y.over_count&&A.over_noise<y.over_noise||A.over_count==y.over_count&&qa.EQ(A.over_noise,y.over_noise)&&A.tot_noise<y.tot_noise;break;case 8:z=A;F=1E-37;for(O=0;O<Q.psymax;O++)C=H[O],C=aa.FAST_LOG10(.368+.632*C*C*C),F+=C;z.max_noise=Math.max(1E-20,F);case 1:z=A.max_noise<y.max_noise;break;case 2:z=A.tot_noise<y.tot_noise;break;case 3:z=
A.tot_noise<y.tot_noise&&A.max_noise<y.max_noise;break;case 4:z=0>=A.max_noise&&.2<y.max_noise||0>=A.max_noise&&0>y.max_noise&&y.max_noise>A.max_noise-.2&&A.tot_noise<y.tot_noise||0>=A.max_noise&&0<y.max_noise&&y.max_noise>A.max_noise-.2&&A.tot_noise<y.tot_noise+y.over_noise||0<A.max_noise&&-.05<y.max_noise&&y.max_noise>A.max_noise-.1&&A.tot_noise+A.over_noise<y.tot_noise+y.over_noise||0<A.max_noise&&-.1<y.max_noise&&y.max_noise>A.max_noise-.15&&A.tot_noise+A.over_noise+A.over_noise<y.tot_noise+y.over_noise+
y.over_noise;break;case 5:z=A.over_noise<y.over_noise||qa.EQ(A.over_noise,y.over_noise)&&A.tot_noise<y.tot_noise;break;case 6:z=A.over_noise<y.over_noise||qa.EQ(A.over_noise,y.over_noise)&&(A.max_noise<y.max_noise||qa.EQ(A.max_noise,y.max_noise)&&A.tot_noise<=y.tot_noise);break;case 7:z=A.over_count<y.over_count||A.over_noise<y.over_noise}0==y.over_count&&(z=z&&A.bits<y.bits);z=z?1:0;if(0!=z)p=b.part2_3_length,q=h,b.assign(l),m=0,T.arraycopy(a,0,d,0,576);else if(0==e.full_outer_loop){if(++m>x&&0==
q.over_count)break;if(3==e.noise_shaping_amp&&t&&30<m)break;if(3==e.noise_shaping_amp&&t&&15<l.global_gain-w)break}}while(255>l.global_gain+l.scalefac_scale);3==e.noise_shaping_amp?t?r=!0:(l.assign(b),T.arraycopy(d,0,a,0,576),m=0,w=l.global_gain,t=!0):r=!0}f.VBR==G.vbr_rh||f.VBR==G.vbr_mtrh?T.arraycopy(d,0,a,0,576):0!=(e.substep_shaping&1)&&trancate_smallspectrums(e,b,n,a);return q.over_count};this.iteration_finish_one=function(c,b,k){var a=c.l3_side,f=a.tt[b][k];ha.best_scalefac_store(c,b,k,a);1==
c.use_best_huffman&&ha.best_huffman_divide(c,f);w.ResvAdjust(c,f)};this.VBR_encode_granule=function(c,b,k,a,m,n,e){var f=c.internal_flags,d=new rb,g=K(576),q=e,v=(e+n)/2,p=0,r=f.sfb21_extra;na.fill(d.l3_enc,0);do{f.sfb21_extra=v>q-42?!1:r;var t=outer_loop(c,b,k,a,m,v);0>=t?(p=1,e=b.part2_3_length,d.assign(b),T.arraycopy(a,0,g,0,576),e-=32,t=e-n,v=(e+n)/2):(n=v+32,t=e-n,v=(e+n)/2,0!=p&&(p=2,b.assign(d),T.arraycopy(g,0,a,0,576)))}while(12<t);f.sfb21_extra=r;2==p&&T.arraycopy(d.l3_enc,0,b.l3_enc,0,576)};
this.get_framebits=function(c,b){var f=c.internal_flags;f.bitrate_index=f.VBR_min_bitrate;n.getframebits(c);f.bitrate_index=1;var a=n.getframebits(c);for(var m=1;m<=f.VBR_max_bitrate;m++)f.bitrate_index=m,a=new xa(a),b[m]=w.ResvFrameBegin(c,a),a=a.bits};this.VBR_old_prepare=function(f,b,k,a,m,n,e,l,d){var g=f.internal_flags,q=1,v=0;g.bitrate_index=g.VBR_max_bitrate;var p=w.ResvFrameBegin(f,new xa(0))/g.mode_gr;get_framebits(f,n);for(var r=0;r<g.mode_gr;r++){var t=E.on_pe(f,b,l[r],p,r,0);g.mode_ext==
c.MPG_MD_MS_LR&&(ms_convert(g.l3_side,r),E.reduce_side(l[r],k[r],p,t));for(t=0;t<g.channels_out;++t){var u=g.l3_side.tt[r][t];if(u.block_type!=c.SHORT_TYPE){var h=1.28/(1+Math.exp(3.5-b[r][t]/300))-.05;h=g.PSY.mask_adjust-h}else h=2.56/(1+Math.exp(3.5-b[r][t]/300))-.14,h=g.PSY.mask_adjust_short-h;g.masking_lower=Math.pow(10,.1*h);init_outer_loop(g,u);d[r][t]=E.calc_xmin(f,a[r][t],u,m[r][t]);0!=d[r][t]&&(q=0);e[r][t]=126;v+=l[r][t]}}for(r=0;r<g.mode_gr;r++)for(t=0;t<g.channels_out;t++)v>n[g.VBR_max_bitrate]&&
(l[r][t]*=n[g.VBR_max_bitrate],l[r][t]/=v),e[r][t]>l[r][t]&&(e[r][t]=l[r][t]);return q};this.bitpressure_strategy=function(f,b,k,a){for(var m=0;m<f.mode_gr;m++)for(var n=0;n<f.channels_out;n++){for(var e=f.l3_side.tt[m][n],l=b[m][n],d=0,g=0;g<e.psy_lmax;g++)l[d++]*=1+.029*g*g/c.SBMAX_l/c.SBMAX_l;if(e.block_type==c.SHORT_TYPE)for(g=e.sfb_smin;g<c.SBMAX_s;g++)l[d++]*=1+.029*g*g/c.SBMAX_s/c.SBMAX_s,l[d++]*=1+.029*g*g/c.SBMAX_s/c.SBMAX_s,l[d++]*=1+.029*g*g/c.SBMAX_s/c.SBMAX_s;a[m][n]=0|Math.max(k[m][n],
.9*a[m][n])}};this.VBR_new_prepare=function(f,b,k,a,m,n){var e=f.internal_flags,l=1,d=0,g=0;if(f.free_format){e.bitrate_index=0;d=new xa(d);var q=w.ResvFrameBegin(f,d);d=d.bits;m[0]=q}else e.bitrate_index=e.VBR_max_bitrate,d=new xa(d),w.ResvFrameBegin(f,d),d=d.bits,get_framebits(f,m),q=m[e.VBR_max_bitrate];for(m=0;m<e.mode_gr;m++){E.on_pe(f,b,n[m],d,m,0);e.mode_ext==c.MPG_MD_MS_LR&&ms_convert(e.l3_side,m);for(var v=0;v<e.channels_out;++v){var p=e.l3_side.tt[m][v];e.masking_lower=Math.pow(10,.1*e.PSY.mask_adjust);
init_outer_loop(e,p);0!=E.calc_xmin(f,k[m][v],p,a[m][v])&&(l=0);g+=n[m][v]}}for(m=0;m<e.mode_gr;m++)for(v=0;v<e.channels_out;v++)g>q&&(n[m][v]*=q,n[m][v]/=g);return l};this.calc_target_bits=function(f,b,k,a,m,u){var e=f.internal_flags,l=e.l3_side;e.bitrate_index=e.VBR_max_bitrate;var d=new xa(0);u[0]=w.ResvFrameBegin(f,d);e.bitrate_index=1;d=n.getframebits(f)-8*e.sideinfo_len;m[0]=d/(e.mode_gr*e.channels_out);d=f.VBR_mean_bitrate_kbps*f.framesize*1E3;0!=(e.substep_shaping&1)&&(d*=1.09);d/=f.out_samplerate;
d-=8*e.sideinfo_len;d/=e.mode_gr*e.channels_out;var g=.93+.07*(11-f.compression_ratio)/5.5;.9>g&&(g=.9);1<g&&(g=1);for(f=0;f<e.mode_gr;f++){var q=0;for(m=0;m<e.channels_out;m++){a[f][m]=int(g*d);if(700<b[f][m]){var v=int((b[f][m]-700)/1.4),p=l.tt[f][m];a[f][m]=int(g*d);p.block_type==c.SHORT_TYPE&&v<d/2&&(v=d/2);v>3*d/2?v=3*d/2:0>v&&(v=0);a[f][m]+=v}a[f][m]>da.MAX_BITS_PER_CHANNEL&&(a[f][m]=da.MAX_BITS_PER_CHANNEL);q+=a[f][m]}if(q>da.MAX_BITS_PER_GRANULE)for(m=0;m<e.channels_out;++m)a[f][m]*=da.MAX_BITS_PER_GRANULE,
a[f][m]/=q}if(e.mode_ext==c.MPG_MD_MS_LR)for(f=0;f<e.mode_gr;f++)E.reduce_side(a[f],k[f],d*e.channels_out,da.MAX_BITS_PER_GRANULE);for(f=b=0;f<e.mode_gr;f++)for(m=0;m<e.channels_out;m++)a[f][m]>da.MAX_BITS_PER_CHANNEL&&(a[f][m]=da.MAX_BITS_PER_CHANNEL),b+=a[f][m];if(b>u[0])for(f=0;f<e.mode_gr;f++)for(m=0;m<e.channels_out;m++)a[f][m]*=u[0],a[f][m]/=b}}function Fc(){function u(b,c,a){for(var f=10,n=c+238-14-286,e=-15;0>e;e++){var l=k[f+-10];var d=b[n+-224]*l;var g=b[c+224]*l;l=k[f+-9];d+=b[n+-160]*
l;g+=b[c+160]*l;l=k[f+-8];d+=b[n+-96]*l;g+=b[c+96]*l;l=k[f+-7];d+=b[n+-32]*l;g+=b[c+32]*l;l=k[f+-6];d+=b[n+32]*l;g+=b[c+-32]*l;l=k[f+-5];d+=b[n+96]*l;g+=b[c+-96]*l;l=k[f+-4];d+=b[n+160]*l;g+=b[c+-160]*l;l=k[f+-3];d+=b[n+224]*l;g+=b[c+-224]*l;l=k[f+-2];d+=b[c+-256]*l;g-=b[n+256]*l;l=k[f+-1];d+=b[c+-192]*l;g-=b[n+192]*l;l=k[f+0];d+=b[c+-128]*l;g-=b[n+128]*l;l=k[f+1];d+=b[c+-64]*l;g-=b[n+64]*l;l=k[f+2];d+=b[c+0]*l;g-=b[n+0]*l;l=k[f+3];d+=b[c+64]*l;g-=b[n+-64]*l;l=k[f+4];d+=b[c+128]*l;g-=b[n+-128]*l;
l=k[f+5];d+=b[c+192]*l;g-=b[n+-192]*l;d*=k[f+6];l=g-d;a[30+2*e]=g+d;a[31+2*e]=k[f+7]*l;f+=18;c--;n++}g=b[c+-16]*k[f+-10];d=b[c+-32]*k[f+-2];g+=(b[c+-48]-b[c+16])*k[f+-9];d+=b[c+-96]*k[f+-1];g+=(b[c+-80]+b[c+48])*k[f+-8];d+=b[c+-160]*k[f+0];g+=(b[c+-112]-b[c+80])*k[f+-7];d+=b[c+-224]*k[f+1];g+=(b[c+-144]+b[c+112])*k[f+-6];d-=b[c+32]*k[f+2];g+=(b[c+-176]-b[c+144])*k[f+-5];d-=b[c+96]*k[f+3];g+=(b[c+-208]+b[c+176])*k[f+-4];d-=b[c+160]*k[f+4];g+=(b[c+-240]-b[c+208])*k[f+-3];d-=b[c+224];b=d-g;c=d+g;g=a[14];
d=a[15]-g;a[31]=c+g;a[30]=b+d;a[15]=b-d;a[14]=c-g;d=a[28]-a[0];a[0]+=a[28];a[28]=d*k[f+-36+7];d=a[29]-a[1];a[1]+=a[29];a[29]=d*k[f+-36+7];d=a[26]-a[2];a[2]+=a[26];a[26]=d*k[f+-72+7];d=a[27]-a[3];a[3]+=a[27];a[27]=d*k[f+-72+7];d=a[24]-a[4];a[4]+=a[24];a[24]=d*k[f+-108+7];d=a[25]-a[5];a[5]+=a[25];a[25]=d*k[f+-108+7];d=a[22]-a[6];a[6]+=a[22];a[22]=d*aa.SQRT2;d=a[23]-a[7];a[7]+=a[23];a[23]=d*aa.SQRT2-a[7];a[7]-=a[6];a[22]-=a[7];a[23]-=a[22];d=a[6];a[6]=a[31]-d;a[31]+=d;d=a[7];a[7]=a[30]-d;a[30]+=d;d=
a[22];a[22]=a[15]-d;a[15]+=d;d=a[23];a[23]=a[14]-d;a[14]+=d;d=a[20]-a[8];a[8]+=a[20];a[20]=d*k[f+-180+7];d=a[21]-a[9];a[9]+=a[21];a[21]=d*k[f+-180+7];d=a[18]-a[10];a[10]+=a[18];a[18]=d*k[f+-216+7];d=a[19]-a[11];a[11]+=a[19];a[19]=d*k[f+-216+7];d=a[16]-a[12];a[12]+=a[16];a[16]=d*k[f+-252+7];d=a[17]-a[13];a[13]+=a[17];a[17]=d*k[f+-252+7];d=-a[20]+a[24];a[20]+=a[24];a[24]=d*k[f+-216+7];d=-a[21]+a[25];a[21]+=a[25];a[25]=d*k[f+-216+7];d=a[4]-a[8];a[4]+=a[8];a[8]=d*k[f+-216+7];d=a[5]-a[9];a[5]+=a[9];a[9]=
d*k[f+-216+7];d=a[0]-a[12];a[0]+=a[12];a[12]=d*k[f+-72+7];d=a[1]-a[13];a[1]+=a[13];a[13]=d*k[f+-72+7];d=a[16]-a[28];a[16]+=a[28];a[28]=d*k[f+-72+7];d=-a[17]+a[29];a[17]+=a[29];a[29]=d*k[f+-72+7];d=aa.SQRT2*(a[2]-a[10]);a[2]+=a[10];a[10]=d;d=aa.SQRT2*(a[3]-a[11]);a[3]+=a[11];a[11]=d;d=aa.SQRT2*(-a[18]+a[26]);a[18]+=a[26];a[26]=d-a[18];d=aa.SQRT2*(-a[19]+a[27]);a[19]+=a[27];a[27]=d-a[19];d=a[2];a[19]-=a[3];a[3]-=d;a[2]=a[31]-d;a[31]+=d;d=a[3];a[11]-=a[19];a[18]-=d;a[3]=a[30]-d;a[30]+=d;d=a[18];a[27]-=
a[11];a[19]-=d;a[18]=a[15]-d;a[15]+=d;d=a[19];a[10]-=d;a[19]=a[14]-d;a[14]+=d;d=a[10];a[11]-=d;a[10]=a[23]-d;a[23]+=d;d=a[11];a[26]-=d;a[11]=a[22]-d;a[22]+=d;d=a[26];a[27]-=d;a[26]=a[7]-d;a[7]+=d;d=a[27];a[27]=a[6]-d;a[6]+=d;d=aa.SQRT2*(a[0]-a[4]);a[0]+=a[4];a[4]=d;d=aa.SQRT2*(a[1]-a[5]);a[1]+=a[5];a[5]=d;d=aa.SQRT2*(a[16]-a[20]);a[16]+=a[20];a[20]=d;d=aa.SQRT2*(a[17]-a[21]);a[17]+=a[21];a[21]=d;d=-aa.SQRT2*(a[8]-a[12]);a[8]+=a[12];a[12]=d-a[8];d=-aa.SQRT2*(a[9]-a[13]);a[9]+=a[13];a[13]=d-a[9];d=
-aa.SQRT2*(a[25]-a[29]);a[25]+=a[29];a[29]=d-a[25];d=-aa.SQRT2*(a[24]+a[28]);a[24]-=a[28];a[28]=d-a[24];d=a[24]-a[16];a[24]=d;d=a[20]-d;a[20]=d;d=a[28]-d;a[28]=d;d=a[25]-a[17];a[25]=d;d=a[21]-d;a[21]=d;d=a[29]-d;a[29]=d;d=a[17]-a[1];a[17]=d;d=a[9]-d;a[9]=d;d=a[25]-d;a[25]=d;d=a[5]-d;a[5]=d;d=a[21]-d;a[21]=d;d=a[13]-d;a[13]=d;d=a[29]-d;a[29]=d;d=a[1]-a[0];a[1]=d;d=a[16]-d;a[16]=d;d=a[17]-d;a[17]=d;d=a[8]-d;a[8]=d;d=a[9]-d;a[9]=d;d=a[24]-d;a[24]=d;d=a[25]-d;a[25]=d;d=a[4]-d;a[4]=d;d=a[5]-d;a[5]=d;d=
a[20]-d;a[20]=d;d=a[21]-d;a[21]=d;d=a[12]-d;a[12]=d;d=a[13]-d;a[13]=d;d=a[28]-d;a[28]=d;d=a[29]-d;a[29]=d;d=a[0];a[0]+=a[31];a[31]-=d;d=a[1];a[1]+=a[30];a[30]-=d;d=a[16];a[16]+=a[15];a[15]-=d;d=a[17];a[17]+=a[14];a[14]-=d;d=a[8];a[8]+=a[23];a[23]-=d;d=a[9];a[9]+=a[22];a[22]-=d;d=a[24];a[24]+=a[7];a[7]-=d;d=a[25];a[25]+=a[6];a[6]-=d;d=a[4];a[4]+=a[27];a[27]-=d;d=a[5];a[5]+=a[26];a[26]-=d;d=a[20];a[20]+=a[11];a[11]-=d;d=a[21];a[21]+=a[10];a[10]-=d;d=a[12];a[12]+=a[19];a[19]-=d;d=a[13];a[13]+=a[18];
a[18]-=d;d=a[28];a[28]+=a[3];a[3]-=d;d=a[29];a[29]+=a[2];a[2]-=d}var k=[-.1482523854003001,32.308141959636465,296.40344946382766,883.1344870032432,11113.947376231741,1057.2713659324597,305.7402417275812,30.825928907280012,3.8533188138216365,59.42900443849514,709.5899960123345,5281.91112291017,-5829.66483675846,-817.6293103748613,-76.91656988279972,-4.594269939176596,.9063471690191471,.1960342806591213,-.15466694054279598,34.324387823855965,301.8067566458425,817.599602898885,11573.795901679885,1181.2520595540152,
321.59731579894424,31.232021761053772,3.7107095756221318,53.650946155329365,684.167428119626,5224.56624370173,-6366.391851890084,-908.9766368219582,-89.83068876699639,-5.411397422890401,.8206787908286602,.3901806440322567,-.16070888947830023,36.147034243915876,304.11815768187864,732.7429163887613,11989.60988270091,1300.012278487897,335.28490093152146,31.48816102859945,3.373875931311736,47.232241542899175,652.7371796173471,5132.414255594984,-6909.087078780055,-1001.9990371107289,-103.62185754286375,
-6.104916304710272,.7416505462720353,.5805693545089249,-.16636367662261495,37.751650073343995,303.01103387567713,627.9747488785183,12358.763425278165,1412.2779918482834,346.7496836825721,31.598286663170416,3.1598635433980946,40.57878626349686,616.1671130880391,5007.833007176154,-7454.040671756168,-1095.7960341867115,-118.24411666465777,-6.818469345853504,.6681786379192989,.7653668647301797,-.1716176790982088,39.11551877123304,298.3413246578966,503.5259106886539,12679.589408408976,1516.5821921214542,
355.9850766329023,31.395241710249053,2.9164211881972335,33.79716964664243,574.8943997801362,4853.234992253242,-7997.57021486075,-1189.7624067269965,-133.6444792601766,-7.7202770609839915,.5993769336819237,.9427934736519954,-.17645823955292173,40.21879108166477,289.9982036694474,359.3226160751053,12950.259102786438,1612.1013903507662,362.85067106591504,31.045922092242872,2.822222032597987,26.988862316190684,529.8996541764288,4671.371946949588,-8535.899136645805,-1282.5898586244496,-149.58553632943463,
-8.643494270763135,.5345111359507916,1.111140466039205,-.36174739330527045,41.04429910497807,277.5463268268618,195.6386023135583,13169.43812144731,1697.6433561479398,367.40983966190305,30.557037410382826,2.531473372857427,20.070154905927314,481.50208566532336,4464.970341588308,-9065.36882077239,-1373.62841526722,-166.1660487028118,-9.58289321133207,.4729647758913199,1.268786568327291,-.36970682634889585,41.393213350082036,261.2935935556502,12.935476055240873,13336.131683328815,1772.508612059496,369.76534388639965,
29.751323653701338,2.4023193045459172,13.304795348228817,430.5615775526625,4237.0568611071185,-9581.931701634761,-1461.6913552409758,-183.12733958476446,-10.718010163869403,.41421356237309503,1.414213562373095,-.37677560326535325,41.619486213528496,241.05423794991074,-187.94665032361226,13450.063605744153,1836.153896465782,369.4908799925761,29.001847876923147,2.0714759319987186,6.779591200894186,377.7767837205709,3990.386575512536,-10081.709459700915,-1545.947424837898,-200.3762958015653,-11.864482073055006,
.3578057213145241,1.546020906725474,-.3829366947518991,41.1516456456653,216.47684307105183,-406.1569483347166,13511.136535077321,1887.8076599260432,367.3025214564151,28.136213436723654,1.913880671464418,.3829366947518991,323.85365704338597,3728.1472257487526,-10561.233882199509,-1625.2025997821418,-217.62525175416,-13.015432208941645,.3033466836073424,1.66293922460509,-.5822628872992417,40.35639251440489,188.20071124269245,-640.2706748618148,13519.21490106562,1927.6022433578062,362.8197642637487,
26.968821921868447,1.7463817695935329,-5.62650678237171,269.3016715297017,3453.386536448852,-11016.145278780888,-1698.6569643425091,-234.7658734267683,-14.16351421663124,.2504869601913055,1.76384252869671,-.5887180101749253,39.23429103868072,155.76096234403798,-889.2492977967378,13475.470561874661,1955.0535223723712,356.4450994756727,25.894952980042156,1.5695032905781554,-11.181939564328772,214.80884394039484,3169.1640829158237,-11443.321309975563,-1765.1588461316153,-251.68908574481912,-15.49755935939164,
.198912367379658,1.847759065022573,-.7912582233652842,37.39369355329111,119.699486012458,-1151.0956593239027,13380.446257078214,1970.3952110853447,348.01959814116185,24.731487364283044,1.3850130831637748,-16.421408865300393,161.05030052864092,2878.3322807850063,-11838.991423510031,-1823.985884688674,-268.2854986386903,-16.81724543849939,.1483359875383474,1.913880671464418,-.7960642926861912,35.2322109610459,80.01928065061526,-1424.0212633405113,13235.794061869668,1973.804052543835,337.9908651258184,
23.289159354463873,1.3934255946442087,-21.099669467133474,108.48348407242611,2583.700758091299,-12199.726194855148,-1874.2780658979746,-284.2467154529415,-18.11369784385905,.09849140335716425,1.961570560806461,-.998795456205172,32.56307803611191,36.958364584370486,-1706.075448829146,13043.287458812016,1965.3831106103316,326.43182772364605,22.175018750622293,1.198638339011324,-25.371248002043963,57.53505923036915,2288.41886619975,-12522.674544337233,-1914.8400385312243,-299.26241273417224,-19.37805630698734,
.04912684976946725,1.990369453344394,.0178904535*aa.SQRT2/2.384E-6,.008938074*aa.SQRT2/2.384E-6,.0015673635*aa.SQRT2/2.384E-6,.001228571*aa.SQRT2/2.384E-6,4.856585E-4*aa.SQRT2/2.384E-6,1.09434E-4*aa.SQRT2/2.384E-6,5.0783E-5*aa.SQRT2/2.384E-6,6.914E-6*aa.SQRT2/2.384E-6,12804.797818791945,1945.5515939597317,313.4244966442953,20.801593959731544,1995.1556208053692,9.000838926174497,-29.20218120805369],n=[[2.382191739347913E-13,6.423305872147834E-13,9.400849094049688E-13,1.122435026096556E-12,1.183840321267481E-12,
1.122435026096556E-12,9.40084909404969E-13,6.423305872147839E-13,2.382191739347918E-13,5.456116108943412E-12,4.878985199565852E-12,4.240448995017367E-12,3.559909094758252E-12,2.858043359288075E-12,2.156177623817898E-12,1.475637723558783E-12,8.371015190102974E-13,2.599706096327376E-13,-5.456116108943412E-12,-4.878985199565852E-12,-4.240448995017367E-12,-3.559909094758252E-12,-2.858043359288076E-12,-2.156177623817898E-12,-1.475637723558783E-12,-8.371015190102975E-13,-2.599706096327376E-13,-2.382191739347923E-13,
-6.423305872147843E-13,-9.400849094049696E-13,-1.122435026096556E-12,-1.183840321267481E-12,-1.122435026096556E-12,-9.400849094049694E-13,-6.42330587214784E-13,-2.382191739347918E-13],[2.382191739347913E-13,6.423305872147834E-13,9.400849094049688E-13,1.122435026096556E-12,1.183840321267481E-12,1.122435026096556E-12,9.400849094049688E-13,6.423305872147841E-13,2.382191739347918E-13,5.456116108943413E-12,4.878985199565852E-12,4.240448995017367E-12,3.559909094758253E-12,2.858043359288075E-12,2.156177623817898E-12,
1.475637723558782E-12,8.371015190102975E-13,2.599706096327376E-13,-5.461314069809755E-12,-4.921085770524055E-12,-4.343405037091838E-12,-3.732668368707687E-12,-3.093523840190885E-12,-2.430835727329465E-12,-1.734679010007751E-12,-9.74825365660928E-13,-2.797435120168326E-13,0,0,0,0,0,0,-2.283748241799531E-13,-4.037858874020686E-13,-2.146547464825323E-13],[.1316524975873958,.414213562373095,.7673269879789602,1.091308501069271,1.303225372841206,1.56968557711749,1.920982126971166,2.414213562373094,3.171594802363212,
4.510708503662055,7.595754112725146,22.90376554843115,.984807753012208,.6427876096865394,.3420201433256688,.9396926207859084,-.1736481776669303,-.7660444431189779,.8660254037844387,.5,-.5144957554275265,-.4717319685649723,-.3133774542039019,-.1819131996109812,-.09457419252642064,-.04096558288530405,-.01419856857247115,-.003699974673760037,.8574929257125442,.8817419973177052,.9496286491027329,.9833145924917901,.9955178160675857,.9991605581781475,.999899195244447,.9999931550702802],[0,0,0,0,0,0,2.283748241799531E-13,
4.037858874020686E-13,2.146547464825323E-13,5.461314069809755E-12,4.921085770524055E-12,4.343405037091838E-12,3.732668368707687E-12,3.093523840190885E-12,2.430835727329466E-12,1.734679010007751E-12,9.74825365660928E-13,2.797435120168326E-13,-5.456116108943413E-12,-4.878985199565852E-12,-4.240448995017367E-12,-3.559909094758253E-12,-2.858043359288075E-12,-2.156177623817898E-12,-1.475637723558782E-12,-8.371015190102975E-13,-2.599706096327376E-13,-2.382191739347913E-13,-6.423305872147834E-13,-9.400849094049688E-13,
-1.122435026096556E-12,-1.183840321267481E-12,-1.122435026096556E-12,-9.400849094049688E-13,-6.423305872147841E-13,-2.382191739347918E-13]],w=n[c.SHORT_TYPE],E=n[c.SHORT_TYPE],B=n[c.SHORT_TYPE],G=n[c.SHORT_TYPE],f=[0,1,16,17,8,9,24,25,4,5,20,21,12,13,28,29,2,3,18,19,10,11,26,27,6,7,22,23,14,15,30,31];this.mdct_sub48=function(b,k,a){for(var m=286,v=0;v<b.channels_out;v++){for(var e=0;e<b.mode_gr;e++){for(var l,d=b.l3_side.tt[e][v],g=d.xr,q=0,D=b.sb_sample[v][1-e],p=0,r=0;9>r;r++)for(u(k,m,D[p]),u(k,
m+32,D[p+1]),p+=2,m+=64,l=1;32>l;l+=2)D[p-1][l]*=-1;for(l=0;32>l;l++,q+=18){D=d.block_type;p=b.sb_sample[v][e];var t=b.sb_sample[v][1-e];0!=d.mixed_block_flag&&2>l&&(D=0);if(1E-12>b.amp_filter[l])na.fill(g,q+0,q+18,0);else{if(1>b.amp_filter[l])for(r=0;18>r;r++)t[r][f[l]]*=b.amp_filter[l];if(D==c.SHORT_TYPE){for(r=-3;0>r;r++){var J=n[c.SHORT_TYPE][r+3];g[q+3*r+9]=p[9+r][f[l]]*J-p[8-r][f[l]];g[q+3*r+18]=p[14-r][f[l]]*J+p[15+r][f[l]];g[q+3*r+10]=p[15+r][f[l]]*J-p[14-r][f[l]];g[q+3*r+19]=t[2-r][f[l]]*
J+t[3+r][f[l]];g[q+3*r+11]=t[3+r][f[l]]*J-t[2-r][f[l]];g[q+3*r+20]=t[8-r][f[l]]*J+t[9+r][f[l]]}r=g;p=q;for(J=0;3>J;J++){var h=r[p+6]*n[c.SHORT_TYPE][0]-r[p+15];t=r[p+0]*n[c.SHORT_TYPE][2]-r[p+9];var x=h+t;var y=h-t;h=r[p+15]*n[c.SHORT_TYPE][0]+r[p+6];t=r[p+9]*n[c.SHORT_TYPE][2]+r[p+0];var A=h+t;var N=-h+t;t=2.069978111953089E-11*(r[p+3]*n[c.SHORT_TYPE][1]-r[p+12]);h=2.069978111953089E-11*(r[p+12]*n[c.SHORT_TYPE][1]+r[p+3]);r[p+0]=1.90752519173728E-11*x+t;r[p+15]=1.90752519173728E-11*-A+h;y*=1.6519652744032674E-11;
A=9.537625958686404E-12*A+h;r[p+3]=y-A;r[p+6]=y+A;x=9.537625958686404E-12*x-t;N*=1.6519652744032674E-11;r[p+9]=x+N;r[p+12]=x-N;p++}}else{J=K(18);for(r=-9;0>r;r++)x=n[D][r+27]*t[r+9][f[l]]+n[D][r+36]*t[8-r][f[l]],y=n[D][r+9]*p[r+9][f[l]]-n[D][r+18]*p[8-r][f[l]],J[r+9]=x-y*w[3+r+9],J[r+18]=x*w[3+r+9]+y;r=g;p=q;x=J;var H=x[17]-x[9];var O=x[15]-x[11];var F=x[14]-x[12];N=x[0]+x[8];A=x[1]+x[7];h=x[2]+x[6];y=x[3]+x[5];r[p+17]=N+h-y-(A-x[4]);J=(N+h-y)*E[19]+(A-x[4]);t=(H-O-F)*E[18];r[p+5]=t+J;r[p+6]=t-J;
var C=(x[16]-x[10])*E[18];A=A*E[19]+x[4];t=H*E[12]+C+O*E[13]+F*E[14];J=-N*E[16]+A-h*E[17]+y*E[15];r[p+1]=t+J;r[p+2]=t-J;t=H*E[13]-C-O*E[14]+F*E[12];J=-N*E[17]+A-h*E[15]+y*E[16];r[p+9]=t+J;r[p+10]=t-J;t=H*E[14]-C+O*E[12]-F*E[13];J=N*E[15]-A+h*E[16]-y*E[17];r[p+13]=t+J;r[p+14]=t-J;H=x[8]-x[0];O=x[6]-x[2];F=x[5]-x[3];N=x[17]+x[9];A=x[16]+x[10];h=x[15]+x[11];y=x[14]+x[12];r[p+0]=N+h+y+(A+x[13]);t=(N+h+y)*E[19]-(A+x[13]);J=(H-O+F)*E[18];r[p+11]=t+J;r[p+12]=t-J;C=(x[7]-x[1])*E[18];A=x[13]-A*E[19];t=N*E[15]-
A+h*E[16]+y*E[17];J=H*E[14]+C+O*E[12]+F*E[13];r[p+3]=t+J;r[p+4]=t-J;t=-N*E[17]+A-h*E[15]-y*E[16];J=H*E[13]+C-O*E[14]-F*E[12];r[p+7]=t+J;r[p+8]=t-J;t=-N*E[16]+A-h*E[17]-y*E[15];J=H*E[12]-C+O*E[13]-F*E[14];r[p+15]=t+J;r[p+16]=t-J}}if(D!=c.SHORT_TYPE&&0!=l)for(r=7;0<=r;--r)D=g[q+r]*B[20+r]+g[q+-1-r]*G[28+r],p=g[q+r]*G[28+r]-g[q+-1-r]*B[20+r],g[q+-1-r]=D,g[q+r]=p}}k=a;m=286;if(1==b.mode_gr)for(e=0;18>e;e++)T.arraycopy(b.sb_sample[v][1][e],0,b.sb_sample[v][0][e],0,32)}}}function Xa(){this.thm=new Xb;this.en=
new Xb}function c(){var u=c.FFTOFFSET,k=c.MPG_MD_MS_LR,n=null,w=this.psy=null,E=null,B=null;this.setModules=function(c,b,k,a){n=c;w=this.psy=b;E=a;B=k};var ha=new Fc;this.lame_encode_mp3_frame=function(f,b,v,a,m,z){var e=Ob([2,2]);e[0][0]=new Xa;e[0][1]=new Xa;e[1][0]=new Xa;e[1][1]=new Xa;var l=Ob([2,2]);l[0][0]=new Xa;l[0][1]=new Xa;l[1][0]=new Xa;l[1][1]=new Xa;var d=[null,null],g=f.internal_flags,q=ca([2,4]),D=[.5,.5],p=[[0,0],[0,0]],r=[[0,0],[0,0]];d[0]=b;d[1]=v;if(0==g.lame_encode_frame_init){b=
f.internal_flags;var t,J;if(0==b.lame_encode_frame_init){v=K(2014);var h=K(2014);b.lame_encode_frame_init=1;for(J=t=0;t<286+576*(1+b.mode_gr);++t)t<576*b.mode_gr?(v[t]=0,2==b.channels_out&&(h[t]=0)):(v[t]=d[0][J],2==b.channels_out&&(h[t]=d[1][J]),++J);for(J=0;J<b.mode_gr;J++)for(t=0;t<b.channels_out;t++)b.l3_side.tt[J][t].block_type=c.SHORT_TYPE;ha.mdct_sub48(b,v,h)}}g.padding=0;0>(g.slot_lag-=g.frac_SpF)&&(g.slot_lag+=f.out_samplerate,g.padding=1);if(0!=g.psymodel)for(h=[null,null],t=0,J=X(2),v=
0;v<g.mode_gr;v++){for(b=0;b<g.channels_out;b++)h[b]=d[b],t=576+576*v-c.FFTOFFSET;b=f.VBR==G.vbr_mtrh||f.VBR==G.vbr_mt?w.L3psycho_anal_vbr(f,h,t,v,e,l,p[v],r[v],q[v],J):w.L3psycho_anal_ns(f,h,t,v,e,l,p[v],r[v],q[v],J);if(0!=b)return-4;f.mode==la.JOINT_STEREO&&(D[v]=q[v][2]+q[v][3],0<D[v]&&(D[v]=q[v][3]/D[v]));for(b=0;b<g.channels_out;b++){var x=g.l3_side.tt[v][b];x.block_type=J[b];x.mixed_block_flag=0}}else for(v=0;v<g.mode_gr;v++)for(b=0;b<g.channels_out;b++)g.l3_side.tt[v][b].block_type=c.NORM_TYPE,
g.l3_side.tt[v][b].mixed_block_flag=0,r[v][b]=p[v][b]=700;0==g.ATH.useAdjust?g.ATH.adjust=1:(b=g.loudness_sq[0][0],q=g.loudness_sq[1][0],2==g.channels_out?(b+=g.loudness_sq[0][1],q+=g.loudness_sq[1][1]):(b+=b,q+=q),2==g.mode_gr&&(b=Math.max(b,q)),b=.5*b*g.ATH.aaSensitivityP,.03125<b?(1<=g.ATH.adjust?g.ATH.adjust=1:g.ATH.adjust<g.ATH.adjustLimit&&(g.ATH.adjust=g.ATH.adjustLimit),g.ATH.adjustLimit=1):(q=31.98*b+6.25E-4,g.ATH.adjust>=q?(g.ATH.adjust*=.075*q+.925,g.ATH.adjust<q&&(g.ATH.adjust=q)):g.ATH.adjustLimit>=
q?g.ATH.adjust=q:g.ATH.adjust<g.ATH.adjustLimit&&(g.ATH.adjust=g.ATH.adjustLimit),g.ATH.adjustLimit=q));ha.mdct_sub48(g,d[0],d[1]);g.mode_ext=c.MPG_MD_LR_LR;if(f.force_ms)g.mode_ext=c.MPG_MD_MS_LR;else if(f.mode==la.JOINT_STEREO){for(v=h=q=0;v<g.mode_gr;v++)for(b=0;b<g.channels_out;b++)q+=r[v][b],h+=p[v][b];q<=1*h&&(q=g.l3_side.tt[0],b=g.l3_side.tt[g.mode_gr-1],q[0].block_type==q[1].block_type&&b[0].block_type==b[1].block_type&&(g.mode_ext=c.MPG_MD_MS_LR))}g.mode_ext==k&&(e=l,p=r);if(f.analysis&&
null!=g.pinfo)for(v=0;v<g.mode_gr;v++)for(b=0;b<g.channels_out;b++)g.pinfo.ms_ratio[v]=g.ms_ratio[v],g.pinfo.ms_ener_ratio[v]=D[v],g.pinfo.blocktype[v][b]=g.l3_side.tt[v][b].block_type,g.pinfo.pe[v][b]=p[v][b],T.arraycopy(g.l3_side.tt[v][b].xr,0,g.pinfo.xr[v][b],0,576),g.mode_ext==k&&(g.pinfo.ers[v][b]=g.pinfo.ers[v][b+2],T.arraycopy(g.pinfo.energy[v][b+2],0,g.pinfo.energy[v][b],0,g.pinfo.energy[v][b].length));if(f.VBR==G.vbr_off||f.VBR==G.vbr_abr){for(l=0;18>l;l++)g.nsPsy.pefirbuf[l]=g.nsPsy.pefirbuf[l+
1];for(v=r=0;v<g.mode_gr;v++)for(b=0;b<g.channels_out;b++)r+=p[v][b];g.nsPsy.pefirbuf[18]=r;r=g.nsPsy.pefirbuf[9];for(l=0;9>l;l++)r+=(g.nsPsy.pefirbuf[l]+g.nsPsy.pefirbuf[18-l])*c.fircoef[l];r=3350*g.mode_gr*g.channels_out/r;for(v=0;v<g.mode_gr;v++)for(b=0;b<g.channels_out;b++)p[v][b]*=r}g.iteration_loop.iteration_loop(f,p,D,e);n.format_bitstream(f);a=n.copy_buffer(g,a,m,z,1);f.bWriteVbrTag&&E.addVbrFrame(f);if(f.analysis&&null!=g.pinfo){for(b=0;b<g.channels_out;b++){for(m=0;m<u;m++)g.pinfo.pcmdata[b][m]=
g.pinfo.pcmdata[b][m+f.framesize];for(m=u;1600>m;m++)g.pinfo.pcmdata[b][m]=d[b][m-u]}B.set_frame_pinfo(f,e)}g.bitrate_stereoMode_Hist[g.bitrate_index][4]++;g.bitrate_stereoMode_Hist[15][4]++;2==g.channels_out&&(g.bitrate_stereoMode_Hist[g.bitrate_index][g.mode_ext]++,g.bitrate_stereoMode_Hist[15][g.mode_ext]++);for(f=0;f<g.mode_gr;++f)for(d=0;d<g.channels_out;++d)m=g.l3_side.tt[f][d].block_type|0,0!=g.l3_side.tt[f][d].mixed_block_flag&&(m=4),g.bitrate_blockType_Hist[g.bitrate_index][m]++,g.bitrate_blockType_Hist[g.bitrate_index][5]++,
g.bitrate_blockType_Hist[15][m]++,g.bitrate_blockType_Hist[15][5]++;return a}}function Gc(){this.size=this.pos=this.want=this.seen=this.sum=0;this.bag=null;this.TotalFrameSize=this.nBytesWritten=this.nVbrNumFrames=0}function Hc(){this.tt=[[null,null],[null,null]];this.resvDrain_post=this.resvDrain_pre=this.private_bits=this.main_data_begin=0;this.scfsi=[X(4),X(4)];for(var c=0;2>c;c++)for(var k=0;2>k;k++)this.tt[c][k]=new rb}function Ic(){this.last_en_subshort=ca([4,9]);this.lastAttacks=X(4);this.pefirbuf=
K(19);this.longfact=K(c.SBMAX_l);this.shortfact=K(c.SBMAX_s);this.attackthre_s=this.attackthre=0}function Xb(){this.l=K(c.SBMAX_l);this.s=ca([c.SBMAX_s,3]);var u=this;this.assign=function(k){T.arraycopy(k.l,0,u.l,0,c.SBMAX_l);for(var n=0;n<c.SBMAX_s;n++)for(var w=0;3>w;w++)u.s[n][w]=k.s[n][w]}}function da(){function u(){this.ptr=this.write_timing=0;this.buf=new Int8Array(40)}this.fill_buffer_resample_init=this.iteration_init_init=this.lame_encode_frame_init=this.Class_ID=0;this.mfbuf=ca([2,da.MFSIZE]);
this.full_outer_loop=this.use_best_huffman=this.subblock_gain=this.noise_shaping_stop=this.psymodel=this.substep_shaping=this.noise_shaping_amp=this.noise_shaping=this.highpass2=this.highpass1=this.lowpass2=this.lowpass1=this.mode_ext=this.samplerate_index=this.bitrate_index=this.VBR_max_bitrate=this.VBR_min_bitrate=this.mf_size=this.mf_samples_to_encode=this.resample_ratio=this.channels_out=this.channels_in=this.mode_gr=0;this.l3_side=new Hc;this.ms_ratio=K(2);this.slot_lag=this.frac_SpF=this.padding=
0;this.tag_spec=null;this.nMusicCRC=0;this.OldValue=X(2);this.CurrentStep=X(2);this.masking_lower=0;this.bv_scf=X(576);this.pseudohalf=X(sa.SFBMAX);this.sfb21_extra=!1;this.inbuf_old=Array(2);this.blackfilt=Array(2*da.BPC+1);this.itime=new Float64Array(2);this.sideinfo_len=0;this.sb_sample=ca([2,2,18,c.SBLIMIT]);this.amp_filter=K(32);this.header=Array(da.MAX_HEADER_BUF);this.ResvMax=this.ResvSize=this.ancillary_flag=this.w_ptr=this.h_ptr=0;this.scalefac_band=new za;this.minval_l=K(c.CBANDS);this.minval_s=
K(c.CBANDS);this.nb_1=ca([4,c.CBANDS]);this.nb_2=ca([4,c.CBANDS]);this.nb_s1=ca([4,c.CBANDS]);this.nb_s2=ca([4,c.CBANDS]);this.s3_ll=this.s3_ss=null;this.decay=0;this.thm=Array(4);this.en=Array(4);this.tot_ener=K(4);this.loudness_sq=ca([2,2]);this.loudness_sq_save=K(2);this.mld_l=K(c.SBMAX_l);this.mld_s=K(c.SBMAX_s);this.bm_l=X(c.SBMAX_l);this.bo_l=X(c.SBMAX_l);this.bm_s=X(c.SBMAX_s);this.bo_s=X(c.SBMAX_s);this.npart_s=this.npart_l=0;this.s3ind=Ia([c.CBANDS,2]);this.s3ind_s=Ia([c.CBANDS,2]);this.numlines_s=
X(c.CBANDS);this.numlines_l=X(c.CBANDS);this.rnumlines_l=K(c.CBANDS);this.mld_cb_l=K(c.CBANDS);this.mld_cb_s=K(c.CBANDS);this.numlines_l_num1=this.numlines_s_num1=0;this.pe=K(4);this.ms_ener_ratio_old=this.ms_ratio_l_old=this.ms_ratio_s_old=0;this.blocktype_old=X(2);this.nsPsy=new Ic;this.VBR_seek_table=new Gc;this.PSY=this.ATH=null;this.nogap_current=this.nogap_total=0;this.findPeakSample=this.findReplayGain=this.decode_on_the_fly=!0;this.AudiophileGain=this.RadioGain=this.PeakSample=0;this.rgdata=
null;this.noclipScale=this.noclipGainChange=0;this.bitrate_stereoMode_Hist=Ia([16,5]);this.bitrate_blockType_Hist=Ia([16,6]);this.hip=this.pinfo=null;this.in_buffer_nsamples=0;this.iteration_loop=this.in_buffer_1=this.in_buffer_0=null;for(var k=0;k<this.en.length;k++)this.en[k]=new Xb;for(k=0;k<this.thm.length;k++)this.thm[k]=new Xb;for(k=0;k<this.header.length;k++)this.header[k]=new u}function Jc(){function u(c,k,f){var b=0;f<<=1;var n=k+f;var a=4;do{var m;var u=a>>1;var e=a;var l=a<<1;var d=l+e;
a=l<<1;var g=k;var q=g+u;do{var B=c[g+0]-c[g+e];var p=c[g+0]+c[g+e];var r=c[g+l]-c[g+d];var t=c[g+l]+c[g+d];c[g+l]=p-t;c[g+0]=p+t;c[g+d]=B-r;c[g+e]=B+r;B=c[q+0]-c[q+e];p=c[q+0]+c[q+e];r=aa.SQRT2*c[q+d];t=aa.SQRT2*c[q+l];c[q+l]=p-t;c[q+0]=p+t;c[q+d]=B-r;c[q+e]=B+r;q+=a;g+=a}while(g<n);var E=w[b+0];var h=w[b+1];for(m=1;m<u;m++){var x=1-2*h*h;var y=2*h*E;g=k+m;q=k+e-m;do{var A=y*c[g+e]-x*c[q+e];t=x*c[g+e]+y*c[q+e];B=c[g+0]-t;p=c[g+0]+t;var K=c[q+0]-A;var H=c[q+0]+A;A=y*c[g+d]-x*c[q+d];t=x*c[g+d]+y*c[q+
d];r=c[g+l]-t;t=c[g+l]+t;var O=c[q+l]-A;var F=c[q+l]+A;A=h*t-E*O;t=E*t+h*O;c[g+l]=p-t;c[g+0]=p+t;c[q+d]=K-A;c[q+e]=K+A;A=E*F-h*r;t=h*F+E*r;c[q+l]=H-t;c[q+0]=H+t;c[g+d]=B-A;c[g+e]=B+A;q+=a;g+=a}while(g<n);x=E;E=x*w[b+0]-h*w[b+1];h=x*w[b+1]+h*w[b+0]}b+=2}while(a<f)}var k=K(c.BLKSIZE),n=K(c.BLKSIZE_s/2),w=[.9238795325112867,.3826834323650898,.9951847266721969,.0980171403295606,.9996988186962042,.02454122852291229,.9999811752826011,.006135884649154475],E=[0,128,64,192,32,160,96,224,16,144,80,208,48,176,
112,240,8,136,72,200,40,168,104,232,24,152,88,216,56,184,120,248,4,132,68,196,36,164,100,228,20,148,84,212,52,180,116,244,12,140,76,204,44,172,108,236,28,156,92,220,60,188,124,252,2,130,66,194,34,162,98,226,18,146,82,210,50,178,114,242,10,138,74,202,42,170,106,234,26,154,90,218,58,186,122,250,6,134,70,198,38,166,102,230,22,150,86,214,54,182,118,246,14,142,78,206,46,174,110,238,30,158,94,222,62,190,126,254];this.fft_short=function(k,w,f,b,v){for(k=0;3>k;k++){var a=c.BLKSIZE_s/2,m=65535&192*(k+1),B=
c.BLKSIZE_s/8-1;do{var e=E[B<<2]&255;var l=n[e]*b[f][v+e+m];var d=n[127-e]*b[f][v+e+m+128];var g=l-d;l+=d;var q=n[e+64]*b[f][v+e+m+64];d=n[63-e]*b[f][v+e+m+192];var D=q-d;q+=d;a-=4;w[k][a+0]=l+q;w[k][a+2]=l-q;w[k][a+1]=g+D;w[k][a+3]=g-D;l=n[e+1]*b[f][v+e+m+1];d=n[126-e]*b[f][v+e+m+129];g=l-d;l+=d;q=n[e+65]*b[f][v+e+m+65];d=n[62-e]*b[f][v+e+m+193];D=q-d;q+=d;w[k][a+c.BLKSIZE_s/2+0]=l+q;w[k][a+c.BLKSIZE_s/2+2]=l-q;w[k][a+c.BLKSIZE_s/2+1]=g+D;w[k][a+c.BLKSIZE_s/2+3]=g-D}while(0<=--B);u(w[k],a,c.BLKSIZE_s/
2)}};this.fft_long=function(n,w,f,b,v){n=c.BLKSIZE/8-1;var a=c.BLKSIZE/2;do{var m=E[n]&255;var B=k[m]*b[f][v+m];var e=k[m+512]*b[f][v+m+512];var l=B-e;B+=e;var d=k[m+256]*b[f][v+m+256];e=k[m+768]*b[f][v+m+768];var g=d-e;d+=e;a-=4;w[a+0]=B+d;w[a+2]=B-d;w[a+1]=l+g;w[a+3]=l-g;B=k[m+1]*b[f][v+m+1];e=k[m+513]*b[f][v+m+513];l=B-e;B+=e;d=k[m+257]*b[f][v+m+257];e=k[m+769]*b[f][v+m+769];g=d-e;d+=e;w[a+c.BLKSIZE/2+0]=B+d;w[a+c.BLKSIZE/2+2]=B-d;w[a+c.BLKSIZE/2+1]=l+g;w[a+c.BLKSIZE/2+3]=l-g}while(0<=--n);u(w,
a,c.BLKSIZE/2)};this.init_fft=function(u){for(u=0;u<c.BLKSIZE;u++)k[u]=.42-.5*Math.cos(2*Math.PI*(u+.5)/c.BLKSIZE)+.08*Math.cos(4*Math.PI*(u+.5)/c.BLKSIZE);for(u=0;u<c.BLKSIZE_s/2;u++)n[u]=.5*(1-Math.cos(2*Math.PI*(u+.5)/c.BLKSIZE_s))}}function Pb(){function u(a,d){for(var b=0,h=0;h<c.BLKSIZE/2;++h)b+=a[h]*d.ATH.eql_w[h];return b*=D}function k(a,c,d,b,f,e){if(c>a)if(c<a*r)var g=c/a;else return a+c;else{if(a>=c*r)return a+c;g=a/c}a+=c;if(6>=b+3){if(g>=p)return a;b=0|aa.FAST_LOG10_X(g,16);return a*
x[b]}b=0|aa.FAST_LOG10_X(g,16);c=0!=e?f.ATH.cb_s[d]*f.ATH.adjust:f.ATH.cb_l[d]*f.ATH.adjust;return a<t*c?a>c?(d=1,13>=b&&(d=y[b]),c=aa.FAST_LOG10_X(a/c,10/15),a*((h[b]-d)*c+d)):13<b?a:a*y[b]:a*h[b]}function n(a,c,d){0>a&&(a=0);0>c&&(c=0);if(0>=a)return c;if(0>=c)return a;var b=c>a?c/a:a/c;if(-2<=d&&2>=d){if(b>=p)return a+c;d=0|aa.FAST_LOG10_X(b,16);return(a+c)*A[d]}if(b<r)return a+c;a<c&&(a=c);return a}function w(a,d,b,h,f){var e,g,l=0,k=0;for(e=g=0;e<c.SBMAX_s;++g,++e){var m=a.bo_s[e],y=a.npart_s;
for(m=m<y?m:y;g<m;)l+=d[g],k+=b[g],g++;a.en[h].s[e][f]=l;a.thm[h].s[e][f]=k;if(g>=y){++e;break}k=a.PSY.bo_s_weight[e];y=1-k;l=k*d[g];k*=b[g];a.en[h].s[e][f]+=l;a.thm[h].s[e][f]+=k;l=y*d[g];k=y*b[g]}for(;e<c.SBMAX_s;++e)a.en[h].s[e][f]=0,a.thm[h].s[e][f]=0}function E(a,d,b,h){var f,e,g=0,l=0;for(f=e=0;f<c.SBMAX_l;++e,++f){var k=a.bo_l[f],m=a.npart_l;for(k=k<m?k:m;e<k;)g+=d[e],l+=b[e],e++;a.en[h].l[f]=g;a.thm[h].l[f]=l;if(e>=m){++f;break}l=a.PSY.bo_l_weight[f];m=1-l;g=l*d[e];l*=b[e];a.en[h].l[f]+=g;
a.thm[h].l[f]+=l;g=m*d[e];l=m*b[e]}for(;f<c.SBMAX_l;++f)a.en[h].l[f]=0,a.thm[h].l[f]=0}function B(a,c,d){return 1<=d?a:0>=d?c:0<c?Math.pow(a/c,d)*c:0}function W(a,d){for(var b=309.07,h=0;h<c.SBMAX_s-1;h++)for(var f=0;3>f;f++){var e=a.thm.s[h][f];if(0<e){e*=d;var g=a.en.s[h][f];g>e&&(b=g>1E10*e?b+23.02585092994046*N[h]:b+N[h]*aa.FAST_LOG10(g/e))}}return b}function f(a,d){for(var b=281.0575,h=0;h<c.SBMAX_l-1;h++){var f=a.thm.l[h];if(0<f){f*=d;var e=a.en.l[h];e>f&&(b=e>1E10*f?b+23.02585092994046*H[h]:
b+H[h]*aa.FAST_LOG10(e/f))}}return b}function b(a,c,b,d,h){var f,e;for(f=e=0;f<a.npart_l;++f){var g=0,l=0,k;for(k=0;k<a.numlines_l[f];++k,++e){var m=c[e];g+=m;l<m&&(l=m)}b[f]=g;d[f]=l;h[f]=g*a.rnumlines_l[f]}}function v(a,c,b,d){var h=J.length-1,f=0,e=b[f]+b[f+1];if(0<e){var g=c[f];g<c[f+1]&&(g=c[f+1]);e=20*(2*g-e)/(e*(a.numlines_l[f]+a.numlines_l[f+1]-1));e|=0;e>h&&(e=h);d[f]=e}else d[f]=0;for(f=1;f<a.npart_l-1;f++)e=b[f-1]+b[f]+b[f+1],0<e?(g=c[f-1],g<c[f]&&(g=c[f]),g<c[f+1]&&(g=c[f+1]),e=20*(3*
g-e)/(e*(a.numlines_l[f-1]+a.numlines_l[f]+a.numlines_l[f+1]-1)),e|=0,e>h&&(e=h),d[f]=e):d[f]=0;e=b[f-1]+b[f];0<e?(g=c[f-1],g<c[f]&&(g=c[f]),e=20*(2*g-e)/(e*(a.numlines_l[f-1]+a.numlines_l[f]-1)),e|=0,e>h&&(e=h),d[f]=e):d[f]=0}function a(a,c,b,d,f,h,e){var g=2*h;f=0<h?Math.pow(10,f):1;for(var l,k,m=0;m<e;++m){var y=a[2][m],p=a[3][m],q=c[0][m],n=c[1][m],x=c[2][m],r=c[3][m];q<=1.58*n&&n<=1.58*q?(l=b[m]*y,k=Math.max(x,Math.min(r,b[m]*p)),l=Math.max(r,Math.min(x,l))):(k=x,l=r);0<h&&(r=d[m]*f,q=Math.min(Math.max(q,
r),Math.max(n,r)),x=Math.max(k,r),r=Math.max(l,r),n=x+r,0<n&&q*g<n&&(q=q*g/n,x*=q,r*=q),k=Math.min(x,k),l=Math.min(r,l));k>y&&(k=y);l>p&&(l=p);c[2][m]=k;c[3][m]=l}}function m(a,c){a=0<=a?27*-a:a*c;return-72>=a?0:Math.exp(.2302585093*a)}function z(a){0>a&&(a=0);a*=.001;return 13*Math.atan(.76*a)+3.5*Math.atan(a*a/56.25)}function e(a,b,d,f,h,e,g,l,k,m,y,p){var q=K(c.CBANDS+1),n=l/(15<p?1152:384),x=X(c.HBLKSIZE),r;l/=k;var u=0,C=0;for(r=0;r<c.CBANDS;r++){var t;var A=z(l*u);q[r]=l*u;for(t=u;.34>z(l*t)-
A&&t<=k/2;t++);a[r]=t-u;for(C=r+1;u<t;)x[u++]=r;if(u>k/2){u=k/2;++r;break}}q[r]=l*u;for(u=0;u<p;u++)r=m[u],A=m[u+1],r=0|Math.floor(.5+y*(r-.5)),0>r&&(r=0),t=0|Math.floor(.5+y*(A-.5)),t>k/2&&(t=k/2),d[u]=(x[r]+x[t])/2,b[u]=x[t],g[u]=(n*A-q[b[u]])/(q[b[u]+1]-q[b[u]]),0>g[u]?g[u]=0:1<g[u]&&(g[u]=1),A=z(l*m[u]*y),A=Math.min(A,15.5)/15.5,e[u]=Math.pow(10,1.25*(1-Math.cos(Math.PI*A))-2.5);for(b=u=0;b<C;b++)d=a[b],A=z(l*u),e=z(l*(u+d-1)),f[b]=.5*(A+e),A=z(l*(u-.5)),e=z(l*(u+d-.5)),h[b]=e-A,u+=d;return C}
function l(a,b,d,f,h,e){var g=ca([c.CBANDS,c.CBANDS]),l=0;if(e)for(var k=0;k<b;k++)for(e=0;e<b;e++){var y=d[k]-d[e];y=0<=y?3*y:1.5*y;if(.5<=y&&2.5>=y){var p=y-.5;p=8*(p*p-2*p)}else p=0;y+=.474;y=15.811389+7.5*y-17.5*Math.sqrt(1+y*y);-60>=y?p=0:(y=Math.exp(.2302585093*(p+y)),p=y/.6609193);y=p*f[e];g[k][e]=y*h[k]}else for(e=0;e<b;e++){p=15+Math.min(21/d[e],12);var q;var n;k=p;for(q=0;1E-20<m(q,k);--q);var x=q;for(n=0;1E-12<Math.abs(n-x);)q=(n+x)/2,0<m(q,k)?n=q:x=q;y=x;for(q=0;1E-20<m(q,k);q+=1);x=0;
for(n=q;1E-12<Math.abs(n-x);)q=(n+x)/2,0<m(q,k)?x=q:n=q;x=n;var r=0;for(n=0;1E3>=n;++n)q=y+n*(x-y)/1E3,q=m(q,k),r+=q;q=1001/(r*(x-y));for(k=0;k<b;k++)y=q*m(d[k]-d[e],p)*f[e],g[k][e]=y*h[k]}for(k=0;k<b;k++){for(e=0;e<b&&!(0<g[k][e]);e++);a[k][0]=e;for(e=b-1;0<e&&!(0<g[k][e]);e--);a[k][1]=e;l+=a[k][1]-a[k][0]+1}d=K(l);for(k=f=0;k<b;k++)for(e=a[k][0];e<=a[k][1];e++)d[f++]=g[k][e];return d}function d(a){a=z(a);a=Math.min(a,15.5)/15.5;return Math.pow(10,1.25*(1-Math.cos(Math.PI*a))-2.5)}function g(a,c){-.3>
a&&(a=3410);a=Math.max(.1,a/1E3);return 3.64*Math.pow(a,-.8)-6.8*Math.exp(-.6*Math.pow(a-3.4,2))+6*Math.exp(-.15*Math.pow(a-8.7,2))+.001*(.6+.04*c)*Math.pow(a,4)}var q=new Jc,D=1/217621504/(c.BLKSIZE/2),p,r,t,J=[1,.79433,.63096,.63096,.63096,.63096,.63096,.25119,.11749],h=[3.3246*3.3246,3.23837*3.23837,9.9500500969,9.0247369744,8.1854926609,7.0440875649,2.46209*2.46209,2.284*2.284,4.4892710641,1.96552*1.96552,1.82335*1.82335,1.69146*1.69146,2.4621061921,2.1508568964,1.37074*1.37074,1.31036*1.31036,
1.5691069696,1.4555939904,1.16203*1.16203,1.2715945225,1.09428*1.09428,1.0659*1.0659,1.0779838276,1.0382591025,1],x=[1.7782755904,1.35879*1.35879,1.38454*1.38454,1.39497*1.39497,1.40548*1.40548,1.3537*1.3537,1.6999465924,1.22321*1.22321,1.3169398564,1],y=[5.5396212496,2.29259*2.29259,4.9868695969,2.12675*2.12675,2.02545*2.02545,1.87894*1.87894,1.74303*1.74303,1.61695*1.61695,2.2499700001,1.39148*1.39148,1.29083*1.29083,1.19746*1.19746,1.2339655056,1.0779838276],A=[1.7782755904,1.35879*1.35879,1.38454*
1.38454,1.39497*1.39497,1.40548*1.40548,1.3537*1.3537,1.6999465924,1.22321*1.22321,1.3169398564,1],N=[11.8,13.6,17.2,32,46.5,51.3,57.5,67.1,71.5,84.6,97.6,130],H=[6.8,5.8,5.8,6.4,6.5,9.9,12.1,14.4,15,18.9,21.6,26.9,34.2,40.2,46.8,56.5,60.7,73.9,85.7,93.4,126.1],O=[-1.730326E-17,-.01703172,-1.349528E-17,.0418072,-6.73278E-17,-.0876324,-3.0835E-17,.1863476,-1.104424E-16,-.627638];this.L3psycho_anal_ns=function(a,d,h,e,g,l,m,y,p,n){var x=a.internal_flags,r=ca([2,c.BLKSIZE]),t=ca([2,3,c.BLKSIZE_s]),A=
K(c.CBANDS+1),I=K(c.CBANDS+1),C=K(c.CBANDS+2),Q=X(2),S=X(2),z,D,F,H,N,Z,L,V=ca([2,576]),ma=X(c.CBANDS+2),R=X(c.CBANDS+2);na.fill(R,0);var T=x.channels_out;a.mode==la.JOINT_STEREO&&(T=4);var M=a.VBR==G.vbr_off?0==x.ResvMax?0:x.ResvSize/x.ResvMax*.5:a.VBR==G.vbr_rh||a.VBR==G.vbr_mtrh||a.VBR==G.vbr_mt?.6:1;for(z=0;z<x.channels_out;z++){var Y=d[z],ha=h+576-350-21+192;for(F=0;576>F;F++){var U;var da=Y[ha+F+10];for(H=U=0;9>H;H+=2)da+=O[H]*(Y[ha+F+H]+Y[ha+F+21-H]),U+=O[H+1]*(Y[ha+F+H+1]+Y[ha+F+21-H-1]);
V[z][F]=da+U}g[e][z].en.assign(x.en[z]);g[e][z].thm.assign(x.thm[z]);2<T&&(l[e][z].en.assign(x.en[z+2]),l[e][z].thm.assign(x.thm[z+2]))}for(z=0;z<T;z++){var Qa=K(12),ya=[0,0,0,0],qa=K(12),ia=1,sa=K(c.CBANDS),Fa=K(c.CBANDS),ta=[0,0,0,0],za=K(c.HBLKSIZE),Wb=ca([3,c.HBLKSIZE_s]);for(F=0;3>F;F++)Qa[F]=x.nsPsy.last_en_subshort[z][F+6],qa[F]=Qa[F]/x.nsPsy.last_en_subshort[z][F+4],ya[0]+=Qa[F];if(2==z)for(F=0;576>F;F++){var Ya=V[0][F];var Xa=V[1][F];V[0][F]=Ya+Xa;V[1][F]=Ya-Xa}var Ia=V[z&1],ec=0;for(F=0;9>
F;F++){for(var xa=ec+64,Ga=1;ec<xa;ec++)Ga<Math.abs(Ia[ec])&&(Ga=Math.abs(Ia[ec]));x.nsPsy.last_en_subshort[z][F]=Qa[F+3]=Ga;ya[1+F/3]+=Ga;Ga=Ga>Qa[F+3-2]?Ga/Qa[F+3-2]:Qa[F+3-2]>10*Ga?Qa[F+3-2]/(10*Ga):0;qa[F+3]=Ga}if(a.analysis){var Qb=qa[0];for(F=1;12>F;F++)Qb<qa[F]&&(Qb=qa[F]);x.pinfo.ers[e][z]=x.pinfo.ers_save[z];x.pinfo.ers_save[z]=Qb}var Ma=3==z?x.nsPsy.attackthre_s:x.nsPsy.attackthre;for(F=0;12>F;F++)0==ta[F/3]&&qa[F]>Ma&&(ta[F/3]=F%3+1);for(F=1;4>F;F++)1.7>(ya[F-1]>ya[F]?ya[F-1]/ya[F]:ya[F]/
ya[F-1])&&(ta[F]=0,1==F&&(ta[0]=0));0!=ta[0]&&0!=x.nsPsy.lastAttacks[z]&&(ta[0]=0);if(3==x.nsPsy.lastAttacks[z]||0!=ta[0]+ta[1]+ta[2]+ta[3])ia=0,0!=ta[1]&&0!=ta[0]&&(ta[1]=0),0!=ta[2]&&0!=ta[1]&&(ta[2]=0),0!=ta[3]&&0!=ta[2]&&(ta[3]=0);2>z?S[z]=ia:0==ia&&(S[0]=S[1]=0);p[z]=x.tot_ener[z];var P=a,Ha=za,Gb=Wb,La=r,kb=z&1,Ra=t,Na=z&1,cb=e,Aa=z,va=d,qb=h,Va=P.internal_flags;if(2>Aa)q.fft_long(Va,La[kb],Aa,va,qb),q.fft_short(Va,Ra[Na],Aa,va,qb);else if(2==Aa){for(var ja=c.BLKSIZE-1;0<=ja;--ja){var Hb=La[kb+
0][ja],Ib=La[kb+1][ja];La[kb+0][ja]=(Hb+Ib)*aa.SQRT2*.5;La[kb+1][ja]=(Hb-Ib)*aa.SQRT2*.5}for(var Ba=2;0<=Ba;--Ba)for(ja=c.BLKSIZE_s-1;0<=ja;--ja)Hb=Ra[Na+0][Ba][ja],Ib=Ra[Na+1][Ba][ja],Ra[Na+0][Ba][ja]=(Hb+Ib)*aa.SQRT2*.5,Ra[Na+1][Ba][ja]=(Hb-Ib)*aa.SQRT2*.5}Ha[0]=La[kb+0][0];Ha[0]*=Ha[0];for(ja=c.BLKSIZE/2-1;0<=ja;--ja){var fc=La[kb+0][c.BLKSIZE/2-ja],tb=La[kb+0][c.BLKSIZE/2+ja];Ha[c.BLKSIZE/2-ja]=.5*(fc*fc+tb*tb)}for(Ba=2;0<=Ba;--Ba)for(Gb[Ba][0]=Ra[Na+0][Ba][0],Gb[Ba][0]*=Gb[Ba][0],ja=c.BLKSIZE_s/
2-1;0<=ja;--ja)fc=Ra[Na+0][Ba][c.BLKSIZE_s/2-ja],tb=Ra[Na+0][Ba][c.BLKSIZE_s/2+ja],Gb[Ba][c.BLKSIZE_s/2-ja]=.5*(fc*fc+tb*tb);var oa=0;for(ja=11;ja<c.HBLKSIZE;ja++)oa+=Ha[ja];Va.tot_ener[Aa]=oa;if(P.analysis){for(ja=0;ja<c.HBLKSIZE;ja++)Va.pinfo.energy[cb][Aa][ja]=Va.pinfo.energy_save[Aa][ja],Va.pinfo.energy_save[Aa][ja]=Ha[ja];Va.pinfo.pe[cb][Aa]=Va.pe[Aa]}2==P.athaa_loudapprox&&2>Aa&&(Va.loudness_sq[cb][Aa]=Va.loudness_sq_save[Aa],Va.loudness_sq_save[Aa]=u(Ha,Va));b(x,za,A,sa,Fa);v(x,sa,Fa,ma);for(L=
0;3>L;L++){var ea=void 0,Ab=void 0,Bb=Wb,Sa=I,Za=C,ub=z,zb=L,Ja=a.internal_flags;for(ea=Ab=0;ea<Ja.npart_s;++ea){for(var Rb=0,rb=0,db=Ja.numlines_s[ea],sb=0;sb<db;++sb,++Ab){var Cb=Bb[zb][Ab];Rb+=Cb;rb<Cb&&(rb=Cb)}Sa[ea]=Rb}for(Ab=ea=0;ea<Ja.npart_s;ea++){var Db=Ja.s3ind_s[ea][0],$a=Ja.s3_ss[Ab++]*Sa[Db];for(++Db;Db<=Ja.s3ind_s[ea][1];)$a+=Ja.s3_ss[Ab]*Sa[Db],++Ab,++Db;var vb=2*Ja.nb_s1[ub][ea];Za[ea]=Math.min($a,vb);Ja.blocktype_old[ub&1]==c.SHORT_TYPE&&(vb=16*Ja.nb_s2[ub][ea],Za[ea]=Math.min(vb,
Za[ea]));Ja.nb_s2[ub][ea]=Ja.nb_s1[ub][ea];Ja.nb_s1[ub][ea]=$a}for(;ea<=c.CBANDS;++ea)Sa[ea]=0,Za[ea]=0;w(x,I,C,z,L);for(Z=0;Z<c.SBMAX_s;Z++){var Ta=x.thm[z].s[Z][L];Ta*=.8;if(2<=ta[L]||1==ta[L+1]){var wb=0!=L?L-1:2;Ga=B(x.thm[z].s[Z][wb],Ta,.6*M);Ta=Math.min(Ta,Ga)}if(1==ta[L])wb=0!=L?L-1:2,Ga=B(x.thm[z].s[Z][wb],Ta,.3*M),Ta=Math.min(Ta,Ga);else if(0!=L&&3==ta[L-1]||0==L&&3==x.nsPsy.lastAttacks[z])wb=2!=L?L+1:0,Ga=B(x.thm[z].s[Z][wb],Ta,.3*M),Ta=Math.min(Ta,Ga);var Yb=Qa[3*L+3]+Qa[3*L+4]+Qa[3*L+
5];6*Qa[3*L+5]<Yb&&(Ta*=.5,6*Qa[3*L+4]<Yb&&(Ta*=.5));x.thm[z].s[Z][L]=Ta}}x.nsPsy.lastAttacks[z]=ta[2];for(D=N=0;D<x.npart_l;D++){for(var eb=x.s3ind[D][0],Jb=A[eb]*J[ma[eb]],lb=x.s3_ll[N++]*Jb;++eb<=x.s3ind[D][1];)Jb=A[eb]*J[ma[eb]],lb=k(lb,x.s3_ll[N++]*Jb,eb,eb-D,x,0);lb*=.158489319246111;C[D]=x.blocktype_old[z&1]==c.SHORT_TYPE?lb:B(Math.min(lb,Math.min(2*x.nb_1[z][D],16*x.nb_2[z][D])),lb,M);x.nb_2[z][D]=x.nb_1[z][D];x.nb_1[z][D]=lb}for(;D<=c.CBANDS;++D)A[D]=0,C[D]=0;E(x,A,C,z)}if((a.mode==la.STEREO||
a.mode==la.JOINT_STEREO)&&0<a.interChRatio){var xb=a.interChRatio,fa=a.internal_flags;if(1<fa.channels_out){for(var Ca=0;Ca<c.SBMAX_l;Ca++){var Sb=fa.thm[0].l[Ca],Eb=fa.thm[1].l[Ca];fa.thm[0].l[Ca]+=Eb*xb;fa.thm[1].l[Ca]+=Sb*xb}for(Ca=0;Ca<c.SBMAX_s;Ca++)for(var fb=0;3>fb;fb++)Sb=fa.thm[0].s[Ca][fb],Eb=fa.thm[1].s[Ca][fb],fa.thm[0].s[Ca][fb]+=Eb*xb,fa.thm[1].s[Ca][fb]+=Sb*xb}}if(a.mode==la.JOINT_STEREO){for(var Oa,ka=0;ka<c.SBMAX_l;ka++)if(!(x.thm[0].l[ka]>1.58*x.thm[1].l[ka]||x.thm[1].l[ka]>1.58*
x.thm[0].l[ka])){var Ua=x.mld_l[ka]*x.en[3].l[ka],gb=Math.max(x.thm[2].l[ka],Math.min(x.thm[3].l[ka],Ua));Ua=x.mld_l[ka]*x.en[2].l[ka];var gc=Math.max(x.thm[3].l[ka],Math.min(x.thm[2].l[ka],Ua));x.thm[2].l[ka]=gb;x.thm[3].l[ka]=gc}for(ka=0;ka<c.SBMAX_s;ka++)for(var ua=0;3>ua;ua++)x.thm[0].s[ka][ua]>1.58*x.thm[1].s[ka][ua]||x.thm[1].s[ka][ua]>1.58*x.thm[0].s[ka][ua]||(Ua=x.mld_s[ka]*x.en[3].s[ka][ua],gb=Math.max(x.thm[2].s[ka][ua],Math.min(x.thm[3].s[ka][ua],Ua)),Ua=x.mld_s[ka]*x.en[2].s[ka][ua],gc=
Math.max(x.thm[3].s[ka][ua],Math.min(x.thm[2].s[ka][ua],Ua)),x.thm[2].s[ka][ua]=gb,x.thm[3].s[ka][ua]=gc);Oa=a.msfix;if(0<Math.abs(Oa)){var Kb=Oa,hc=Kb,Zb=Math.pow(10,a.ATHlower*x.ATH.adjust);Kb*=2;hc*=2;for(var wa=0;wa<c.SBMAX_l;wa++){var ba=x.ATH.cb_l[x.bm_l[wa]]*Zb;var Wa=Math.min(Math.max(x.thm[0].l[wa],ba),Math.max(x.thm[1].l[wa],ba));var ab=Math.max(x.thm[2].l[wa],ba);var mb=Math.max(x.thm[3].l[wa],ba);if(Wa*Kb<ab+mb){var hb=Wa*hc/(ab+mb);ab*=hb;mb*=hb}x.thm[2].l[wa]=Math.min(ab,x.thm[2].l[wa]);
x.thm[3].l[wa]=Math.min(mb,x.thm[3].l[wa])}Zb*=c.BLKSIZE_s/c.BLKSIZE;for(wa=0;wa<c.SBMAX_s;wa++)for(var Da=0;3>Da;Da++)ba=x.ATH.cb_s[x.bm_s[wa]]*Zb,Wa=Math.min(Math.max(x.thm[0].s[wa][Da],ba),Math.max(x.thm[1].s[wa][Da],ba)),ab=Math.max(x.thm[2].s[wa][Da],ba),mb=Math.max(x.thm[3].s[wa][Da],ba),Wa*Kb<ab+mb&&(hb=Wa*Kb/(ab+mb),ab*=hb,mb*=hb),x.thm[2].s[wa][Da]=Math.min(x.thm[2].s[wa][Da],ab),x.thm[3].s[wa][Da]=Math.min(x.thm[3].s[wa][Da],mb)}}var ib=a.internal_flags;a.short_blocks!=ra.short_block_coupled||
0!=S[0]&&0!=S[1]||(S[0]=S[1]=0);for(var Ka=0;Ka<ib.channels_out;Ka++)Q[Ka]=c.NORM_TYPE,a.short_blocks==ra.short_block_dispensed&&(S[Ka]=1),a.short_blocks==ra.short_block_forced&&(S[Ka]=0),0!=S[Ka]?ib.blocktype_old[Ka]==c.SHORT_TYPE&&(Q[Ka]=c.STOP_TYPE):(Q[Ka]=c.SHORT_TYPE,ib.blocktype_old[Ka]==c.NORM_TYPE&&(ib.blocktype_old[Ka]=c.START_TYPE),ib.blocktype_old[Ka]==c.STOP_TYPE&&(ib.blocktype_old[Ka]=c.SHORT_TYPE)),n[Ka]=ib.blocktype_old[Ka],ib.blocktype_old[Ka]=Q[Ka];for(z=0;z<T;z++){var Ea=0;if(1<
z){var Lb=y;Ea=-2;var Tb=c.NORM_TYPE;if(n[0]==c.SHORT_TYPE||n[1]==c.SHORT_TYPE)Tb=c.SHORT_TYPE;var Fb=l[e][z-2]}else Lb=m,Ea=0,Tb=n[z],Fb=g[e][z];Lb[Ea+z]=Tb==c.SHORT_TYPE?W(Fb,x.masking_lower):f(Fb,x.masking_lower);a.analysis&&(x.pinfo.pe[e][z]=Lb[Ea+z])}return 0};var F=[-1.730326E-17,-.01703172,-1.349528E-17,.0418072,-6.73278E-17,-.0876324,-3.0835E-17,.1863476,-1.104424E-16,-.627638];this.L3psycho_anal_vbr=function(d,h,e,g,l,k,m,x,y,p){for(var r=d.internal_flags,A,t,I=K(c.HBLKSIZE),C=ca([3,c.HBLKSIZE_s]),
Q=ca([2,c.BLKSIZE]),z=ca([2,3,c.BLKSIZE_s]),S=ca([4,c.CBANDS]),D=ca([4,c.CBANDS]),O=ca([4,3]),L=[[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]],H=X(2),N=d.mode==la.JOINT_STEREO?4:r.channels_out,Z=ca([2,576]),G=d.internal_flags,V=G.channels_out,ma=d.mode==la.JOINT_STEREO?4:V,R=0;R<V;R++){firbuf=h[R];for(var T=e+576-350-21+192,M=0;576>M;M++){var Y;var ha=firbuf[T+M+10];for(var U=Y=0;9>U;U+=2)ha+=F[U]*(firbuf[T+M+U]+firbuf[T+M+21-U]),Y+=F[U+1]*(firbuf[T+M+U+1]+firbuf[T+M+21-U-1]);Z[R][M]=ha+Y}l[g][R].en.assign(G.en[R]);
l[g][R].thm.assign(G.thm[R]);2<ma&&(k[g][R].en.assign(G.en[R+2]),k[g][R].thm.assign(G.thm[R+2]))}for(R=0;R<ma;R++){var da=K(12),ya=K(12),qa=[0,0,0,0],ia=Z[R&1],sa=0,Fa=3==R?G.nsPsy.attackthre_s:G.nsPsy.attackthre,na=1;if(2==R)for(M=0,U=576;0<U;++M,--U){var ta=Z[0][M],za=Z[1][M];Z[0][M]=ta+za;Z[1][M]=ta-za}for(M=0;3>M;M++)ya[M]=G.nsPsy.last_en_subshort[R][M+6],da[M]=ya[M]/G.nsPsy.last_en_subshort[R][M+4],qa[0]+=ya[M];for(M=0;9>M;M++){for(var Xa=sa+64,Ya=1;sa<Xa;sa++)Ya<Math.abs(ia[sa])&&(Ya=Math.abs(ia[sa]));
G.nsPsy.last_en_subshort[R][M]=ya[M+3]=Ya;qa[1+M/3]+=Ya;Ya=Ya>ya[M+3-2]?Ya/ya[M+3-2]:ya[M+3-2]>10*Ya?ya[M+3-2]/(10*Ya):0;da[M+3]=Ya}for(M=0;3>M;++M){var Ia=ya[3*M+3]+ya[3*M+4]+ya[3*M+5],Wb=1;6*ya[3*M+5]<Ia&&(Wb*=.5,6*ya[3*M+4]<Ia&&(Wb*=.5));O[R][M]=Wb}if(d.analysis){var xa=da[0];for(M=1;12>M;M++)xa<da[M]&&(xa=da[M]);G.pinfo.ers[g][R]=G.pinfo.ers_save[R];G.pinfo.ers_save[R]=xa}for(M=0;12>M;M++)0==L[R][M/3]&&da[M]>Fa&&(L[R][M/3]=M%3+1);for(M=1;4>M;M++){var Qb=qa[M-1],Ga=qa[M];4E4>Math.max(Qb,Ga)&&Qb<
1.7*Ga&&Ga<1.7*Qb&&(1==M&&L[R][0]<=L[R][M]&&(L[R][0]=0),L[R][M]=0)}L[R][0]<=G.nsPsy.lastAttacks[R]&&(L[R][0]=0);if(3==G.nsPsy.lastAttacks[R]||0!=L[R][0]+L[R][1]+L[R][2]+L[R][3])na=0,0!=L[R][1]&&0!=L[R][0]&&(L[R][1]=0),0!=L[R][2]&&0!=L[R][1]&&(L[R][2]=0),0!=L[R][3]&&0!=L[R][2]&&(L[R][3]=0);2>R?H[R]=na:0==na&&(H[0]=H[1]=0);y[R]=G.tot_ener[R]}var qb=d.internal_flags;d.short_blocks!=ra.short_block_coupled||0!=H[0]&&0!=H[1]||(H[0]=H[1]=0);for(var Ma=0;Ma<qb.channels_out;Ma++)d.short_blocks==ra.short_block_dispensed&&
(H[Ma]=1),d.short_blocks==ra.short_block_forced&&(H[Ma]=0);for(var P=0;P<N;P++){var Ha=P&1;A=Q;var Gb=d,La=P,kb=g,Ra=I,Na=A,cb=Ha,Aa=Gb.internal_flags;if(2>La)q.fft_long(Aa,Na[cb],La,h,e);else if(2==La)for(var va=c.BLKSIZE-1;0<=va;--va){var rb=Na[cb+0][va],Va=Na[cb+1][va];Na[cb+0][va]=(rb+Va)*aa.SQRT2*.5;Na[cb+1][va]=(rb-Va)*aa.SQRT2*.5}Ra[0]=Na[cb+0][0];Ra[0]*=Ra[0];for(va=c.BLKSIZE/2-1;0<=va;--va){var ja=Na[cb+0][c.BLKSIZE/2-va],Hb=Na[cb+0][c.BLKSIZE/2+va];Ra[c.BLKSIZE/2-va]=.5*(ja*ja+Hb*Hb)}var Ib=
0;for(va=11;va<c.HBLKSIZE;va++)Ib+=Ra[va];Aa.tot_ener[La]=Ib;if(Gb.analysis){for(va=0;va<c.HBLKSIZE;va++)Aa.pinfo.energy[kb][La][va]=Aa.pinfo.energy_save[La][va],Aa.pinfo.energy_save[La][va]=Ra[va];Aa.pinfo.pe[kb][La]=Aa.pe[La]}var Ba=P,zb=I,tb=d.internal_flags;2==d.athaa_loudapprox&&2>Ba&&(tb.loudness_sq[g][Ba]=tb.loudness_sq_save[Ba],tb.loudness_sq_save[Ba]=u(zb,tb));if(0!=H[Ha]){var oa=void 0,ea=r,Ab=I,Bb=S[P],Sa=D[P],Za=P,ub=K(c.CBANDS),sb=K(c.CBANDS),Ja=X(c.CBANDS+2);b(ea,Ab,Bb,ub,sb);v(ea,ub,
sb,Ja);var Rb=0;for(oa=0;oa<ea.npart_l;oa++){var Xb,db=ea.s3ind[oa][0],cc=ea.s3ind[oa][1],Cb=0,Db=0;Cb=Ja[db];Db+=1;var $a=ea.s3_ll[Rb]*Bb[db]*J[Ja[db]];++Rb;for(++db;db<=cc;){Cb+=Ja[db];Db+=1;var vb=ea.s3_ll[Rb]*Bb[db]*J[Ja[db]];$a=Xb=n($a,vb,db-oa);++Rb;++db}Cb=(1+2*Cb)/(2*Db);var Ta=.5*J[Cb];$a*=Ta;if(ea.blocktype_old[Za&1]==c.SHORT_TYPE){var wb=2*ea.nb_1[Za][oa];Sa[oa]=0<wb?Math.min($a,wb):Math.min($a,.3*Bb[oa])}else{var Yb=16*ea.nb_2[Za][oa],eb=2*ea.nb_1[Za][oa];0>=Yb&&(Yb=$a);0>=eb&&(eb=$a);
wb=ea.blocktype_old[Za&1]==c.NORM_TYPE?Math.min(eb,Yb):eb;Sa[oa]=Math.min($a,wb)}ea.nb_2[Za][oa]=ea.nb_1[Za][oa];ea.nb_1[Za][oa]=$a;vb=ub[oa];vb*=ea.minval_l[oa];vb*=Ta;Sa[oa]>vb&&(Sa[oa]=vb);1<ea.masking_lower&&(Sa[oa]*=ea.masking_lower);Sa[oa]>Bb[oa]&&(Sa[oa]=Bb[oa]);1>ea.masking_lower&&(Sa[oa]*=ea.masking_lower)}for(;oa<c.CBANDS;++oa)Bb[oa]=0,Sa[oa]=0}else for(var Jb=r,lb=P,xb=0;xb<Jb.npart_l;xb++)Jb.nb_2[lb][xb]=Jb.nb_1[lb][xb],Jb.nb_1[lb][xb]=0}2==H[0]+H[1]&&d.mode==la.JOINT_STEREO&&a(S,D,r.mld_cb_l,
r.ATH.cb_l,d.ATHlower*r.ATH.adjust,d.msfix,r.npart_l);for(P=0;P<N;P++)Ha=P&1,0!=H[Ha]&&E(r,S[P],D[P],P);for(var fa=0;3>fa;fa++){for(P=0;P<N;++P)if(Ha=P&1,0!=H[Ha]){var Ca=r,Sb=P;if(0==fa)for(var Eb=0;Eb<Ca.npart_s;Eb++)Ca.nb_s2[Sb][Eb]=Ca.nb_s1[Sb][Eb],Ca.nb_s1[Sb][Eb]=0}else{t=z;var fb=P,Oa=fa,ka=C,Ua=t,gb=Ha,gc=d.internal_flags;0==Oa&&2>fb&&q.fft_short(gc,Ua[gb],fb,h,e);if(2==fb)for(var ua=c.BLKSIZE_s-1;0<=ua;--ua){var Kb=Ua[gb+0][Oa][ua],hc=Ua[gb+1][Oa][ua];Ua[gb+0][Oa][ua]=(Kb+hc)*aa.SQRT2*.5;
Ua[gb+1][Oa][ua]=(Kb-hc)*aa.SQRT2*.5}ka[Oa][0]=Ua[gb+0][Oa][0];ka[Oa][0]*=ka[Oa][0];for(ua=c.BLKSIZE_s/2-1;0<=ua;--ua){var Zb=Ua[gb+0][Oa][c.BLKSIZE_s/2-ua],wa=Ua[gb+0][Oa][c.BLKSIZE_s/2+ua];ka[Oa][c.BLKSIZE_s/2-ua]=.5*(Zb*Zb+wa*wa)}var ba=void 0,Wa=void 0,ab=void 0,mb=C,hb=S[P],Da=D[P],ib=P,Ka=fa,Ea=d.internal_flags,Lb=new float[c.CBANDS],Tb=K(c.CBANDS),Fb=new int[c.CBANDS];for(ba=Wa=0;ba<Ea.npart_s;++ba){var Ob=0,Pb=0,dc=Ea.numlines_s[ba];for(ab=0;ab<dc;++ab,++Wa){var nc=mb[Ka][Wa];Ob+=nc;Pb<nc&&
(Pb=nc)}hb[ba]=Ob;Lb[ba]=Pb;Tb[ba]=Ob/dc}for(;ba<c.CBANDS;++ba)Lb[ba]=0,Tb[ba]=0;var Mb=Ea,nb=Lb,Ub=Tb,$b=Fb,ac=J.length-1,pa=0,Pa=Ub[pa]+Ub[pa+1];if(0<Pa){var bb=nb[pa];bb<nb[pa+1]&&(bb=nb[pa+1]);Pa=20*(2*bb-Pa)/(Pa*(Mb.numlines_s[pa]+Mb.numlines_s[pa+1]-1));var ob=0|Pa;ob>ac&&(ob=ac);$b[pa]=ob}else $b[pa]=0;for(pa=1;pa<Mb.npart_s-1;pa++)Pa=Ub[pa-1]+Ub[pa]+Ub[pa+1],0<Pa?(bb=nb[pa-1],bb<nb[pa]&&(bb=nb[pa]),bb<nb[pa+1]&&(bb=nb[pa+1]),Pa=20*(3*bb-Pa)/(Pa*(Mb.numlines_s[pa-1]+Mb.numlines_s[pa]+Mb.numlines_s[pa+
1]-1)),ob=0|Pa,ob>ac&&(ob=ac),$b[pa]=ob):$b[pa]=0;Pa=Ub[pa-1]+Ub[pa];0<Pa?(bb=nb[pa-1],bb<nb[pa]&&(bb=nb[pa]),Pa=20*(2*bb-Pa)/(Pa*(Mb.numlines_s[pa-1]+Mb.numlines_s[pa]-1)),ob=0|Pa,ob>ac&&(ob=ac),$b[pa]=ob):$b[pa]=0;for(Wa=ba=0;ba<Ea.npart_s;ba++){var yb=Ea.s3ind_s[ba][0],mc=Ea.s3ind_s[ba][1];var lc=Fb[yb];var tc=1;var ic=Ea.s3_ss[Wa]*hb[yb]*J[Fb[yb]];++Wa;for(++yb;yb<=mc;){lc+=Fb[yb];tc+=1;var bc=Ea.s3_ss[Wa]*hb[yb]*J[Fb[yb]];ic=n(ic,bc,yb-ba);++Wa;++yb}lc=(1+2*lc)/(2*tc);var uc=.5*J[lc];ic*=uc;
Da[ba]=ic;Ea.nb_s2[ib][ba]=Ea.nb_s1[ib][ba];Ea.nb_s1[ib][ba]=ic;bc=Lb[ba];bc*=Ea.minval_s[ba];bc*=uc;Da[ba]>bc&&(Da[ba]=bc);1<Ea.masking_lower&&(Da[ba]*=Ea.masking_lower);Da[ba]>hb[ba]&&(Da[ba]=hb[ba]);1>Ea.masking_lower&&(Da[ba]*=Ea.masking_lower)}for(;ba<c.CBANDS;++ba)hb[ba]=0,Da[ba]=0}0==H[0]+H[1]&&d.mode==la.JOINT_STEREO&&a(S,D,r.mld_cb_s,r.ATH.cb_s,d.ATHlower*r.ATH.adjust,d.msfix,r.npart_s);for(P=0;P<N;++P)Ha=P&1,0==H[Ha]&&w(r,S[P],D[P],P,fa)}for(P=0;P<N;P++)if(Ha=P&1,0==H[Ha])for(var Vb=0;Vb<
c.SBMAX_s;Vb++){var vc=K(3);for(fa=0;3>fa;fa++){var jb=r.thm[P].s[Vb][fa];jb*=.8;if(2<=L[P][fa]||1==L[P][fa+1]){var jc=0!=fa?fa-1:2,kc=B(r.thm[P].s[Vb][jc],jb,.36);jb=Math.min(jb,kc)}else if(1==L[P][fa])jc=0!=fa?fa-1:2,kc=B(r.thm[P].s[Vb][jc],jb,.18),jb=Math.min(jb,kc);else if(0!=fa&&3==L[P][fa-1]||0==fa&&3==r.nsPsy.lastAttacks[P])jc=2!=fa?fa+1:0,kc=B(r.thm[P].s[Vb][jc],jb,.18),jb=Math.min(jb,kc);jb*=O[P][fa];vc[fa]=jb}for(fa=0;3>fa;fa++)r.thm[P].s[Vb][fa]=vc[fa]}for(P=0;P<N;P++)r.nsPsy.lastAttacks[P]=
L[P][2];for(var Nb=d.internal_flags,pb=0;pb<Nb.channels_out;pb++){var oc=c.NORM_TYPE;0!=H[pb]?Nb.blocktype_old[pb]==c.SHORT_TYPE&&(oc=c.STOP_TYPE):(oc=c.SHORT_TYPE,Nb.blocktype_old[pb]==c.NORM_TYPE&&(Nb.blocktype_old[pb]=c.START_TYPE),Nb.blocktype_old[pb]==c.STOP_TYPE&&(Nb.blocktype_old[pb]=c.SHORT_TYPE));p[pb]=Nb.blocktype_old[pb];Nb.blocktype_old[pb]=oc}for(P=0;P<N;P++){if(1<P){var pc=x;var qc=-2;var rc=c.NORM_TYPE;if(p[0]==c.SHORT_TYPE||p[1]==c.SHORT_TYPE)rc=c.SHORT_TYPE;var sc=k[g][P-2]}else pc=
m,qc=0,rc=p[P],sc=l[g][P];pc[qc+P]=rc==c.SHORT_TYPE?W(sc,r.masking_lower):f(sc,r.masking_lower);d.analysis&&(r.pinfo.pe[g][P]=pc[qc+P])}return 0};this.psymodel_init=function(a){var b=a.internal_flags,f,h=!0,g=13,k=0,m=0,x=-8.25,y=-4.5,n=K(c.CBANDS),u=K(c.CBANDS),A=K(c.CBANDS),w=a.out_samplerate;switch(a.experimentalZ){default:case 0:h=!0;break;case 1:h=a.VBR==G.vbr_mtrh||a.VBR==G.vbr_mt?!1:!0;break;case 2:h=!1;break;case 3:g=8,k=-1.75,m=-.0125,x=-8.25,y=-2.25}b.ms_ener_ratio_old=.25;b.blocktype_old[0]=
b.blocktype_old[1]=c.NORM_TYPE;for(f=0;4>f;++f){for(var v=0;v<c.CBANDS;++v)b.nb_1[f][v]=1E20,b.nb_2[f][v]=1E20,b.nb_s1[f][v]=b.nb_s2[f][v]=1;for(var z=0;z<c.SBMAX_l;z++)b.en[f].l[z]=1E20,b.thm[f].l[z]=1E20;for(v=0;3>v;++v){for(z=0;z<c.SBMAX_s;z++)b.en[f].s[z][v]=1E20,b.thm[f].s[z][v]=1E20;b.nsPsy.lastAttacks[f]=0}for(v=0;9>v;v++)b.nsPsy.last_en_subshort[f][v]=10}b.loudness_sq_save[0]=b.loudness_sq_save[1]=0;b.npart_l=e(b.numlines_l,b.bo_l,b.bm_l,n,u,b.mld_l,b.PSY.bo_l_weight,w,c.BLKSIZE,b.scalefac_band.l,
c.BLKSIZE/1152,c.SBMAX_l);for(f=0;f<b.npart_l;f++)z=k,n[f]>=g&&(z=m*(n[f]-g)/(24-g)+k*(24-n[f])/(24-g)),A[f]=Math.pow(10,z/10),b.rnumlines_l[f]=0<b.numlines_l[f]?1/b.numlines_l[f]:0;b.s3_ll=l(b.s3ind,b.npart_l,n,u,A,h);for(f=v=0;f<b.npart_l;f++){m=Ma.MAX_VALUE;for(z=0;z<b.numlines_l[f];z++,v++)k=w*v/(1E3*c.BLKSIZE),k=this.ATHformula(1E3*k,a)-20,k=Math.pow(10,.1*k),k*=b.numlines_l[f],m>k&&(m=k);b.ATH.cb_l[f]=m;m=-20+20*n[f]/10;6<m&&(m=100);-15>m&&(m=-15);m-=8;b.minval_l[f]=Math.pow(10,m/10)*b.numlines_l[f]}b.npart_s=
e(b.numlines_s,b.bo_s,b.bm_s,n,u,b.mld_s,b.PSY.bo_s_weight,w,c.BLKSIZE_s,b.scalefac_band.s,c.BLKSIZE_s/384,c.SBMAX_s);for(f=v=0;f<b.npart_s;f++){z=x;n[f]>=g&&(z=y*(n[f]-g)/(24-g)+x*(24-n[f])/(24-g));A[f]=Math.pow(10,z/10);m=Ma.MAX_VALUE;for(z=0;z<b.numlines_s[f];z++,v++)k=w*v/(1E3*c.BLKSIZE_s),k=this.ATHformula(1E3*k,a)-20,k=Math.pow(10,.1*k),k*=b.numlines_s[f],m>k&&(m=k);b.ATH.cb_s[f]=m;m=-7+7*n[f]/12;12<n[f]&&(m*=1+3.1*Math.log(1+m));12>n[f]&&(m*=1+2.3*Math.log(1-m));-15>m&&(m=-15);m-=8;b.minval_s[f]=
Math.pow(10,m/10)*b.numlines_s[f]}b.s3_ss=l(b.s3ind_s,b.npart_s,n,u,A,h);p=Math.pow(10,.5625);r=Math.pow(10,1.5);t=Math.pow(10,1.5);q.init_fft(b);b.decay=Math.exp(-2.302585092994046/(.01*w/192));f=3.5;0!=(a.exp_nspsytune&2)&&(f=1);0<Math.abs(a.msfix)&&(f=a.msfix);a.msfix=f;for(h=0;h<b.npart_l;h++)b.s3ind[h][1]>b.npart_l-1&&(b.s3ind[h][1]=b.npart_l-1);b.ATH.decay=Math.pow(10,576*b.mode_gr/w*-1.2);b.ATH.adjust=.01;b.ATH.adjustLimit=1;if(-1!=a.ATHtype){v=a.out_samplerate/c.BLKSIZE;for(f=k=h=0;f<c.BLKSIZE/
2;++f)k+=v,b.ATH.eql_w[f]=1/Math.pow(10,this.ATHformula(k,a)/10),h+=b.ATH.eql_w[f];h=1/h;for(f=c.BLKSIZE/2;0<=--f;)b.ATH.eql_w[f]*=h}for(h=v=0;h<b.npart_s;++h)for(f=0;f<b.numlines_s[h];++f)++v;for(h=v=0;h<b.npart_l;++h)for(f=0;f<b.numlines_l[h];++f)++v;for(f=v=0;f<b.npart_l;f++)k=w*(v+b.numlines_l[f]/2)/(1*c.BLKSIZE),b.mld_cb_l[f]=d(k),v+=b.numlines_l[f];for(;f<c.CBANDS;++f)b.mld_cb_l[f]=1;for(f=v=0;f<b.npart_s;f++)k=w*(v+b.numlines_s[f]/2)/(1*c.BLKSIZE_s),b.mld_cb_s[f]=d(k),v+=b.numlines_s[f];for(;f<
c.CBANDS;++f)b.mld_cb_s[f]=1;return 0};this.ATHformula=function(a,b){switch(b.ATHtype){case 0:a=g(a,9);break;case 1:a=g(a,-1);break;case 2:a=g(a,0);break;case 3:a=g(a,1)+6;break;case 4:a=g(a,b.ATHcurve);break;default:a=g(a,0)}return a}}function W(){function u(){this.mask_adjust_short=this.mask_adjust=0;this.bo_l_weight=K(c.SBMAX_l);this.bo_s_weight=K(c.SBMAX_s)}function k(){this.lowerlimit=0}function n(a,b){this.lowpass=b}function V(a){return 1<a?0:0>=a?1:Math.cos(Math.PI/2*a)}function E(a,b){switch(a){case 44100:return b.version=
1,0;case 48E3:return b.version=1;case 32E3:return b.version=1,2;case 22050:return b.version=0;case 24E3:return b.version=0,1;case 16E3:return b.version=0,2;case 11025:return b.version=0;case 12E3:return b.version=0,1;case 8E3:return b.version=0,2;default:return b.version=0,-1}}function B(a,b,d){16E3>d&&(b=2);d=w.bitrate_table[b][1];for(var c=2;14>=c;c++)0<w.bitrate_table[b][c]&&Math.abs(w.bitrate_table[b][c]-a)<Math.abs(d-a)&&(d=w.bitrate_table[b][c]);return d}function U(a,b,d){16E3>d&&(b=2);for(d=
0;14>=d;d++)if(0<w.bitrate_table[b][d]&&w.bitrate_table[b][d]==a)return d;return-1}function f(a,b){var d=[new n(8,2E3),new n(16,3700),new n(24,3900),new n(32,5500),new n(40,7E3),new n(48,7500),new n(56,1E4),new n(64,11E3),new n(80,13500),new n(96,15100),new n(112,15600),new n(128,17E3),new n(160,17500),new n(192,18600),new n(224,19400),new n(256,19700),new n(320,20500)];b=e.nearestBitrateFullIndex(b);a.lowerlimit=d[b].lowpass}function b(a){var b=c.BLKSIZE+a.framesize-c.FFTOFFSET;return b=Math.max(b,
512+a.framesize-32)}function v(f,g,k,p,q,n,r){var h=f.internal_flags,x=0,y=[null,null],u=[null,null];if(4294479419!=h.Class_ID)return-3;if(0==p)return 0;var t=d.copy_buffer(h,q,n,r,0);if(0>t)return t;n+=t;x+=t;u[0]=g;u[1]=k;if(qa.NEQ(f.scale,0)&&qa.NEQ(f.scale,1))for(t=0;t<p;++t)u[0][t]*=f.scale,2==h.channels_out&&(u[1][t]*=f.scale);if(qa.NEQ(f.scale_left,0)&&qa.NEQ(f.scale_left,1))for(t=0;t<p;++t)u[0][t]*=f.scale_left;if(qa.NEQ(f.scale_right,0)&&qa.NEQ(f.scale_right,1))for(t=0;t<p;++t)u[1][t]*=f.scale_right;
if(2==f.num_channels&&1==h.channels_out)for(t=0;t<p;++t)u[0][t]=.5*(u[0][t]+u[1][t]),u[1][t]=0;g=b(f);y[0]=h.mfbuf[0];y[1]=h.mfbuf[1];for(k=0;0<p;){var v=[null,null];v[0]=u[0];v[1]=u[1];t=new a;var A=f;var w=y;var B=k,E=p,D=t,H=A.internal_flags;if(.9999>H.resample_ratio||1.0001<H.resample_ratio)for(var O=0;O<H.channels_out;O++){var G=new m,J=D,N,V=w[O],T=H.mf_size,U=A.framesize,W=v[O],X=B,aa=E,ha=G,la=O,ca=A.internal_flags,ia=0,sa=A.out_samplerate/z(A.out_samplerate,A.in_samplerate);sa>da.BPC&&(sa=
da.BPC);var ra=1E-4>Math.abs(ca.resample_ratio-Math.floor(.5+ca.resample_ratio))?1:0;var R=1/ca.resample_ratio;1<R&&(R=1);var na=31;0==na%2&&--na;na+=ra;ra=na+1;if(0==ca.fill_buffer_resample_init){ca.inbuf_old[0]=K(ra);ca.inbuf_old[1]=K(ra);for(N=0;N<=2*sa;++N)ca.blackfilt[N]=K(ra);ca.itime[0]=0;for(ia=ca.itime[1]=0;ia<=2*sa;ia++){var M=0,za=(ia-sa)/(2*sa);for(N=0;N<=na;N++){var Fa=ca.blackfilt[ia],Ia=N,xa=N-za,Qa=Math.PI*R;xa/=na;0>xa&&(xa=0);1<xa&&(xa=1);var Ma=xa-.5;xa=.42-.5*Math.cos(2*xa*Math.PI)+
.08*Math.cos(4*xa*Math.PI);M+=Fa[Ia]=1E-9>Math.abs(Ma)?Qa/Math.PI:xa*Math.sin(na*Qa*Ma)/(Math.PI*na*Ma)}for(N=0;N<=na;N++)ca.blackfilt[ia][N]/=M}ca.fill_buffer_resample_init=1}M=ca.inbuf_old[la];for(R=0;R<U;R++){N=R*ca.resample_ratio;ia=0|Math.floor(N-ca.itime[la]);if(na+ia-na/2>=aa)break;za=N-ca.itime[la]-(ia+na%2*.5);za=0|Math.floor(2*za*sa+sa+.5);for(N=Fa=0;N<=na;++N)Ia=0|N+ia-na/2,Fa+=(0>Ia?M[ra+Ia]:W[X+Ia])*ca.blackfilt[za][N];V[T+R]=Fa}ha.num_used=Math.min(aa,na+ia-na/2);ca.itime[la]+=ha.num_used-
R*ca.resample_ratio;if(ha.num_used>=ra)for(N=0;N<ra;N++)M[N]=W[X+ha.num_used+N-ra];else{V=ra-ha.num_used;for(N=0;N<V;++N)M[N]=M[N+ha.num_used];for(ia=0;N<ra;++N,++ia)M[N]=W[X+ia]}J.n_out=R;D.n_in=G.num_used}else for(D.n_out=Math.min(A.framesize,E),D.n_in=D.n_out,A=0;A<D.n_out;++A)w[0][H.mf_size+A]=v[0][B+A],2==H.channels_out&&(w[1][H.mf_size+A]=v[1][B+A]);w=t.n_in;t=t.n_out;if(h.findReplayGain&&!h.decode_on_the_fly&&l.AnalyzeSamples(h.rgdata,y[0],h.mf_size,y[1],h.mf_size,t,h.channels_out)==Y.GAIN_ANALYSIS_ERROR)return-6;
p-=w;k+=w;h.mf_size+=t;1>h.mf_samples_to_encode&&(h.mf_samples_to_encode=c.ENCDELAY+c.POSTDELAY);h.mf_samples_to_encode+=t;if(h.mf_size>=g){w=r-x;0==r&&(w=0);t=f;w=e.enc.lame_encode_mp3_frame(t,y[0],y[1],q,n,w);t.frameNum++;t=w;if(0>t)return t;n+=t;x+=t;h.mf_size-=f.framesize;h.mf_samples_to_encode-=f.framesize;for(w=0;w<h.channels_out;w++)for(t=0;t<h.mf_size;t++)y[w][t]=y[w][t+f.framesize]}}return x}function a(){this.n_out=this.n_in=0}function m(){this.num_used=0}function z(a,b){return 0!=b?z(b,
a%b):a}var e=this;W.V9=410;W.V8=420;W.V7=430;W.V6=440;W.V5=450;W.V4=460;W.V3=470;W.V2=480;W.V1=490;W.V0=500;W.R3MIX=1E3;W.STANDARD=1001;W.EXTREME=1002;W.INSANE=1003;W.STANDARD_FAST=1004;W.EXTREME_FAST=1005;W.MEDIUM=1006;W.MEDIUM_FAST=1007;W.LAME_MAXMP3BUFFER=147456;var l,d,g,q,D,p=new Pb,r,t,J;this.enc=new c;this.setModules=function(a,b,c,f,e,k,m,n,u){l=a;d=b;g=c;q=f;D=e;r=k;t=n;J=u;this.enc.setModules(d,p,q,r)};this.lame_init=function(){var a=new zc;a.class_id=4294479419;var b=a.internal_flags=new da;
a.mode=la.NOT_SET;a.original=1;a.in_samplerate=44100;a.num_channels=2;a.num_samples=-1;a.bWriteVbrTag=!0;a.quality=-1;a.short_blocks=null;b.subblock_gain=-1;a.lowpassfreq=0;a.highpassfreq=0;a.lowpasswidth=-1;a.highpasswidth=-1;a.VBR=G.vbr_off;a.VBR_q=4;a.ATHcurve=-1;a.VBR_mean_bitrate_kbps=128;a.VBR_min_bitrate_kbps=0;a.VBR_max_bitrate_kbps=0;a.VBR_hard_min=0;b.VBR_min_bitrate=1;b.VBR_max_bitrate=13;a.quant_comp=-1;a.quant_comp_short=-1;a.msfix=-1;b.resample_ratio=1;b.OldValue[0]=180;b.OldValue[1]=
180;b.CurrentStep[0]=4;b.CurrentStep[1]=4;b.masking_lower=1;b.nsPsy.attackthre=-1;b.nsPsy.attackthre_s=-1;a.scale=-1;a.athaa_type=-1;a.ATHtype=-1;a.athaa_loudapprox=-1;a.athaa_sensitivity=0;a.useTemporal=null;a.interChRatio=-1;b.mf_samples_to_encode=c.ENCDELAY+c.POSTDELAY;a.encoder_padding=0;b.mf_size=c.ENCDELAY-c.MDCTDELAY;a.findReplayGain=!1;a.decode_on_the_fly=!1;b.decode_on_the_fly=!1;b.findReplayGain=!1;b.findPeakSample=!1;b.RadioGain=0;b.AudiophileGain=0;b.noclipGainChange=0;b.noclipScale=-1;
a.preset=0;a.write_id3tag_automatic=!0;a.lame_allocated_gfp=1;return a};this.nearestBitrateFullIndex=function(a){var b=[8,16,24,32,40,48,56,64,80,96,112,128,160,192,224,256,320];var d=b[16];var c=16;var f=b[16];var e=16;for(var h=0;16>h;h++)if(Math.max(a,b[h+1])!=a){d=b[h+1];c=h+1;f=b[h];e=h;break}return d-a>a-f?e:c};this.lame_init_params=function(a){var b=a.internal_flags;b.Class_ID=0;null==b.ATH&&(b.ATH=new Cc);null==b.PSY&&(b.PSY=new u);null==b.rgdata&&(b.rgdata=new Ac);b.channels_in=a.num_channels;
1==b.channels_in&&(a.mode=la.MONO);b.channels_out=a.mode==la.MONO?1:2;b.mode_ext=c.MPG_MD_MS_LR;a.mode==la.MONO&&(a.force_ms=!1);a.VBR==G.vbr_off&&128!=a.VBR_mean_bitrate_kbps&&0==a.brate&&(a.brate=a.VBR_mean_bitrate_kbps);a.VBR!=G.vbr_off&&a.VBR!=G.vbr_mtrh&&a.VBR!=G.vbr_mt&&(a.free_format=!1);a.VBR==G.vbr_off&&0==a.brate&&qa.EQ(a.compression_ratio,0)&&(a.compression_ratio=11.025);a.VBR==G.vbr_off&&0<a.compression_ratio&&(0==a.out_samplerate&&(a.out_samplerate=map2MP3Frequency(int(.97*a.in_samplerate))),
a.brate=0|16*a.out_samplerate*b.channels_out/(1E3*a.compression_ratio),b.samplerate_index=E(a.out_samplerate,a),a.free_format||(a.brate=B(a.brate,a.version,a.out_samplerate)));0!=a.out_samplerate&&(16E3>a.out_samplerate?(a.VBR_mean_bitrate_kbps=Math.max(a.VBR_mean_bitrate_kbps,8),a.VBR_mean_bitrate_kbps=Math.min(a.VBR_mean_bitrate_kbps,64)):32E3>a.out_samplerate?(a.VBR_mean_bitrate_kbps=Math.max(a.VBR_mean_bitrate_kbps,8),a.VBR_mean_bitrate_kbps=Math.min(a.VBR_mean_bitrate_kbps,160)):(a.VBR_mean_bitrate_kbps=
Math.max(a.VBR_mean_bitrate_kbps,32),a.VBR_mean_bitrate_kbps=Math.min(a.VBR_mean_bitrate_kbps,320)));if(0==a.lowpassfreq){switch(a.VBR){case G.vbr_off:var e=new k;f(e,a.brate);e=e.lowerlimit;break;case G.vbr_abr:e=new k;f(e,a.VBR_mean_bitrate_kbps);e=e.lowerlimit;break;case G.vbr_rh:var h=[19500,19E3,18600,18E3,17500,16E3,15600,14900,12500,1E4,3950];if(0<=a.VBR_q&&9>=a.VBR_q){e=h[a.VBR_q];h=h[a.VBR_q+1];var m=a.VBR_q_frac;e=linear_int(e,h,m)}else e=19500;break;default:h=[19500,19E3,18500,18E3,17500,
16500,15500,14500,12500,9500,3950],0<=a.VBR_q&&9>=a.VBR_q?(e=h[a.VBR_q],h=h[a.VBR_q+1],m=a.VBR_q_frac,e=linear_int(e,h,m)):e=19500}a.mode!=la.MONO||a.VBR!=G.vbr_off&&a.VBR!=G.vbr_abr||(e*=1.5);a.lowpassfreq=e|0}0==a.out_samplerate&&(2*a.lowpassfreq>a.in_samplerate&&(a.lowpassfreq=a.in_samplerate/2),e=a.lowpassfreq|0,h=a.in_samplerate,m=44100,48E3<=h?m=48E3:44100<=h?m=44100:32E3<=h?m=32E3:24E3<=h?m=24E3:22050<=h?m=22050:16E3<=h?m=16E3:12E3<=h?m=12E3:11025<=h?m=11025:8E3<=h&&(m=8E3),-1==e?e=m:(15960>=
e&&(m=44100),15250>=e&&(m=32E3),11220>=e&&(m=24E3),9970>=e&&(m=22050),7230>=e&&(m=16E3),5420>=e&&(m=12E3),4510>=e&&(m=11025),3970>=e&&(m=8E3),e=h<m?44100<h?48E3:32E3<h?44100:24E3<h?32E3:22050<h?24E3:16E3<h?22050:12E3<h?16E3:11025<h?12E3:8E3<h?11025:8E3:m),a.out_samplerate=e);a.lowpassfreq=Math.min(20500,a.lowpassfreq);a.lowpassfreq=Math.min(a.out_samplerate/2,a.lowpassfreq);a.VBR==G.vbr_off&&(a.compression_ratio=16*a.out_samplerate*b.channels_out/(1E3*a.brate));a.VBR==G.vbr_abr&&(a.compression_ratio=
16*a.out_samplerate*b.channels_out/(1E3*a.VBR_mean_bitrate_kbps));a.bWriteVbrTag||(a.findReplayGain=!1,a.decode_on_the_fly=!1,b.findPeakSample=!1);b.findReplayGain=a.findReplayGain;b.decode_on_the_fly=a.decode_on_the_fly;b.decode_on_the_fly&&(b.findPeakSample=!0);if(b.findReplayGain&&l.InitGainAnalysis(b.rgdata,a.out_samplerate)==Y.INIT_GAIN_ANALYSIS_ERROR)return a.internal_flags=null,-6;b.decode_on_the_fly&&!a.decode_only&&(null!=b.hip&&J.hip_decode_exit(b.hip),b.hip=J.hip_decode_init());b.mode_gr=
24E3>=a.out_samplerate?1:2;a.framesize=576*b.mode_gr;a.encoder_delay=c.ENCDELAY;b.resample_ratio=a.in_samplerate/a.out_samplerate;switch(a.VBR){case G.vbr_mt:case G.vbr_rh:case G.vbr_mtrh:a.compression_ratio=[5.7,6.5,7.3,8.2,10,11.9,13,14,15,16.5][a.VBR_q];break;case G.vbr_abr:a.compression_ratio=16*a.out_samplerate*b.channels_out/(1E3*a.VBR_mean_bitrate_kbps);break;default:a.compression_ratio=16*a.out_samplerate*b.channels_out/(1E3*a.brate)}a.mode==la.NOT_SET&&(a.mode=la.JOINT_STEREO);0<a.highpassfreq?
(b.highpass1=2*a.highpassfreq,b.highpass2=0<=a.highpasswidth?2*(a.highpassfreq+a.highpasswidth):2*a.highpassfreq,b.highpass1/=a.out_samplerate,b.highpass2/=a.out_samplerate):(b.highpass1=0,b.highpass2=0);0<a.lowpassfreq?(b.lowpass2=2*a.lowpassfreq,0<=a.lowpasswidth?(b.lowpass1=2*(a.lowpassfreq-a.lowpasswidth),0>b.lowpass1&&(b.lowpass1=0)):b.lowpass1=2*a.lowpassfreq,b.lowpass1/=a.out_samplerate,b.lowpass2/=a.out_samplerate):(b.lowpass1=0,b.lowpass2=0);e=a.internal_flags;var n=32,v=-1;if(0<e.lowpass1){var z=
999;for(h=0;31>=h;h++)m=h/31,m>=e.lowpass2&&(n=Math.min(n,h)),e.lowpass1<m&&m<e.lowpass2&&(z=Math.min(z,h));e.lowpass1=999==z?(n-.75)/31:(z-.75)/31;e.lowpass2=n/31}0<e.highpass2&&e.highpass2<.75/31*.9&&(e.highpass1=0,e.highpass2=0,T.err.println("Warning: highpass filter disabled.  highpass frequency too small\n"));if(0<e.highpass2){n=-1;for(h=0;31>=h;h++)m=h/31,m<=e.highpass1&&(v=Math.max(v,h)),e.highpass1<m&&m<e.highpass2&&(n=Math.max(n,h));e.highpass1=v/31;e.highpass2=-1==n?(v+.75)/31:(n+.75)/31}for(h=
0;32>h;h++)m=h/31,v=e.highpass2>e.highpass1?V((e.highpass2-m)/(e.highpass2-e.highpass1+1E-20)):1,m=e.lowpass2>e.lowpass1?V((m-e.lowpass1)/(e.lowpass2-e.lowpass1+1E-20)):1,e.amp_filter[h]=v*m;b.samplerate_index=E(a.out_samplerate,a);if(0>b.samplerate_index)return a.internal_flags=null,-1;if(a.VBR==G.vbr_off)if(a.free_format)b.bitrate_index=0;else{if(a.brate=B(a.brate,a.version,a.out_samplerate),b.bitrate_index=U(a.brate,a.version,a.out_samplerate),0>=b.bitrate_index)return a.internal_flags=null,-1}else b.bitrate_index=
1;a.analysis&&(a.bWriteVbrTag=!1);null!=b.pinfo&&(a.bWriteVbrTag=!1);d.init_bit_stream_w(b);e=b.samplerate_index+3*a.version+6*(16E3>a.out_samplerate?1:0);for(h=0;h<c.SBMAX_l+1;h++)b.scalefac_band.l[h]=q.sfBandIndex[e].l[h];for(h=0;h<c.PSFB21+1;h++)m=(b.scalefac_band.l[22]-b.scalefac_band.l[21])/c.PSFB21,m=b.scalefac_band.l[21]+h*m,b.scalefac_band.psfb21[h]=m;b.scalefac_band.psfb21[c.PSFB21]=576;for(h=0;h<c.SBMAX_s+1;h++)b.scalefac_band.s[h]=q.sfBandIndex[e].s[h];for(h=0;h<c.PSFB12+1;h++)m=(b.scalefac_band.s[13]-
b.scalefac_band.s[12])/c.PSFB12,m=b.scalefac_band.s[12]+h*m,b.scalefac_band.psfb12[h]=m;b.scalefac_band.psfb12[c.PSFB12]=192;b.sideinfo_len=1==a.version?1==b.channels_out?21:36:1==b.channels_out?13:21;a.error_protection&&(b.sideinfo_len+=2);e=a.internal_flags;a.frameNum=0;a.write_id3tag_automatic&&t.id3tag_write_v2(a);e.bitrate_stereoMode_Hist=Ia([16,5]);e.bitrate_blockType_Hist=Ia([16,6]);e.PeakSample=0;a.bWriteVbrTag&&r.InitVbrTag(a);b.Class_ID=4294479419;for(e=0;19>e;e++)b.nsPsy.pefirbuf[e]=700*
b.mode_gr*b.channels_out;-1==a.ATHtype&&(a.ATHtype=4);switch(a.VBR){case G.vbr_mt:a.VBR=G.vbr_mtrh;case G.vbr_mtrh:null==a.useTemporal&&(a.useTemporal=!1);g.apply_preset(a,500-10*a.VBR_q,0);0>a.quality&&(a.quality=LAME_DEFAULT_QUALITY);5>a.quality&&(a.quality=0);5<a.quality&&(a.quality=5);b.PSY.mask_adjust=a.maskingadjust;b.PSY.mask_adjust_short=a.maskingadjust_short;b.sfb21_extra=a.experimentalY?!1:44E3<a.out_samplerate;b.iteration_loop=new VBRNewIterationLoop(D);break;case G.vbr_rh:g.apply_preset(a,
500-10*a.VBR_q,0);b.PSY.mask_adjust=a.maskingadjust;b.PSY.mask_adjust_short=a.maskingadjust_short;b.sfb21_extra=a.experimentalY?!1:44E3<a.out_samplerate;6<a.quality&&(a.quality=6);0>a.quality&&(a.quality=LAME_DEFAULT_QUALITY);b.iteration_loop=new VBROldIterationLoop(D);break;default:b.sfb21_extra=!1,0>a.quality&&(a.quality=LAME_DEFAULT_QUALITY),e=a.VBR,e==G.vbr_off&&(a.VBR_mean_bitrate_kbps=a.brate),g.apply_preset(a,a.VBR_mean_bitrate_kbps,0),a.VBR=e,b.PSY.mask_adjust=a.maskingadjust,b.PSY.mask_adjust_short=
a.maskingadjust_short,b.iteration_loop=e==G.vbr_off?new Bc(D):new ABRIterationLoop(D)}if(a.VBR!=G.vbr_off){b.VBR_min_bitrate=1;b.VBR_max_bitrate=14;16E3>a.out_samplerate&&(b.VBR_max_bitrate=8);if(0!=a.VBR_min_bitrate_kbps&&(a.VBR_min_bitrate_kbps=B(a.VBR_min_bitrate_kbps,a.version,a.out_samplerate),b.VBR_min_bitrate=U(a.VBR_min_bitrate_kbps,a.version,a.out_samplerate),0>b.VBR_min_bitrate)||0!=a.VBR_max_bitrate_kbps&&(a.VBR_max_bitrate_kbps=B(a.VBR_max_bitrate_kbps,a.version,a.out_samplerate),b.VBR_max_bitrate=
U(a.VBR_max_bitrate_kbps,a.version,a.out_samplerate),0>b.VBR_max_bitrate))return-1;a.VBR_min_bitrate_kbps=w.bitrate_table[a.version][b.VBR_min_bitrate];a.VBR_max_bitrate_kbps=w.bitrate_table[a.version][b.VBR_max_bitrate];a.VBR_mean_bitrate_kbps=Math.min(w.bitrate_table[a.version][b.VBR_max_bitrate],a.VBR_mean_bitrate_kbps);a.VBR_mean_bitrate_kbps=Math.max(w.bitrate_table[a.version][b.VBR_min_bitrate],a.VBR_mean_bitrate_kbps)}a.tune&&(b.PSY.mask_adjust+=a.tune_value_a,b.PSY.mask_adjust_short+=a.tune_value_a);
e=a.internal_flags;switch(a.quality){default:case 9:e.psymodel=0;e.noise_shaping=0;e.noise_shaping_amp=0;e.noise_shaping_stop=0;e.use_best_huffman=0;e.full_outer_loop=0;break;case 8:a.quality=7;case 7:e.psymodel=1;e.noise_shaping=0;e.noise_shaping_amp=0;e.noise_shaping_stop=0;e.use_best_huffman=0;e.full_outer_loop=0;break;case 6:e.psymodel=1;0==e.noise_shaping&&(e.noise_shaping=1);e.noise_shaping_amp=0;e.noise_shaping_stop=0;-1==e.subblock_gain&&(e.subblock_gain=1);e.use_best_huffman=0;e.full_outer_loop=
0;break;case 5:e.psymodel=1;0==e.noise_shaping&&(e.noise_shaping=1);e.noise_shaping_amp=0;e.noise_shaping_stop=0;-1==e.subblock_gain&&(e.subblock_gain=1);e.use_best_huffman=0;e.full_outer_loop=0;break;case 4:e.psymodel=1;0==e.noise_shaping&&(e.noise_shaping=1);e.noise_shaping_amp=0;e.noise_shaping_stop=0;-1==e.subblock_gain&&(e.subblock_gain=1);e.use_best_huffman=1;e.full_outer_loop=0;break;case 3:e.psymodel=1;0==e.noise_shaping&&(e.noise_shaping=1);e.noise_shaping_amp=1;e.noise_shaping_stop=1;-1==
e.subblock_gain&&(e.subblock_gain=1);e.use_best_huffman=1;e.full_outer_loop=0;break;case 2:e.psymodel=1;0==e.noise_shaping&&(e.noise_shaping=1);0==e.substep_shaping&&(e.substep_shaping=2);e.noise_shaping_amp=1;e.noise_shaping_stop=1;-1==e.subblock_gain&&(e.subblock_gain=1);e.use_best_huffman=1;e.full_outer_loop=0;break;case 1:e.psymodel=1;0==e.noise_shaping&&(e.noise_shaping=1);0==e.substep_shaping&&(e.substep_shaping=2);e.noise_shaping_amp=2;e.noise_shaping_stop=1;-1==e.subblock_gain&&(e.subblock_gain=
1);e.use_best_huffman=1;e.full_outer_loop=0;break;case 0:e.psymodel=1,0==e.noise_shaping&&(e.noise_shaping=1),0==e.substep_shaping&&(e.substep_shaping=2),e.noise_shaping_amp=2,e.noise_shaping_stop=1,-1==e.subblock_gain&&(e.subblock_gain=1),e.use_best_huffman=1,e.full_outer_loop=0}b.ATH.useAdjust=0>a.athaa_type?3:a.athaa_type;b.ATH.aaSensitivityP=Math.pow(10,a.athaa_sensitivity/-10);null==a.short_blocks&&(a.short_blocks=ra.short_block_allowed);a.short_blocks!=ra.short_block_allowed||a.mode!=la.JOINT_STEREO&&
a.mode!=la.STEREO||(a.short_blocks=ra.short_block_coupled);0>a.quant_comp&&(a.quant_comp=1);0>a.quant_comp_short&&(a.quant_comp_short=0);0>a.msfix&&(a.msfix=0);a.exp_nspsytune|=1;0>a.internal_flags.nsPsy.attackthre&&(a.internal_flags.nsPsy.attackthre=Pb.NSATTACKTHRE);0>a.internal_flags.nsPsy.attackthre_s&&(a.internal_flags.nsPsy.attackthre_s=Pb.NSATTACKTHRE_S);0>a.scale&&(a.scale=1);0>a.ATHtype&&(a.ATHtype=4);0>a.ATHcurve&&(a.ATHcurve=4);0>a.athaa_loudapprox&&(a.athaa_loudapprox=2);0>a.interChRatio&&
(a.interChRatio=0);null==a.useTemporal&&(a.useTemporal=!0);b.slot_lag=b.frac_SpF=0;a.VBR==G.vbr_off&&(b.slot_lag=b.frac_SpF=72E3*(a.version+1)*a.brate%a.out_samplerate|0);q.iteration_init(a);p.psymodel_init(a);return 0};this.lame_encode_flush=function(a,e,f,g){var k=a.internal_flags,l=dc([2,1152]),h=0,m=k.mf_samples_to_encode-c.POSTDELAY,p=b(a);if(1>k.mf_samples_to_encode)return 0;var n=0;a.in_samplerate!=a.out_samplerate&&(m+=16*a.out_samplerate/a.in_samplerate);var q=a.framesize-m%a.framesize;576>
q&&(q+=a.framesize);a.encoder_padding=q;for(q=(m+q)/a.framesize;0<q&&0<=h;){var r=p-k.mf_size;m=a.frameNum;r*=a.in_samplerate;r/=a.out_samplerate;1152<r&&(r=1152);1>r&&(r=1);h=g-n;0==g&&(h=0);h=this.lame_encode_buffer(a,l[0],l[1],r,e,f,h);f+=h;n+=h;q-=m!=a.frameNum?1:0}k.mf_samples_to_encode=0;if(0>h)return h;h=g-n;0==g&&(h=0);d.flush_bitstream(a);h=d.copy_buffer(k,e,f,h,1);if(0>h)return h;f+=h;n+=h;h=g-n;0==g&&(h=0);if(a.write_id3tag_automatic){t.id3tag_write_v1(a);h=d.copy_buffer(k,e,f,h,0);if(0>
h)return h;n+=h}return n};this.lame_encode_buffer=function(a,b,d,c,e,f,g){var h=a.internal_flags,k=[null,null];if(4294479419!=h.Class_ID)return-3;if(0==c)return 0;if(null==h.in_buffer_0||h.in_buffer_nsamples<c)h.in_buffer_0=K(c),h.in_buffer_1=K(c),h.in_buffer_nsamples=c;k[0]=h.in_buffer_0;k[1]=h.in_buffer_1;for(var l=0;l<c;l++)k[0][l]=b[l],1<h.channels_in&&(k[1][l]=d[l]);return v(a,k[0],k[1],c,e,f,g)}}function Kc(){this.setModules=function(c,k){}}function Lc(){this.setModules=function(c,k,n){}}function Mc(){}
function Nc(){this.setModules=function(c,k){}}function Fa(){this.sampleRate=this.channels=this.dataLen=this.dataOffset=0}function cc(c){return c.charCodeAt(0)<<24|c.charCodeAt(1)<<16|c.charCodeAt(2)<<8|c.charCodeAt(3)}var na={fill:function(c,k,n,w){if(2==arguments.length)for(var u=0;u<c.length;u++)c[u]=arguments[1];else for(u=k;u<n;u++)c[u]=w}},T={arraycopy:function(c,k,n,w,E){for(E=k+E;k<E;)n[w++]=c[k++]}},aa={SQRT2:1.4142135623730951,FAST_LOG10:function(c){return Math.log10(c)},FAST_LOG10_X:function(c,
k){return Math.log10(c)*k}};ra.short_block_allowed=new ra(0);ra.short_block_coupled=new ra(1);ra.short_block_dispensed=new ra(2);ra.short_block_forced=new ra(3);var Ma={MAX_VALUE:3.4028235E38};G.vbr_off=new G(0);G.vbr_mt=new G(1);G.vbr_rh=new G(2);G.vbr_abr=new G(3);G.vbr_mtrh=new G(4);G.vbr_default=G.vbr_mtrh;la.STEREO=new la(0);la.JOINT_STEREO=new la(1);la.DUAL_CHANNEL=new la(2);la.MONO=new la(3);la.NOT_SET=new la(4);Y.STEPS_per_dB=100;Y.MAX_dB=120;Y.GAIN_NOT_ENOUGH_SAMPLES=-24601;Y.GAIN_ANALYSIS_ERROR=
0;Y.GAIN_ANALYSIS_OK=1;Y.INIT_GAIN_ANALYSIS_ERROR=0;Y.INIT_GAIN_ANALYSIS_OK=1;Y.YULE_ORDER=10;Y.MAX_ORDER=Y.YULE_ORDER;Y.MAX_SAMP_FREQ=48E3;Y.RMS_WINDOW_TIME_NUMERATOR=1;Y.RMS_WINDOW_TIME_DENOMINATOR=20;Y.MAX_SAMPLES_PER_WINDOW=Y.MAX_SAMP_FREQ*Y.RMS_WINDOW_TIME_NUMERATOR/Y.RMS_WINDOW_TIME_DENOMINATOR+1;qa.EQ=function(c,k){return Math.abs(c)>Math.abs(k)?Math.abs(c-k)<=1E-6*Math.abs(c):Math.abs(c-k)<=1E-6*Math.abs(k)};qa.NEQ=function(c,k){return!qa.EQ(c,k)};zb.NUMTOCENTRIES=100;zb.MAXFRAMESIZE=2880;
var w={t1HB:[1,1,1,0],t2HB:[1,2,1,3,1,1,3,2,0],t3HB:[3,2,1,1,1,1,3,2,0],t5HB:[1,2,6,5,3,1,4,4,7,5,7,1,6,1,1,0],t6HB:[7,3,5,1,6,2,3,2,5,4,4,1,3,3,2,0],t7HB:[1,2,10,19,16,10,3,3,7,10,5,3,11,4,13,17,8,4,12,11,18,15,11,2,7,6,9,14,3,1,6,4,5,3,2,0],t8HB:[3,4,6,18,12,5,5,1,2,16,9,3,7,3,5,14,7,3,19,17,15,13,10,4,13,5,8,11,5,1,12,4,4,1,1,0],t9HB:[7,5,9,14,15,7,6,4,5,5,6,7,7,6,8,8,8,5,15,6,9,10,5,1,11,7,9,6,4,1,14,4,6,2,6,0],t10HB:[1,2,10,23,35,30,12,17,3,3,8,12,18,21,12,7,11,9,15,21,32,40,19,6,14,13,22,34,
46,23,18,7,20,19,33,47,27,22,9,3,31,22,41,26,21,20,5,3,14,13,10,11,16,6,5,1,9,8,7,8,4,4,2,0],t11HB:[3,4,10,24,34,33,21,15,5,3,4,10,32,17,11,10,11,7,13,18,30,31,20,5,25,11,19,59,27,18,12,5,35,33,31,58,30,16,7,5,28,26,32,19,17,15,8,14,14,12,9,13,14,9,4,1,11,4,6,6,6,3,2,0],t12HB:[9,6,16,33,41,39,38,26,7,5,6,9,23,16,26,11,17,7,11,14,21,30,10,7,17,10,15,12,18,28,14,5,32,13,22,19,18,16,9,5,40,17,31,29,17,13,4,2,27,12,11,15,10,7,4,1,27,12,8,12,6,3,1,0],t13HB:[1,5,14,21,34,51,46,71,42,52,68,52,67,44,43,19,
3,4,12,19,31,26,44,33,31,24,32,24,31,35,22,14,15,13,23,36,59,49,77,65,29,40,30,40,27,33,42,16,22,20,37,61,56,79,73,64,43,76,56,37,26,31,25,14,35,16,60,57,97,75,114,91,54,73,55,41,48,53,23,24,58,27,50,96,76,70,93,84,77,58,79,29,74,49,41,17,47,45,78,74,115,94,90,79,69,83,71,50,59,38,36,15,72,34,56,95,92,85,91,90,86,73,77,65,51,44,43,42,43,20,30,44,55,78,72,87,78,61,46,54,37,30,20,16,53,25,41,37,44,59,54,81,66,76,57,54,37,18,39,11,35,33,31,57,42,82,72,80,47,58,55,21,22,26,38,22,53,25,23,38,70,60,51,
36,55,26,34,23,27,14,9,7,34,32,28,39,49,75,30,52,48,40,52,28,18,17,9,5,45,21,34,64,56,50,49,45,31,19,12,15,10,7,6,3,48,23,20,39,36,35,53,21,16,23,13,10,6,1,4,2,16,15,17,27,25,20,29,11,17,12,16,8,1,1,0,1],t15HB:[7,12,18,53,47,76,124,108,89,123,108,119,107,81,122,63,13,5,16,27,46,36,61,51,42,70,52,83,65,41,59,36,19,17,15,24,41,34,59,48,40,64,50,78,62,80,56,33,29,28,25,43,39,63,55,93,76,59,93,72,54,75,50,29,52,22,42,40,67,57,95,79,72,57,89,69,49,66,46,27,77,37,35,66,58,52,91,74,62,48,79,63,90,62,40,
38,125,32,60,56,50,92,78,65,55,87,71,51,73,51,70,30,109,53,49,94,88,75,66,122,91,73,56,42,64,44,21,25,90,43,41,77,73,63,56,92,77,66,47,67,48,53,36,20,71,34,67,60,58,49,88,76,67,106,71,54,38,39,23,15,109,53,51,47,90,82,58,57,48,72,57,41,23,27,62,9,86,42,40,37,70,64,52,43,70,55,42,25,29,18,11,11,118,68,30,55,50,46,74,65,49,39,24,16,22,13,14,7,91,44,39,38,34,63,52,45,31,52,28,19,14,8,9,3,123,60,58,53,47,43,32,22,37,24,17,12,15,10,2,1,71,37,34,30,28,20,17,26,21,16,10,6,8,6,2,0],t16HB:[1,5,14,44,74,63,
110,93,172,149,138,242,225,195,376,17,3,4,12,20,35,62,53,47,83,75,68,119,201,107,207,9,15,13,23,38,67,58,103,90,161,72,127,117,110,209,206,16,45,21,39,69,64,114,99,87,158,140,252,212,199,387,365,26,75,36,68,65,115,101,179,164,155,264,246,226,395,382,362,9,66,30,59,56,102,185,173,265,142,253,232,400,388,378,445,16,111,54,52,100,184,178,160,133,257,244,228,217,385,366,715,10,98,48,91,88,165,157,148,261,248,407,397,372,380,889,884,8,85,84,81,159,156,143,260,249,427,401,392,383,727,713,708,7,154,76,73,
141,131,256,245,426,406,394,384,735,359,710,352,11,139,129,67,125,247,233,229,219,393,743,737,720,885,882,439,4,243,120,118,115,227,223,396,746,742,736,721,712,706,223,436,6,202,224,222,218,216,389,386,381,364,888,443,707,440,437,1728,4,747,211,210,208,370,379,734,723,714,1735,883,877,876,3459,865,2,377,369,102,187,726,722,358,711,709,866,1734,871,3458,870,434,0,12,10,7,11,10,17,11,9,13,12,10,7,5,3,1,3],t24HB:[15,13,46,80,146,262,248,434,426,669,653,649,621,517,1032,88,14,12,21,38,71,130,122,216,
209,198,327,345,319,297,279,42,47,22,41,74,68,128,120,221,207,194,182,340,315,295,541,18,81,39,75,70,134,125,116,220,204,190,178,325,311,293,271,16,147,72,69,135,127,118,112,210,200,188,352,323,306,285,540,14,263,66,129,126,119,114,214,202,192,180,341,317,301,281,262,12,249,123,121,117,113,215,206,195,185,347,330,308,291,272,520,10,435,115,111,109,211,203,196,187,353,332,313,298,283,531,381,17,427,212,208,205,201,193,186,177,169,320,303,286,268,514,377,16,335,199,197,191,189,181,174,333,321,305,289,
275,521,379,371,11,668,184,183,179,175,344,331,314,304,290,277,530,383,373,366,10,652,346,171,168,164,318,309,299,287,276,263,513,375,368,362,6,648,322,316,312,307,302,292,284,269,261,512,376,370,364,359,4,620,300,296,294,288,282,273,266,515,380,374,369,365,361,357,2,1033,280,278,274,267,264,259,382,378,372,367,363,360,358,356,0,43,20,19,17,15,13,11,9,7,6,4,7,5,3,1,3],t32HB:[1,10,8,20,12,20,16,32,14,12,24,0,28,16,24,16],t33HB:[15,28,26,48,22,40,36,64,14,24,20,32,12,16,8,0],t1l:[1,4,3,5],t2l:[1,4,
7,4,5,7,6,7,8],t3l:[2,3,7,4,4,7,6,7,8],t5l:[1,4,7,8,4,5,8,9,7,8,9,10,8,8,9,10],t6l:[3,4,6,8,4,4,6,7,5,6,7,8,7,7,8,9],t7l:[1,4,7,9,9,10,4,6,8,9,9,10,7,7,9,10,10,11,8,9,10,11,11,11,8,9,10,11,11,12,9,10,11,12,12,12],t8l:[2,4,7,9,9,10,4,4,6,10,10,10,7,6,8,10,10,11,9,10,10,11,11,12,9,9,10,11,12,12,10,10,11,11,13,13],t9l:[3,4,6,7,9,10,4,5,6,7,8,10,5,6,7,8,9,10,7,7,8,9,9,10,8,8,9,9,10,11,9,9,10,10,11,11],t10l:[1,4,7,9,10,10,10,11,4,6,8,9,10,11,10,10,7,8,9,10,11,12,11,11,8,9,10,11,12,12,11,12,9,10,11,12,
12,12,12,12,10,11,12,12,13,13,12,13,9,10,11,12,12,12,13,13,10,10,11,12,12,13,13,13],t11l:[2,4,6,8,9,10,9,10,4,5,6,8,10,10,9,10,6,7,8,9,10,11,10,10,8,8,9,11,10,12,10,11,9,10,10,11,11,12,11,12,9,10,11,12,12,13,12,13,9,9,9,10,11,12,12,12,9,9,10,11,12,12,12,12],t12l:[4,4,6,8,9,10,10,10,4,5,6,7,9,9,10,10,6,6,7,8,9,10,9,10,7,7,8,8,9,10,10,10,8,8,9,9,10,10,10,11,9,9,10,10,10,11,10,11,9,9,9,10,10,11,11,12,10,10,10,11,11,11,11,12],t13l:[1,5,7,8,9,10,10,11,10,11,12,12,13,13,14,14,4,6,8,9,10,10,11,11,11,11,
12,12,13,14,14,14,7,8,9,10,11,11,12,12,11,12,12,13,13,14,15,15,8,9,10,11,11,12,12,12,12,13,13,13,13,14,15,15,9,9,11,11,12,12,13,13,12,13,13,14,14,15,15,16,10,10,11,12,12,12,13,13,13,13,14,13,15,15,16,16,10,11,12,12,13,13,13,13,13,14,14,14,15,15,16,16,11,11,12,13,13,13,14,14,14,14,15,15,15,16,18,18,10,10,11,12,12,13,13,14,14,14,14,15,15,16,17,17,11,11,12,12,13,13,13,15,14,15,15,16,16,16,18,17,11,12,12,13,13,14,14,15,14,15,16,15,16,17,18,19,12,12,12,13,14,14,14,14,15,15,15,16,17,17,17,18,12,13,13,14,
14,15,14,15,16,16,17,17,17,18,18,18,13,13,14,15,15,15,16,16,16,16,16,17,18,17,18,18,14,14,14,15,15,15,17,16,16,19,17,17,17,19,18,18,13,14,15,16,16,16,17,16,17,17,18,18,21,20,21,18],t15l:[3,5,6,8,8,9,10,10,10,11,11,12,12,12,13,14,5,5,7,8,9,9,10,10,10,11,11,12,12,12,13,13,6,7,7,8,9,9,10,10,10,11,11,12,12,13,13,13,7,8,8,9,9,10,10,11,11,11,12,12,12,13,13,13,8,8,9,9,10,10,11,11,11,11,12,12,12,13,13,13,9,9,9,10,10,10,11,11,11,11,12,12,13,13,13,14,10,9,10,10,10,11,11,11,11,12,12,12,13,13,14,14,10,10,10,
11,11,11,11,12,12,12,12,12,13,13,13,14,10,10,10,11,11,11,11,12,12,12,12,13,13,14,14,14,10,10,11,11,11,11,12,12,12,13,13,13,13,14,14,14,11,11,11,11,12,12,12,12,12,13,13,13,13,14,15,14,11,11,11,11,12,12,12,12,13,13,13,13,14,14,14,15,12,12,11,12,12,12,13,13,13,13,13,13,14,14,15,15,12,12,12,12,12,13,13,13,13,14,14,14,14,14,15,15,13,13,13,13,13,13,13,13,14,14,14,14,15,15,14,15,13,13,13,13,13,13,13,14,14,14,14,14,15,15,15,15],t16_5l:[1,5,7,9,10,10,11,11,12,12,12,13,13,13,14,11,4,6,8,9,10,11,11,11,12,12,
12,13,14,13,14,11,7,8,9,10,11,11,12,12,13,12,13,13,13,14,14,12,9,9,10,11,11,12,12,12,13,13,14,14,14,15,15,13,10,10,11,11,12,12,13,13,13,14,14,14,15,15,15,12,10,10,11,11,12,13,13,14,13,14,14,15,15,15,16,13,11,11,11,12,13,13,13,13,14,14,14,14,15,15,16,13,11,11,12,12,13,13,13,14,14,15,15,15,15,17,17,13,11,12,12,13,13,13,14,14,15,15,15,15,16,16,16,13,12,12,12,13,13,14,14,15,15,15,15,16,15,16,15,14,12,13,12,13,14,14,14,14,15,16,16,16,17,17,16,13,13,13,13,13,14,14,15,16,16,16,16,16,16,15,16,14,13,14,14,
14,14,15,15,15,15,17,16,16,16,16,18,14,15,14,14,14,15,15,16,16,16,18,17,17,17,19,17,14,14,15,13,14,16,16,15,16,16,17,18,17,19,17,16,14,11,11,11,12,12,13,13,13,14,14,14,14,14,14,14,12],t16l:[1,5,7,9,10,10,11,11,12,12,12,13,13,13,14,10,4,6,8,9,10,11,11,11,12,12,12,13,14,13,14,10,7,8,9,10,11,11,12,12,13,12,13,13,13,14,14,11,9,9,10,11,11,12,12,12,13,13,14,14,14,15,15,12,10,10,11,11,12,12,13,13,13,14,14,14,15,15,15,11,10,10,11,11,12,13,13,14,13,14,14,15,15,15,16,12,11,11,11,12,13,13,13,13,14,14,14,14,
15,15,16,12,11,11,12,12,13,13,13,14,14,15,15,15,15,17,17,12,11,12,12,13,13,13,14,14,15,15,15,15,16,16,16,12,12,12,12,13,13,14,14,15,15,15,15,16,15,16,15,13,12,13,12,13,14,14,14,14,15,16,16,16,17,17,16,12,13,13,13,13,14,14,15,16,16,16,16,16,16,15,16,13,13,14,14,14,14,15,15,15,15,17,16,16,16,16,18,13,15,14,14,14,15,15,16,16,16,18,17,17,17,19,17,13,14,15,13,14,16,16,15,16,16,17,18,17,19,17,16,13,10,10,10,11,11,12,12,12,13,13,13,13,13,13,13,10],t24l:[4,5,7,8,9,10,10,11,11,12,12,12,12,12,13,10,5,6,7,8,
9,10,10,11,11,11,12,12,12,12,12,10,7,7,8,9,9,10,10,11,11,11,11,12,12,12,13,9,8,8,9,9,10,10,10,11,11,11,11,12,12,12,12,9,9,9,9,10,10,10,10,11,11,11,12,12,12,12,13,9,10,9,10,10,10,10,11,11,11,11,12,12,12,12,12,9,10,10,10,10,10,11,11,11,11,12,12,12,12,12,13,9,11,10,10,10,11,11,11,11,12,12,12,12,12,13,13,10,11,11,11,11,11,11,11,11,11,12,12,12,12,13,13,10,11,11,11,11,11,11,11,12,12,12,12,12,13,13,13,10,12,11,11,11,11,12,12,12,12,12,12,13,13,13,13,10,12,12,11,11,11,12,12,12,12,12,12,13,13,13,13,10,12,12,
12,12,12,12,12,12,12,12,13,13,13,13,13,10,12,12,12,12,12,12,12,12,13,13,13,13,13,13,13,10,13,12,12,12,12,12,12,13,13,13,13,13,13,13,13,10,9,9,9,9,9,9,9,9,9,9,9,10,10,10,10,6],t32l:[1,5,5,7,5,8,7,9,5,7,7,9,7,9,9,10],t33l:[4,5,5,6,5,6,6,7,5,6,6,7,6,7,7,8]};w.ht=[new U(0,0,null,null),new U(2,0,w.t1HB,w.t1l),new U(3,0,w.t2HB,w.t2l),new U(3,0,w.t3HB,w.t3l),new U(0,0,null,null),new U(4,0,w.t5HB,w.t5l),new U(4,0,w.t6HB,w.t6l),new U(6,0,w.t7HB,w.t7l),new U(6,0,w.t8HB,w.t8l),new U(6,0,w.t9HB,w.t9l),new U(8,
0,w.t10HB,w.t10l),new U(8,0,w.t11HB,w.t11l),new U(8,0,w.t12HB,w.t12l),new U(16,0,w.t13HB,w.t13l),new U(0,0,null,w.t16_5l),new U(16,0,w.t15HB,w.t15l),new U(1,1,w.t16HB,w.t16l),new U(2,3,w.t16HB,w.t16l),new U(3,7,w.t16HB,w.t16l),new U(4,15,w.t16HB,w.t16l),new U(6,63,w.t16HB,w.t16l),new U(8,255,w.t16HB,w.t16l),new U(10,1023,w.t16HB,w.t16l),new U(13,8191,w.t16HB,w.t16l),new U(4,15,w.t24HB,w.t24l),new U(5,31,w.t24HB,w.t24l),new U(6,63,w.t24HB,w.t24l),new U(7,127,w.t24HB,w.t24l),new U(8,255,w.t24HB,w.t24l),
new U(9,511,w.t24HB,w.t24l),new U(11,2047,w.t24HB,w.t24l),new U(13,8191,w.t24HB,w.t24l),new U(0,0,w.t32HB,w.t32l),new U(0,0,w.t33HB,w.t33l)];w.largetbl=[65540,327685,458759,589832,655369,655370,720906,720907,786443,786444,786444,851980,851980,851980,917517,655370,262149,393222,524295,589832,655369,720906,720906,720907,786443,786443,786444,851980,917516,851980,917516,655370,458759,524295,589832,655369,720905,720906,786442,786443,851979,786443,851979,851980,851980,917516,917517,720905,589832,589832,
655369,720905,720906,786442,786442,786443,851979,851979,917515,917516,917516,983052,983052,786441,655369,655369,720905,720906,786442,786442,851978,851979,851979,917515,917516,917516,983052,983052,983053,720905,655370,655369,720906,720906,786442,851978,851979,917515,851979,917515,917516,983052,983052,983052,1048588,786441,720906,720906,720906,786442,851978,851979,851979,851979,917515,917516,917516,917516,983052,983052,1048589,786441,720907,720906,786442,786442,851979,851979,851979,917515,917516,983052,
983052,983052,983052,1114125,1114125,786442,720907,786443,786443,851979,851979,851979,917515,917515,983051,983052,983052,983052,1048588,1048589,1048589,786442,786443,786443,786443,851979,851979,917515,917515,983052,983052,983052,983052,1048588,983053,1048589,983053,851978,786444,851979,786443,851979,917515,917516,917516,917516,983052,1048588,1048588,1048589,1114125,1114125,1048589,786442,851980,851980,851979,851979,917515,917516,983052,1048588,1048588,1048588,1048588,1048589,1048589,983053,1048589,
851978,851980,917516,917516,917516,917516,983052,983052,983052,983052,1114124,1048589,1048589,1048589,1048589,1179661,851978,983052,917516,917516,917516,983052,983052,1048588,1048588,1048589,1179661,1114125,1114125,1114125,1245197,1114125,851978,917517,983052,851980,917516,1048588,1048588,983052,1048589,1048589,1114125,1179661,1114125,1245197,1114125,1048589,851978,655369,655369,655369,720905,720905,786441,786441,786441,851977,851977,851977,851978,851978,851978,851978,655366];w.table23=[65538,262147,
458759,262148,327684,458759,393222,458759,524296];w.table56=[65539,262148,458758,524296,262148,327684,524294,589831,458757,524294,589831,655368,524295,524295,589832,655369];w.bitrate_table=[[0,8,16,24,32,40,48,56,64,80,96,112,128,144,160,-1],[0,32,40,48,56,64,80,96,112,128,160,192,224,256,320,-1],[0,8,16,24,32,40,48,56,64,-1,-1,-1,-1,-1,-1,-1]];w.samplerate_table=[[22050,24E3,16E3,-1],[44100,48E3,32E3,-1],[11025,12E3,8E3,-1]];w.scfsi_band=[0,6,11,16,21];ia.Q_MAX=257;ia.Q_MAX2=116;ia.LARGE_BITS=1E5;
ia.IXMAX_VAL=8206;var sa={};sa.SFBMAX=3*c.SBMAX_s;c.ENCDELAY=576;c.POSTDELAY=1152;c.MDCTDELAY=48;c.FFTOFFSET=224+c.MDCTDELAY;c.DECDELAY=528;c.SBLIMIT=32;c.CBANDS=64;c.SBPSY_l=21;c.SBPSY_s=12;c.SBMAX_l=22;c.SBMAX_s=13;c.PSFB21=6;c.PSFB12=6;c.BLKSIZE=1024;c.HBLKSIZE=c.BLKSIZE/2+1;c.BLKSIZE_s=256;c.HBLKSIZE_s=c.BLKSIZE_s/2+1;c.NORM_TYPE=0;c.START_TYPE=1;c.SHORT_TYPE=2;c.STOP_TYPE=3;c.MPG_MD_LR_LR=0;c.MPG_MD_LR_I=1;c.MPG_MD_MS_LR=2;c.MPG_MD_MS_I=3;c.fircoef=[-.1039435,-.1892065,-.0432472*5,-.155915,3.898045E-17,
.0467745*5,.50455,.756825,.187098*5];da.MFSIZE=3456+c.ENCDELAY-c.MDCTDELAY;da.MAX_HEADER_BUF=256;da.MAX_BITS_PER_CHANNEL=4095;da.MAX_BITS_PER_GRANULE=7680;da.BPC=320;Fa.RIFF=cc("RIFF");Fa.WAVE=cc("WAVE");Fa.fmt_=cc("fmt ");Fa.data=cc("data");Fa.readHeader=function(c){var k=new Fa,n=c.getUint32(0,!1);if(Fa.RIFF==n&&(c.getUint32(4,!0),Fa.WAVE==c.getUint32(8,!1)&&Fa.fmt_==c.getUint32(12,!1))){var u=c.getUint32(16,!0),w=20;switch(u){case 16:case 18:k.channels=c.getUint16(w+2,!0);k.sampleRate=c.getUint32(w+
4,!0);break;default:throw"extended fmt chunk not implemented";}w+=u;u=Fa.data;for(var B=0;u!=n;){n=c.getUint32(w,!1);B=c.getUint32(w+4,!0);if(u==n)break;w+=B+8}k.dataLen=B;k.dataOffset=w+8;return k}};sa.SFBMAX=3*c.SBMAX_s;lamejs.Mp3Encoder=function(c,k,n){3!=arguments.length&&(console.error("WARN: Mp3Encoder(channels, samplerate, kbps) not specified"),c=1,k=44100,n=128);var u=new W,w=new Kc,B=new Y,G=new qa,f=new wc,b=new ia,v=new Ec,a=new zb,m=new mc,z=new Nc,e=new xc,l=new qb,d=new Lc,g=new Mc;
u.setModules(B,G,f,b,v,a,m,z,g);G.setModules(B,g,m,a);z.setModules(G,m);f.setModules(u);v.setModules(G,e,b,l);b.setModules(l,e,u.enc.psy);e.setModules(G);l.setModules(b);a.setModules(u,G,m);w.setModules(d,g);d.setModules(m,z,f);var q=u.lame_init();q.num_channels=c;q.in_samplerate=k;q.brate=n;q.mode=la.STEREO;q.quality=3;q.bWriteVbrTag=!1;q.disable_reservoir=!0;q.write_id3tag_automatic=!1;u.lame_init_params(q);var D=1152,p=0|1.25*D+7200,r=new Int8Array(p);this.encodeBuffer=function(a,b){1==c&&(b=a);
a.length>D&&(D=a.length,p=0|1.25*D+7200,r=new Int8Array(p));a=u.lame_encode_buffer(q,a,b,a.length,r,0,p);return new Int8Array(r.subarray(0,a))};this.flush=function(){var a=u.lame_encode_flush(q,r,0,p);return new Int8Array(r.subarray(0,a))}};lamejs.WavHeader=Fa}lamejs();


window.soundRecording = new SoundRecording();

}
