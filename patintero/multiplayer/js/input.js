import { keys, gameState } from './config.js';
import { activateBoost } from './boost.js';
import { attemptSwitchToRunner, attemptSwitchToTagger } from './character-switch.js';

/**
 * Initialize input handlers
 */
export function initInputHandlers() {
    // Keydown handler
    window.addEventListener('keydown', (e) => {
        if (keys.hasOwnProperty(e.key) || keys.hasOwnProperty(e.key.toLowerCase())) {
            keys[e.key] = true;
            if (e.key.length === 1) keys[e.key.toLowerCase()] = true;
            if (e.key === ' ') e.preventDefault();
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) e.preventDefault();
        }

        // Number key bindings for quick character switching
        if (gameState.gameActive) {
            const num = parseInt(e.key);
            if (!isNaN(num) && num >= 1 && num <= 5) {
                if (gameState.currentRole === 'runner') {
                    attemptSwitchToRunner(num - 1);
                } else if (gameState.currentRole === 'tagger') {
                    attemptSwitchToTagger(num - 1);
                }
            }
        }
    });

    // Keyup handler
    window.addEventListener('keyup', (e) => {
        if (keys.hasOwnProperty(e.key) || keys.hasOwnProperty(e.key.toLowerCase())) {
            keys[e.key] = false;
            if (e.key.length === 1) keys[e.key.toLowerCase()] = false;
        }
    });
}

/**
 * Check if space key is pressed (for boost)
 */
export function checkBoostInput() {
    if (keys[' ']) {
        activateBoost();
    }
}
