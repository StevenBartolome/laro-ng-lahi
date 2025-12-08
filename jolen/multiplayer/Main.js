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

import * as TargetMode from "../js/TargetMode.js";
import * as CircleMode from "../js/CircleMode.js";
import * as HoleMode from "../js/HoleMode.js";
import * as TumbangMode from "../js/TumbangMode.js";
import * as LineMode from "../js/LineMode.js";

import { ModeSelection } from "./ModeSelection.js";
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
        this.level = 1;
        this.scores = {};
        this.gameState = "idle"; // idle, dragging, shooting, waiting, levelComplete, gameOver

        // Marble
        this.startingPosition = { x: this.canvas.width / 2, y: this.canvas.height - 100 };
        this.playerMarble = {
            x: this.startingPosition.x,
            y: this.startingPosition.y,
            radius: MARBLE_RADIUS,
            vx: 0,
            vy: 0,
            color: PLAYER_COLOR,
            isMoving: false,
        };

        // Input
        this.isDragging = false;
        this.dragStartX = 0;
        this.dragStartY = 0;
        this.dragCurrentX = 0;
        this.dragCurrentY = 0;

        // Message
        this.message = "";
        this.messageTimer = 0;

        // Sync state
        this.lastSyncedState = null;
        this.isWaitingForSync = false;

        // Mode selection
        this.modeSelection = new ModeSelection();
        this.modeSelection.onModeSelected = (mode) => this.onHostSelectMode(mode);

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
        if (!readyPlayersDisplay || !playerStates) return;

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

    async initializeGame() {
        console.log('🎯 Host initializing game...');

        const playerIds = this.players.map(p => p.id);
        await this.firebaseSync.initializeGame(playerIds, this.gameMode, 'normal');

        console.log('✓ Game initialized, setting up first level...');

        // Setup the first level immediately
        this.modeState = this.currentModeModule.setup(this.level, this.canvas.width, this.canvas.height);
        console.log('✓ Level 1 targets created:', this.modeState.length, 'targets');

        // Sync the mode state to Firebase
        await this.firebaseSync.updateModeState(this.modeState);
        console.log('✓ Mode state synced to Firebase');
    }

    setupFirebaseListeners() {
        // Listen to game state changes
        this.firebaseSync.listenToGameState((gameState) => {
            this.onGameStateUpdate(gameState);
        });

        // Listen to lobby changes (for disconnects)
        this.firebaseSync.listenToLobby((lobby) => {
            if (!lobby) {
                alert('Lobby closed. Returning to menu...');
                window.location.href = '../../multiplayer-menu.php';
            }
        });
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

        // Update level
        if (gameState.level !== this.level) {
            this.level = gameState.level;
            this.ui.updateLevel(this.level);
        }

        // Update mode
        if (gameState.gameMode !== this.gameMode) {
            this.gameMode = gameState.gameMode;
            this.ui.updateMode(this.gameMode);
            this.setGameMode(this.gameMode);
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
                this.resetPlayerMarble();
            } else {
                this.gameState = "waiting";
            }
        }

        // Update players list
        this.ui.updatePlayersList(this.players, this.scores, this.currentTurnPlayerId);

        // Sync mode state (targets/objects)
        if (gameState.modeState) {
            if (Array.isArray(gameState.modeState)) {
                console.log('✓ Received mode state with', gameState.modeState.length, 'objects');
            } else {
                console.log('✓ Received mode state (object-based)');
            }
            this.modeState = gameState.modeState;
        } else {
            console.warn('⚠️ No mode state in game update');
        }

        // Sync marble position and velocity
        if (gameState.playerMarble) {
            if (!this.isMyTurn) {
                // Spectators receive marble updates
                this.playerMarble.x = gameState.playerMarble.x;
                this.playerMarble.y = gameState.playerMarble.y;
                this.playerMarble.vx = gameState.playerMarble.vx || 0;
                this.playerMarble.vy = gameState.playerMarble.vy || 0;

                // If marble has velocity, spectators should watch it move
                const hasVelocity = Math.abs(this.playerMarble.vx) > 0.1 || Math.abs(this.playerMarble.vy) > 0.1;
                if (hasVelocity && this.gameState !== "shooting") {
                    console.log('📺 Spectating marble movement...');
                    this.gameState = "shooting";
                }
            }
        }


        // Check for game over
        if (gameState.gameState === 'finished') {
            this.showGameOver();
        }
    }


    // Host selects mode and starts game
    async onHostSelectMode(mode) {
        if (!this.isHost) return;

        console.log('🎯 Host selected mode:', mode);

        // Set local game mode FIRST
        this.gameMode = mode;
        this.setGameMode(mode);

        // NOW setup the level with the correct mode
        this.modeState = this.currentModeModule.setup(this.level, this.canvas.width, this.canvas.height);

        // Log based on mode state type
        if (Array.isArray(this.modeState)) {
            console.log('✓ Level 1 setup for mode:', mode, '- created', this.modeState.length, 'objects');
        } else {
            console.log('✓ Level 1 setup for mode:', mode, '- state initialized');
        }

        // Sync to Firebase (this will update gameState.selectedMode)
        await this.firebaseSync.setSelectedMode(mode);

        // Sync the mode state to Firebase
        await this.firebaseSync.updateModeState(this.modeState);
        console.log('✓ Mode state synced to Firebase');

        // Hide mode selection
        this.modeSelection.hide();

        // Start the game with the selected mode
        await this.firebaseSync.startGameWithMode(mode);
    }

    setupLevel() {
        // Only host initializes level
        if (!this.isHost) return;

        this.modeState = this.currentModeModule.setup(this.level, this.canvas.width, this.canvas.height);
        this.firebaseSync.updateModeState(this.modeState);
    }

    setGameMode(mode) {
        switch (mode) {
            case "target": this.currentModeModule = TargetMode; break;
            case "circle": this.currentModeModule = CircleMode; break;
            case "hole": this.currentModeModule = HoleMode; break;
            case "tumbang": this.currentModeModule = TumbangMode; break;
            case "line": this.currentModeModule = LineMode; break;
        }
    }

    setupInputListeners() {
        this.canvas.addEventListener("mousedown", (e) => this.handleMouseDown(e));
        window.addEventListener("mousemove", (e) => this.handleMouseMove(e));
        window.addEventListener("mouseup", (e) => this.handleMouseUp(e));

        // Return to lobby button
        const returnBtn = document.getElementById('returnToLobbyBtn');
        if (returnBtn) {
            returnBtn.addEventListener('click', () => {
                window.location.href = '../../multiplayer-menu.php';
            });
        }
    }

    resetPlayerMarble() {
        this.playerMarble.x = this.startingPosition.x;
        this.playerMarble.y = this.startingPosition.y;
        this.playerMarble.vx = 0;
        this.playerMarble.vy = 0;
        this.playerMarble.isMoving = false;
    }

    // Input handlers
    getMousePos(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY,
        };
    }

    isMouseOnMarble(mouseX, mouseY) {
        const dx = mouseX - this.playerMarble.x;
        const dy = mouseY - this.playerMarble.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance <= this.playerMarble.radius + 10;
    }

    handleMouseDown(e) {
        if (!this.isMyTurn || this.gameState !== "idle") return;

        const pos = this.getMousePos(e);
        if (this.isMouseOnMarble(pos.x, pos.y)) {
            this.isDragging = true;
            this.dragStartX = pos.x;
            this.dragStartY = pos.y;
            this.dragCurrentX = pos.x;
            this.dragCurrentY = pos.y;
            this.gameState = "dragging";
        }
    }

    handleMouseMove(e) {
        if (!this.isDragging || this.gameState !== "dragging") return;
        const pos = this.getMousePos(e);
        this.dragCurrentX = pos.x;
        this.dragCurrentY = pos.y;
    }

    async handleMouseUp(e) {
        if (!this.isDragging || this.gameState !== "dragging" || !this.isMyTurn) return;

        const dx = this.dragCurrentX - this.playerMarble.x;
        const dy = this.dragCurrentY - this.playerMarble.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 5) {
            const clampedDistance = Math.min(distance, MAX_DRAG_DISTANCE);
            const power = clampedDistance * POWER_MULTIPLIER;
            const angle = Math.atan2(-dy, -dx);

            this.playerMarble.vx = Math.cos(angle) * power;
            this.playerMarble.vy = Math.sin(angle) * power;
            this.playerMarble.isMoving = true;
            this.gameState = "shooting";

            // Sync marble state
            await this.firebaseSync.updateMarble({
                x: this.playerMarble.x,
                y: this.playerMarble.y,
                vx: this.playerMarble.vx,
                vy: this.playerMarble.vy
            });
        } else {
            this.gameState = "idle";
        }

        this.isDragging = false;
    }

    // Game loop
    update() {
        // Update physics for EVERYONE when marble is moving
        // Active player controls, others spectate
        if (this.gameState === "shooting") {
            let anyMoving = false;

            // Update player marble physics (all players see this)
            if (updateMarble(this.playerMarble, this.canvas.width, this.canvas.height)) {
                anyMoving = true;
            }

            // Update mode logic (targets, collisions, etc.)
            if (this.modeState) {
                const result = this.currentModeModule.update(
                    this.playerMarble,
                    this.modeState,
                    this.scores[this.currentTurnPlayerId] || 0,
                    this.canvas.width,
                    this.canvas.height
                );

                if (result.anyMoving) anyMoving = true;

                // Only active player updates scores and syncs
                if (this.isMyTurn) {
                    if (result.scoreIncrease) {
                        const newScore = (this.scores[this.userId] || 0) + result.scoreIncrease;
                        this.scores[this.userId] = newScore;
                        this.firebaseSync.updateScore(this.userId, newScore);
                    }

                    // Sync mode state changes
                    if (result.scoreIncrease) {
                        this.firebaseSync.updateModeState(this.modeState);
                    }

                    // Periodic marble sync during movement (every 5 frames)
                    if (!this.syncCounter) this.syncCounter = 0;
                    this.syncCounter++;
                    if (this.syncCounter % 5 === 0 && anyMoving) {
                        this.firebaseSync.updateMarble({
                            x: this.playerMarble.x,
                            y: this.playerMarble.y,
                            vx: this.playerMarble.vx,
                            vy: this.playerMarble.vy
                        });
                    }
                }
            }

            // Check if turn is over (only active player)
            if (!anyMoving && this.isMyTurn) {
                this.checkLevelComplete();
            }
        }

        // Draw everything
        this.draw();

        // Update message timer
        if (this.messageTimer > 0) {
            this.messageTimer--;
            if (this.messageTimer === 0) {
                this.message = "";
            }
        }

        requestAnimationFrame(() => this.update());
    }

    async checkLevelComplete() {
        if (!this.modeState) return;

        const levelComplete = this.currentModeModule.checkLevelComplete(this.modeState);

        if (levelComplete) {
            this.message = "Level Complete!";
            this.messageTimer = 90;

            if (this.isHost) {
                // Advance level
                const newLevel = this.level + 1;

                // Award bonus points
                const updatedScores = { ...this.scores };
                this.players.forEach(player => {
                    updatedScores[player.id] = (updatedScores[player.id] || 0) + (100 * newLevel);
                });

                await this.firebaseSync.advanceLevel(newLevel, updatedScores);

                // Setup new level
                setTimeout(() => {
                    this.setupLevel();
                }, 1500);
            }

            this.gameState = "waiting";
        } else {
            // Turn over, next player
            await this.endTurn();
        }
    }

    async endTurn() {
        if (!this.isMyTurn) return;

        const currentIndex = this.players.findIndex(p => p.id === this.userId);
        const playerIds = this.players.map(p => p.id);

        await this.firebaseSync.endTurn(currentIndex, playerIds, this.scores);

        this.gameState = "waiting";
    }

    draw() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw background
        if (images.background.complete && images.background.naturalWidth > 0) {
            this.ctx.drawImage(images.background, 0, 0, this.canvas.width, this.canvas.height);
        }

        // Draw mode specifics using the mode's draw function
        if (this.modeState && this.currentModeModule) {
            this.currentModeModule.draw(this.ctx, this.modeState);
        } else {
            // Debug: Show waiting message
            this.ctx.fillStyle = "white";
            this.ctx.font = "bold 24px Arial";
            this.ctx.textAlign = "center";
            this.ctx.fillText("Waiting for game to start...", this.canvas.width / 2, this.canvas.height / 2);
        }

        // Draw player marble (with correct color for current player)
        const currentPlayerIndex = this.players.findIndex(p => p.id === this.currentTurnPlayerId);
        const playerIndex = currentPlayerIndex >= 0 ? currentPlayerIndex : 0;

        drawMarble(
            this.ctx,
            this.playerMarble,
            this.gameState === "idle" || this.gameState === "dragging",
            true,
            playerIndex  // Pass player index for correct marble color
        );

        // Draw drag line
        if (this.isDragging && this.gameState === "dragging") {
            this.drawDragLine();
        }

        // Draw message
        this.drawMessage();
    }

    drawDragLine() {
        if (!this.isDragging || this.gameState !== "dragging") return;

        this.ctx.save();

        const dx = this.dragCurrentX - this.playerMarble.x;
        const dy = this.dragCurrentY - this.playerMarble.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const clampedDistance = Math.min(distance, MAX_DRAG_DISTANCE);

        // Draw drag line
        this.ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
        this.ctx.lineWidth = 4;
        this.ctx.setLineDash([5, 5]);
        this.ctx.beginPath();
        this.ctx.moveTo(this.playerMarble.x, this.playerMarble.y);
        this.ctx.lineTo(this.dragCurrentX, this.dragCurrentY);
        this.ctx.stroke();
        this.ctx.setLineDash([]);

        // Draw trajectory line
        const trajectoryLength = clampedDistance * 1.5;
        const shootAngle = Math.atan2(-dy, -dx);
        const endX = this.playerMarble.x + Math.cos(shootAngle) * trajectoryLength;
        const endY = this.playerMarble.y + Math.sin(shootAngle) * trajectoryLength;

        this.ctx.strokeStyle = "rgba(255, 200, 0, 0.8)";
        this.ctx.lineWidth = 3;
        this.ctx.setLineDash([10, 5]);
        this.ctx.beginPath();
        this.ctx.moveTo(this.playerMarble.x, this.playerMarble.y);
        this.ctx.lineTo(endX, endY);
        this.ctx.stroke();
        this.ctx.setLineDash([]);

        // Draw arrow head
        this.ctx.fillStyle = "rgba(255, 200, 0, 0.8)";
        this.ctx.beginPath();
        this.ctx.moveTo(endX, endY);
        this.ctx.lineTo(
            endX - 15 * Math.cos(shootAngle - Math.PI / 6),
            endY - 15 * Math.sin(shootAngle - Math.PI / 6)
        );
        this.ctx.lineTo(
            endX - 15 * Math.cos(shootAngle + Math.PI / 6),
            endY - 15 * Math.sin(shootAngle + Math.PI / 6)
        );
        this.ctx.closePath();
        this.ctx.fill();

        // Power UI
        const powerPercent = (clampedDistance / MAX_DRAG_DISTANCE) * 100;
        this.ctx.strokeStyle =
            powerPercent > 75 ? "#f44336" : powerPercent > 50 ? "#FF9800" : "#4CAF50";
        this.ctx.lineWidth = 4;
        this.ctx.beginPath();
        this.ctx.arc(
            this.playerMarble.x,
            this.playerMarble.y,
            this.playerMarble.radius + 5,
            0,
            Math.PI * 2
        );
        this.ctx.stroke();

        this.ctx.fillStyle = "white";
        this.ctx.strokeStyle = "black";
        this.ctx.lineWidth = 3;
        this.ctx.font = "bold 18px Arial";
        this.ctx.textAlign = "center";
        this.ctx.textBaseline = "middle";
        const powerText = `${Math.round(powerPercent)}%`;
        this.ctx.strokeText(powerText, this.playerMarble.x, this.playerMarble.y - 30);
        this.ctx.fillText(powerText, this.playerMarble.x, this.playerMarble.y - 30);

        this.ctx.restore();
    }

    drawMessage() {
        if (this.messageTimer > 0) {
            this.ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
            this.ctx.fillRect(0, this.canvas.height / 2 - 50, this.canvas.width, 100);
            this.ctx.fillStyle = "white";
            this.ctx.font = "bold 36px Arial";
            this.ctx.textAlign = "center";
            this.ctx.fillText(this.message, this.canvas.width / 2, this.canvas.height / 2 + 10);
        }
    }

    showGameOver() {
        this.ui.showGameOver(this.players, this.scores);
    }
}

// Start the game when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
    new MultiplayerJolen();
});
