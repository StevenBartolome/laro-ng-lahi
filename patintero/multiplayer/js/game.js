import {
    gameState, CONFIG, DIFFICULTY,
    boost, taggerBoost,
    runners, taggers, keys
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
import {
    uploadFullGameState, uploadPlayerPosition,
    initGameStateSync, initPlayerInputSync,
    initEntityUsageSync,
    isHostClient
} from './sync.js';

import { database } from '../../../config/firebase.js';
import { ref, onValue, set, update, get } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-database.js";

let lastTime = 0;

/**
 * Start the multiplayer game
 */
export function startGame(difficulty) {
    // This function is now deprecated in favor of hostStartGame (which calls this internally via listener)
    // But for safety if UI calls it directly:
    hostStartGame(difficulty);
}

export function resetLocalState() {
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
    gameState.starting = false;
}

export function initializeGameListeners() {
    if (!window.multiplayerState.lobbyId) return;

    // Listen for Game Start / State Changes
    console.log('[GAME] Listening for lobby updates on:', window.multiplayerState.lobbyId);
    const lobbyRef = ref(database, `lobbies/${window.multiplayerState.lobbyId}`);
    onValue(lobbyRef, (snapshot) => {
        const data = snapshot.val();
        console.log('[GAME] Lobby update received:', data);
        if (data && data.status === 'playing') {
            console.log('[GAME] Status is playing. Local Active:', gameState.gameActive, 'Starting:', gameState.starting);

            // CRITICAL FIX: The Lobby Menu sets status='playing' before redirection.
            // We must NOT start until the Host has actually generated the teams in this game.
            // If team1 is missing, it means we are in the "premature" state.
            if (!data.team1 && !data.team1AreRunners) {
                console.log('[GAME] Status is playing BUT teams are missing. Waiting for Host to select difficulty...');
                return;
            }

            if (!gameState.gameActive && !gameState.starting) {
                // Determine difficulty from data
                const difficulty = data.difficulty || 'medium'; // Default to medium if missing

                // IMPORTANT: The Difficulty and other configs should be set LOCALLY here
                // We'll pass data to handleGameStart to process it
                console.log('[GAME] Triggering handleGameStart with difficulty:', difficulty);
                handleGameStart(difficulty, data);
            }
        }
    });

    // TODO: Implement entity usage listener for bot control locking
    // const usageRef = ref(database, `lobbies/${window.multiplayerState.lobbyId}/entityUsage`);
    // onValue(usageRef, (snapshot) => {
    //     window.multiplayerState.entityUsage = snapshot.val() || {};
    //     // Update UI to show locks
    // });
}

/**
 * Triggered by Host via UI
 */
export async function hostStartGame(difficulty) {
    // If host, update lobby status to 'playing', set difficulty, and assign teams ATOMICALLY
    if (window.multiplayerState.isHost) {

        // Fetch players directly to ensure we have them
        const playerRef = ref(database, `lobbies/${window.multiplayerState.lobbyId}/players`);
        const snapshot = await get(playerRef);
        const playersMap = snapshot.val() || {}; // Fallback to window.state not needed if we fetch

        // Generate Teams
        const playersListWithId = Object.entries(playersMap)
            .map(([id, p]) => ({ ...p, id }))
            .sort((a, b) => a.joinedAt - b.joinedAt);

        // Randomly shuffle players into teams
        const shuffled = [...playersListWithId].sort(() => Math.random() - 0.5);
        const midPoint = Math.ceil(shuffled.length / 2);
        const team1Ids = shuffled.slice(0, midPoint).map(p => p.id);
        const team2Ids = shuffled.slice(midPoint).map(p => p.id);

        // Randomly decide which team are runners
        const team1AreRunners = Math.random() < 0.5;

        console.log('[HOST] Generating Teams:');
        console.log(' - Players Map:', playersMap);
        console.log(' - Team 1 IDs:', team1Ids);
        console.log(' - Team 2 IDs:', team2Ids);
        console.log(' - Team 1 is Runners?:', team1AreRunners);

        // Atomic update to Firebase
        update(ref(database, `lobbies/${window.multiplayerState.lobbyId}`), {
            status: 'playing',
            difficulty: difficulty,
            team1: team1Ids,
            team2: team2Ids,
            team1AreRunners: team1AreRunners
        }).then(() => {
            console.log('[HOST] Update successful!');
        }).catch(err => {
            console.error('[HOST] Update failed:', err);
        });

        console.log('Host: Started game with random team assignments');
    }
}

/**
 * Local Game Start Sequence (triggered by listener)
 */
function handleGameStart(difficulty, lobbyData) {
    gameState.starting = true; // Prevent double start

    // Remove waiting message immediately
    document.getElementById('waitingForHost')?.remove();

    // Initialize sync listeners based on role
    initGameStateSync(); // All clients listen for game state
    initEntityUsageSync(); // All clients listen for character usage
    if (isHostClient()) {
        initPlayerInputSync(); // Host listens for player inputs
    }

    // Update Config based on difficulty
    // This is repeated in startRound, but good to have if needed earlier
    // For now effectively syncs the visual UI state
    document.getElementById('difficultyScreen').classList.add('hidden');
    document.getElementById('coinFlipScreen').classList.remove('hidden');

    // Simulate coin flip for everyone
    setTimeout(() => {
        performCoinFlip(lobbyData);
    }, 500);
}




/**
 * Perform coin flip to determine starting role
 */
export function performCoinFlip(providedData = null) {
    const coin = document.getElementById('coin');
    const resultText = document.getElementById('coinResult');
    const lobbyId = window.multiplayerState.lobbyId;
    const myId = window.multiplayerState.playerId;

    // Define processing logic
    const processLobbyData = (lobbyData) => {
        const team1 = lobbyData.team1 || [];
        const team2 = lobbyData.team2 || [];
        const team1AreRunners = lobbyData.team1AreRunners;

        console.log('[COIN] Processing Role. MyID:', myId);
        console.log('[COIN] Team 1:', team1);
        console.log('[COIN] Team 2:', team2);
        console.log('[COIN] Team 1 is Runners?:', team1AreRunners);

        // Determine my role based on random team assignment
        const amInTeam1 = team1.includes(myId);
        console.log('[COIN] Am I in Team 1?:', amInTeam1);

        let isRunner;

        if (team1AreRunners) {
            isRunner = amInTeam1; // Team 1 = Runners
        } else {
            isRunner = !amInTeam1; // Team 2 = Runners
        }

        gameState.myTeamId = amInTeam1 ? 1 : 2;

        gameState.initialRole = isRunner ? 'runner' : 'tagger';
        gameState.currentRole = gameState.initialRole;

        console.log(`My role: ${gameState.currentRole} (randomly assigned)`);

        // Determine rotation for animation (visual only)
        const rotations = isRunner ? 0 : 180;

        // Animate coin flip
        coin.style.animation = 'none';
        setTimeout(() => {
            coin.style.transform = `rotateY(${rotations + 720}deg)`;
            coin.style.transition = 'transform 2s ease-out';

            setTimeout(() => {
                resultText.textContent = `You will start as: ${gameState.initialRole.toUpperCase()}!`;
                resultText.style.color = gameState.initialRole === 'runner' ? '#4CAF50' : '#f44336';

                setTimeout(() => {
                    document.getElementById('coinFlipScreen').classList.add('hidden');
                    document.getElementById('gameArea').classList.add('active');
                    document.getElementById('boostMeter').classList.add('active');

                    // Remove waiting message if exists
                    document.getElementById('waitingForHost')?.remove();

                    startRound();
                }, 2000);
            }, 2000);
        }, 50);
    };

    if (providedData) {
        processLobbyData(providedData);
    } else {
        const lobbyRef = ref(database, `lobbies/${lobbyId}`);
        get(lobbyRef).then((snapshot) => {
            processLobbyData(snapshot.val());
        });
    }
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
        // Determine Runner Team ID for scoring
        // Host logic:
        if (gameState.currentRole === 'runner') {
            gameState.runnerTeamId = gameState.myTeamId;
        } else {
            gameState.runnerTeamId = gameState.myTeamId === 1 ? 2 : 1;
        }

        updateStatus(gameState.currentRole === 'runner' ? "ROLE: RUNNER - Complete runs to earn points!" : "ROLE: TAGGER - Stop them all!");
    } else { // I am Tagger
        if (amInTeam1WithId) {
            taggerTeam = team1Ids;
            runnerTeam = team2Ids;
        } else {
            taggerTeam = team2Ids;
            runnerTeam = team1Ids;
        }

        // Determine Runner Team ID for scoring
        if (gameState.currentRole === 'runner') {
            gameState.runnerTeamId = gameState.myTeamId;
        } else {
            gameState.runnerTeamId = gameState.myTeamId === 1 ? 2 : 1;
        }

        updateStatus(gameState.currentRole === 'runner' ? "ROLE: RUNNER - Complete runs to earn points!" : "ROLE: TAGGER - Stop them all!");
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
        // Determine spawn type: player (self), remote (other humans), or bot
        let spawnType;
        if (p.id === myId) {
            spawnType = 'player';
        } else if (p.isBot) {
            spawnType = 'bot';
        } else {
            spawnType = 'remote'; // Other human players
        }

        createRunner(spawnType, startX, 50, p.headIndex, p.name, p.id);
    });

    // 4. Spawn Taggers
    taggerTeam.forEach((p, index) => {
        // Determine spawn type: player (self), remote (other humans), or bot
        let spawnType;
        if (p.id === myId) {
            spawnType = 'player';
        } else if (p.isBot) {
            spawnType = 'bot';
        } else {
            spawnType = 'remote'; // Other human players
        }

        if (index === 0) {
            // First tagger is Vertical (Patotot) - Always Center
            createTagger(1, 'vertical', 0, diff, spawnType, p.headIndex, p.name, p.id);
        } else {
            // Remaining taggers are Horizontal (Patotot)
            const lineIndex = (index - 1) % linePositions.length;
            if (linePositions.length > 0) {
                const yPos = linePositions[lineIndex];
                createTagger(index + 1, 'horizontal', yPos, diff, spawnType, p.headIndex, p.name, p.id);
            } else {
                // Fallback if no horizontal lines
                createTagger(index + 1, 'horizontal', fh / 2, diff, spawnType, p.headIndex, p.name, p.id);
            }
        }
    });

    gameState.gameActive = true;
    gameState.animationFrameId = requestAnimationFrame(gameLoop);
}

