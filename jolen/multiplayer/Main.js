// Main.js - Multiplayer Jolen Game Logic
import {
    FRICTION,
    MARBLE_RADIUS,
    PLAYER_COLOR,
    MAX_DRAG_DISTANCE,
    POWER_MULTIPLIER,
    COLLISION_ELASTICITY,
    loadAssets,
    images,
    updateMarble,
    drawMarble,
} from "./Common.js";




import * as TargetMode from "./TargetMode.js"; // Multiplayer version with physics
import * as CircleMode from "./CircleMode.js"; // Multiplayer version
import * as HoleMode from "./HoleMode.js"; // Multiplayer version
import * as LineMode from "./LineMode.js"; // Multiplayer version




import { ModeSelection } from "./ModeSelection.js";
import { InputHandler } from "./InputHandler.js";
import { GameRenderer } from "./GameRenderer.js";
import Sound from "../js/Sound.js";
import { FirebaseSync } from "./FirebaseSync.js";
import { MultiplayerUI } from "./UI.js";
import { auth, signInAnonymously } from '../../config/firebase.js';

class MultiplayerJolen {
    constructor() {
        this.canvas = document.getElementById("gameCanvas");
        this.ctx = this.canvas.getContext("2d");
        this.canvas.width = 1280;
        this.canvas.height = 720;

        // Game state
        this.lobbyId = null;
        this.userId = null;
        this.isHost = false;
        this.firebaseSync = null;
        this.ui = new MultiplayerUI();

        // Players
        this.players = [];
        this.playerNames = {};
        this.currentTurnPlayerId = null;
        this.isMyTurn = false;

        // Game data
        this.gameMode = "target";
        this.currentModeModule = TargetMode;
        this.modeState = null;
        this.targetCount = 6; // Number of targets (6-10)
        this.scores = {};
        this.gameState = "idle"; // idle, dragging, shooting, waiting, gameOver

        // Marble - now tracking all player marbles
        this.startingPosition = { x: this.canvas.width / 2, y: this.canvas.height - 100 };
        this.playerMarbles = {}; // Object storing all players' marbles by playerId

        // Input
        this.isDragging = false;
        this.dragStartX = 0;
        this.dragStartY = 0;
        this.dragCurrentX = 0;
        this.dragCurrentY = 0;

        // Message
        this.message = "";
        this.messageTimer = 0;

        // Turn tracking
        this.currentTurnHitCount = 0; // Track hits in current turn

        // Sync state
        this.lastSyncedState = null;
        this.isWaitingForSync = false;

        // Mode selection
        this.modeSelection = new ModeSelection();
        this.modeSelection.onModeSelected = (mode, targetCount) => this.onHostSelectMode(mode, targetCount);

        // Initialize modules
        this.inputHandler = new InputHandler(this);
        this.renderer = new GameRenderer(this);

        this.init();
    }

    async init() {
        console.log('🎮 Initializing Multiplayer Jolen...');

        // Get lobby ID from URL
        const urlParams = new URLSearchParams(window.location.search);
        this.lobbyId = urlParams.get('lobby');

        if (!this.lobbyId) {
            alert('No lobby ID found. Redirecting...');
            window.location.href = '../../multiplayer-menu.php';
            return;
        }

        // Authenticate with Firebase
        try {
            if (!auth.currentUser) {
                await signInAnonymously(auth);
            }
            this.userId = auth.currentUser.uid;
            console.log('✓ Firebase UID:', this.userId);
        } catch (error) {
            console.error('Firebase auth error:', error);
            alert('Authentication failed. Please try again.');
            window.location.href = '../../multiplayer-menu.php';
            return;
        }

        // Initialize Firebase sync
        this.firebaseSync = new FirebaseSync(this.lobbyId);
        await this.firebaseSync.init();

        // Load lobby data
        await this.loadLobbyData();

        // Load assets
        await loadAssets();
        console.log('✓ Assets loaded');

        // Initialize sound
        Sound.init();

        // Setup input listeners
        this.setupInputListeners();

        // Setup Firebase listeners
        this.setupFirebaseListeners();

        // If host, initialize game state (but don't start yet)
        if (this.isHost) {
            await this.initializeGame();
        }

        // Show ready screen
        this.showReadyScreen();

        // Start game loop
        this.update();
    }

    showReadyScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        const waitingScreen = document.getElementById('waitingScreen');
        const readyBtn = document.getElementById('readyBtn');

        loadingScreen.classList.add('hidden');
        waitingScreen.classList.remove('hidden');

        // Ready button handler
        readyBtn.addEventListener('click', async () => {
            await this.firebaseSync.setPlayerReady();
            readyBtn.disabled = true;
            readyBtn.textContent = 'Ready! ✓';
        });

