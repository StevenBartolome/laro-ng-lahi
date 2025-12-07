/**
 * Luksong Baka - Multiplayer Main
 * Integrates multiplayer functionality with the core game
 */

import MultiplayerGame from './multiplayer.js';
import { database } from '../../config/firebase.js';
import { ref, get } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-database.js";

// Initialize multiplayer instance
const multiplayer = new MultiplayerGame();
let gameInitialized = false;
let inputEnabled = false;
let gameLoopRunning = false; // Guard to prevent multiple game loops

// UI Elements
const waitingScreen = document.getElementById('waitingScreen');
const readyBtn = document.getElementById('readyBtn');
const spectatorOverlay = document.getElementById('spectatorOverlay');
const yourTurnBanner = document.getElementById('yourTurnBanner');
const currentPlayerName = document.getElementById('currentPlayerName');
const spectatorPlayerName = document.getElementById('spectatorPlayerName');
const playersContainer = document.getElementById('playersContainer');
const readyPlayersDisplay = document.getElementById('readyPlayersDisplay');
const lobbyCodeDisplay = document.getElementById('lobbyCodeDisplay');
const leaveLobbyBtn = document.getElementById('leaveLobbyBtn');
const gameOverScreen = document.getElementById('gameOverScreen');
const finalScoresContainer = document.getElementById('finalScoresContainer');
const backToMenuBtn = document.getElementById('backToMenuBtn');

// Game canvas and context
const canvas = document.getElementById('gameCanvas');

/**
 * Initialize the multiplayer game
 */
async function init() {
    console.log('Initializing multiplayer game...');

    const success = await multiplayer.init();

    if (!success) {
        console.error('Multiplayer initialization failed');
        return;
    }

    console.log('Multiplayer initialized successfully');

    // Display lobby code - get it from Firebase lobby data
    const urlParams = new URLSearchParams(window.location.search);
    const lobbyId = urlParams.get('lobby');

    // Get actual lobby code from Firebase
    const lobbyRef = ref(database, `lobbies/${lobbyId}`);
    const lobbySnapshot = await get(lobbyRef);
    if (lobbySnapshot.exists()) {
        const lobbyData = lobbySnapshot.val();
        lobbyCodeDisplay.textContent = lobbyData.code || lobbyId.substring(0, 6).toUpperCase();
        console.log('Lobby code:', lobbyData.code);
    }

    // Setup event listeners
    setupEventListeners();

    // Override multiplayer callbacks
    multiplayer.onGameStateUpdate = handleGameStateUpdate;
    multiplayer.onPlayersUpdate = handlePlayersUpdate;
    multiplayer.onRealtimeUpdate = handleRealtimeUpdate;

    // Initialize game modules
    console.log('Initializing game modules...');
    initializeGameModules();
    console.log('Game modules initialized');

    // Show waiting screen
    waitingScreen.classList.remove('hidden');
    updateReadyDisplay();

    console.log('Multiplayer setup complete, waiting for players to ready up');
}

/**
 * Initialize core game modules
 */
function initializeGameModules() {
    // Initialize rendering
    Rendering.init(canvas);

    // Initialize UI
    UI.init();

    // Load assets
    Assets.load();

    // Initialize sound
    Sound.init();

    // Setup input handlers (but don't enable yet)
    setupInputHandlers();

    gameInitialized = true;
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    readyBtn.addEventListener('click', async () => {
        Sound.playClick();
        await multiplayer.setPlayerReady();
        readyBtn.disabled = true;
        readyBtn.textContent = 'Ready! ✓';
        updateReadyDisplay();
    });

    leaveLobbyBtn.addEventListener('click', async () => {
        Sound.playClick();
        await multiplayer.leaveLobby();
    });

    backToMenuBtn.addEventListener('click', () => {
        Sound.playClick();
        window.location.href = '../../multiplayer-menu.php';
    });
}

/**
 * Handle game state updates from Firebase
 */
