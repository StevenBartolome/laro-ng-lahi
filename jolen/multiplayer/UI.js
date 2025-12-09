// UI.js - Multiplayer UI management
export class MultiplayerUI {
    constructor() {
        this.elements = {
            turnIndicator: document.getElementById('turnIndicator'),
            turnPlayerName: document.getElementById('turnPlayerName'),
            waitingMessage: document.getElementById('waitingMessage'),
            playersPanel: document.getElementById('playersPanel'),
            playersList: document.getElementById('playersList'),
            targetsDisplay: document.getElementById('targets-display'),
            modeDisplay: document.getElementById('mode-display'),
            gameOverOverlay: document.getElementById('gameOverOverlay'),
            finalScores: document.getElementById('finalScores'),
            gameOverTitle: document.getElementById('gameOverTitle'),
            returnToLobbyBtn: document.getElementById('returnToLobbyBtn'),
            loadingScreen: document.getElementById('loadingScreen'),
            gameContainer: document.getElementById('game-container')
        };

        this.currentUserId = null;
        this.playerNames = {};
    }

    init(userId, playerNames) {
        this.currentUserId = userId;
        this.playerNames = playerNames;

        // Hide loading, show game
        this.elements.loadingScreen.style.display = 'none';
        this.elements.gameContainer.style.display = 'block';
    }

    updateTurnIndicator(currentPlayerId, playerName, isYourTurn) {
        this.elements.turnPlayerName.textContent = playerName;

        if (isYourTurn) {
            this.elements.turnIndicator.classList.add('your-turn');
            this.elements.waitingMessage.style.display = 'none';
        } else {
            this.elements.turnIndicator.classList.remove('your-turn');
            this.elements.waitingMessage.style.display = 'block';
        }
    }

    updatePlayersList(players, scores, currentTurnPlayerId) {
        let html = '';

        players.forEach(player => {
            const isCurrentTurn = player.id === currentTurnPlayerId;
            const isCurrentUser = player.id === this.currentUserId;
            const score = scores[player.id] || 0;

            let classes = 'player-item';
            if (isCurrentTurn) classes += ' active-turn';
            if (isCurrentUser) classes += ' current-user';

            const youBadge = isCurrentUser ? '<span class="player-badge">YOU</span>' : '';

            html += `
                <div class="${classes}">
                    <div>
                        <span class="player-name">${player.name}</span>
                        ${youBadge}
                    </div>
                    <span class="player-score">${score}</span>
                </div>
            `;
        });

        this.elements.playersList.innerHTML = html;
    }

    updateTargetsRemaining(remaining, total) {
        if (this.elements.targetsDisplay) {
            this.elements.targetsDisplay.textContent = `${remaining}/${total}`;
        }
    }

    updateMode(mode) {
        const modeNames = {
            'target': 'Target',
            'circle': 'Circle',
            'hole': 'Hole',
            'tumbang': 'Tumbang',
            'line': 'Line'
        };
        this.elements.modeDisplay.textContent = modeNames[mode] || mode;
    }

    showGameOver(players, scores) {
        // Sort players by score
        const sortedPlayers = [...players].sort((a, b) => {
            return (scores[b.id] || 0) - (scores[a.id] || 0);
        });

        const winner = sortedPlayers[0];
        this.elements.gameOverTitle.textContent = `${winner.name} Wins! 🏆`;

        let html = '';
        sortedPlayers.forEach((player, index) => {
            const rank = index + 1;
            const score = scores[player.id] || 0;
            const isWinner = index === 0;
            const isCurrentUser = player.id === this.currentUserId;

            const rankEmojis = ['🥇', '🥈', '🥉'];
            const rankDisplay = rank <= 3 ? rankEmojis[rank - 1] : `#${rank}`;

            const classes = isWinner ? 'score-item winner' : 'score-item';
            const youBadge = isCurrentUser ? ' (You)' : '';

            html += `
                <div class="${classes}">
                    <span class="rank">${rankDisplay}</span>
                    <div class="player-info">
                        <div class="player-name">${player.name}${youBadge}</div>
                    </div>
                    <span class="score">${score}</span>
                </div>
            `;
        });

        this.elements.finalScores.innerHTML = html;
        this.elements.gameOverOverlay.classList.remove('hidden');
    }

    showLoading(message = 'Loading...') {
        this.elements.loadingScreen.style.display = 'flex';
        this.elements.gameContainer.style.display = 'none';
    }

    hideLoading() {
        this.elements.loadingScreen.style.display = 'none';
        this.elements.gameContainer.style.display = 'block';
    }

    showMessage(canvas, ctx, message, duration = 90) {
        // Draw a message on the canvas
        const messageData = {
            text: message,
            timer: duration,
            show: true
        };
        return messageData;
    }
}
