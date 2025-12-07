// assets/js/multiplayer-menu.js
import { database, auth, signInAnonymously } from '../../config/firebase.js';
import {
    ref,
    push,
    set,
    get,
    onValue,
    remove,
    onDisconnect,
    query,
    orderByChild,
    equalTo
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-database.js";

class MultiplayerMenu {
    constructor() {
        this.currentLobbyId = null;
        this.currentLobbyCode = null;
        this.isHost = false;
        this.userId = null;
        this.displayName = null;
        this.playersListener = null;
        this.games = [];
        this.selectedGame = null;

        this.init();
    }

    async init() {
        // Get display name from PHP session
        this.displayName = document.body.dataset.displayname || 'Player';
        const phpUserId = document.body.dataset.userid || null;

        if (!phpUserId) {
            alert('Please login first');
            window.location.href = 'login.php';
            return;
        }

        // Sign in anonymously to Firebase (for security rules)
        try {
            const userCredential = await signInAnonymously(auth);
            this.userId = userCredential.user.uid;
            console.log('Firebase UID:', this.userId);
        } catch (error) {
            console.error('Firebase auth error:', error);
            alert('Authentication failed. Please try again.');
            return;
        }

        // Load games from database
        await this.loadGames();

        this.setupEventListeners();
        this.setupBeforeUnload();
    }

    async loadGames() {
        try {
            const response = await fetch('get-games.php');
            const data = await response.json();

            if (data.success) {
                this.games = data.games;
                this.populateGameSelect();
            } else {
                console.error('Failed to load games:', data.error);
                alert('Failed to load games. Please refresh the page.');
            }
        } catch (error) {
            console.error('Error loading games:', error);
            alert('Failed to load games. Please refresh the page.');
        }
    }

    populateGameSelect() {
        const selectElement = document.getElementById('gameSelect');
        selectElement.innerHTML = '<option value="">Select a game...</option>';

        this.games.forEach(game => {
            const option = document.createElement('option');
            option.value = game.game_id;
            option.textContent = `${game.name} (${game.min_players}-${game.max_players} players)`;
            option.dataset.minPlayers = game.min_players;
            option.dataset.maxPlayers = game.max_players;
            option.dataset.gameName = game.name;
            selectElement.appendChild(option);
        });
    }

    setupEventListeners() {
        // Main menu buttons
        document.getElementById('createBtn').addEventListener('click', () => this.showScreen('gameSelectScreen'));
        document.getElementById('joinMenuBtn').addEventListener('click', () => this.showScreen('joinScreen'));

        // Game selection
        document.getElementById('gameSelect').addEventListener('change', (e) => this.onGameSelect(e));
        document.getElementById('confirmGameBtn').addEventListener('click', () => this.createLobby());
        document.getElementById('backFromGameSelect').addEventListener('click', () => this.showScreen('mainMenu'));

        // Lobby screen buttons
        document.getElementById('copyBtn').addEventListener('click', () => this.copyCode());
        document.getElementById('startGameBtn').addEventListener('click', () => this.startGame());
        document.getElementById('backFromLobby').addEventListener('click', () => this.leaveLobby());

        // Join screen buttons
        document.getElementById('joinBtn').addEventListener('click', () => this.joinLobby());
        document.getElementById('backFromJoin').addEventListener('click', () => this.showScreen('mainMenu'));

        // Joined lobby screen button
        document.getElementById('backFromJoinedLobby').addEventListener('click', () => this.leaveLobby());

        // Enter key on join input
        document.getElementById('joinInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.joinLobby();
        });
    }

    onGameSelect(e) {
        const selectedOption = e.target.selectedOptions[0];

        if (selectedOption.value) {
            this.selectedGame = {
                id: selectedOption.value,
                name: selectedOption.dataset.gameName,
                minPlayers: parseInt(selectedOption.dataset.minPlayers),
                maxPlayers: parseInt(selectedOption.dataset.maxPlayers)
            };

            document.getElementById('confirmGameBtn').disabled = false;

            // Show game info
            const gameInfo = document.getElementById('gameInfo');
            gameInfo.innerHTML = `
                <p><strong>${this.selectedGame.name}</strong></p>
                <p>Players: ${this.selectedGame.minPlayers} - ${this.selectedGame.maxPlayers}</p>
            `;
            gameInfo.style.display = 'block';
        } else {
            this.selectedGame = null;
            document.getElementById('confirmGameBtn').disabled = true;
            document.getElementById('gameInfo').style.display = 'none';
        }
    }

    setupBeforeUnload() {
        window.addEventListener('beforeunload', () => {
            if (this.currentLobbyId) {
                if (this.isHost) {
                    remove(ref(database, `lobbies/${this.currentLobbyId}`));
                } else {
                    remove(ref(database, `lobbies/${this.currentLobbyId}/players/${this.userId}`));
                }
            }
        });
    }

    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(screenId).classList.add('active');
    }

    generateLobbyCode() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    }

    async createLobby() {
        if (!this.selectedGame) {
            alert('Please select a game first');
            return;
        }

        try {
            const code = this.generateLobbyCode();
            const lobbyRef = push(ref(database, 'lobbies'));
            const lobbyId = lobbyRef.key;

            const lobbyData = {
                code: code,
                hostId: this.userId,
                hostName: this.displayName,
                createdAt: Date.now(),
                status: 'waiting',
                game: {
                    id: this.selectedGame.id,
                    name: this.selectedGame.name,
                    minPlayers: this.selectedGame.minPlayers,
                    maxPlayers: this.selectedGame.maxPlayers
                },
                players: {
                    [this.userId]: {
                        name: this.displayName,
                        isHost: true,
                        joinedAt: Date.now()
                    }
                }
            };

            await set(lobbyRef, lobbyData);

            const lobbyDisconnectRef = ref(database, `lobbies/${lobbyId}`);
            onDisconnect(lobbyDisconnectRef).remove();

            this.currentLobbyId = lobbyId;
            this.currentLobbyCode = code;
            this.isHost = true;

            document.getElementById('lobbyCode').textContent = code;
            document.getElementById('lobbyGameName').textContent = this.selectedGame.name;
            document.getElementById('lobbyPlayerRequirement').textContent =
                `${this.selectedGame.minPlayers}-${this.selectedGame.maxPlayers} players`;

            this.showScreen('lobbyScreen');
            this.listenToPlayers(lobbyId, 'playersList');

        } catch (error) {
            console.error('Error creating lobby:', error);
            alert('Failed to create lobby. Please try again.');
        }
    }

    async joinLobby() {
        const code = document.getElementById('joinInput').value.trim().toUpperCase();

        if (code.length !== 6) {
            alert('Please enter a valid 6-character code');
            return;
        }

        try {
            const lobbiesRef = ref(database, 'lobbies');
            const lobbyQuery = query(lobbiesRef, orderByChild('code'), equalTo(code));
            const snapshot = await get(lobbyQuery);

            if (!snapshot.exists()) {
                alert('Lobby not found. Please check the code.');
                return;
            }

            const lobbies = snapshot.val();
            const lobbyId = Object.keys(lobbies)[0];
            const lobby = lobbies[lobbyId];

            if (lobby.status !== 'waiting') {
                alert('This lobby is no longer available.');
                return;
            }

            const playerCount = lobby.players ? Object.keys(lobby.players).length : 0;
            const maxPlayers = lobby.game?.maxPlayers || 4;

            if (playerCount >= maxPlayers) {
                alert(`Lobby is full (${maxPlayers}/${maxPlayers} players).`);
                return;
            }

            const firebaseUid = auth.currentUser.uid;
            const playerRef = ref(database, `lobbies/${lobbyId}/players/${firebaseUid}`);

            await set(playerRef, {
                name: this.displayName,
                isHost: false,
                joinedAt: Date.now()
            });

            onDisconnect(playerRef).remove();

            this.currentLobbyId = lobbyId;
            this.currentLobbyCode = code;
            this.isHost = false;
            this.selectedGame = lobby.game;

            document.getElementById('joinedLobbyCode').textContent = code;
            document.getElementById('joinedLobbyGameName').textContent = lobby.game?.name || 'Unknown Game';
            document.getElementById('joinedLobbyPlayerRequirement').textContent =
                `${lobby.game?.minPlayers || 2}-${lobby.game?.maxPlayers || 4} players`;
            document.getElementById('joinInput').value = '';

            this.showScreen('joinedLobbyScreen');
            this.listenToPlayers(lobbyId, 'joinedPlayersList');
            this.listenToLobbyStatus(lobbyId);

        } catch (error) {
            console.error('Error joining lobby:', error);
            alert('Failed to join lobby. Please try again.');
        }
    }

    listenToPlayers(lobbyId, listElementId) {
        const playersRef = ref(database, `lobbies/${lobbyId}/players`);

        if (this.playersListener) {
            this.playersListener();
        }

        this.playersListener = onValue(playersRef, (snapshot) => {
            const players = snapshot.val();
            const listElement = document.getElementById(listElementId);

            if (!players) {
                listElement.innerHTML = '<div class="empty-players">No players yet...</div>';
                if (this.isHost) {
                    document.getElementById('startGameBtn').disabled = true;
                }
                return;
            }

            const playerCount = Object.keys(players).length;
            const minPlayers = this.selectedGame?.minPlayers || 2;
            const maxPlayers = this.selectedGame?.maxPlayers || 4;

            let html = '';
            Object.entries(players).forEach(([playerId, player]) => {
                const hostBadge = player.isHost ? '<span class="host-badge">HOST</span>' : '';
                html += `
                    <div class="player-item">
                        <span class="player-name">${player.name}</span>
                        ${hostBadge}
                    </div>
                `;
            });

            listElement.innerHTML = html;

            // Update player count display
            const countDisplay = listElementId === 'playersList' ?
                document.getElementById('playerCount') :
                document.getElementById('joinedPlayerCount');

            if (countDisplay) {
                countDisplay.textContent = `${playerCount}/${maxPlayers}`;

                // Color code based on requirements
                if (playerCount < minPlayers) {
                    countDisplay.style.color = '#ff6b6b';
                } else if (playerCount >= minPlayers && playerCount <= maxPlayers) {
                    countDisplay.style.color = '#51cf66';
                }
            }

            // Enable start button only if player count is within valid range
            if (this.isHost) {
                const canStart = playerCount >= minPlayers && playerCount <= maxPlayers;
                document.getElementById('startGameBtn').disabled = !canStart;

                const statusMsg = document.getElementById('lobbyStatusMessage');
                if (statusMsg) {
                    if (playerCount < minPlayers) {
                        statusMsg.textContent = `Need at least ${minPlayers} players to start`;
                        statusMsg.style.color = '#ff6b6b';
                    } else {
                        statusMsg.textContent = 'Ready to start!';
                        statusMsg.style.color = '#51cf66';
                    }
                }
            }
        });
    }

    listenToLobbyStatus(lobbyId) {
        const statusRef = ref(database, `lobbies/${lobbyId}/status`);

        onValue(statusRef, (snapshot) => {
            const status = snapshot.val();

            if (status === 'playing') {
                // Get the full lobby data to access game info
                const lobbyRef = ref(database, `lobbies/${lobbyId}`);
                get(lobbyRef).then((lobbySnapshot) => {
                    const lobby = lobbySnapshot.val();

                    // Route to the correct game based on game_id
                    const gameRoutes = {
                        '1': 'jolen/index.html',
                        '2': 'luksong-baka/index.html',
                        '3': 'patintero/index.html'
                    };

                    const gameUrl = gameRoutes[lobby.game?.id] || 'game.php';
                    window.location.href = `${gameUrl}?lobby=${lobbyId}`;
                });
            } else if (!snapshot.exists()) {
                alert('The host has left. Lobby closed.');
                this.leaveLobby();
            }
        });
    }

    async startGame() {
        if (!this.isHost || !this.currentLobbyId) return;

        try {
            await set(ref(database, `lobbies/${this.currentLobbyId}/status`), 'playing');

            // Route to the correct game based on game_id
            const gameRoutes = {
                '1': 'jolen/index.html',           // Assuming game_id 1 is jolen
                '2': 'luksong-baka/index.html',    // Assuming game_id 2 is luksong-baka
                '3': 'patintero/index.html'        // Assuming game_id 3 is patintero
            };

            const gameUrl = gameRoutes[this.selectedGame.id] || 'game.php';
            window.location.href = `${gameUrl}?lobby=${this.currentLobbyId}`;

        } catch (error) {
            console.error('Error starting game:', error);
            alert('Failed to start game. Please try again.');
        }
    }

    async leaveLobby() {
        if (!this.currentLobbyId) return;

        try {
            if (this.isHost) {
                await remove(ref(database, `lobbies/${this.currentLobbyId}`));
            } else {
                await remove(ref(database, `lobbies/${this.currentLobbyId}/players/${this.userId}`));
            }

            if (this.playersListener) {
                this.playersListener();
                this.playersListener = null;
            }

            this.currentLobbyId = null;
            this.currentLobbyCode = null;
            this.isHost = false;
            this.selectedGame = null;

            this.showScreen('mainMenu');
        } catch (error) {
            console.error('Error leaving lobby:', error);
        }
    }

    copyCode() {
        if (!this.currentLobbyCode) return;

        navigator.clipboard.writeText(this.currentLobbyCode).then(() => {
            const btn = document.getElementById('copyBtn');
            const originalText = btn.textContent;
            btn.textContent = 'Copied!';
            setTimeout(() => {
                btn.textContent = originalText;
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy:', err);
            alert('Failed to copy code');
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new MultiplayerMenu();
});