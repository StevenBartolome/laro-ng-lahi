/**
 * Patintero Multiplayer - Main Entry Point
 */

import { database, auth } from '../../../config/firebase.js';
import { ref, get, set, onValue, onDisconnect, update } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-database.js";
import { initInputHandlers } from './input.js';
import { hostStartGame, resetGame, initializeGameListeners } from './game.js';
import { showDifficultyScreen, hideDifficultyScreen, handleCloseOverlay } from './ui.js';

// Global Game State for Multiplayer
window.multiplayerState = {
    lobbyId: null,
    playerId: null,
    isHost: false,
    players: {},
    gameStatus: 'waiting'
};

// Expose functions to window
window.startGame = hostStartGame;
window.resetGame = resetGame;
window.showDifficultyScreen = showDifficultyScreen;
window.hideDifficultyScreen = hideDifficultyScreen;
window.handleCloseOverlay = handleCloseOverlay;

async function initMultiplayer() {
    // 1. Get Lobby ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const lobbyId = urlParams.get('lobby');

    if (!lobbyId) {
        alert('No lobby ID found. Returning to menu.');
        window.location.href = '../../multiplayer-menu.php';
        return;
    }

    window.multiplayerState.lobbyId = lobbyId;

    // 2. Auth Check
    await new Promise(resolve => {
        const unsubscribe = auth.onAuthStateChanged(user => {
            if (user) {
                window.multiplayerState.playerId = user.uid;
                unsubscribe();
                resolve();
            } else {
                alert('Not authenticated. Returning to menu.');
                window.location.href = '../../multiplayer-menu.php';
            }
        });
    });

    console.log(`Connected to Lobby: ${lobbyId} as Player: ${window.multiplayerState.playerId}`);

    // 3. Check Host Status & Join
    const playerRef = ref(database, `lobbies/${lobbyId}/players/${window.multiplayerState.playerId}`);
    const snapshot = await get(playerRef);

    if (snapshot.exists()) {
        const playerData = snapshot.val();
        window.multiplayerState.isHost = playerData.isHost;
        playerData.status = 'ingame';
        playerData.headIndex = Math.floor(Math.random() * 3) + 1; // Assign random head for this session
        await update(playerRef, playerData);

        // Setup disconnect cleanup
        onDisconnect(ref(database, `lobbies/${lobbyId}/players/${window.multiplayerState.playerId}/status`)).set('disconnected');
    } else {
        alert('You are not part of this lobby.');
        window.location.href = '../../multiplayer-menu.php';
        return;
    }

    // 3.5 Listen to Players
    const playersRef = ref(database, `lobbies/${lobbyId}/players`);
    onValue(playersRef, (snapshot) => {
        const players = snapshot.val() || {};
        window.multiplayerState.players = players;
        console.log('Updated Players List:', players);
    });

    // 3.8 Initialize Game Listeners (For start signal)
    initializeGameListeners();

    // 4. Initialize Game UI
    const title = document.querySelector('.game-title');
    if (title) title.textContent = `Lobby: ${lobbyId}`;

    // 5. Initialize Inputs
    initInputHandlers();

    // 6. Show Difficulty Screen (Host Only)
    if (window.multiplayerState.isHost) {
        showDifficultyScreen();
        console.log('Host: Showing difficulty selection screen');
    } else {
        // Non-host: Wait for host to select difficulty and start
        console.log('Non-host: Waiting for host to start game');
        document.getElementById('difficultyScreen')?.classList.add('hidden');

        // Show waiting message
        const waitingMsg = document.createElement('div');
        waitingMsg.id = 'waitingForHost';
        waitingMsg.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 30px 50px;
            border-radius: 15px;
            font-size: 24px;
            text-align: center;
            z-index: 10000;
        `;
        waitingMsg.innerHTML = `
            <div style="font-size: 32px; margin-bottom: 15px;">⏳</div>
            <div>Waiting for host to start the game...</div>
        `;
        document.body.appendChild(waitingMsg);
    }

    console.log('Multiplayer initialized and ready.');
}

// Start
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMultiplayer);
} else {
    initMultiplayer();
}
