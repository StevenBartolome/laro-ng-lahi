// FirebaseSync.js - Handles Firebase Realtime Database sync for multiplayer Jolen
import { database, auth } from '../../config/firebase.js';
import {
    ref,
    set,
    get,
    onValue,
    update,
    remove,
    onDisconnect
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-database.js";

export class FirebaseSync {
    constructor(lobbyId) {
        this.lobbyId = lobbyId;
        this.userId = auth.currentUser?.uid;
        this.listeners = [];
        this.gameRef = ref(database, `lobbies/${lobbyId}/game`);
        this.lobbyRef = ref(database, `lobbies/${lobbyId}`);

        // Callbacks
        this.onGameStateChange = null;
        this.onTurnChange = null;
        this.onPlayerUpdate = null;
        this.onLobbyClose = null;
    }

    async init() {
        console.log('🔥 Firebase Sync initialized for lobby:', this.lobbyId);

        // Set up disconnect handler for this player
        const playerRef = ref(database, `lobbies/${this.lobbyId}/players/${this.userId}`);
        await onDisconnect(playerRef).remove();

        return true;
    }

    // Initialize game data structure (host only)
    async initializeGame(playerIds, gameMode = 'target', targetCount = 6) {
        const initialScores = {};
        const playerStates = {};
        const playerMarbles = {};

        playerIds.forEach((id, index) => {
            initialScores[id] = 0;
            playerStates[id] = {
                isReady: false,  // Add ready state
                score: 0
            };
            // Initialize each player's marble at starting position
            playerMarbles[id] = {
                x: 640, // Center of 1280px canvas
                y: 620, // Bottom of 720px canvas
                vx: 0,
                vy: 0
            };
        });

        const gameData = {
            currentTurnIndex: 0,
            currentTurnPlayerId: playerIds[0],
            playerOrder: playerIds,
            targetCount: targetCount,  // Number of targets (6-10)
            gameMode: gameMode,
            difficulty: 'normal',
            gameState: 'waiting',  // Start in waiting state, not playing
            scores: initialScores,
            playerStates: playerStates,  // Add player states
            modeState: null, // Will be set by game logic
            playerMarbles: playerMarbles, // All player marbles
            lastAction: {
                type: 'init',
                timestamp: Date.now()
            }
        };

        await set(this.gameRef, gameData);
        console.log('✓ Game initialized:', gameData);
        return gameData;
    }

    // Set player as ready
    async setPlayerReady() {
        await update(this.gameRef, {
            [`playerStates/${this.userId}/isReady`]: true,
            'lastAction/type': 'player_ready',
            'lastAction/timestamp': Date.now()
        });
    }

    // Start the game (host only, after all players ready)
    async startGame() {
        await update(this.gameRef, {
            gameState: 'playing',
            'lastAction/type': 'game_start',
            'lastAction/timestamp': Date.now()
        });
    }

    // Set selected mode (host only)
    async setSelectedMode(mode) {
        await update(this.gameRef, {
            selectedMode: mode,
            gameState: 'mode_selection',
            'lastAction/type': 'mode_select',
            'lastAction/timestamp': Date.now()
        });
    }

    // Start game with selected mode and target count (host only)
    async startGameWithMode(mode, targetCount) {
        await update(this.gameRef, {
            gameMode: mode,
            targetCount: targetCount,
            gameState: 'playing',
            'lastAction/type': 'game_start_with_mode',
            'lastAction/timestamp': Date.now()
        });
    }

    // Get current game state
    async getGameState() {
        const snapshot = await get(this.gameRef);
        return snapshot.val();
    }

    // Get lobby data (players list, etc.)
    async getLobbyData() {
        const snapshot = await get(this.lobbyRef);
        return snapshot.val();
    }

    // Listen to game state changes
    listenToGameState(callback) {
        const listener = onValue(this.gameRef, (snapshot) => {
            const gameState = snapshot.val();
            if (gameState && callback) {
                callback(gameState);
            }
        });
        this.listeners.push(listener);
        return listener;
    }

    // Listen to lobby changes (for player disconnect detection)
    listenToLobby(callback) {
        const listener = onValue(this.lobbyRef, (snapshot) => {
            const lobby = snapshot.val();
            if (!lobby) {
                // Lobby was deleted
                if (this.onLobbyClose) {
                    this.onLobbyClose();
                }
            } else if (callback) {
                callback(lobby);
            }
        });
        this.listeners.push(listener);
        return listener;
    }

    // Update game state (host only for most actions)
    async updateGameState(updates) {
        await update(this.gameRef, {
            ...updates,
            'lastAction/timestamp': Date.now()
        });
    }

    // Update marble state during turn (for specific player)
    async updatePlayerMarble(playerId, marbleData) {
        await update(this.gameRef, {
            [`playerMarbles/${playerId}`]: marbleData,
            'lastAction/type': 'marble_update',
            'lastAction/timestamp': Date.now()
        });
    }

    // Update all player marbles at once
    async updateAllPlayerMarbles(playerMarbles) {
        await update(this.gameRef, {
            playerMarbles: playerMarbles,
            'lastAction/type': 'marbles_update',
            'lastAction/timestamp': Date.now()
        });
    }

    // Update mode state (targets, etc.)
    async updateModeState(modeState) {
        await update(this.gameRef, {
            modeState: modeState,
            'lastAction/type': 'mode_update',
            'lastAction/timestamp': Date.now()
        });
    }

    // End turn and move to next player
    async endTurn(currentIndex, playerOrder, scores) {
        const nextIndex = (currentIndex + 1) % playerOrder.length;
        const nextPlayerId = playerOrder[nextIndex];

        await update(this.gameRef, {
            currentTurnIndex: nextIndex,
            currentTurnPlayerId: nextPlayerId,
            scores: scores,
            'lastAction/type': 'turn_end',
            'lastAction/timestamp': Date.now()
        });
    }

    // Advance to next level
    async advanceLevel(level, scores) {
        await update(this.gameRef, {
            level: level,
            scores: scores,
            modeState: null, // Reset mode state for new level
            'lastAction/type': 'level_advance',
            'lastAction/timestamp': Date.now()
        });
    }

    // Update score for current player
    async updateScore(playerId, score) {
        await update(this.gameRef, {
            [`scores/${playerId}`]: score,
            'lastAction/type': 'score_update',
            'lastAction/timestamp': Date.now()
        });
    }

    // Update game mode and reset scores (host only)
    async updateGameMode(newMode, resetScores) {
        await update(this.gameRef, {
            gameMode: newMode,
            scores: resetScores,
            currentTurnIndex: 0,
            currentTurnPlayerId: null, // Will be set on next getGameState
            'lastAction/type': 'mode_change',
            'lastAction/timestamp': Date.now()
        });
    }

    // Set game over state
    async setGameOver() {
        await update(this.gameRef, {
            gameState: 'finished',
            'lastAction/type': 'game_over',
            'lastAction/timestamp': Date.now()
        });
    }

    // Clean up listeners
    cleanup() {
        this.listeners.forEach(unsubscribe => {
            if (typeof unsubscribe === 'function') {
                unsubscribe();
            }
        });
        this.listeners = [];
    }

    // Leave game (remove player from lobby)
    async leaveGame() {
        try {
            await remove(ref(database, `lobbies/${this.lobbyId}/players/${this.userId}`));
            this.cleanup();
        } catch (error) {
            console.error('Error leaving game:', error);
        }
    }
}
