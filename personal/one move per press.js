/**
🦥
@file one move per press
@summary Limits movement to a single one move per key or button press.
@license MIT
@author Violgamba (Jon Heard)
@version 7.0.1



@description
Limits movement to a one move per key or button press.  Holding the key or button down no longer
results in multiple moves.  This is useful when the target player is not skilled with the input
device they are using.

For example, my young nieces make games by drawing maps and tiles with my laptop's touch screen.
However, they are not skilled at the keyboard or a gamepad, so they struggle when playing their
games, often moving the character further than intended.


HOW TO USE:
1. Import this plugin into your game.
2. Plat-test the game and try to hold a direction key or button down.  Note that the character only moves one cell per press.
*/

const MOVE_KEYS = new Set([ 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 's', 'a', 'd' ]);

// 0.2 is bipsi's (hard-coded) delay between movements while holding down a direction key.
// 0.1 is a reduction to be sure we send a "keyup" event before the press triggers multiple moves.
// 1000 is to convert from seconds to milliseconds that 'setTimeout()' expects.
const UP_KEY_DELAY_TIME = 0.2 - 0.1 * 1000;

window.addEventListener('keydown', evt => {
if (MOVE_KEYS.has(evt.key)) {
	setTimeout(() => {
		document.dispatchEvent(new KeyboardEvent('keyup', evt));
	}, UP_KEY_DELAY_TIME);
}
}, { capture: true });
