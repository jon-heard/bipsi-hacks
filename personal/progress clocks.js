/**
⏲️
@file progress clocks
@summary Adds the ability to show progress-clock uis in the game.
@license MIT
@author Violgamba (Jon Heard)


@description
Adds the ability to show progress-clock uis in the game.  This is useful if your game tracks a
numeric state that you'd like to display.


HOW TO USE - BASIC:
1. Import this plugin into your game.
2. Playtest the game and note the progress-clock at the top.

HOW TO USE - SET COUNT:
1. Import this plugin into your game.
2. Add a touch script ('before', 'after' or 'touch' javascript field) to a readily touchable event.
3. Set the touch script of step 2 to the following code:
  PLAYBACK.getProgressClock(0).setCount(2);
4. Playtest the game and trigger the script of step 2.  Note that the progress-clock changes, flashes and starts pulsing.

HOW TO USE - INCREMENT AND DECREMENT COUNT:
1. Import this plugin into your game.
2. Add a touch script ('before', 'after' or 'touch' javascript field) to a readily touchable event.
3. Add a touch script to a second, readily touchable event.
4. Set the touch script of step 2 to the following code:
  if (PLAYBACK.getProgressClock(0).decrement()) {
    SAY("Progress-clock decremented to 0.");
  }
5. Set the touch script of step 3 to the following code:
  if (PLAYBACK.getProgressClock(0).incremented()) {
    SAY("Progress-clock incremented to its max.");
  }
6. Playtest the game and trigger the script of step 2.  Note that the progress-clock decrements once and flashes.
7. Playtest the game and trigger the script of step 3.  Note that the progress-clock Increments once and flashes.
8. Playtest the game and trigger the script of step 2 until the progress-clock reaches 0.  Note that a dialogue pops up telling you.

HOW TO USE - ENABLE:
1. Import this plugin into your game.
2. Set the plugin's "default-enabled" parameter to "false".
3. Add a touch script ('before', 'after' or 'touch' javascript field) to a readily touchable event.
4. Set the touch script of step 3 to the following code:
  PLAYBACK.getProgressClock(0).enabled = true;
5. Playtest the game and trigger the script of step 3.  Note that the progress-clock appears.

HOW TO USE - SET PROGRESS-CLOCK VISUAL:
1. Import this plugin into your game.
2. Set the plugin's "default-foreground-color" parameter to "green".
3. Set the plugin's "default-size" parameter to "5".
4. Set the plugin's "default-position" parameter to "[12, 12]".
4. Add a touch script ('before', 'after' or 'touch' javascript field) to a readily touchable event.
5. Set the touch script of step 4 to the following code:
  const clock = PLAYBACK.getProgressClock(0);
  clock.foregroundColor = 'blue';
  clock.size = 10;
  clock.position = [64, 12];
6. Playtest the game.  Note that the progress-clock is small, green and positioned in the screen corner.
7. Trigger the script of step 4.  Note that the progress-clock becomes large and blue and positioned at the top-middle.

HOW TO USE - ADD A NEW PROGRESS-CLOCK:
1. Import this plugin into your game.
2. Set the plugin's "auto-create-clock" parameter to "false".
2. Add a touch script ('before', 'after' or 'touch' javascript field) to a readily touchable event.
3. Set the triggerable script of step 2 to the following code:
  const clock = PLAYBACK.getProgressClock(PLAYBACK.addProgressClock());
  clock.position = [12, 12];
4. Playtest the game and trigger the script of step 2.  Note that a new progress-clock appears.

HOW TO USE - AN UNSEGMENTED (ANALOG) PROGRESS-CLOCK
1. Import this plugin into your game.
2. Set the plugin's "default-segment-count" parameter to "0".
3. Add a touch script ('before', 'after' or 'touch' javascript field) to a readily touchable event.
4. Add a touch script to a second, readily touchable event.
5. Set the touch script of step 3 to the following code:
  const clock = PLAYBACK.getProgressClock(0);
  clock.normalizedCount = Math.max(0, clock.normalizedCount - .1);
  if (clock.normalizedCount == 0) {
	  SAY("Progress-clock decremented to 0.");
  }
6. Set the touch script of step 4 to the following code:
  const clock = PLAYBACK.getProgressClock(0);
  clock.normalizedCount = Math.min(1, clock.normalizedCount + .1);
  if (clock.normalizedCount == 1) {
	  SAY("Progress-clock incremented to its max.");
  }
7. Playtest the game and trigger the script of step 3 a few times.  Note that the progress-clock decrements one tenth of it's span each time.
8. Playtest the game and trigger the script of step 4 a few times.  Note that the progress-clock Increments one tenth of it's span each time.
9. A few notes on unsegmented progress-clocks.
  - The following functions are disabled for an unsegmented progress-clock: setCount(), increment(), decrement()
  - You CAN set the normalizedCount (as is done here) for a SEGMENTED progress-clock.  If this is done then segments are ignored.
    - this is useful if you want a visual segmentation on an otherwise analogue progress-clock.


// A tag to easily identify/access this plugin from code
//!CONFIG progress-clocks-js (tag) true

// If true, one progress-clock is created automatically
//!CONFIG auto-create-clock (json) true

// Plugin functions - useful for situatons where an event's javascript fields are directly callable (like in Binksi)
// Sets the value (in clock-segments) of a single progress-clock ("count" = the count to set, "index" = the index of the progress-clock)
//!CONFIG set-count (javascript) "if (!window.progressClocks?.length) return;\nconst args = window.ARGUMENTS;\nif (!args) return;\nif (args.index === undefined) args.index = 0;\nif (args.index >= window.progressClocks.length) return;\n\nif (args.count === undefined) return;\nwindow.progressClocks[args.index].setCount(args.count);"
// Sets the number of clock segments for a single progress-clock ("count" = the number of segments to set, "index" = the index of the progress-clock)
//!CONFIG setup-clock (javascript) "if (!window.progressClocks?.length) return;\nconst args = window.ARGUMENTS;\nif (!args) return;\nif (args.index === undefined) args.index = 0;\nif (args.index >= window.progressClocks.length) return;\n\nconst clock = window.progressClocks[args.index];\n\nif(args.enabled) clock.enabled = args.enabled;\n\nif (args.segmentCount)\nclock.segmentCount = args.segmentCount;\n\nif (args.normalizedCount)\nclock.normalizedCount = args.normalizedCount;\n\nif (args.count)\nclock.normalizedCount = args.count / clock.segmentCount;\n"

// Default settings for each new progress-clock
//!CONFIG default-enabled (json) true
//!CONFIG default-warning-count (json) 2
//!CONFIG default-segment-count (json) 5
//!CONFIG default-background-color (text) "grey"
//!CONFIG default-foreground-color (text) "blue"
//!CONFIG default-outline-color (text) "black"
//!CONFIG default-flash-color (text) "yellow"
//!CONFIG default-flash-speed (json) 1
//!CONFIG default-warning-color (text) "red"
//!CONFIG default-warning-speed (json) 1.5
//!CONFIG default-line-width (json) 0.5
//!CONFIG default-size (json) 10
//!CONFIG default-position (json) [64, 12]
*/