/**
 * NON-HOST: Update only the local player's movement
 * Non-hosts don't run bot AI or other game logic - they receive synced state
 */
function updatePlayerOnly(timeScale) {
    const field = document.getElementById('field');
    const fw = field.offsetWidth;
    const fh = field.offsetHeight;

    // keys is already imported from config.js at top of file

    // Update player runner
    if (gameState.currentRole === 'runner' && gameState.playerControlledRunner !== null) {
        const r = runners[gameState.playerControlledRunner];
        if (r && r.active && r.type === 'player') {
            let dx = 0, dy = 0;
            let speed = CONFIG.runnerSpeed;
            if (boost.active) speed *= boost.multiplier;
            const scaledSpeed = speed * timeScale;

            if (keys.ArrowUp || keys.w) dy -= scaledSpeed;
            if (keys.ArrowDown || keys.s) dy += scaledSpeed;
            if (keys.ArrowLeft || keys.a) dx -= scaledSpeed;
            if (keys.ArrowRight || keys.d) dx += scaledSpeed;

            r.x += dx;
            r.y += dy;

            // Bounds
            if (r.x < 20) r.x = 20; if (r.x > fw - 20) r.x = fw - 20;
            if (r.y < 20) r.y = 20; if (r.y > fh - 20) r.y = fh - 20;

            // Visual update
            r.el.style.left = `${r.x}px`;
            r.el.style.top = `${r.y}px`;
        }
    }

    // Update player tagger
    if (gameState.currentRole === 'tagger' && gameState.playerControlledTagger !== null) {
        const t = taggers[gameState.playerControlledTagger];
        if (t && t.controller === 'player') {
            let dx = 0, dy = 0;
            let speed = CONFIG.taggerSpeed;
            if (taggerBoost.active) speed *= taggerBoost.multiplier;
            const scaledSpeed = speed * timeScale;

            if (keys.ArrowUp || keys.w) dy -= scaledSpeed;
            if (keys.ArrowDown || keys.s) dy += scaledSpeed;
            if (keys.ArrowLeft || keys.a) dx -= scaledSpeed;
            if (keys.ArrowRight || keys.d) dx += scaledSpeed;

            t.x += dx;
            t.y += dy;

            // Apply movement constraints based on tagger type
            if (t.type === 'vertical') {
                t.x = fw / 2;
                if (t.y < fh * 0.2) t.y = fh * 0.2;
                if (t.y > fh - 20) t.y = fh - 20;
            } else if (t.type === 'horizontal') {
                t.y = t.fixedPos;
                if (t.x < 20) t.x = 20;
                if (t.x > fw - 20) t.x = fw - 20;
            }

            t.el.style.left = `${t.x}px`;
            t.el.style.top = `${t.y}px`;
        }
    }
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

    // HOST: runs full game logic and broadcasts state
    if (isHostClient()) {
        checkBoostInput();
        updateRunners(clampedTimeScale);
        updateTaggers(clampedTimeScale);
        checkCollisions();
        uploadFullGameState();
    } else {
        // NON-HOST: only update own player movement, then upload position
        checkBoostInput();
        updatePlayerOnly(clampedTimeScale); // New function for non-host
        uploadPlayerPosition();
    }

    // Check if all runners are tagged
    const allRunnersTagged = runners.every(r => !r.active);
    if (allRunnersTagged && runners.length > 0) {
        gameState.gameActive = false;
        clearInterval(gameState.timerInterval);
        gameState.roundsCompleted++;

        if (gameState.roundsCompleted === 1) {
            const myScore = gameState.myTeamId === 1 ? gameState.team1Score : gameState.team2Score;
            const enemyScore = gameState.myTeamId === 1 ? gameState.team2Score : gameState.team1Score;

            showRoundModal(
                "ROUND 1 COMPLETE!",
                `Scores after Round 1:\nMy Team: ${myScore}\nEnemy Team: ${enemyScore}\n\nSwitching roles...`,
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

    const myScore = gameState.myTeamId === 1 ? gameState.team1Score : gameState.team2Score;
    const enemyScore = gameState.myTeamId === 1 ? gameState.team2Score : gameState.team1Score;

    const winner = myScore > enemyScore ? 'My Team' :
        myScore < enemyScore ? 'Enemy Team' : 'Tie';
    const winnerColor = myScore > enemyScore ? '#4CAF50' :
        myScore < enemyScore ? '#f44336' : '#FFA500';

    msg.innerHTML = `
        <div style="font-size: 1.5em; margin: 20px 0;">
            <div style="margin-bottom: 15px;">
                My Team: <span style="color: #4CAF50; font-size: 1.2em;">${myScore}</span> | 
                Enemy Team: <span style="color: #f44336; font-size: 1.2em;">${enemyScore}</span>
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
