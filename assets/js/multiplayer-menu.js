// Screen elements
const mainMenu = document.getElementById('mainMenu');
const lobbyScreen = document.getElementById('lobbyScreen');
const joinScreen = document.getElementById('joinScreen');
const joinedLobbyScreen = document.getElementById('joinedLobbyScreen');

// Buttons
const createBtn = document.getElementById('createBtn');
const joinMenuBtn = document.getElementById('joinMenuBtn');
const copyBtn = document.getElementById('copyBtn');
const joinBtn = document.getElementById('joinBtn');
const startGameBtn = document.getElementById('startGameBtn');
const backFromLobby = document.getElementById('backFromLobby');
const backFromJoin = document.getElementById('backFromJoin');
const backFromJoinedLobby = document.getElementById('backFromJoinedLobby');

// Input fields
const joinInput = document.getElementById('joinInput');
const lobbyCodeDisplay = document.getElementById('lobbyCode');
const joinedLobbyCodeDisplay = document.getElementById('joinedLobbyCode');

// Player lists
const playersList = document.getElementById('playersList');
const joinedPlayersList = document.getElementById('joinedPlayersList');

// State
let currentLobbyCode = '';
let isHost = false;
let lobbyPlayers = [];

/**
 * Show a specific screen and hide others
 */
function showScreen(screen) {
    mainMenu.classList.remove('active');
    lobbyScreen.classList.remove('active');
    joinScreen.classList.remove('active');
    joinedLobbyScreen.classList.remove('active');
    
    screen.classList.add('active');
}

/**
 * Generate a random 6-character lobby code
 */
function generateLobbyCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

/**
 * Update player list display
 */
function updatePlayersList(listElement, players) {
    listElement.innerHTML = '';
    
    if (players.length === 0) {
        listElement.innerHTML = '<div class="empty-players">Waiting for players...</div>';
        return;
    }

    players.forEach((player) => {
        const playerEl = document.createElement('div');
        playerEl.className = 'player-item';
        playerEl.innerHTML = `
            <div class="player-avatar">${player.name.charAt(0)}</div>
            <div class="player-info">
                <div class="player-name">${player.name}</div>
                <div class="player-status ${player.isHost ? 'host' : ''}">${player.isHost ? '👑 Host' : 'Player'}</div>
            </div>
        `;
        listElement.appendChild(playerEl);
    });

    // Enable start button if host and 2+ players
    if (isHost) {
        startGameBtn.disabled = players.length < 2;
    }
}

// ============ Event Listeners ============

// Create Lobby
createBtn.addEventListener('click', () => {
    currentLobbyCode = generateLobbyCode();
    lobbyCodeDisplay.textContent = currentLobbyCode;
    isHost = true;
    lobbyPlayers = [{ name: 'You', isHost: true }];
    updatePlayersList(playersList, lobbyPlayers);
    showScreen(lobbyScreen);
});

// Go to Join Lobby screen
joinMenuBtn.addEventListener('click', () => {
    joinInput.value = '';
    showScreen(joinScreen);
    joinInput.focus();
});

// Copy lobby code
copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(currentLobbyCode);
    const originalText = copyBtn.innerHTML;
    copyBtn.innerHTML = '<span class="icon">✓</span>Copied!';
    copyBtn.style.opacity = '0.8';
    
    setTimeout(() => {
        copyBtn.innerHTML = originalText;
        copyBtn.style.opacity = '1';
    }, 2000);
});

// Join Lobby
joinBtn.addEventListener('click', () => {
    const code = joinInput.value.trim().toUpperCase();
    
    if (code.length === 6) {
        isHost = false;
        joinedLobbyCodeDisplay.textContent = code;
        const joinedPlayers = [
            { name: 'Host', isHost: true },
            { name: 'You', isHost: false }
        ];
        updatePlayersList(joinedPlayersList, joinedPlayers);
        showScreen(joinedLobbyScreen);
        joinInput.value = '';
    } else {
        alert('Please enter a valid 6-character lobby code');
    }
});

// Start Game
startGameBtn.addEventListener('click', () => {
    alert('Game starting with ' + lobbyPlayers.length + ' players!');
});

// Handle Enter key in join input
joinInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        joinBtn.click();
    }
});

// Back buttons
backFromLobby.addEventListener('click', () => {
    isHost = false;
    lobbyPlayers = [];
    showScreen(mainMenu);
});

backFromJoin.addEventListener('click', () => {
    showScreen(mainMenu);
});

backFromJoinedLobby.addEventListener('click', () => {
    showScreen(mainMenu);
});