function handleGameStateUpdate(gameState) {
    if (!gameState) return;

    console.log('Game state updated:', {
        phase: gameState.gamePhase,
        currentTurn: gameState.currentTurnPlayerId,
        isMyTurn: multiplayer.isMyTurn()
    });

    // Update current turn display
    const currentPlayerId = gameState.currentTurnPlayerId;
    const currentPlayerState = gameState.playerStates[currentPlayerId];

    if (currentPlayerState) {
        currentPlayerName.textContent = currentPlayerState.name;
        spectatorPlayerName.textContent = currentPlayerState.name;
    }

    // Check if it's my turn
    const isMyTurn = multiplayer.isMyTurn();
    const myState = multiplayer.getMyState();
    const isTaya = myState && myState.isTaya;

    if (isTaya) {
        console.log('You are the Taya!');
        yourTurnBanner.classList.add('hidden');
        spectatorOverlay.classList.remove('hidden');
        spectatorOverlay.innerHTML = '<div class="spectator-message taya-view"><h2>You are the Taya! 🐂</h2><p>Watch the jumpers!</p></div>';
        spectatorOverlay.classList.remove('hidden');
        spectatorOverlay.classList.add('taya-mode'); // Add class for transparent background
        inputEnabled = false;
    } else if (isMyTurn) {
        console.log('It\'s my turn!');
        yourTurnBanner.classList.remove('hidden');
        spectatorOverlay.classList.add('hidden');
        spectatorOverlay.classList.remove('taya-mode');
        // Reset overlay content just in case
        spectatorOverlay.innerHTML = '<div class="spectator-message"><h2>Waiting for your turn...</h2><p>Watch other players!</p></div>';
        inputEnabled = true;
    } else {
        console.log('Spectating...');
        yourTurnBanner.classList.add('hidden');
        if (gameState.gamePhase === 'playing') {
            spectatorOverlay.classList.remove('hidden');
            // Check if current turn player is Taya? Should not happen based on turn logic, but good safety
            spectatorOverlay.innerHTML = '<div class="spectator-message"><h2>Waiting for your turn...</h2><p>Watch other players!</p></div>';
        }
        inputEnabled = false;
    }

    // Update players list
    updatePlayersDisplay(gameState);

    // Handle game phase changes
    if (gameState.gamePhase === 'playing' && waitingScreen.classList.contains('overlay')) {
        console.log('Starting game!');
        startGame();
    } else if (gameState.gamePhase === 'finished') {
        console.log('Game finished!');
        showGameOver(gameState);
    }

    // Sync local game state with multiplayer state
    if (isMyTurn && gameInitialized) {
        const myState = multiplayer.getMyState();
        if (myState) {
            syncLocalGameState(myState);
        }
    }
}

/**
 * Handle players updates
 */
function handlePlayersUpdate(players) {
    updateReadyDisplay();
}

/**
 * Handle real-time updates (movement sync from other players)
 */
function handleRealtimeUpdate(data) {
    // If it's not my turn, update local state based on active player's broadcast
    if (!multiplayer.isMyTurn()) {
        if (data.playerX !== undefined) Player.x = data.playerX;
        if (data.playerY !== undefined) Player.y = data.playerY;
        if (data.gameState !== undefined) GameState.state = data.gameState;
        if (data.chargeAngle !== undefined) GameState.chargeAngle = data.chargeAngle;
        if (data.angleDirection !== undefined) GameState.angleDirection = data.angleDirection;
        if (data.currentLevel !== undefined) {
            GameState.currentLevel = data.currentLevel;
            Baka.setLevel(data.currentLevel);
        }
    }
}

/**
 * Update ready players display
 */
function updateReadyDisplay() {
    if (!multiplayer.syncedGameState) return;

    const playerStates = multiplayer.syncedGameState.playerStates;
    let html = '';

    Object.entries(playerStates).forEach(([playerId, state]) => {
        const isReady = state.isReady;
        const isYou = playerId === multiplayer.playerId;

        html += `
            <div class="ready-player-item ${isReady ? 'ready' : ''}">
                <span class="ready-player-name">
                    ${state.name} ${isYou ? '(You)' : ''}
                </span>
                <span class="ready-status ${isReady ? 'ready' : ''}">
                    ${isReady ? '✓ Ready' : 'Not Ready'}
                </span>
            </div>
        `;
    });

    readyPlayersDisplay.innerHTML = html;

    // Check if all players are ready (host starts game)
    const allReady = Object.values(playerStates).every(state => state.isReady);
    if (allReady && multiplayer.isHost && multiplayer.syncedGameState.gamePhase === 'waiting') {
        setTimeout(() => {
            multiplayer.startGame();
        }, 1000);
    }
}

/**
 * Update players display in sidebar
 */
