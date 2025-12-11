/**
 * Patintero Multiplayer - Host-Driven Sync Module
 * 
 * ARCHITECTURE: Host runs the entire game, broadcasts full state to all clients.
 * Non-hosts only send their character position and receive the complete game state.
 */

import { database } from '../../../config/firebase.js';
import { ref, set, onValue } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-database.js";
import { runners, taggers, gameState, boost, taggerBoost } from './config.js';
import { updateTimerDisplay } from './ui.js';
import { updateBoostUI } from './boost.js';
import { addPositionUpdate } from './interpolation.js';

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

    // DEBUG: Log what we're uploading
    console.log('[UPLOAD] 📤 Uploading game state:');
    console.log('[UPLOAD] - Runners:', runnersData.length, runnersData.map((r, i) => `R${i}:(${r.x},${r.y})`));
    console.log('[UPLOAD] - Taggers:', taggersData.length, taggersData.map((t, i) => `T${i}:(${t.x},${t.y})`));

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
        boost: {
            active: boost.active,
            ready: boost.ready,
            currentCharges: boost.currentCharges
        },
        taggerBoost: {
            active: taggerBoost.active,
            ready: taggerBoost.ready
        },
        timestamp: now,
        isGameOver: !gameState.gameActive && gameState.roundsCompleted >= 2
    }).catch(err => {
        console.error('[UPLOAD] ❌ Failed to upload state:', err);
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

    console.log('[SYNC] Initializing game state listener for lobby:', lobbyId);
    console.log('[SYNC] Is Host?:', isHost());

    const stateRef = ref(database, `lobbies/${lobbyId}/gameState`);
    onValue(stateRef, (snapshot) => {
        const data = snapshot.val();
        console.log('[SYNC] 📡 Received game state update:', data ? 'Data exists' : 'No data');

        if (!data) {
            console.warn('[SYNC] ⚠️ No game state data received');
            return;
        }

        receivedGameState = data;

        // Non-hosts: Apply the received state
        if (!isHost()) {
            console.log('[SYNC] 🎮 Non-host applying received state...');
            console.log('[SYNC] - Runners count:', data.runners?.length || 0);
            console.log('[SYNC] - Taggers count:', data.taggers?.length || 0);
            console.log('[SYNC] - Timer:', data.timer);
            console.log('[SYNC] - Scores:', data.scores);
            applyReceivedGameState(data);
        } else {
            console.log('[SYNC] 👑 Host received own state (ignoring)');
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
 * ALL: Initialize listener for entity usage to update visuals
 */
export function initEntityUsageSync() {
    const lobbyId = window.multiplayerState?.lobbyId;
    if (!lobbyId) return;

    const usageRef = ref(database, `lobbies/${lobbyId}/entityUsage`);
    onValue(usageRef, (snapshot) => {
        const usage = snapshot.val() || {};
        window.multiplayerState.entityUsage = usage;

        // Update Runner Visuals
        runners.forEach((r, idx) => {
            const entityId = `runner_${idx}`;
            const controllerId = usage[entityId];

            // If I control it, character-switch.js handles my visuals
            if (controllerId === window.multiplayerState.playerId) return;

            if (controllerId) {
                // Controlled by someone else
                r.type = 'remote'; // Treat as remote player
                r.remotePlayerId = controllerId;

                r.el.classList.add('player-controlled');
                r.el.style.filter = 'none';

                // Update Label
                const label = r.el.querySelector('.entity-label');
                // ideally fetch name, but ID helper for now
                if (label) label.textContent = `P${idx + 1}`;
            } else {
                // Bot / Free
                if (r.type === 'remote') {
                    // Was remote, now free -> bot
                    r.type = 'bot';
                    r.remotePlayerId = null;
                    r.el.classList.remove('player-controlled');
                    r.el.style.filter = 'hue-rotate(180deg)'; // Bot Color

                    const label = r.el.querySelector('.entity-label');
                    if (label) label.textContent = `R${idx + 1}`;
                }
            }
        });

        // Update Tagger Visuals
        taggers.forEach((t, idx) => {
            const entityId = `tagger_${idx}`;
            const controllerId = usage[entityId];

            if (controllerId === window.multiplayerState.playerId) return;

            if (controllerId) {
                t.controller = 'remote';
                t.remotePlayerId = controllerId;
                t.el.classList.add('player-tagger');

                const label = t.el.querySelector('.entity-label');
                if (label) label.textContent = `T${t.id}`;
            } else {
                if (t.controller === 'remote') {
                    t.controller = 'bot';
                    t.remotePlayerId = null;
                    t.el.classList.remove('player-tagger');

                    const label = t.el.querySelector('.entity-label');
                    if (label) label.textContent = `T${t.id}`;
                }
            }
        });

        // Also update the panel UI if open
        import('./character-switch.js').then(m => m.updateCharacterPanel());
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
    console.log('[SYNC-APPLY] 🔄 Starting to apply received game state');
    const myId = window.multiplayerState?.playerId;
    console.log('[SYNC-APPLY] My Player ID:', myId);

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

    // Apply runner positions and states
    if (data.runners) {
        console.log('[SYNC-APPLY] Applying runner states. Total runners:', data.runners.length);

        data.runners.forEach((rData, idx) => {
            if (!runners[idx]) {
                console.warn('[SYNC-APPLY] No local runner at index:', idx);
                return;
            }

            const runner = runners[idx];
            const isMyRunner = (runner.remotePlayerId === myId || runner.type === 'player');

            console.log(`[SYNC-APPLY] Runner ${idx}:`, {
                isMyRunner,
                remoteActive: rData.active,
                localActive: runner.active,
                remoteReachedBottom: rData.reachedBottom
            });

            // CRITICAL: Apply active and reachedBottom status for ALL runners
            // This ensures tagged runners show as tagged on all clients
            if (rData.active !== undefined) {
                runner.active = rData.active;
            }
            if (rData.reachedBottom !== undefined) {
                runner.reachedBottom = rData.reachedBottom;
            }

            // Apply visual indicators for active status (all runners)
            if (!runner.active) {
                runner.el.style.opacity = '0.3';
                runner.el.style.filter = 'grayscale(100%)';
                console.log('[SYNC-APPLY] ❌ Runner', idx, 'marked as INACTIVE/TAGGED');
            } else {
                runner.el.style.opacity = '1';
                runner.el.style.filter = 'none';
            }

            // Apply visual indicator for reached bottom (all runners)
            if (runner.reachedBottom) {
                runner.el.style.border = '3px solid #00FF00';
                console.log('[SYNC-APPLY] ✓ Runner', idx, 'reached bottom');
            } else {
                runner.el.style.border = '3px solid #fff';
            }

            // Skip position buffering ONLY for my own character
            // (I control my own position locally)
            if (isMyRunner) {
                console.log('[SYNC-APPLY] Skipping position update for my runner');
                return;
            }

            // Update internal coordinates (for fallback when buffer is empty)
            runner.x = rData.x;
            runner.y = rData.y;

            // Add position to buffer for interpolation (smooth rendering happens in game loop)
            addPositionUpdate(runner, rData.x, rData.y, data.timestamp);
            console.log('[SYNC-APPLY] Added position to buffer for runner', idx, ':', rData.x, rData.y);
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

            // Update internal coordinates (for fallback when buffer is empty)
            tagger.x = tData.x;
            tagger.y = tData.y;

            // Add position to buffer for interpolation (smooth rendering happens in game loop)
            addPositionUpdate(tagger, tData.x, tData.y, data.timestamp);
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

    // Apply timer and update display
    if (data.timer !== undefined) {
        gameState.gameTimer = data.timer;
        // Update timer display to ensure visual sync for non-hosts
        updateTimerDisplay();
    }

    // Apply boost states for runners
    if (data.boost) {
        if (data.boost.active !== undefined) boost.active = data.boost.active;
        if (data.boost.ready !== undefined) boost.ready = data.boost.ready;
        if (data.boost.currentCharges !== undefined) boost.currentCharges = data.boost.currentCharges;

        // Update boost UI to reflect synced state
        updateBoostUI();
    }

    // Apply boost states for taggers
    if (data.taggerBoost) {
        if (data.taggerBoost.active !== undefined) taggerBoost.active = data.taggerBoost.active;
        if (data.taggerBoost.ready !== undefined) taggerBoost.ready = data.taggerBoost.ready;

        // Update boost UI (same function handles both)
        updateBoostUI();
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
