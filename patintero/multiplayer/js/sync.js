/**
 * Patintero Multiplayer - Host-Driven Sync Module
 * 
 * ARCHITECTURE: Host runs the entire game, broadcasts full state to all clients.
 * Non-hosts only send their character position and receive the complete game state.
 */

import { database } from '../../../config/firebase.js';
import { ref, set, onValue } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-database.js";
import { runners, taggers, gameState } from './config.js';

import { switchRolesAfterTag, endGame } from './game.js';

let lastUploadTime = 0;
const UPLOAD_INTERVAL = 50; // ms (~20 updates per second)

// Cache for received game state (non-hosts use this)
let receivedGameState = null;

/**
 * Check if current player is the host
 */
function isHost() {
    return window.multiplayerState?.isHost === true;
}

/**
 * HOST ONLY: Upload the complete game state to Firebase
 * This includes ALL entity positions, scores, and game status
 */
export function uploadFullGameState() {
    if (!isHost()) return;

    const now = Date.now();
    if (now - lastUploadTime < UPLOAD_INTERVAL) return;
    lastUploadTime = now;

    const lobbyId = window.multiplayerState?.lobbyId;
    if (!lobbyId) return; // Removed gameActive check to allow final state sync

    // Collect all runner data
    const runnersData = runners.map((r, idx) => ({
        x: Math.round(r.x),
        y: Math.round(r.y),
        active: r.active,
        reachedBottom: r.reachedBottom,
        type: r.type,
        remotePlayerId: r.remotePlayerId || null
    }));

    // Collect all tagger data
    const taggersData = taggers.map((t, idx) => ({
        x: Math.round(t.x),
        y: Math.round(t.y),
        type: t.type,
        controller: t.controller,
        remotePlayerId: t.remotePlayerId || null
    }));

    // Upload complete state
    const stateRef = ref(database, `lobbies/${lobbyId}/gameState`);
    set(stateRef, {
        runners: runnersData,
        taggers: taggersData,
        scores: {
            team1: gameState.team1Score,
            team2: gameState.team2Score
        },
        roundsCompleted: gameState.roundsCompleted,
        timer: gameState.gameTimer,
        timestamp: now,
        isGameOver: !gameState.gameActive && gameState.roundsCompleted >= 2
    }).catch(err => {
        // Silently fail to avoid console spam
    });
}

/**
 * NON-HOST: Upload only this player's position to Firebase
 * Host will read this and update the appropriate entity
 */
export function uploadPlayerPosition() {
    if (isHost()) return; // Host doesn't need to upload - it runs the game

    const now = Date.now();
    if (now - lastUploadTime < UPLOAD_INTERVAL) return;
    lastUploadTime = now;

    const lobbyId = window.multiplayerState?.lobbyId;
    const playerId = window.multiplayerState?.playerId;
    if (!lobbyId || !playerId || !gameState.gameActive) return;

    // Find local player entity
    let localEntity = null;
    let entityType = null;

    if (gameState.currentRole === 'runner' && gameState.playerControlledRunner !== null) {
        localEntity = runners[gameState.playerControlledRunner];
        entityType = 'runner';
    } else if (gameState.currentRole === 'tagger' && gameState.playerControlledTagger !== null) {
        localEntity = taggers[gameState.playerControlledTagger];
        entityType = 'tagger';
    }

    if (!localEntity) return;

    const posRef = ref(database, `lobbies/${lobbyId}/playerInputs/${playerId}`);
    set(posRef, {
        x: Math.round(localEntity.x),
        y: Math.round(localEntity.y),
        role: entityType,
        timestamp: now
    }).catch(err => {
        // Silently fail
    });
}

/**
 * Initialize listener for complete game state from host (non-hosts only)
 */
export function initGameStateSync() {
    const lobbyId = window.multiplayerState?.lobbyId;
    if (!lobbyId) return;

    console.log('[SYNC] Initializing game state listener');

    const stateRef = ref(database, `lobbies/${lobbyId}/gameState`);
    onValue(stateRef, (snapshot) => {
        const data = snapshot.val();
        if (!data) return;

        receivedGameState = data;

        // Non-hosts: Apply the received state
        if (!isHost()) {
            applyReceivedGameState(data);
        }
    });
}

/**
 * HOST: Initialize listener for player inputs from non-hosts
 */
export function initPlayerInputSync() {
    if (!isHost()) return;

    const lobbyId = window.multiplayerState?.lobbyId;
    if (!lobbyId) return;

    console.log('[SYNC] Host: Initializing player input listener');

    const inputsRef = ref(database, `lobbies/${lobbyId}/playerInputs`);
    onValue(inputsRef, (snapshot) => {
        const inputs = snapshot.val() || {};

        // Apply each player's input to their entity
        Object.entries(inputs).forEach(([playerId, input]) => {
            applyPlayerInputToEntity(playerId, input);
        });
    });
}