function updatePlayersDisplay(gameState) {
    const playerStates = gameState.playerStates;
    const currentTurnId = gameState.currentTurnPlayerId;

    let html = '';

    Object.entries(playerStates).forEach(([playerId, state]) => {
        const isCurrentTurn = playerId === currentTurnId;
        const isYou = playerId === multiplayer.playerId;
        const isEliminated = state.isEliminated;
        const isTaya = state.isTaya; // New property

        html += `
            <div class="player-item ${isCurrentTurn ? 'active-turn' : ''} ${isTaya ? 'taya-role' : ''}">
                <div class="player-item-name">
                    ${state.name}
                    ${isYou ? '<span class="player-badge you">YOU</span>' : ''}
                    ${isTaya ? '<span class="player-badge taya">TAYA</span>' : ''}
                </div>
                <div class="player-item-stats">
                    <!-- Lives removed -->
                    <span class="player-stat level">Lv ${state.currentLevel}</span>
                </div>
            </div>
        `;
    });

    playersContainer.innerHTML = html;
}

/**
 * Start the game
 */
function startGame() {
    waitingScreen.classList.add('hidden');
    Sound.startMusic();

    // Reset game state
    GameLogic.resetGame();

    // Start game loop only if not already running
    if (!gameLoopRunning) {
        gameLoopRunning = true;
        gameLoop();
    }
}

/**
 * Sync local game state with multiplayer state
 */
function syncLocalGameState(myState) {
    GameState.lives = myState.lives;
    GameState.currentLevel = myState.currentLevel;
    GameState.totalJumps = myState.totalJumps;

    Baka.setLevel(myState.currentLevel);
    UI.updateLivesDisplay();
}

/**
 * Setup input handlers
 */
function setupInputHandlers() {
    let isInputDown = false;

    function handleInputDown(e) {
        if (!inputEnabled || !multiplayer.isMyTurn()) return;
        if (isInputDown) return;
        if (GameState.state === 'success' || GameState.state === 'fail' || GameState.state === 'gameover') return;

        isInputDown = true;

        if (GameState.state === 'idle') {
            GameState.state = 'running';
            Sound.playRun();
        } else if (GameState.state === 'running') {
            GameState.state = 'charging';
            Sound.stopRun();
            GameState.chargeAngle = CONFIG.minAngle + 15;
            GameState.angleDirection = 1;
        } else if (GameState.state === 'jumping') {
            // Record bounce input time
            GameState.bounceInputTime = Date.now();
        }
    }

    function handleInputUp(e) {
        if (!inputEnabled || !multiplayer.isMyTurn()) return;
        if (!isInputDown) return;

        isInputDown = false;

        if (GameState.state === 'charging') {
            GameState.state = 'jumping';
            GameLogic.executeJump();
            Sound.playJump();
        }
    }

    // Keyboard input
    window.addEventListener('keydown', (e) => {
        if (e.code === 'Space') {
            e.preventDefault();
            handleInputDown(e);
        }
    });

    window.addEventListener('keyup', (e) => {
        if (e.code === 'Space') {
            e.preventDefault();
            handleInputUp(e);
        }
    });

    // Mouse/touch input
    canvas.addEventListener('mousedown', handleInputDown);
    canvas.addEventListener('mouseup', handleInputUp);
    canvas.addEventListener('touchstart', handleInputDown);
    canvas.addEventListener('touchend', handleInputUp);
}

/**
 * Game loop
 */
function gameLoop() {
    update();
    Rendering.render();
    requestAnimationFrame(gameLoop);
}

/**
 * Update game state
 */
function update() {
    // Broadcast my state to all spectators if it's my turn
    if (multiplayer.isMyTurn()) {
        const now = Date.now();
        if (!window.lastBroadcast || now - window.lastBroadcast > 50) { // 50ms throttle (~20 FPS)
            multiplayer.updateRealtimeState({
                playerX: Player.x,
                playerY: Player.y,
                gameState: GameState.state,
                chargeAngle: GameState.chargeAngle,
                angleDirection: GameState.angleDirection,
                currentLevel: GameState.currentLevel
            });
            window.lastBroadcast = now;
        }
    } else {
        // Spectator mode - state is updated via handleRealtimeUpdate
        // Just return, rendering will use the synced data
        return;
    }

    switch (GameState.state) {
        case 'running':
            // SPEED NORMALIZATION: Removed difficultyMultiplier
            Player.x += CONFIG.runSpeed;

            if (Player.x + Player.width > Baka.x + 30) {
                Sound.stopRun();
                GameState.state = 'fail';
                handlePlayerFail('Ran into baka!');
            }
            break;

        case 'charging':
            // SPEED NORMALIZATION: Removed difficultyMultiplier
            GameState.chargeAngle += GameState.angleDirection * GameState.angleSpeed;
            if (GameState.chargeAngle >= CONFIG.maxAngle) {
                GameState.chargeAngle = CONFIG.maxAngle;
                GameState.angleDirection = -1;
            } else if (GameState.chargeAngle <= CONFIG.minAngle) {
                GameState.chargeAngle = CONFIG.minAngle;
                GameState.angleDirection = 1;
            }
            break;

        case 'jumping':
            const landed = GameLogic.updateJumpArc();
            const collision = GameLogic.checkBakaCollision();

            if (collision === 'bounce') {
                const timeSinceInput = Date.now() - GameState.bounceInputTime;

                if (timeSinceInput < 250) {
                    GameLogic.handleBounce();
                    Sound.playJump();
                    UI.showMessage('✨ PERFECT! ✨', 'success');
                    GameState.bounceInputTime = 0;
                } else {
                    GameState.state = 'fail';
                    handlePlayerFail('Missed timing!');
                }
            }

            const canHitBaka = GameState.currentLevel >= 4;

            if (canHitBaka && collision === 'hit') {
                GameState.state = 'fail';
                handlePlayerFail('Hit the baka!');
            } else if (landed) {
                if (collision === 'clear' || Player.x > Baka.x + Baka.width) {
                    GameState.state = 'success';
                    handlePlayerSuccess();
                } else {
                    GameState.state = 'fail';
                    handlePlayerFail('Too short!');
                }
            }
            break;
    }
}

