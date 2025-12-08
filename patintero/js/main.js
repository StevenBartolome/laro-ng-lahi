/**
 * Patintero Game - Main Entry Point
 * This module imports all other modules and exposes global functions for HTML
 */

import { startGame, resetGame } from './game.js';
import { initInputHandlers } from './input.js';
import { showDifficultyScreen, hideDifficultyScreen, handleCloseOverlay } from './ui.js';

// Expose functions to window for HTML onclick handlers
window.startGame = startGame;
window.resetGame = resetGame;
window.showDifficultyScreen = showDifficultyScreen;
window.hideDifficultyScreen = hideDifficultyScreen;
window.handleCloseOverlay = handleCloseOverlay;

// Initialize input handlers when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initInputHandlers);
} else {
    initInputHandlers();
}

console.log('Patintero game modules loaded successfully!');
