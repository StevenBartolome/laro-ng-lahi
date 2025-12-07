# Luksong Baka Multiplayer

This folder contains the multiplayer implementation for Luksong Baka game.

## Files

- **index.html** - Main multiplayer game page with UI for turn indicators, player list, and spectator mode
- **multiplayer.js** - Core multiplayer module handling Firebase real-time synchronization
- **multiplayer-main.js** - Game integration that connects multiplayer functionality with game logic
- **multiplayer-style.css** - Styles for multiplayer UI components

## Features

### Turn-Based Gameplay
- Players take turns jumping over the baka
- Only the active player can control the game
- Other players watch in spectator mode

### Real-Time Synchronization
- All game state is synchronized via Firebase Realtime Database
- Player actions are broadcast to all players in the lobby
- Turn transitions happen automatically

### Player Management
- Track lives, level, and score for each player
- Eliminated players are marked and skipped in turn rotation
- Host can start the game when all players are ready

### UI Components
- **Multiplayer Panel**: Shows current turn, player list with stats
- **Turn Indicator**: Highlights whose turn it is
- **Spectator Overlay**: Shown when watching other players
- **Waiting Screen**: Ready-up system before game starts
- **Game Over Screen**: Final scores and rankings

## How It Works

1. **Lobby Creation**: Host creates a lobby from the multiplayer menu
2. **Players Join**: Other players join using the lobby code
3. **Ready Up**: All players click "I'm Ready!" button
4. **Game Starts**: Host automatically starts when all are ready
5. **Turn-Based Play**: Players take turns in order
6. **Synchronization**: Each action updates Firebase and all clients
7. **Turn Rotation**: After each jump (success or fail), turn advances
8. **Game End**: When all players are eliminated or complete all levels

## Integration with Main Game

The multiplayer version uses the same core game modules:
- `js/config.js` - Game configuration
- `js/state.js` - Game state management
- `js/logic.js` - Game logic and physics
- `js/rendering.js` - Canvas rendering
- `js/assets.js` - Asset loading
- `js/sound.js` - Sound management
- `js/ui.js` - UI updates

The multiplayer layer adds:
- Firebase synchronization
- Turn management
- Input control based on turn
- Spectator mode
- Multi-player state tracking

## Firebase Structure

```
lobbies/
  {lobbyId}/
    code: "ABC123"
    hostId: "firebase-uid"
    status: "playing"
    players/
      {playerId}/
        name: "Player Name"
        isHost: true/false
    gameState/
      currentTurnIndex: 0
      currentTurnPlayerId: "firebase-uid"
      playerOrder: ["uid1", "uid2", ...]
      gamePhase: "waiting" | "playing" | "finished"
      playerStates/
        {playerId}/
          name: "Player Name"
          lives: 3
          currentLevel: 1
          totalJumps: 0
          isReady: true/false
          isEliminated: false
          score: 0
          lastAction: {...}
```

## Usage

Players access this through the multiplayer menu:
1. Click "Multiplayer" from main menu
2. Create or join a lobby
3. Select "Luksong Baka" as the game
4. Game automatically routes to `luksong-baka/multiplayer/index.html?lobby={lobbyId}`

## Notes

- Requires Firebase authentication (handled by multiplayer-menu.js)
- Lobby ID is passed via URL parameter
- Disconnection handling: Host leaving closes lobby, players leaving removes them
- All players must have the same game version for proper synchronization
