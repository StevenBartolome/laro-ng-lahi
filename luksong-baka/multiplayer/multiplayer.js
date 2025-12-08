/**
 * Luksong Baka - Multiplayer Module
 * Handles Firebase real-time synchronization for multiplayer gameplay
 */

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

class MultiplayerGame {
    constructor() {
        this.lobbyId = null;
        this.playerId = null;
        this.playerName = null;
        this.isHost = false;
        this.players = {};
        this.currentTurnPlayerId = null;
        this.gameStarted = false;
        this.listeners = [];

        // Game state sync
        this.syncedGameState = null;
        this.localPlayerReady = false;
    }

    /**
     * Initialize multiplayer session
     */
    async init() {
        console.log('=== MULTIPLAYER INIT START ===');

        // Get lobby ID from URL
        const urlParams = new URLSearchParams(window.location.search);
        this.lobbyId = urlParams.get('lobby');

        console.log('URL params:', window.location.search);
        console.log('Lobby ID from URL:', this.lobbyId);

        if (!this.lobbyId) {
            console.error('No lobby ID in URL');
            alert('No lobby ID found. Redirecting to multiplayer menu...');
            window.location.href = '../../multiplayer-menu.php';
            return false;
        }

        console.log('Initializing multiplayer for lobby:', this.lobbyId);

        // Wait for Firebase auth to be ready (should be persisted from multiplayer menu)
        console.log('Waiting for Firebase auth...');
        let authAttempts = 0;
        while (!auth.currentUser && authAttempts < 100) {
            await new Promise(resolve => setTimeout(resolve, 100));
            authAttempts++;
            if (authAttempts % 10 === 0) {
                console.log(`Auth wait attempt ${authAttempts}/100...`);
            }
        }

        // Get Firebase user
        this.playerId = auth.currentUser?.uid;
        console.log('Firebase auth state:', {
            currentUser: auth.currentUser,
            playerId: this.playerId,
            authAttempts: authAttempts
        });

        if (!this.playerId) {
            console.error('Firebase auth not ready after waiting. Auth state:', auth.currentUser);
            alert('Authentication error. Please go back to multiplayer menu and try again.');
            window.location.href = '../../multiplayer-menu.php';
            return false;
        }

        console.log('✓ Authenticated as:', this.playerId);

        // Get player info from lobby
        console.log('Fetching lobby from Firebase...');
        const lobbyRef = ref(database, `lobbies/${this.lobbyId}`);

        try {
            const lobbySnapshot = await get(lobbyRef);
            console.log('Lobby snapshot exists:', lobbySnapshot.exists());

            if (!lobbySnapshot.exists()) {
                console.error('❌ Lobby not found in Firebase');
                console.error('Lobby ID:', this.lobbyId);
                console.error('Firebase path:', `lobbies/${this.lobbyId}`);

                // Try to list all lobbies to debug
                const allLobbiesRef = ref(database, 'lobbies');
                const allLobbiesSnapshot = await get(allLobbiesRef);
                console.log('All lobbies in Firebase:', allLobbiesSnapshot.val());

                alert('Lobby not found. It may have been closed. Redirecting to menu...');
                window.location.href = '../../multiplayer-menu.php';
                return false;
            }

            const lobbyData = lobbySnapshot.val();
            console.log('✓ Lobby data retrieved:', lobbyData);

            this.isHost = lobbyData.hostId === this.playerId;
            this.players = lobbyData.players || {};
            this.playerName = this.players[this.playerId]?.name || 'Player';

            console.log('Lobby info:', {
                isHost: this.isHost,
                playerName: this.playerName,
                playerCount: Object.keys(this.players).length,
                lobbyStatus: lobbyData.status,
                hostId: lobbyData.hostId,
                myId: this.playerId
            });

            // Setup game state in Firebase if host
            if (this.isHost) {
                console.log('I am host, initializing game state...');
                await this.initializeGameState();
                console.log('✓ Game state initialized');
            } else {
                console.log('I am not host, waiting for game state...');
                // Wait for game state to be initialized by host
                let waitAttempts = 0;
                while (waitAttempts < 30) {
                    const gameStateSnapshot = await get(ref(database, `lobbies/${this.lobbyId}/gameState`));
                    if (gameStateSnapshot.exists()) {
                        console.log('✓ Game state found');
                        break;
                    }
                    await new Promise(resolve => setTimeout(resolve, 200));
                    waitAttempts++;
                }
                if (waitAttempts >= 30) {
                    console.warn('Game state not found after waiting');
                }
            }

            // Listen to game state changes
            console.log('Setting up listeners...');
            this.setupListeners();

            // Setup disconnect handler
            this.setupDisconnectHandler();

            console.log('=== MULTIPLAYER INIT COMPLETE ===');
            return true;

        } catch (error) {
            console.error('Error during lobby initialization:', error);
            alert('Error loading lobby: ' + error.message);
            window.location.href = '../../multiplayer-menu.php';
            return false;
        }
    }

