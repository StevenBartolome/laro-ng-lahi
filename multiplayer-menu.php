<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Multiplayer Menu</title>
    <link rel="stylesheet" href="assets/css/multiplayer-menu.css">
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <h1>Multiplayer</h1>
            <p>Join or create a lobby to play with friends</p>
        </div>

        <!-- Main Menu -->
        <div id="mainMenu" class="screen active">
            <button id="createBtn" class="btn btn-create">
                <span class="icon">+</span>
                Create Lobby
            </button>
            <button id="joinMenuBtn" class="btn btn-join">
                <span class="icon">→</span>
                Join Lobby
            </button>
        </div>

        <!-- Lobby Screen (After Creation) -->
        <div id="lobbyScreen" class="screen">
            <h2>Lobby Created!</h2>
            <p class="subtitle">Share this code with your friends</p>
            
            <div class="code-display">
                <p class="code-label">Your Lobby Code</p>
                <p id="lobbyCode" class="code">------</p>
            </div>

            <button id="copyBtn" class="btn btn-secondary">Copy Code</button>

            <!-- Players List -->
            <div class="players-container">
                <p class="players-label">Players in Lobby</p>
                <div id="playersList" class="player-list">
                    <div class="empty-players">Waiting for players...</div>
                </div>
            </div>

            <button id="startGameBtn" class="btn btn-join" disabled>
                <span class="icon">▶</span>
                Start Game
            </button>
            <button id="backFromLobby" class="btn btn-back">Back to Menu</button>
        </div>

        <!-- Join Lobby Screen -->
        <div id="joinScreen" class="screen">
            <h2>Join a Lobby</h2>
            
            <input 
                type="text" 
                id="joinInput" 
                placeholder="Enter lobby code..."
                class="input"
                maxlength="6"
            >

            <button id="joinBtn" class="btn btn-join">Join Lobby</button>
            <button id="backFromJoin" class="btn btn-back">Back to Menu</button>
        </div>

        <!-- Joined Lobby Screen -->
        <div id="joinedLobbyScreen" class="screen">
            <h2>In Lobby</h2>
            <p class="subtitle">Waiting for host to start...</p>

            <div class="code-display">
                <p class="code-label">Lobby Code</p>
                <p id="joinedLobbyCode" class="code">------</p>
            </div>

            <!-- Players List -->
            <div class="players-container">
                <p class="players-label">Players in Lobby</p>
                <div id="joinedPlayersList" class="player-list">
                    <div class="empty-players">Loading players...</div>
                </div>
            </div>

            <button id="backFromJoinedLobby" class="btn btn-back">Leave Lobby</button>
        </div>
    </div>

    <script src="assets/js/multiplayer-menu.js"></script>
</body>
</html>