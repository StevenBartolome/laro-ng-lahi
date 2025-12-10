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

import { database } from '../../../config/firebase.js';
import { ref, onValue, set, update, get } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-database.js";

let lastTime = 0;

/**
 * Start the multiplayer game
 */
export function startGame(difficulty) {
    if (!window.multiplayerState.lobbyId) return;

    // Reset local state
    if (gameState.animationFrameId) {
        cancelAnimationFrame(gameState.animationFrameId);
        gameState.animationFrameId = null;
    }
    lastTime = 0;
    if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
        gameState.timerInterval = null;
    }
    gameState.gameActive = false;


    // Hide difficulty screen and wait for host to start signal
    document.getElementById('difficultyScreen').classList.add('hidden');

    // If host, update lobby status to 'starting' or 'playing'
    if (window.multiplayerState.isHost) {
        // Logic to determine roles, for now simplified:
        // Host = Tagger 1 (Vertical), Others = Runners?
        // Or implement Coin Flip Sync.

        // For this iteration, let's start round directly.
        // In full implementation, we sync the "Coin Flip" phase here.
    }

    // Listen for Game Start / State Changes
    const lobbyRef = ref(database, `lobbies/${window.multiplayerState.lobbyId}`);
    onValue(lobbyRef, (snapshot) => {
        const data = snapshot.val();
        if (data && data.status === 'playing') {
            if (!gameState.gameActive && !gameState.starting) {
                gameState.starting = true; // Prevent double start
                document.getElementById('coinFlipScreen').classList.remove('hidden');
                // Simulate coin flip for everyone (visual only for now, logic determines roles)
                setTimeout(() => {
                    // TODO: Read assigned role from Firebase
                    // For now, random locally for testing, effectively making it "Single Player" logic but online
                    performCoinFlip();
                }, 500);
            }
        }
    });
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
    // Default difficulty for multiplayer
    const diff = DIFFICULTY['medium'];

    // Equalize speeds
    const baseSpeed = 10;
    CONFIG.runnerSpeed = baseSpeed * diff.speedMult;
    CONFIG.taggerSpeed = baseSpeed * diff.speedMult;
    CONFIG.botSpeed = baseSpeed * diff.speedMult;

    // Initialize/Reset Timer
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
    // In true multiplayer, we would iterate through `window.multiplayerState.players`
    // and spawn entities for each.
    // For now, we spawn Local Player + Bots to maintain loop functionality while testing assets.

    // Retrieve my head index (assigned in main.js)
    let myHeadIndex = null;
    // We would fetch this from firebase, but we can't await here easily without refactoring.
    // Let's rely on simple random for now or fetch it async if needed.
    // Ideally update `window.multiplayerState` to include `headIndex`

    // Check if we have local head index stored
    // For now, allow random.

    // --- DYNAMIC MULTIPLAYER SPAWNING ---
    // Retrieve latest player list (should be synced by main.js)
    const playersMap = window.multiplayerState.players || {};
    const playersList = Object.values(playersMap);

    // Sort players deterministically (e.g., by joinedAt) so everyone agrees on order
    playersList.sort((a, b) => a.joinedAt - b.joinedAt);

    // Split into two teams
    const totalPlayers = playersList.length;
    const midPoint = Math.ceil(totalPlayers / 2); // Split half-half
    const team1 = playersList.slice(0, midPoint);
    const team2 = playersList.slice(midPoint);

    // Determine which team corresponds to Runners and Taggers based on currentRole
    // We need to know which team the LOCAL player is on to orient "My Team" vs "Enemy Team"
    // However, simplest way: Team 1 starts as Runner, Team 2 starts as Tagger.
    // If roles swap, Team 1 becomes Tagger, Team 2 becomes Runner.

    // Wait, gameState.currentRole tells us what the LOCAL player is.
    // We need to align the teams so tha local player gets the correct role status.

    const myId = window.multiplayerState.playerId;
    const amInTeam1 = team1.find(p => p.name === playersMap[myId]?.name); // Using name or ID match
    // Note: main.js stores players with firebase UID as key. 'playersList' is values.
    // We need to match ID. Let's re-map list to include ID.
    const playersListWithId = Object.entries(playersMap).map(([id, p]) => ({ ...p, id })).sort((a, b) => a.joinedAt - b.joinedAt);

    const team1Ids = playersListWithId.slice(0, midPoint);
    const team2Ids = playersListWithId.slice(midPoint);

    const amInTeam1WithId = team1Ids.find(p => p.id === myId);

    let runnerTeam = [];
    let taggerTeam = [];

    // This logic assumes "Team 1" is the "Runner" team initially? 
    // Or we align with `gameState.currentRole`.
    // If `currentRole` is Runner, and I am in Team 1, then Team 1 is Runner.
    // If `currentRole` is Runner, and I am in Team 2, then Team 2 is Runner.

    if (gameState.currentRole === 'runner') {
        if (amInTeam1WithId) {
            runnerTeam = team1Ids;
            taggerTeam = team2Ids;
        } else {
            runnerTeam = team2Ids;
            taggerTeam = team1Ids;
        }
        updateStatus("ROLE: RUNNER - Complete runs to earn points!");
    } else { // I am Tagger
        if (amInTeam1WithId) {
            taggerTeam = team1Ids;
            runnerTeam = team2Ids;
        } else {
            taggerTeam = team2Ids;
            runnerTeam = team1Ids;
        }
        updateStatus("ROLE: TAGGER - Stop them all!");
    }

    // --- DYNAMIC FIELD RESIZING & SPAWNING ---

    // 1. Calculate Field Height
    const numTaggers = taggerTeam.length;
    // Standard: 1 Vertical + (N-1) Horizontal
    // If 1 Tagger (1v1), we enforce at least 1 Horizontal line? Or just Vertical?
    // Let's assume minimum 1 horizontal line for playability unless purely vertical.
    // If numTaggers=1, Horiz=0. But 1v1 on big field is boring.
    const numHorizontalLines = Math.max(1, numTaggers - 1);

    // Height Calculation: Base 144px per line + buffers
    // 2 players (1 tagger) -> 0 horiz lines -> 1 line min -> Small field
    let newHeight = 144 * (numHorizontalLines + 1);
    if (newHeight < 400) newHeight = 400; // Min height
    if (newHeight > 720) newHeight = 720; // Max height

    // Apply Height
    field.style.height = `${newHeight}px`;
    const fh = field.offsetHeight; // Get new height
    // Note: fw (width) usually stays fixed, but good to refresh if responsive
    const fw_current = field.offsetWidth;

    // 2. Regenerate Grid Lines
    const existingLines = field.querySelectorAll('.horizontal-line');
    existingLines.forEach(l => l.remove());

    const linePositions = [];
    for (let i = 0; i < numHorizontalLines; i++) {
        // Distribute lines evenly within the height
        // e.g. 1 line -> 50%
        // e.g. 2 lines -> 33%, 66%
        const percent = (i + 1) / (numHorizontalLines + 1);
        const topPosPercent = percent * 100;

        const line = document.createElement('div');
        line.className = 'line horizontal-line';
        line.style.top = `${topPosPercent}%`;
        field.appendChild(line);

        linePositions.push(percent * fh); // Store pixel position for spawning
    }

    // 3. Spawn Runners
    const runnerSegmentWidth = fw_current / (runnerTeam.length + 1);

    runnerTeam.forEach((p, index) => {
        const startX = runnerSegmentWidth * (index + 1);
        const spawnType = (p.id === myId) ? 'player' : 'bot'; // Remote players as bots for now

        createRunner(spawnType, startX, 50, p.headIndex);
    });

    // 4. Spawn Taggers
    taggerTeam.forEach((p, index) => {
        const spawnType = (p.id === myId) ? 'player' : 'bot';

        if (index === 0) {
            // First tagger is Vertical (Patotot) - Always Center
            createTagger(1, 'vertical', 0, diff, spawnType, p.headIndex);
        } else {
            // Remaining taggers are Horizontal (Patotot)
            // Assign to lines in order, wrapping if necessary
            // (Though with dynamic field, lines should match taggers usually)

            // If we enforced numHorizontalLines = numTaggers - 1, it matches perfectly.
            // But if numTaggers=1 (1v1), we have 1 horiz line but no 2nd tagger.
            // That's fine, the line exists as an obstacle/visual, just no tagger on it.

            const lineIndex = (index - 1) % linePositions.length;
            if (linePositions.length > 0) {
                const yPos = linePositions[lineIndex];
                createTagger(index + 1, 'horizontal', yPos, diff, spawnType, p.headIndex);
            } else {
                // Fallback if no horizontal lines (shouldn't happen with min 1)
                createTagger(index + 1, 'horizontal', fh / 2, diff, spawnType, p.headIndex);
            }
        }
    });

    gameState.gameActive = true;
    gameState.animationFrameId = requestAnimationFrame(gameLoop);
}

