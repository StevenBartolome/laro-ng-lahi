import { gameState, runners } from './config.js';

// Forward declarations for functions that will be set by game.js
let endGameFn = null;
let switchRolesAfterTagFn = null;

/**
 * Set the game flow functions (to avoid circular dependencies)
 */
export function setGameFlowFunctions(endGame, switchRolesAfterTag) {
    endGameFn = endGame;
    switchRolesAfterTagFn = switchRolesAfterTag;
}

/**
 * Show a status toast message
 */
export function updateStatus(msg) {
    // Remove existing status toasts to prevent stacking
    const existing = document.querySelectorAll('.game-status-toast');
    existing.forEach(el => el.remove());

    const toast = document.createElement('div');
    toast.className = 'game-status-toast'; // Add class for easy selection
    toast.style.position = 'fixed'; // Changed to fixed
    toast.style.top = '10%'; // Top position
    toast.style.left = '50%';
    toast.style.transform = 'translate(-50%, -50%)';
    toast.style.background = 'rgba(0, 0, 0, 0.85)';
    toast.style.color = '#ffd700'; // Gold text
    toast.style.padding = '10px 20px';
    toast.style.borderRadius = '20px';
    toast.style.fontSize = '20px';
    toast.style.fontWeight = 'bold';
    toast.style.fontFamily = "var(--font-heading, 'Arial')";
    toast.style.zIndex = '1000';
    toast.style.border = '2px solid #ffd700';
    toast.style.boxShadow = '0 5px 15px rgba(0,0,0,0.5)';
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

/**
 * Show round modal with callback
 */
/**
 * Show round modal with callback
 */
export function showRoundModal(titleText, msgText, callback) {
    const modal = document.getElementById('messageOverlay');
    const title = document.getElementById('modalTitle');
    const msg = document.getElementById('modalMessage');
    const btn = document.getElementById('modalActionBtn');
    const menuBtn = document.getElementById('modalMenuBtn');

    // Ensure backdrop mode
    modal.classList.add('game-complete-backdrop');

    // Update Text
    title.textContent = titleText;
    title.classList.remove('fail');
    title.classList.add('round'); // Gold for round transition
    
    // Allow HTML in msg
    msg.innerHTML = msgText.replace(/\n/g, '<br>');
    
    btn.textContent = "Start Next Round";
    
    // Hide Main Menu button for round transitions (optional, can keep if desired)
    // For now, let's keep it but maybe it's cleaner without
    menuBtn.style.display = 'none';

    // Override button click
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);

    newBtn.onclick = () => {
        modal.classList.add('hidden');
        // Crucial: Remove pointer-events blocking class
        modal.classList.remove('game-complete-backdrop');
        callback();
    };

    modal.classList.remove('hidden');
}

/**
 * Update timer display
 */
export function updateTimerDisplay() {
    const minutes = Math.floor(gameState.gameTimer / 60);
    const seconds = gameState.gameTimer % 60;
    const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    document.getElementById('timerValue').textContent = timeString;

    // Change color when time is running low
    const timerValue = document.getElementById('timerValue');
    if (gameState.gameTimer <= 10) {
        timerValue.style.color = '#ff4444';
        timerValue.style.animation = 'pulse 1s infinite';
    } else if (gameState.gameTimer <= 30) {
        timerValue.style.color = '#ffaa00';
        timerValue.style.animation = 'none';
    } else {
        timerValue.style.color = 'white';
        timerValue.style.animation = 'none';
    }
}

/**
 * Update timer (called every second)
 */
export function updateTimer() {
    gameState.gameTimer--; // Count down
    updateTimerDisplay();

    // Check if time is up
    if (gameState.gameTimer <= 0) {
        gameState.gameActive = false;
        clearInterval(gameState.timerInterval);
        gameState.roundsCompleted++;

        if (gameState.roundsCompleted === 1) {
            // First round complete - switch roles for second round
            showRoundModal(
                "TIME'S UP!",
                `Round 1 Complete! ${gameState.currentRole === 'runner' ? 'My Team' : 'Enemy Team'} scored ${gameState.currentRole === 'runner' ? gameState.playerTeamScore : gameState.enemyTeamScore} points!\n\nSwitching roles...`,
                () => {
                    if (switchRolesAfterTagFn) switchRolesAfterTagFn();
                }
            );
        } else {
            // Both rounds complete - end game
            if (endGameFn) endGameFn();
        }
    }
}