    /**
     * Initialize game state in Firebase (host only)
     */
    async initializeGameState() {
        const playerIds = Object.keys(this.players);
        const gameStateRef = ref(database, `lobbies/${this.lobbyId}/gameState`);

        // Randomly select Taya
        const tayaIndex = Math.floor(Math.random() * playerIds.length);
        const tayaPlayerId = playerIds[tayaIndex];

        // Ensure current turn is NOT the Taya (if it happens to be Taya, move to next)
        let currentTurnIndex = 0;
        if (playerIds[currentTurnIndex] === tayaPlayerId) {
            currentTurnIndex = (currentTurnIndex + 1) % playerIds.length;
        }

        const initialState = {
            currentTurnIndex: currentTurnIndex,
            currentTurnPlayerId: playerIds[currentTurnIndex],
            tayaPlayerId: tayaPlayerId, // New: Track who is Taya
            playerOrder: playerIds,
            playerStates: {},
            gamePhase: 'waiting', // waiting, playing, finished
            currentLevel: 1,
            startedAt: Date.now()
        };

        // Initialize each player's state
        playerIds.forEach(playerId => {
            initialState.playerStates[playerId] = {
                name: this.players[playerId].name,
                currentLevel: 1,
                totalJumps: 0,
                isReady: false,
                isEliminated: false,
                lastAction: null,
                score: 0,
                isTaya: playerId === tayaPlayerId
            };
        });

        await set(gameStateRef, initialState);
    }

    /**
     * Setup Firebase listeners
     */
    setupListeners() {
        // Listen to game state
        const gameStateRef = ref(database, `lobbies/${this.lobbyId}/gameState`);
        const unsubscribe = onValue(gameStateRef, (snapshot) => {
            if (snapshot.exists()) {
                this.syncedGameState = snapshot.val();
                this.currentTurnPlayerId = this.syncedGameState.currentTurnPlayerId;
                this.onGameStateUpdate(this.syncedGameState);
            }
        });
        this.listeners.push(unsubscribe);

        // Listen to players
        const playersRef = ref(database, `lobbies/${this.lobbyId}/players`);
        const playersUnsubscribe = onValue(playersRef, (snapshot) => {
            if (snapshot.exists()) {
                this.players = snapshot.val();
                this.onPlayersUpdate(this.players);
            } else {
                // Lobby was deleted
                alert('Lobby closed by host.');
                window.location.href = '../../multiplayer-menu.php';
            }
        });
        this.listeners.push(playersUnsubscribe);

        // Listen to real-time game state (movement sync)
        this.setupRealtimeListener();
    }