/**
 * Main game loop
 */
export function gameLoop(timestamp) {
    if (!gameState.gameActive) return;

    if (!timestamp) timestamp = performance.now();
    if (!lastTime) lastTime = timestamp;
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;

    const timeScale = deltaTime / (1000 / 60);
    const clampedTimeScale = Math.min(timeScale, 4.0);

    checkBoostInput();

    updateRunners(clampedTimeScale);
    updateTaggers(clampedTimeScale);
    checkCollisions();

    // Check if all runners are tagged
    const allRunnersTagged = runners.every(r => !r.active);
    if (allRunnersTagged && runners.length > 0) {
        gameState.gameActive = false;
        clearInterval(gameState.timerInterval);
        gameState.roundsCompleted++;

        if (gameState.roundsCompleted === 1) {
            showRoundModal(
                "ROUND 1 COMPLETE!",
                `${gameState.currentRole === 'runner' ? 'My Team' : 'Enemy Team'} scored ${gameState.currentRole === 'runner' ? gameState.playerTeamScore : gameState.enemyTeamScore} points!\n\nSwitching roles...`,
                () => {
                    switchRolesAfterTag();
                }
            );
        } else {
            endGame();
        }
        return;
    }

    updateCharacterPanel();

    if (gameState.gameActive) {
        gameState.animationFrameId = requestAnimationFrame(gameLoop);
    }
}

/**
 * Switch roles after all runners tagged
 */
export function switchRolesAfterTag() {
    gameState.currentRole = gameState.currentRole === 'runner' ? 'tagger' : 'runner';
    gameState.playerControlledRunner = null;
    gameState.playerControlledTagger = null;
    gameState.gameTimer = 120;
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
    `;
    btn.textContent = "Play Again";

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
    gameState.gamePhase = 'first-round';
    gameState.playerScore = 0;
    gameState.playerTeamScore = 0;
    gameState.enemyTeamScore = 0;
    gameState.gameTimer = 0;
    gameState.roundsCompleted = 0;
    gameState.initialRole = null;
    gameState.currentRole = 'runner';

    if (gameState.timerInterval) clearInterval(gameState.timerInterval);

    location.reload();
}

setGameFlowFunctions(endGame, switchRolesAfterTag);