class ProgressClock {
	normalizedCount = 1;
	segmentCount = parseInt(FIELD(CONFIG, 'default-segment-count', 'json'), 10) ?? 5;
	count = parseInt(FIELD(CONFIG, 'default-segment-count', 'json'), 10) ?? 5;
	enabled = FIELD(CONFIG, 'default-enabled', 'json') ?? true;
	warningCount = parseInt(FIELD(CONFIG, 'default-warning-count', 'json'), 10) ?? 2;
	backgroundColor = FIELD(CONFIG, 'default-background-color', 'text') || 'grey';
	foregroundColor = FIELD(CONFIG, 'default-foreground-color', 'text') || 'blue';
	outlineColor = FIELD(CONFIG, 'default-outline-color', 'text') || 'black';
	flashColor = FIELD(CONFIG, 'default-flash-color', 'text') || 'yellow';
	flashSpeed = parseInt(FIELD(CONFIG, 'default-flash-speed', 'json'), 10) ?? 1;
	warningColor = FIELD(CONFIG, 'default-warning-color', 'text') || 'red';
	warningSpeed = parseInt(FIELD(CONFIG, 'default-warning-speed', 'json'), 10) ?? 1.5;
	lineWidth = parseFloat(FIELD(CONFIG, 'default-line-width', 'json')) ?? .5;
	size = parseInt(FIELD(CONFIG, 'default-size', 'json'), 10) || 10;
	position = FIELD(CONFIG, 'default-position', 'json') || [64, 12];

	constructor() {}

	// Sets the progress-clock's available count in units of segment.  Returns true if the count is maxed.
	setCount(count) {
		if (this.segmentCount <= 0) return;
		this.count = Math.min(Math.max(count, 0), this.segmentCount);
		this.normalizedCount = this.count / this.segmentCount;
		this.inWarning = this.count <= this.warningCount;
		if (!this.inWarning) {
			this.interpolatedColor = null;
		}

		// Make sure we're using the latest colors to animate with
		this.refreshAnimatedColors();

		// Kick off the flash animation
		this.startColor = this.cachedComputedFlashColor;
		this.endColor = this.cachedComputedForeColor;
		this.flashStartTime = performance.now();
		return this.count == this.segmentCount;
	}

	// Increments the progress-clock's available count in units of segment.  Returns true if the count is maxed.
	increment() {
		if (this.segmentCount <= 0) return;
		this.setCount(this.count + 1);
		return this.count == this.segmentCount;
	}

	// Decrements the progress-clock's available count in units of segment.  Returns true if the count is at 0.
	decrement() {
		if (this.segmentCount <= 0) return;
		this.setCount(this.count - 1);
		return this.count == 0;
	}