        this.updateReadyDisplay();
    }

    updateReadyDisplay() {
        const readyPlayersDisplay = document.getElementById('readyPlayersDisplay');
        if (!this.firebaseSync || !this.players) return;

        // We'll update this from Firebase callback
    }

    updateReadyDisplayFromGameState(playerStates) {
        const readyPlayersDisplay = document.getElementById('readyPlayersDisplay');
        console.log('📋 updateReadyDisplayFromGameState called');
        console.log('  - playerStates:', playerStates);
        console.log('  - readyPlayersDisplay element:', readyPlayersDisplay);

        if (!readyPlayersDisplay || !playerStates) {
            console.warn('⚠️ Missing element or playerStates');
            return;
        }

        let html = '';
        Object.entries(playerStates).forEach(([playerId, state]) => {
            const isReady = state.isReady;
            const playerName = this.playerNames[playerId] || 'Player';
            const isYou = playerId === this.userId;

            html += `
                <div class="ready-player-item ${isReady ? 'ready' : ''}">
                    <span class="ready-player-name">
                        ${playerName} ${isYou ? '(You)' : ''}
                    </span>
                    <span class="ready-status ${isReady ? 'ready' : ''}">
                        ${isReady ? '✓ Ready' : 'Not Ready'}
                    </span>
                </div>
            `;
        });

        console.log('✅ Setting ready display HTML:', html);
        readyPlayersDisplay.innerHTML = html;
    }

    async loadLobbyData() {
        const lobby = await this.firebaseSync.getLobbyData();

        if (!lobby) {
            alert('Lobby not found. Redirecting...');
            window.location.href = '../../multiplayer-menu.php';
            return;
        }

        // Check if user is host
        this.isHost = lobby.hostId === this.userId;

        // Load players
        this.players = [];
        this.playerNames = {};

        if (lobby.players) {
            Object.entries(lobby.players).forEach(([playerId, playerData]) => {
                this.players.push({
                    id: playerId,
                    name: playerData.name,
                    isHost: playerData.isHost
                });
                this.playerNames[playerId] = playerData.name;
            });
        }

        // Sort players by join time (host first)
        this.players.sort((a, b) => {
            if (a.isHost) return -1;
            if (b.isHost) return 1;
            return 0;
        });

        // Load game settings
        if (lobby.game) {
            // Mode would be set here if we had mode selection
            // For now, default to target mode
        }

        console.log('✓ Lobby loaded:', {
            isHost: this.isHost,
            players: this.players.length,
            lobbyId: this.lobbyId
        });

        // Initialize UI
        this.ui.init(this.userId, this.playerNames);
    }

    updatePlayersFromLobby(lobby) {
        if (!lobby || !lobby.players) return;

        this.players = [];
        this.playerNames = {};

        Object.entries(lobby.players).forEach(([playerId, playerData]) => {
            this.players.push({
                id: playerId,
                name: playerData.name,
                isHost: playerData.isHost
            });
            this.playerNames[playerId] = playerData.name;
        });

        // Sort: Host first, then by join time/ID
        this.players.sort((a, b) => {
            if (a.isHost) return -1;
            if (b.isHost) return 1;
            return 0; // Keep original order if possible, or sort by name if needed
        });

        // Update UI list immediately
        this.ui.updatePlayersList(this.players, this.scores, this.currentTurnPlayerId);
    }

    async initializeGame() {
        console.log('🎯 Host initializing game...');

        const playerIds = this.players.map(p => p.id);
        await this.firebaseSync.initializeGame(playerIds, this.gameMode, this.targetCount);

        console.log('✓ Game initialized with', this.targetCount, 'targets');

        // Setup targets based on targetCount
        this.modeState = this.currentModeModule.setup(this.targetCount, this.canvas.width, this.canvas.height);
        console.log('✓ Targets created:', this.modeState.length, 'targets');

        // Initialize player marbles for all players
        this.players.forEach((player, index) => {
            this.playerMarbles[player.id] = {
                x: this.startingPosition.x,
                y: this.startingPosition.y,
                radius: MARBLE_RADIUS,
                vx: 0,
                vy: 0,
                color: PLAYER_COLOR,
                isMoving: false
            };
        });

        // Sync the mode state and player marbles to Firebase
        await this.firebaseSync.updateModeState(this.modeState);
        await this.firebaseSync.updateAllPlayerMarbles(this.getPlayerMarblesForSync());
        console.log('✓ Mode state and player marbles synced to Firebase');
    }

    // Helper to get player marbles data for Firebase sync (without extra properties)
    getPlayerMarblesForSync() {
        const syncData = {};
        Object.keys(this.playerMarbles).forEach(playerId => {
            const marble = this.playerMarbles[playerId];
            syncData[playerId] = {
                x: marble.x,
                y: marble.y,
                vx: marble.vx,
                vy: marble.vy
            };
        });
        return syncData;
    }

    setupFirebaseListeners() {
        // Listen to game state changes
        this.firebaseSync.listenToGameState((gameState) => {
            this.onGameStateUpdate(gameState);
        });

        // Listen to lobby changes (for disconnects and player updates)
        this.firebaseSync.listenToLobby((lobby) => {
            if (!lobby) {
                alert('Lobby closed. Returning to menu...');
                window.location.href = '../../multiplayer-menu.php';
                return;
            }

            // 1. Host Leave Check
            // Check if the original host is still in the players list
            if (lobby.players && !lobby.players[lobby.hostId]) {
                alert('Host left the game. Lobby is closing...');
                window.location.href = '../../multiplayer-menu.php';
                return;
            }

            // 2. Player Leave Check & Notification
            if (lobby.players) {
                const currentIds = Object.keys(lobby.players);
                // Find players who left by filtering (matches Luksong Baka pattern)
                if (this.players && this.players.length > 0) {
                    const previousIds = this.players.map(p => p.id);
                    const leftPlayers = previousIds.filter(id => !currentIds.includes(id));

                    // Show notification for each player who left
                    leftPlayers.forEach(prevId => {
                        const leftPlayerName = this.playerNames[prevId] || 'A player';
                        console.log(`👋 ${leftPlayerName} left the game`);
                        this.showNotification(`${leftPlayerName} left the game`);

                        // HOST LOGIC: Clean up game state for this player (non-blocking)
                        if (this.isHost && this.firebaseSync && typeof this.firebaseSync.removePlayerFromGame === 'function') {
                            console.log('👑 Host cleaning up left player:', prevId);
                            // Don't await - let it happen in background to avoid stack overflow
                            this.firebaseSync.removePlayerFromGame(prevId).catch(error => {
                                console.error('Error removing player from game:', error);
                            });
                        }
                    });
                }

                // 3. Minimum Player Check (check during playing state)
                const remainingPlayerCount = currentIds.length;
                const gamePhase = this.gameState; // Use local game state

                if (remainingPlayerCount < 2 && (gamePhase === 'playing' || gamePhase === 'shooting' || gamePhase === 'dragging')) {
                    console.log('⚠️ Not enough players to continue. Returning to lobby...');

                    // Show styled notification (matches Luksong Baka style)
                    const notification = document.createElement('div');
                    notification.className = 'player-left-notification';
                    notification.style.cssText = `
                        position: fixed;
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%);
                        background: linear-gradient(135deg, rgba(241, 196, 15, 0.95), rgba(243, 156, 18, 0.95));
                        padding: 20px 40px;
                        border-radius: 15px;
                        box-shadow: 0 8px 30px rgba(0, 0, 0, 0.4);
                        z-index: 10000;
                        display: flex;
                        align-items: center;
                        gap: 15px;
                        font-family: 'Poppins', sans-serif;
                        font-size: 18px;
                        font-weight: 600;
                        color: white;
                        opacity: 0;
                        transition: opacity 0.3s ease;
                    `;
                    notification.innerHTML = `
                        <span class="notification-icon" style="font-size: 24px;">⚠️</span>
                        <span class="notification-text">Not enough players. Returning to lobby...</span>
                    `;
                    document.body.appendChild(notification);

                    // Force a reflow to ensure the initial state is rendered
                    notification.offsetHeight; // This triggers a reflow

                    // Trigger animation
                    setTimeout(() => {
                        notification.style.opacity = '1';
                    }, 10);

                    // Redirect to lobby after 2 seconds
                    setTimeout(() => {
                        window.location.href = '../../multiplayer-menu.php';
                    }, 2000);

                    return; // Don't update player list if redirecting
                }
            }

            // Update local player list from the new lobby data
            this.updatePlayersFromLobby(lobby);
        });
    }

    // Helper for showing temporary notifications
    showNotification(message) {
        let notif = document.getElementById('game-notification');
        if (!notif) {
            notif = document.createElement('div');
            notif.id = 'game-notification';
            notif.style.position = 'fixed';
            notif.style.top = '20px';
            notif.style.left = '50%';
            notif.style.transform = 'translateX(-50%)';
            notif.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
            notif.style.color = 'white';
            notif.style.padding = '10px 20px';
            notif.style.borderRadius = '20px';
            notif.style.zIndex = '1000';
            notif.style.transition = 'opacity 0.3s';
            document.body.appendChild(notif);
        }

        notif.textContent = message;
        notif.style.opacity = '1';
        notif.style.display = 'block';

        setTimeout(() => {
            notif.style.opacity = '0';
            setTimeout(() => {
                notif.style.display = 'none';
            }, 300);
        }, 3000);
    }

    onGameStateUpdate(gameState) {
        if (!gameState) return;

        console.log('📡 Game state update:', {
            level: gameState.level,
            gameState: gameState.gameState,
            modeState: gameState.modeState ? 'exists' : 'null',
            currentTurn: gameState.currentTurnPlayerId,
            isMyTurn: gameState.currentTurnPlayerId === this.userId
        });

        // Handle waiting state (ready screen)
        if (gameState.gameState === 'waiting' && gameState.playerStates) {
            this.updateReadyDisplayFromGameState(gameState.playerStates);

            // Check if all players are ready
            const allReady = Object.values(gameState.playerStates).every(state => state.isReady);
            if (allReady) {
                // Show mode selection screen
                const waitingScreen = document.getElementById('waitingScreen');
                if (!waitingScreen.classList.contains('hidden')) {
                    console.log('✓ All players ready! Showing mode selection...');
                    waitingScreen.classList.add('hidden');
                    this.modeSelection.show(this.isHost);
                }
            }
            return;
        }

        // Handle mode selection state
        if (gameState.gameState === 'mode_selection') {
            // Non-host: update display to show selected mode
            if (!this.isHost && gameState.selectedMode) {
                this.modeSelection.showSelectedMode(gameState.selectedMode);
                // Auto-transition after 2 seconds
                setTimeout(() => {
                    this.modeSelection.hide();
                }, 2000);
            }
            return;
        }

        // Handle transition to playing state
        if (gameState.gameState === 'playing') {
            const waitingScreen = document.getElementById('waitingScreen');
            const modeSelectionScreen = document.getElementById('modeSelectionScreen');
            const gameContainer = document.getElementById('game-container');

            if (!waitingScreen.classList.contains('hidden')) {
                waitingScreen.classList.add('hidden');
            }
            if (modeSelectionScreen && !modeSelectionScreen.classList.contains('hidden')) {
                modeSelectionScreen.classList.add('hidden');
            }
            if (gameContainer.style.display === 'none') {
                gameContainer.style.display = 'block';
                console.log('✓ Game started!');
            }
        }

        // Update targetCount
        if (gameState.targetCount !== this.targetCount) {
            this.targetCount = gameState.targetCount || 6;
            this.ui.updateTargetsRemaining(this.countRemainingTargets(), this.targetCount);
        }

        // Update mode
        if (gameState.gameMode !== this.gameMode) {
            console.log(`🔄 Mode change detected: ${this.gameMode} -> ${gameState.gameMode}`);
            this.gameMode = gameState.gameMode;
            this.ui.updateMode(this.gameMode);
            this.setGameMode(this.gameMode);

            // Force reset local state to match new mode
            // This ensures all clients reset their scores and positions
            if (gameState.scores) {
                this.scores = { ...gameState.scores };
            }

            // Reset player marbles - critical for mode switching!
            if (gameState.playerMarbles) {
                console.log('✓ Resetting all marbles for new mode');
                Object.keys(gameState.playerMarbles).forEach(playerId => {
                    const fbMarble = gameState.playerMarbles[playerId];

                    if (!this.playerMarbles[playerId]) {
                        this.playerMarbles[playerId] = { ...fbMarble, radius: MARBLE_RADIUS, color: PLAYER_COLOR, isMoving: false };
                    } else {
                        // FORCE update even for my own marble on mode change
                        this.playerMarbles[playerId].x = fbMarble.x;
                        this.playerMarbles[playerId].y = fbMarble.y;
                        this.playerMarbles[playerId].vx = fbMarble.vx || 0;
                        this.playerMarbles[playerId].vy = fbMarble.vy || 0;
                        this.playerMarbles[playerId].isMoving = false;
                    }
                });
            }

            // CRITICAL: Also sync modeState immediately on mode change
            // Don't wait for the regular modeState sync which might skip based on turn
            if (gameState.modeState) {
                console.log('✓ Syncing mode state for new mode');
                this.modeState = gameState.modeState;
            }

            // Force sync current turn from Firebase on mode change
            if (gameState.currentTurnPlayerId) {
                this.currentTurnPlayerId = gameState.currentTurnPlayerId;
                this.isMyTurn = this.currentTurnPlayerId === this.userId;
                const playerName = this.playerNames[this.currentTurnPlayerId] || 'Unknown';
                this.ui.updateTurnIndicator(this.currentTurnPlayerId, playerName, this.isMyTurn);
                console.log('✓ Turn reset to:', playerName);
            }

            // Reset game state to idle
            this.gameState = "idle";
            this.currentTurnHitCount = 0;

            // Update UI
            this.ui.updatePlayersList(this.players, this.scores, this.currentTurnPlayerId);
            this.ui.updateTargetsRemaining(this.countRemainingTargets(), this.targetCount);

            console.log('✓ Mode switch complete. State reset.');
        }

        // Update scores
        this.scores = gameState.scores || {};

        // Update current turn
        const newTurnPlayerId = gameState.currentTurnPlayerId;
        if (newTurnPlayerId !== this.currentTurnPlayerId) {
            this.currentTurnPlayerId = newTurnPlayerId;
            this.isMyTurn = this.currentTurnPlayerId === this.userId;

            const playerName = this.playerNames[this.currentTurnPlayerId] || 'Unknown';
            this.ui.updateTurnIndicator(this.currentTurnPlayerId, playerName, this.isMyTurn);

            // Reset for new turn
            if (this.isMyTurn) {
                this.gameState = "idle";
                this.currentTurnHitCount = 0; // Reset hit counter for new turn
                // Only reset velocity for current player's marble, keep position
                if (this.playerMarbles[this.userId]) {
                    this.playerMarbles[this.userId].vx = 0;
                    this.playerMarbles[this.userId].vy = 0;
                    this.playerMarbles[this.userId].isMoving = false;
                }
            } else {
                this.gameState = "waiting";
            }
        }

        // Update players list
        this.ui.updatePlayersList(this.players, this.scores, this.currentTurnPlayerId);

        // Sync mode state (targets/objects)
        if (gameState.modeState) {
            // Only update local state if it's NOT my turn
            // (If it is my turn, I'm the one simulating the physics!)
            if (!this.isMyTurn) {
                if (Array.isArray(gameState.modeState)) {
                    console.log('✓ Received mode state with', gameState.modeState.length, 'objects');
                } else {
                    console.log('✓ Received mode state (object-based)');
                }
                this.modeState = gameState.modeState;

                // Only update target count if state structure matches current mode
                // This prevents crashes during mode transitions
                try {
                    this.ui.updateTargetsRemaining(this.countRemainingTargets(), this.targetCount);
                } catch (error) {
                    console.warn('⚠️ Skipping target count update during mode transition:', error.message);
                }
            }
        } else {
            console.warn('⚠️ No mode state in game update');
        }

        // Sync marble position and velocity
        if (gameState.playerMarbles) {
            // Update all player marbles from Firebase
            Object.keys(gameState.playerMarbles).forEach(playerId => {
                // Skip updating the current player's marble if it's their turn
                // (they are simulating physics locally, including collisions)
                if (this.isMyTurn && playerId === this.userId) {
                    return; // Skip this player
                }

                if (!this.playerMarbles[playerId]) {
                    // Initialize if doesn't exist
                    this.playerMarbles[playerId] = {
                        x: 0,
                        y: 0,
                        radius: MARBLE_RADIUS,
                        vx: 0,
                        vy: 0,
                        color: PLAYER_COLOR,
                        isMoving: false
                    };
                }

                const fbMarble = gameState.playerMarbles[playerId];
                this.playerMarbles[playerId].x = fbMarble.x;
                this.playerMarbles[playerId].y = fbMarble.y;
                this.playerMarbles[playerId].vx = fbMarble.vx || 0;
                this.playerMarbles[playerId].vy = fbMarble.vy || 0;

                // Check if any marble has velocity (for spectating)
                const hasVelocity = Math.abs(fbMarble.vx) > 0.1 || Math.abs(fbMarble.vy) > 0.1;
                if (hasVelocity && this.gameState !== "shooting" && !this.isMyTurn) {
                    console.log('📺 Spectating marble movement...');
                    this.gameState = "shooting";
                }
            });
        }


        // Check for game over
        if (gameState.gameState === 'finished') {
            this.showGameOver();
        }
    }


    // Host selects mode and target count, then starts game
    async onHostSelectMode(mode, targetCount) {
        if (!this.isHost) return;

        console.log('🎯 Host selected mode:', mode, 'with', targetCount, 'targets');

        // Set local game mode and target count FIRST
        this.gameMode = mode;
        this.targetCount = targetCount;
        this.setGameMode(mode);

        // NOW setup targets with the correct count
        this.modeState = this.currentModeModule.setup(this.targetCount, this.canvas.width, this.canvas.height);

        console.log('✓ Setup complete for mode:', mode, '- created', this.modeState.length, 'targets');

        // Update UI immediately for host
        this.ui.updateTargetsRemaining(this.countRemainingTargets(), this.targetCount);

        // Sync to Firebase (this will update gameState.selectedMode)
        await this.firebaseSync.setSelectedMode(mode);

        // Sync the mode state to Firebase
        await this.firebaseSync.updateModeState(this.modeState);
        console.log('✓ Mode state synced to Firebase');

        // Hide mode selection
        this.modeSelection.hide();

        // Start the game with the selected mode and target count
        await this.firebaseSync.startGameWithMode(mode, targetCount);
    }

    setupTargets() {
        // Only host initializes targets
        if (!this.isHost) return;

        this.modeState = this.currentModeModule.setup(this.targetCount, this.canvas.width, this.canvas.height);
        this.firebaseSync.updateModeState(this.modeState);
    }

    setGameMode(mode) {
        switch (mode) {
            case "target": this.currentModeModule = TargetMode; break;
            case "circle": this.currentModeModule = CircleMode; break;
            case "hole": this.currentModeModule = HoleMode; break;
            case "line": this.currentModeModule = LineMode; break;
        }
    }

    setupInputListeners() {
        // Use InputHandler for mouse events
        this.inputHandler.setupListeners();

        // Return to lobby button
        const returnBtn = document.getElementById('returnToLobbyBtn');
        if (returnBtn) {
            returnBtn.addEventListener('click', () => {
                window.location.href = '../../multiplayer-menu.php';
            });
        }

        // Settings menu button
        const menuBtn = document.getElementById('menuBtn');
        if (menuBtn) {
            menuBtn.addEventListener('click', () => this.openSettings());
        }

        // Close settings button
        const closeSettingsBtn = document.getElementById('closeSettingsBtn');
        if (closeSettingsBtn) {
            closeSettingsBtn.addEventListener('click', () => this.closeSettings());
        }

        // Leave lobby button
        const leaveLobbyBtn = document.getElementById('leaveLobbyBtn');
        if (leaveLobbyBtn) {
            leaveLobbyBtn.addEventListener('click', () => this.showConfirmDialog(
                'Leave Lobby',
                'Are you sure you want to leave the lobby?',
                () => {
                    window.location.href = '../../multiplayer-menu.php';
                }
            ));
        }

        // Mode change buttons (host only)
        const modeBtns = document.querySelectorAll('.settings-mode-btn');
        modeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                if (!this.isHost) return;
                const newMode = btn.dataset.mode;
                if (newMode === this.gameMode) return; // Already on this mode

                this.showConfirmDialog(
                    'Change Mode',
                    `Change game mode to ${this.getModeDisplayName(newMode)}? This will restart the game.`,
                    async () => {
                        await this.changeGameMode(newMode);
                    }
                );
            });
        });

        // Confirmation dialog buttons
        const confirmYesBtn = document.getElementById('confirmYesBtn');
        const confirmNoBtn = document.getElementById('confirmNoBtn');
        if (confirmYesBtn) {
            confirmYesBtn.addEventListener('click', async () => {
                if (this.confirmCallback) {
                    // Disable button to prevent double-clicks
                    confirmYesBtn.disabled = true;
                    confirmYesBtn.textContent = 'Processing...';

                    try {
                        await this.confirmCallback();
                    } catch (error) {
                        console.error('Error in confirm callback:', error);
                    } finally {
                        // Re-enable button
                        confirmYesBtn.disabled = false;
                        confirmYesBtn.textContent = 'Yes';
                    }
                }
                this.closeConfirmDialog();
            });
        }
        if (confirmNoBtn) {
            confirmNoBtn.addEventListener('click', () => this.closeConfirmDialog());
        }
    }

    openSettings() {
        const settingsOverlay = document.getElementById('settingsOverlay');
        const changeModeSection = document.getElementById('changeModeSection');
        const settingsModeText = document.getElementById('settingsModeText');
        const currentModeDisplay = document.getElementById('currentModeDisplay');

        // Update current mode display
        settingsModeText.textContent = this.getModeDisplayName(this.gameMode);
        currentModeDisplay.querySelector('.mode-icon').textContent = this.getModeIcon(this.gameMode);

        // Show/hide host-only section (the h3 "Change Mode" and mode-options)
        const changeModeHeader = document.getElementById('changeModeSection');
        const modeOptions = document.querySelector('#settingsOverlay .mode-options');
        if (changeModeHeader) {
            changeModeHeader.style.display = this.isHost ? 'block' : 'none';
        }
        if (modeOptions) {
            modeOptions.style.display = this.isHost ? 'flex' : 'none';
        }

        // Update active mode button
        document.querySelectorAll('.settings-mode-btn').forEach(btn => {
            btn.classList.toggle('selected', btn.dataset.mode === this.gameMode);
            btn.disabled = !this.isHost;
        });

        settingsOverlay.classList.remove('hidden');
    }

    closeSettings() {
        const settingsOverlay = document.getElementById('settingsOverlay');
        settingsOverlay.classList.add('hidden');
    }

    getModeDisplayName(mode) {
        const names = {
            'target': 'Target',
            'circle': 'Circle',
            'hole': 'Hole',
            'line': 'Line'
        };
        return names[mode] || mode;
    }

    getModeIcon(mode) {
        const icons = {
            'target': '🎯',
            'circle': '⭕',
            'hole': '🕳️',
            'line': '📏'
        };
        return icons[mode] || '🎮';
    }

    showConfirmDialog(title, message, callback) {
        this.confirmCallback = callback;
        const dialog = document.getElementById('confirmDialog');
        document.getElementById('confirmTitle').textContent = title;
        document.getElementById('confirmMessage').textContent = message;
        dialog.classList.remove('hidden');
    }

    closeConfirmDialog() {
        const dialog = document.getElementById('confirmDialog');
        dialog.classList.add('hidden');
        this.confirmCallback = null;
    }

    async changeGameMode(newMode) {
        if (!this.isHost) return;

        console.log('🔄 Changing game mode to:', newMode);

        // Update local mode
        this.gameMode = newMode;
        this.setGameMode(newMode);

        // Reset and setup new targets
        this.modeState = this.currentModeModule.setup(this.targetCount, this.canvas.width, this.canvas.height);

        // Reset all player marbles to starting position
        this.resetAllPlayerMarbles();

        // Reset scores to 0
        Object.keys(this.scores).forEach(playerId => {
            this.scores[playerId] = 0;
        });

        // Reset game state to idle to allow playing
        this.gameState = "idle";
        this.currentTurnHitCount = 0;

        // Update UI
        this.ui.updateTargetsRemaining(this.countRemainingTargets(), this.targetCount);
        this.ui.updateMode(newMode);
        this.ui.updatePlayersList(this.players, this.scores, this.currentTurnPlayerId);

        // Sync to Firebase
        await this.firebaseSync.updateModeState(this.modeState);
        // Pass the first player's ID (Host) as the next turn player
        const nextPlayerId = this.players.length > 0 ? this.players[0].id : this.userId;
        await this.firebaseSync.updateGameMode(newMode, this.scores, nextPlayerId);
        await this.firebaseSync.updateAllPlayerMarbles(this.getPlayerMarblesForSync());

        // Close settings
        this.closeSettings();

        console.log('✓ Game mode changed to:', newMode);
    }

    resetPlayerMarble() {
        // Only reset velocity for current player's marble, preserve position
        if (this.playerMarbles[this.userId]) {
            this.playerMarbles[this.userId].vx = 0;
            this.playerMarbles[this.userId].vy = 0;
            this.playerMarbles[this.userId].isMoving = false;
        }
    }

    resetPlayerMarblePosition() {
        // Full reset including position for current player (for level start)
        if (this.playerMarbles[this.userId]) {
            this.playerMarbles[this.userId].x = this.startingPosition.x;
            this.playerMarbles[this.userId].y = this.startingPosition.y;
            this.playerMarbles[this.userId].vx = 0;
            this.playerMarbles[this.userId].vy = 0;
            this.playerMarbles[this.userId].isMoving = false;
        }
    }

    resetAllPlayerMarbles() {
        // Reset all players' marbles to starting position (level complete)
        Object.keys(this.playerMarbles).forEach(playerId => {
            this.playerMarbles[playerId].x = this.startingPosition.x;
            this.playerMarbles[playerId].y = this.startingPosition.y;
            this.playerMarbles[playerId].vx = 0;
            this.playerMarbles[playerId].vy = 0;
            this.playerMarbles[playerId].isMoving = false;
        });
    }

    getPlayerMarblesForSync() {
        const marblesForSync = {};
        Object.keys(this.playerMarbles).forEach(playerId => {
            const marble = this.playerMarbles[playerId];
            marblesForSync[playerId] = {
                x: marble.x,
                y: marble.y,
                vx: marble.vx,
                vy: marble.vy
            };
        });
        return marblesForSync;
    }

    // Note: Input handling methods are in InputHandler.js

    // Game loop
    update() {
        // Update physics for ALL player marbles when in shooting state
        if (this.gameState === "shooting") {
            let anyMoving = false;

            //Update all player marbles' physics
            Object.values(this.playerMarbles).forEach(marble => {
                if (updateMarble(marble, this.canvas.width, this.canvas.height)) {
                    anyMoving = true;
                }
            });

            // Update mode logic (targets, collisions, etc.)
            if (this.modeState) {
                const result = this.currentModeModule.update(
                    this.playerMarbles,
                    this.currentTurnPlayerId,
                    this.modeState,
                    this.scores[this.currentTurnPlayerId] || 0,
                    this.canvas.width,
                    this.canvas.height
                );

                if (result.anyMoving) anyMoving = true;

                // Only active player updates scores and syncs
                if (this.isMyTurn) {
                    // Track hits in this turn
                    if (result.hitCount) {
                        this.currentTurnHitCount += result.hitCount;
                    }

                    if (result.scoreIncrease) {
                        const newScore = (this.scores[this.userId] || 0) + result.scoreIncrease;
                        this.scores[this.userId] = newScore;
                        this.firebaseSync.updateScore(this.userId, newScore);
                    }

                    // Sync mode state changes (on score change OR if things are moving)
                    if (result.scoreIncrease || (anyMoving && this.syncCounter % 5 === 0)) {
                        this.firebaseSync.updateModeState(this.modeState);
                    }

                    // Periodic marble sync during movement (every 5 frames)
                    if (!this.syncCounter) this.syncCounter = 0;
                    this.syncCounter++;
                    if (this.syncCounter % 5 === 0 && anyMoving) {
                        this.firebaseSync.updateAllPlayerMarbles(this.getPlayerMarblesForSync());
                    }
                }
            }

            // Check if game is over (only active player)
            if (!anyMoving && this.isMyTurn) {
                this.checkGameOver();
            }
        }

        // Draw everything using GameRenderer
        this.renderer.draw();

        // Update message timer
        if (this.messageTimer > 0) {
            this.messageTimer--;
            if (this.messageTimer === 0) {
                this.message = "";
            }
        }

        requestAnimationFrame(() => this.update());
    }

    async checkGameOver() {
        if (!this.modeState) return;

        const allTargetsHit = this.currentModeModule.checkLevelComplete(this.modeState);

        if (allTargetsHit) {
            // Game is over! Determine winner
            console.log('🏆 All targets hit! Game over!');

            // Determine winner
            const winner = this.determineWinner();
            console.log('🏆 Winner:', winner.name, 'with score:', winner.score);

            // Set game to finished state in Firebase (any player can do this)
            await this.firebaseSync.setGameOver();
            console.log('✓ Game over state set in Firebase');

            // Show game over immediately for all players
            console.log('🎉 Showing game over screen...');
            this.showGameOver();

            this.currentTurnHitCount = 0;
        } else {
            // Check if player hit any targets this turn
            if (this.currentTurnHitCount > 0) {
                // Player hit at least one target, keep their turn
                console.log(`✓ Hit ${this.currentTurnHitCount} target(s)! Keep your turn.`);
                this.message = `Hit ${this.currentTurnHitCount}! Shoot again!`;
                this.messageTimer = 60;
                this.currentTurnHitCount = 0; // Reset for next shot

                // Update targets remaining display
                this.ui.updateTargetsRemaining(this.countRemainingTargets(), this.targetCount);

                this.gameState = "idle"; // Allow shooting again
            } else {
                // Player missed all targets, end turn
                console.log('✗ Missed! Turn over.');
                this.message = "Missed!";
                this.messageTimer = 60;
                await this.endTurn();
            }
        }
    }

    determineWinner() {
        let maxScore = 0;
        let winnerId = null;
        let winnerName = "";

        Object.entries(this.scores).forEach(([playerId, score]) => {
            if (score > maxScore) {
                maxScore = score;
                winnerId = playerId;
                winnerName = this.playerNames[playerId] || 'Unknown';
            }
        });

        return {
            id: winnerId,
            name: winnerName,
            score: maxScore,
            allScores: { ...this.scores }
        };
    }

    countRemainingTargets() {
        if (!this.modeState) return 0;
        // Use the mode module's countRemaining function to handle different state structures
        return this.currentModeModule.countRemaining(this.modeState);
    }

    async endTurn() {
        if (!this.isMyTurn) return;

        const currentIndex = this.players.findIndex(p => p.id === this.userId);
        const playerIds = this.players.map(p => p.id);

        await this.firebaseSync.endTurn(currentIndex, playerIds, this.scores);

        this.gameState = "waiting";
    }

    // Note: Draw methods have been moved to GameRenderer.js

    showGameOver() {
        console.log('🎊 showGameOver() called');
        console.log('Players:', this.players);
        console.log('Scores:', this.scores);
        this.ui.showGameOver(this.players, this.scores);
    }
}

// Start the game when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
    new MultiplayerJolen();
});