/**
 * HOST: Apply a remote player's input to their entity
 */
function applyPlayerInputToEntity(playerId, input) {
    if (!input) return;

    // Find the entity controlled by this player
    if (input.role === 'runner') {
        const entity = runners.find(r => r.remotePlayerId === playerId);
        if (entity) {
            entity.x = input.x;
            entity.y = input.y;
            entity.el.style.left = `${entity.x}px`;
            entity.el.style.top = `${entity.y}px`;
        }
    } else if (input.role === 'tagger') {
        const entity = taggers.find(t => t.remotePlayerId === playerId);
        if (entity) {
            entity.x = input.x;
            entity.y = input.y;
            entity.el.style.left = `${entity.x}px`;
            entity.el.style.top = `${entity.y}px`;
        }
    }
}

/**
 * NON-HOST: Apply the complete game state received from host
 */
function applyReceivedGameState(data) {
    const myId = window.multiplayerState?.playerId;

    // Check for Round Swapping logic
    if (data.roundsCompleted !== undefined && data.roundsCompleted > gameState.roundsCompleted) {
        console.log('[SYNC] Round Change Detected! Host says:', data.roundsCompleted, 'Local:', gameState.roundsCompleted);
        gameState.roundsCompleted = data.roundsCompleted;
        // Trigger role switch logic locally
        switchRolesAfterTag();
        // Since switchRolesAfterTag resets timer and spawns, we should respect that.
    }

    // Check for Game Over
    if (data.isGameOver) {
        if (gameState.gameActive) {
            endGame();
        }
    }

    // Apply runner positions
    if (data.runners) {
        // Ensure strictly matched array length if possible, or ignore extras
        data.runners.forEach((rData, idx) => {
            if (!runners[idx]) return;
            // Note: If startRound hasn't run yet or mismatched, this might be issue.
            // But switchRolesAfterTag calls startRound which repopulates runners.

            const runner = runners[idx];

            // Skip applying position to player's own character
            if (runner.remotePlayerId === myId || runner.type === 'player') {
                if (rData.active !== undefined && !rData.active && runner.active) {
                    runner.active = false;
                    runner.el.style.opacity = '0.3';
                    runner.el.style.filter = 'grayscale(100%)';
                }
                return;
            }

            // Smooth interpolation for other entities
            const lerpFactor = 0.4;
            runner.x = runner.x + (rData.x - runner.x) * lerpFactor;
            runner.y = runner.y + (rData.y - runner.y) * lerpFactor;
            runner.active = rData.active;
            runner.reachedBottom = rData.reachedBottom;

            runner.el.style.left = `${runner.x}px`;
            runner.el.style.top = `${runner.y}px`;

            if (!runner.active) {
                runner.el.style.opacity = '0.3';
                runner.el.style.filter = 'grayscale(100%)';
            }

            if (runner.reachedBottom) {
                runner.el.style.border = '3px solid #00FF00';
            } else {
                runner.el.style.border = '3px solid #fff';
            }
        });
    }

    // Apply tagger positions
    if (data.taggers) {
        data.taggers.forEach((tData, idx) => {
            if (!taggers[idx]) return;
            const tagger = taggers[idx];

            // Skip applying position to player's own character
            if (tagger.remotePlayerId === myId || tagger.controller === 'player') {
                return;
            }

            // Smooth interpolation
            const lerpFactor = 0.4;
            tagger.x = tagger.x + (tData.x - tagger.x) * lerpFactor;
            tagger.y = tagger.y + (tData.y - tagger.y) * lerpFactor;

            tagger.el.style.left = `${tagger.x}px`;
            tagger.el.style.top = `${tagger.y}px`;
        });
    }

    // Apply scores
    if (data.scores) {
        if (data.scores.team1 !== undefined) gameState.team1Score = data.scores.team1;
        if (data.scores.team2 !== undefined) gameState.team2Score = data.scores.team2;

        const myScore = gameState.myTeamId === 1 ? gameState.team1Score : gameState.team2Score;
        const enemyScore = gameState.myTeamId === 1 ? gameState.team2Score : gameState.team1Score;

        document.getElementById('myTeamScore').textContent = myScore;
        document.getElementById('enemyTeamScore').textContent = enemyScore;
    }

    // Apply timer
    if (data.timer !== undefined) {
        gameState.gameTimer = data.timer;
    }
}

/**
 * Exposed for other modules
 */
export function isHostClient() {
    return isHost();
}

/**
 * Get received game state (for non-hosts)
 */
export function getReceivedGameState() {
    return receivedGameState;
}
