/**
 * Patintero Game - Main Entry Point
 * This module imports all other modules and exposes global functions for HTML
 */

import { startGame, resetGame } from './game.js';
import { initInputHandlers } from './input.js';

// Expose functions to window for HTML onclick handlers
window.startGame = startGame;
window.resetGame = resetGame;

// Initialize input handlers when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initInputHandlers);
} else {
    initInputHandlers();
}

console.log('Patintero game modules loaded successfully!');
