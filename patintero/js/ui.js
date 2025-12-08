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
    const toast = document.createElement('div');
    toast.style.position = 'absolute';
    toast.style.top = '20%';
    toast.style.left = '50%';
    toast.style.transform = 'translate(-50%, -50%)';
    toast.style.background = 'rgba(0,0,0,0.8)';
    toast.style.color = '#fff';
    toast.style.padding = '20px';
    toast.style.borderRadius = '10px';
    toast.style.fontSize = '24px';
    toast.style.fontWeight = 'bold';
    toast.style.zIndex = '1000';
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
}

/**
 * Show round modal with callback
 */
export function showRoundModal(titleText, msgText, callback) {
    const modal = document.getElementById('gameOverModal');
    const title = document.getElementById('modalTitle');
    const msg = document.getElementById('modalMessage');
    const btn = document.querySelector('.game-over-modal .btn');

    title.textContent = titleText;
    msg.textContent = msgText;
    btn.textContent = "Start Next Round";

    // Override button click
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);

    newBtn.onclick = () => {
        modal.style.display = 'none';
        callback();
    };

    modal.style.display = 'block';
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
    notification.style.position = 'absolute';
    notification.style.top = '30%';
    notification.style.left = '50%';
    notification.style.transform = 'translate(-50%, -50%)';

    // Different colors based on type
    if (type === 'enemy') {
        notification.style.background = 'rgba(244, 67, 54, 0.9)'; // Red for enemy
    } else if (type === 'team') {
        notification.style.background = 'rgba(33, 150, 243, 0.9)'; // Blue for team bot
    } else {
        notification.style.background = 'rgba(76, 175, 80, 0.9)'; // Green for player
    }

    notification.style.color = '#fff';
    notification.style.padding = '15px 30px';
    notification.style.borderRadius = '10px';
    notification.style.fontSize = '28px';
    notification.style.fontWeight = 'bold';
    notification.style.zIndex = '1000';
    notification.style.animation = 'fadeInOut 1.5s ease-out';
    notification.textContent = text;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 1500);
}
