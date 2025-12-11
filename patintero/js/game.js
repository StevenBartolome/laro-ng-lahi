import {
    gameState, CONFIG, DIFFICULTY,
    boost, taggerBoost,
    runners, taggers
} from './config.js';
import { createRunner, createTagger } from './entities.js';
import { updateBoostUI } from './boost.js';
import { updateRunners, updateTaggers } from './movement.js';
import { checkCollisions } from './collision.js';
import {
    updateStatus, showRoundModal, updateTimerDisplay,
    updateTimer, setGameFlowFunctions
} from './ui.js';
import { updateCharacterPanel } from './character-switch.js';
import { checkBoostInput } from './input.js';

// Move lastTime to module scope and export reset function if needed, 
// or just reset it inside startGame/startRound.
let lastTime = 0;

/**
 * Start the game with selected difficulty
 */
export function startGame(difficulty) {
    // Clean up existing game state to prevent double speed
    if (gameState.animationFrameId) {
        cancelAnimationFrame(gameState.animationFrameId);
        gameState.animationFrameId = null;
    }
    lastTime = 0; // Reset time tracker

    if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
        gameState.timerInterval = null;
    }
    gameState.gameActive = false;

    // Reset game area visibility
    document.getElementById('gameArea').classList.remove('active');
    document.getElementById('boostMeter').classList.remove('active');

    gameState.selectedDifficulty = difficulty || 'medium';

    // Hide difficulty screen and show coin flip
    document.getElementById('difficultyScreen').classList.add('hidden');
    document.getElementById('coinFlipScreen').classList.remove('hidden');

    // Perform coin flip after a short delay
    setTimeout(() => performCoinFlip(), 500);
}

/**
 * Perform coin flip to determine starting role
 */
export function performCoinFlip() {
    const coin = document.getElementById('coin');
    const resultText = document.getElementById('coinResult');

    // Determine random role
    const isRunner = Math.random() < 0.5;
    gameState.initialRole = isRunner ? 'runner' : 'tagger';
    gameState.currentRole = gameState.initialRole;

    // Determine which side to show based on role
    const rotations = isRunner ? 0 : 180; // 0 = heads (runner), 180 = tails (tagger)

    // Animate coin flip
    coin.style.animation = 'none';
    setTimeout(() => {
        // Apply rotation based on result
        coin.style.transform = `rotateY(${rotations + 720}deg)`; // Add 720 for spinning effect
        coin.style.transition = 'transform 2s ease-out';

        // Show result after animation
        setTimeout(() => {
            resultText.textContent = `You will start as: ${gameState.initialRole.toUpperCase()}!`;
            resultText.style.color = gameState.initialRole === 'runner' ? '#4CAF50' : '#f44336';

            // Start game after showing result
            setTimeout(() => {
                document.getElementById('coinFlipScreen').classList.add('hidden');
                document.getElementById('gameArea').classList.add('active');
                document.getElementById('boostMeter').classList.add('active');
                startRound();
            }, 2000);
        }, 2000);
    }, 50);
}

/**
 * Start a round
 */
export function startRound() {
    const field = document.getElementById('field');
    const fw = field.offsetWidth;
    const diff = DIFFICULTY[gameState.selectedDifficulty];

    // Equalize speeds based on difficulty multiplier (Base speed 10)
    const baseSpeed = 10;
    CONFIG.runnerSpeed = baseSpeed * diff.speedMult;
    CONFIG.taggerSpeed = baseSpeed * diff.speedMult;
    CONFIG.botSpeed = baseSpeed * diff.speedMult;

    // Initialize/Reset Timer (2 minutes countdown)
    gameState.gameTimer = 120;
    updateTimerDisplay();

    // Start timer countdown
    if (gameState.timerInterval) clearInterval(gameState.timerInterval);
    gameState.timerInterval = setInterval(updateTimer, 1000);

    // Update UI displays
    document.getElementById('myTeamScore').textContent = gameState.playerTeamScore;
    document.getElementById('enemyTeamScore').textContent = gameState.enemyTeamScore;
    document.getElementById('roleValue').textContent = gameState.currentRole.toUpperCase();

    // Reset Boost
    boost.ready = true;
    boost.active = false;
    boost.currentCharges = boost.maxCharges;
    taggerBoost.ready = true;
    taggerBoost.active = false;
    updateBoostUI();

    // Clear Entities
    document.querySelectorAll('.entity').forEach(e => e.remove());
    runners.length = 0;
    taggers.length = 0;

    // --- SETUP BASED ON ROLE ---
    if (gameState.currentRole === 'runner') {
        // Player is Runner [0], + 4 Bots = 5 Total Runners
        createRunner('player', fw / 2, 50);
        createRunner('bot', fw * 0.25, 50);
        createRunner('bot', fw * 0.4, 50);
        createRunner('bot', fw * 0.6, 50);
        createRunner('bot', fw * 0.75, 50);

        // 5 Bot Taggers
        createTagger(1, 'horizontal', field.offsetHeight * 0.2, diff, 'bot');
        createTagger(2, 'horizontal', field.offsetHeight * 0.4, diff, 'bot');
        createTagger(3, 'vertical', 0, diff, 'bot');
        createTagger(4, 'horizontal', field.offsetHeight * 0.6, diff, 'bot');
        createTagger(5, 'horizontal', field.offsetHeight * 0.8, diff, 'bot');

        updateStatus("ROLE: RUNNER - Complete runs to earn points!");

    } else {
        // Player is Vertical Tagger (Center), + 4 Bot Taggers = 5 Total Taggers
        createTagger(1, 'horizontal', field.offsetHeight * 0.2, diff, 'bot');
        createTagger(2, 'horizontal', field.offsetHeight * 0.4, diff, 'bot');
        createTagger(3, 'vertical', 0, diff, 'player'); // Player Controlled
        createTagger(4, 'horizontal', field.offsetHeight * 0.6, diff, 'bot');
        createTagger(5, 'horizontal', field.offsetHeight * 0.8, diff, 'bot');

        // 5 Bot Runners
        createRunner('bot', fw / 2, 50);
        createRunner('bot', fw * 0.25, 50);
        createRunner('bot', fw * 0.4, 50);
        createRunner('bot', fw * 0.6, 50);
        createRunner('bot', fw * 0.75, 50);

        updateStatus("ROLE: TAGGER - Stop them all!");
    }

    gameState.gameActive = true;
    gameState.animationFrameId = requestAnimationFrame(gameLoop);
}