    /**
     * Setup real-time listener for movement sync
     */
    setupRealtimeListener() {
        const realtimeRef = ref(database, `lobbies/${this.lobbyId}/realtime`);
        const unsubscribe = onValue(realtimeRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                // Only process updates from other players
                if (data.playerId !== this.playerId) {
                    this.onRealtimeUpdate(data);
                }
            }
        });
        this.listeners.push(unsubscribe);
    }

    /**
     * Broadcast real-time state (position, game state, angle)
     */
    updateRealtimeState(data) {
        const realtimeRef = ref(database, `lobbies/${this.lobbyId}/realtime`);
        set(realtimeRef, {
            playerId: this.playerId,
            ...data,
            timestamp: Date.now()
        });
    }

    /**
     * Callback for real-time updates (override in game)
     */
    onRealtimeUpdate(data) {
        // Override this in multiplayer-main.js
        console.log('Realtime update:', data);
    }

    /**
     * Setup disconnect handler
     */
    setupDisconnectHandler() {
        if (this.isHost) {
            // Host leaving closes the lobby
            const lobbyRef = ref(database, `lobbies/${this.lobbyId}`);
            onDisconnect(lobbyRef).remove();
        } else {
            // Player leaving removes them from lobby
            const playerRef = ref(database, `lobbies/${this.lobbyId}/players/${this.playerId}`);
            onDisconnect(playerRef).remove();
        }
    }

    /**
     * Check if it's current player's turn
     */
    isMyTurn() {
        return this.currentTurnPlayerId === this.playerId;
    }

    /**
     * Mark player as ready
     */
    async setPlayerReady() {
        const playerStateRef = ref(database, `lobbies/${this.lobbyId}/gameState/playerStates/${this.playerId}/isReady`);
        await set(playerStateRef, true);
        this.localPlayerReady = true;
    }

    /**
     * Start the game (host only)
     */
    async startGame() {
        if (!this.isHost) return;

        const gamePhaseRef = ref(database, `lobbies/${this.lobbyId}/gameState/gamePhase`);
        await set(gamePhaseRef, 'playing');
    }

    /**
     * Update player's game state after action
     */
    async updatePlayerAction(actionData) {
        const playerStateRef = ref(database, `lobbies/${this.lobbyId}/gameState/playerStates/${this.playerId}`);

        const updates = {
            lastAction: {
                type: actionData.type, // 'jump_success', 'jump_fail', 'level_complete'
                timestamp: Date.now(),
                level: actionData.level,
                lives: actionData.lives,
                angle: actionData.angle || null
            },
            lives: 0, // Removed life system
            currentLevel: actionData.level,
            totalJumps: actionData.totalJumps || 0,
            score: actionData.score || 0
        };

        // No elimination logic needed anymore


        await update(playerStateRef, updates);
    }

    /**
     * Advance to next player's turn
     */
    async nextTurn() {
        if (!this.syncedGameState) return;

        const playerOrder = this.syncedGameState.playerOrder;
        let currentIndex = this.syncedGameState.currentTurnIndex;
        let nextIndex = (currentIndex + 1) % playerOrder.length;

        // Skip Taya and eliminated players
        let attempts = 0;
        while (attempts < playerOrder.length) {
            const nextPlayerId = playerOrder[nextIndex];
            const playerState = this.syncedGameState.playerStates[nextPlayerId];

            // Should skip if eliminated OR if it's the Taya (Taya doesn't jump over themselves)
            const isTaya = nextPlayerId === this.syncedGameState.tayaPlayerId;

            if (!playerState.isEliminated && !isTaya) {
                break;
            }

            nextIndex = (nextIndex + 1) % playerOrder.length;
            attempts++;
        }

        // Check if all players eliminated
        const activePlayers = Object.values(this.syncedGameState.playerStates)
            .filter(p => !p.isEliminated);

        if (activePlayers.length === 0) {
            await this.endGame();
            return;
        }

        // Update turn
        const gameStateRef = ref(database, `lobbies/${this.lobbyId}/gameState`);
        await update(gameStateRef, {
            currentTurnIndex: nextIndex,
            currentTurnPlayerId: playerOrder[nextIndex]
        });
    }

    /**
     * End the game
     */
    async endGame() {
        const gamePhaseRef = ref(database, `lobbies/${this.lobbyId}/gameState/gamePhase`);
        await set(gamePhaseRef, 'finished');
    }

    /**
     * Get current game state
     */
    getGameState() {
        return this.syncedGameState;
    }

    /**
     * Get player state by ID
     */
    getPlayerState(playerId) {
        return this.syncedGameState?.playerStates?.[playerId] || null;
    }

    /**
     * Get current player's state
     */
    getMyState() {
        return this.getPlayerState(this.playerId);
    }

    /**
     * Get all active players (not eliminated)
     */
    getActivePlayers() {
        if (!this.syncedGameState) return [];

        return Object.entries(this.syncedGameState.playerStates)
            .filter(([id, state]) => !state.isEliminated)
            .map(([id, state]) => ({ id, ...state }));
    }

    /**
     * Callback for game state updates (override in game)
     */
    onGameStateUpdate(gameState) {
        // Override this in your game implementation
        console.log('Game state updated:', gameState);
    }

    /**
     * Switch roles (failed jumper becomes Taya)
     */
    async switchRoles(newTayaId) {
        if (!this.syncedGameState) return;

        const oldTayaId = this.syncedGameState.tayaPlayerId;

        // Update Taya ID in game state
        await update(ref(database, `lobbies/${this.lobbyId}/gameState`), {
            tayaPlayerId: newTayaId
        });

        // Update player states locally for internal consistency if needed, 
        // but the listener will handle the main sync.
        // We do need to update the individual player 'isTaya' flags in Firebase though
        // so they sync to everyone.

        const updates = {};
        updates[`playerStates/${newTayaId}/isTaya`] = true;
        if (oldTayaId) {
            updates[`playerStates/${oldTayaId}/isTaya`] = false;
        }

        await update(ref(database, `lobbies/${this.lobbyId}/gameState`), updates);
    }

    /**
     * Remove a player from the game state (when they leave)
     */
    async removePlayerFromGameState(playerId) {
        if (!this.syncedGameState) return;

        // Remove from playerOrder
        const newPlayerOrder = this.syncedGameState.playerOrder.filter(id => id !== playerId);

        // Remove from playerStates
        const newPlayerStates = { ...this.syncedGameState.playerStates };
        delete newPlayerStates[playerId];

        // Check if the leaving player was the current turn
        let newTurnIndex = this.syncedGameState.currentTurnIndex;
        let newTurnPlayerId = this.syncedGameState.currentTurnPlayerId;

        if (newTurnPlayerId === playerId && newPlayerOrder.length > 0) {
            // Move to next valid player
            newTurnIndex = newTurnIndex % newPlayerOrder.length;
            newTurnPlayerId = newPlayerOrder[newTurnIndex];

            // Skip Taya if needed
            const tayaId = this.syncedGameState.tayaPlayerId;
            if (newTurnPlayerId === tayaId && newPlayerOrder.length > 1) {
                newTurnIndex = (newTurnIndex + 1) % newPlayerOrder.length;
                newTurnPlayerId = newPlayerOrder[newTurnIndex];
            }
        }

        // Check if the leaving player was Taya - assign new Taya if needed
        let newTayaId = this.syncedGameState.tayaPlayerId;
        if (newTayaId === playerId && newPlayerOrder.length > 0) {
            // Assign random new Taya
            const randomIndex = Math.floor(Math.random() * newPlayerOrder.length);
            newTayaId = newPlayerOrder[randomIndex];

            // Update isTaya flags
            Object.keys(newPlayerStates).forEach(id => {
                newPlayerStates[id].isTaya = (id === newTayaId);
            });
        }

        // Update Firebase
        await update(ref(database, `lobbies/${this.lobbyId}/gameState`), {
            playerOrder: newPlayerOrder,
            playerStates: newPlayerStates,
            currentTurnIndex: newTurnIndex,
            currentTurnPlayerId: newTurnPlayerId,
            tayaPlayerId: newTayaId
        });
    }

    /**
     * Callback for players updates (override in game)
     */
    onPlayersUpdate(players) {
        // Override this in your game implementation
        console.log('Players updated:', players);
    }

    /**
     * Leave the lobby
     */
    async leaveLobby() {
        // Remove listeners
        this.listeners.forEach(unsubscribe => unsubscribe());

        if (this.isHost) {
            await remove(ref(database, `lobbies/${this.lobbyId}`));
        } else {
            await remove(ref(database, `lobbies/${this.lobbyId}/players/${this.playerId}`));
        }

        window.location.href = '../../multiplayer-menu.php';
    }

    /**
     * Cleanup
     */
    destroy() {
        this.listeners.forEach(unsubscribe => unsubscribe());
    }
}

// Export for use in game
window.MultiplayerGame = MultiplayerGame;
export default MultiplayerGame;