	// Call after changing the progress-clock's colors so the color animation is done right
	refreshAnimatedColors() {
		if (this.cachedForeColor != this.foregroundColor) {
			this.cachedComputedForeColor = standardizeColor(this.foregroundColor);
			this.cachedForeColor = this.foregroundColor;
		}
		if (this.cachedFlashColor != this.flashColor) {
			this.cachedComputedFlashColor = standardizeColor(this.flashColor);
			this.cachedFlashColor = this.flashColor;
		}
		if (this.cachedWarningColor != this.warningColor) {
			this.cachedComputedWarningColor = standardizeColor(this.warningColor);
			this.cachedWarningColor = this.warningColor;
		}
	}

	// Call each frame to allow color animations
	update() {
		if (!this.enabled) return;
		if (this.flashStartTime > 0) {
			const phase = (performance.now() - this.flashStartTime) / (this.flashSpeed * 1000);
			if (phase < 1) {
				// Calculate flash-fade
				const lerped = arrayLerp_3(this.startColor, this.endColor, phase);
				this.interpolatedColor = `RGB(${lerped[0]}, ${lerped[1]}, ${lerped[2]})`;
			} else {
				// End flash-fade
				this.flashStartTime = 0;
				this.interpolatedColor = null;
			}
		} else if (this.inWarning) {
			const phase = Math.abs((performance.now() % (this.warningSpeed * 1000)) / (this.warningSpeed * 500) - 1);
			const lerped = arrayLerp_3(this.cachedComputedForeColor, this.cachedComputedWarningColor, phase);
			this.interpolatedColor = `RGB(${lerped[0]}, ${lerped[1]}, ${lerped[2]})`;
		}
	}

	// Call to draw this progress-clock to the given destination canvas-context.
	render(destination) {
		if (!this.enabled) return;
		// Base circle
		destination.beginPath();
		destination.arc(this.position[0], this.position[1], this.size, 0, PI2);
		destination.fillStyle = this.backgroundColor;
		destination.fill();
		// Time wedge
		destination.beginPath();
		destination.arc(this.position[0], this.position[1], this.size, TOP, TOP - PI2 * this.normalizedCount, true);
		destination.lineTo(this.position[0], this.position[1]);
		destination.fillStyle = this.interpolatedColor || this.foregroundColor;
		destination.fill();
		// Segments / outlines
		if (this.lineWidth > 0) {
			if (this.segmentCount <= 1) {
				// just draw a complete circle outline
				destination.beginPath();
				destination.arc(this.position[0], this.position[1], this.size, 0, PI2);
				destination.lineWidth = this.lineWidth;
				destination.strokeStyle = this.outlineColor;
				destination.stroke();
			} else {
				destination.lineWidth = this.lineWidth;
				destination.strokeStyle = this.outlineColor;
				for (let i = 0; i < this.segmentCount; i++) {
					const start = ((i + 0) / this.segmentCount);
					const end = ((i + 1) / this.segmentCount);
					destination.beginPath();
					destination.arc(this.position[0], this.position[1], this.size, TOP + PI2 * start, TOP + PI2 * end);
					destination.lineTo(this.position[0], this.position[1]);
					destination.stroke();
				}
			}
		}
	}

	cachedForeColor;
	cachedComputedForeColor;
	cachedFlashColor;
	cachedComputedFlashColor;
	cachedWarningColor;
	cachedComputedWarningColor;

	startColor;
	endColor;
	flashStartTime;
	inWarning;
	interpolatedColor;
}

window.progressClocks = [];
if (FIELD(CONFIG, 'auto-create-clock', 'json')) {
	window.progressClocks.push(new ProgressClock());
}

const PI = Math.PI;
const PI2 = PI * 2;
const TOP = PI * 1.5;

// Modified from this: https://stackoverflow.com/a/47355187/4751469
function standardizeColor(str){
	var ctx = document.createElement('canvas').getContext('2d');
	ctx.fillStyle = str;
	const hexColor = ctx.fillStyle;
	return [ Number(`0X${hexColor.slice(1, 3)}`), Number(`0X${hexColor.slice(3, 5)}`), Number(`0X${hexColor.slice(5, 7)}`) ];
}

// Lerp a 3-element array
function arrayLerp_3(startCoords, endCoords, phase) {
	return [startCoords[0] * (1 - phase) + endCoords[0] * phase, startCoords[1] * (1 - phase) + endCoords[1] * phase, startCoords[2] * (1 - phase) + endCoords[2] * phase];
}

wrap.before(BipsiPlayback.prototype, 'render', () => {
	window.progressClocks.forEach(ui => ui.update());
});

const orig_drawEventLayer = window.drawEventLayer;
window.drawEventLayer = (destination, tileset, tileToFrame, palette, events) => {
	orig_drawEventLayer(destination, tileset, tileToFrame, palette, events);
	if (destination !== TEMP_ROOM) return;
	window.progressClocks.forEach(ui => ui.render(destination));
};

BipsiPlayback.prototype.addProgressClock = function addProgressClock() {
	window.progressClocks.push(new ProgressClock());
	return window.progressClocks.length - 1;
};

BipsiPlayback.prototype.getProgressClock = function getProgressClock(index) {
	if (index < 0 || index >= window.progressClocks.length) return;
	return window.progressClocks[index];
};