/**
 * Main game loop
 */
/**
 * Main game loop
 */
export function gameLoop(timestamp) {
    if (!gameState.gameActive) return;

    // Safety check for timestamp
    if (!timestamp) timestamp = performance.now();

    if (!lastTime) lastTime = timestamp;
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;

    // Target 60 FPS (approx 16.67ms per frame)
    const timeScale = deltaTime / (1000 / 60);
    // Clamp timeScale to avoid huge jumps
    const clampedTimeScale = Math.min(timeScale, 4.0);

    checkBoostInput();

    updateRunners(clampedTimeScale);
    updateTaggers(clampedTimeScale);
    checkCollisions();

    // Check if all runners are tagged
    const allRunnersTagged = runners.every(r => !r.active);
    if (allRunnersTagged && runners.length > 0) {
        // All runners tagged
        gameState.gameActive = false;
        clearInterval(gameState.timerInterval);
        gameState.roundsCompleted++;

        if (gameState.roundsCompleted === 1) {
            // First round complete - switch roles for second round
            showRoundModal(
                "ROUND 1 COMPLETE!",
                `${gameState.currentRole === 'runner' ? 'My Team' : 'Enemy Team'} scored ${gameState.currentRole === 'runner' ? gameState.playerTeamScore : gameState.enemyTeamScore} points!\n\nSwitching roles...`,
                () => {
                    switchRolesAfterTag();
                }
            );
        } else {
            // Both rounds complete - end game
            endGame();
        }
        return;
    }

    // Update character selection panel
    updateCharacterPanel();

    gameState.animationFrameId = requestAnimationFrame(gameLoop);
}

/**
 * Switch roles (between rounds)
 */
export function switchRoles() {
    gameState.gameActive = false;
    gameState.gamePhase = 'second-round';

    // Switch to opposite role
    gameState.currentRole = gameState.currentRole === 'runner' ? 'tagger' : 'runner';

    showRoundModal(
        "ROUND 2 STARTING!",
        `Switching roles... You are now: ${gameState.currentRole.toUpperCase()}`,
        () => {
            startRound();
        }
    );
}

/**
 * Switch roles after all runners tagged
 */
export function switchRolesAfterTag() {
    // Switch to opposite role
    gameState.currentRole = gameState.currentRole === 'runner' ? 'tagger' : 'runner';

    // Reset control indices
    gameState.playerControlledRunner = null;
    gameState.playerControlledTagger = null;

    // Reset timer for second round (will be set to 120 in startRound)
    gameState.gameTimer = 120;

    // Start new round with switched roles
    startRound();
}

/**
 * End game and show results
 */
export function endGame() {
    gameState.gameActive = false;
    clearInterval(gameState.timerInterval);

    const modal = document.getElementById('gameOverModal');
    const title = document.getElementById('modalTitle');
    const msg = document.getElementById('modalMessage');
    const btn = document.querySelector('.game-over-modal .btn');

    title.textContent = "GAME OVER!";

    // Determine winner
    const winner = gameState.playerTeamScore > gameState.enemyTeamScore ? 'My Team' :
        gameState.playerTeamScore < gameState.enemyTeamScore ? 'Enemy Team' : 'Tie';
    const winnerColor = gameState.playerTeamScore > gameState.enemyTeamScore ? '#4CAF50' :
        gameState.playerTeamScore < gameState.enemyTeamScore ? '#f44336' : '#FFA500';

    msg.innerHTML = `
        <div style="font-size: 1.5em; margin: 20px 0;">
            <div style="margin-bottom: 15px;">
                My Team: <span style="color: #4CAF50; font-size: 1.2em;">${gameState.playerTeamScore}</span> | 
                Enemy Team: <span style="color: #f44336; font-size: 1.2em;">${gameState.enemyTeamScore}</span>
            </div>
            <div style="color: ${winnerColor}; font-size: 1.4em; font-weight: bold;">
                ${winner === 'Tie' ? "IT'S A TIE!" : winner + " WINS!"}
            </div>
        </div>
        <div style="color: #666;">
            ${winner === 'My Team' ? "Great job! You won!" :
            winner === 'Enemy Team' ? "Better luck next time!" :
                "Close match!"}
        </div>
    `;
    btn.textContent = "Play Again";

    // Override button click
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);

    newBtn.onclick = () => {
        resetGame();
    };

    modal.style.display = 'block';
}

/**
 * Reset game to initial state
 */
export function resetGame() {
    // Reset all game state
    gameState.gamePhase = 'first-round';
    gameState.playerScore = 0;
    gameState.playerTeamScore = 0;
    gameState.enemyTeamScore = 0;
    gameState.gameTimer = 0;
    gameState.roundsCompleted = 0;
    gameState.initialRole = null;
    gameState.currentRole = 'runner';

    if (gameState.timerInterval) clearInterval(gameState.timerInterval);

    location.reload(); // Simplest full reset
}

// Set up UI callbacks to avoid circular dependencies
setGameFlowFunctions(endGame, switchRolesAfterTag);