/**
 * Show point notification
 */
export function showPointNotification(text, type = 'player') {
    const notification = document.createElement('div');
    notification.style.position = 'fixed'; // Changed to fixed
    notification.style.top = '15%'; // Moved up
    notification.style.left = '50%';
    notification.style.transform = 'translate(-50%, -50%)';

    // Different colors based on type
    if (type === 'enemy') {
        notification.style.background = 'linear-gradient(135deg, #e74c3c, #c0392b)'; // Red gradient
        notification.style.boxShadow = '0 0 20px rgba(231, 76, 60, 0.6)';
    } else if (type === 'team') {
        notification.style.background = 'linear-gradient(135deg, #3498db, #2980b9)'; // Blue gradient
        notification.style.boxShadow = '0 0 20px rgba(52, 152, 219, 0.6)';
    } else {
        notification.style.background = 'linear-gradient(135deg, #2ecc71, #27ae60)'; // Green gradient
        notification.style.boxShadow = '0 0 20px rgba(46, 204, 113, 0.6)';
    }

    notification.style.color = '#fff';
    notification.style.padding = '12px 25px';
    notification.style.borderRadius = '30px';
    notification.style.fontSize = '24px';
    notification.style.fontWeight = 'bold';
    notification.style.fontFamily = "var(--font-heading, 'Arial')";
    notification.style.zIndex = '2000'; // Higher z-index
    notification.style.border = '3px solid white';
    notification.style.animation = 'slideDownFade 2s ease-out forwards';
    notification.textContent = text;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 2000);
}

// Track current overlay mode
let currentOverlayMode = 'both';

/**
 * Show difficulty/menu screen with specific mode
 * mode: 'both', 'instructions', 'difficulty'
 */
export function showDifficultyScreen(mode = 'both') {
    currentOverlayMode = mode; // Store mode
    const difficultyScreen = document.getElementById('difficultyScreen');
    const instructionsPanel = difficultyScreen.querySelector('.instructions-panel');
    const difficultyPanel = difficultyScreen.querySelector('.difficulty-panel');
    const overlayContent = difficultyScreen.querySelector('.overlay-content');
    const menuGrid = difficultyScreen.querySelector('.menu-grid');
    
    // Reset layout based on mode
    if (mode === 'both') {
        overlayContent.style.maxWidth = '900px';
        menuGrid.classList.remove('single');
        instructionsPanel.style.display = 'block';
        difficultyPanel.style.display = 'flex';
    } else if (mode === 'instructions') {
        overlayContent.style.maxWidth = '500px';
        menuGrid.classList.add('single');
        instructionsPanel.style.display = 'block';
        difficultyPanel.style.display = 'none';
    } else if (mode === 'difficulty') {
        overlayContent.style.maxWidth = '500px';
        menuGrid.classList.add('single');
        instructionsPanel.style.display = 'none';
        difficultyPanel.style.display = 'flex';
    }
    
    difficultyScreen.classList.remove('hidden');
}

/**
 * Hide difficulty screen
 */
export function hideDifficultyScreen() {
    document.getElementById('difficultyScreen').classList.add('hidden');
}

/**
 * Handle closing the overlay (X button)
 * Logic:
 * - If Instructions open:
 *   - If Game Active: Resume game (Hide)
 *   - If Not Active: Back to Menu (Difficulty)
 * - If Difficulty/Menu open:
 *   - If Game Active: Resume game (Hide)
 *   - If Not Active: Exit to Game Select hierarchy
 */
export function handleCloseOverlay() {
    if (currentOverlayMode === 'instructions') {
        if (gameState.gameActive || gameState.roundsCompleted > 0) {
            hideDifficultyScreen();
        } else {
            // If at start screen, return to main menu (both panels)
            showDifficultyScreen('both');
        }
    } else {
        // Mode is 'difficulty' or 'both'
        if (gameState.gameActive || gameState.roundsCompleted > 0) {
            hideDifficultyScreen();
        } else {
            window.location.href = '../game_select.php';
        }
    }
}
