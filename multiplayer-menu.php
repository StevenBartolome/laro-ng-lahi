<?php
session_start();

// Check if user is logged in
if (!isset($_SESSION['logged_in']) || !$_SESSION['logged_in']) {
    header("Location: login.php");
    exit();
}

$user_id = $_SESSION['user_id'];
$displayname = $_SESSION['displayname'] ?? $_SESSION['username'];
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Multiplayer Menu</title>
    <link rel="stylesheet" href="assets/css/multiplayer-menu.css">
</head>
<body data-userid="<?php echo htmlspecialchars($user_id); ?>" data-displayname="<?php echo htmlspecialchars($displayname); ?>">
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

        <!-- Game Selection Screen -->
        <div id="gameSelectScreen" class="screen">
            <h2>Select a Game</h2>
            <p class="subtitle">Choose which game to play</p>
            
            <select id="gameSelect" class="game-select">
                <option value="">Loading games...</option>
            </select>

            <div id="gameInfo" class="game-info" style="display: none;"></div>

            <button id="confirmGameBtn" class="btn btn-join" disabled>
                Create Lobby
            </button>
            <button id="backFromGameSelect" class="btn btn-back">Back to Menu</button>
        </div>

        <!-- Lobby Screen (After Creation) -->
        <div id="lobbyScreen" class="screen">
            <h2>Lobby Created!</h2>
            <p class="subtitle">Share this code with your friends</p>
            
            <div class="game-header">
                <p class="game-title" id="lobbyGameName">Game Name</p>
                <p class="game-requirement" id="lobbyPlayerRequirement">2-4 players</p>
            </div>

            <div class="code-display">
                <p class="code-label">Your Lobby Code</p>
                <p id="lobbyCode" class="code">------</p>
            </div>

            <button id="copyBtn" class="btn btn-secondary">Copy Code</button>
            <button id="addBotBtn" class="btn btn-secondary" style="display: none;">Add Bot</button>

            <!-- Players List -->
            <div class="players-container">
                <div class="players-header">
                    <p class="players-label">Players in Lobby</p>
                    <p class="player-count" id="playerCount">0/4</p>
                </div>
                <div id="playersList" class="player-list">
                    <div class="empty-players">Waiting for players...</div>
                </div>
            </div>

            <p id="lobbyStatusMessage" class="status-message">Need at least 2 players to start</p>

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

            <div class="game-header">
                <p class="game-title" id="joinedLobbyGameName">Game Name</p>
                <p class="game-requirement" id="joinedLobbyPlayerRequirement">2-4 players</p>
            </div>

            <div class="code-display">
                <p class="code-label">Lobby Code</p>
                <p id="joinedLobbyCode" class="code">------</p>
            </div>

            <!-- Players List -->
            <div class="players-container">
                <div class="players-header">
                    <p class="players-label">Players in Lobby</p>
                    <p class="player-count" id="joinedPlayerCount">0/4</p>
                </div>
                <div id="joinedPlayersList" class="player-list">
                    <div class="empty-players">Loading players...</div>
                </div>
            </div>

            <button id="backFromJoinedLobby" class="btn btn-back">Leave Lobby</button>
        </div>
    </div>

    <script type="module" src="assets/js/multiplayer-menu.js"></script>
</body>
</html>