/**
 * Handle player success
 */
async function handlePlayerSuccess() {
    GameState.totalJumps++;
    const nextLevel = Math.min(GameState.currentLevel + 1, 5);
    const score = GameState.totalJumps * 100;

    UI.showMessage(`Level ${nextLevel}!`, 'success');

    // Update Firebase
    await multiplayer.updatePlayerAction({
        type: 'level_complete',
        level: nextLevel,
        lives: 0, // Ignored
        totalJumps: GameState.totalJumps,
        score: score,
        angle: GameState.chargeAngle
    });

    setTimeout(async () => {
        if (nextLevel > 5) {
            // Player completed all levels
            await multiplayer.updatePlayerAction({
                type: 'game_complete',
                level: 5,
                lives: GameState.lives,
                totalJumps: GameState.totalJumps,
                score: score
            });
        }

        Player.reset();
        GameState.state = 'idle';

        // Advance turn
        await multiplayer.nextTurn();
    }, 1500);
}

/**
 * Handle player failure
 */
async function handlePlayerFail(message) {
    // GameState.lives--; // REMOVED: No lives system anymore
    // UI.updateLivesDisplay(); // REMOVED

    UI.showMessage(`💥 ${message} You are now the Baka!`, 'fail');

    const score = GameState.totalJumps * 100;

    // Update Firebase first with the fail action
    await multiplayer.updatePlayerAction({
        type: 'jump_fail',
        level: GameState.currentLevel,
        lives: 0, // Ignored
        totalJumps: GameState.totalJumps,
        score: score,
        angle: GameState.chargeAngle
    });

    // NOW Switch Roles: I become Taya
    console.log('Switching roles: I am now Taya');
    await multiplayer.switchRoles(multiplayer.playerId);

    setTimeout(async () => {
        Player.reset();
        GameState.state = 'idle';

        // Advance turn (will skip new Taya automatically and pick next jumper)
        await multiplayer.nextTurn();
    }, 2000);
}

/**
 * Show game over screen
 */
function showGameOver(gameState) {
    gameOverScreen.classList.remove('hidden');
    spectatorOverlay.classList.add('hidden');

    // Calculate final scores
    const scores = Object.entries(gameState.playerStates)
        .map(([id, state]) => ({
            id,
            name: state.name,
            score: state.score || 0,
            level: state.currentLevel,
            jumps: state.totalJumps
        }))
        .sort((a, b) => {
            // Sort by level first, then by jumps
            if (b.level !== a.level) return b.level - a.level;
            return b.jumps - a.jumps;
        });

    // Display scores
    let html = '<h3>Final Scores</h3>';
    scores.forEach((player, index) => {
        const isWinner = index === 0;
        const isYou = player.id === multiplayer.playerId;

        html += `
            <div class="score-item ${isWinner ? 'winner' : ''}">
                <span class="score-rank">${index + 1}.</span>
                <span class="score-name">
                    ${player.name} ${isYou ? '(You)' : ''}
                    ${isWinner ? '🏆' : ''}
                </span>
                <span class="score-value">
                    Lv ${player.level} • ${player.jumps} jumps
                </span>
            </div>
        `;
    });

    finalScoresContainer.innerHTML = html;
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    init();
});
