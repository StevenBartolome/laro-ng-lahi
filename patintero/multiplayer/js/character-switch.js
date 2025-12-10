import { gameState, runners, taggers } from './config.js';
import { database } from '../../../config/firebase.js';
import { ref, update, get } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-database.js";

/**
 * Update the character selection panel UI
 */
export function updateCharacterPanel() {
    const panel = document.getElementById('characterPanel');
    const buttonsContainer = document.getElementById('characterButtons');
    const title = document.getElementById('characterPanelTitle');

    // Safety check if window.multiplayerState is not yet ready
    const usage = window.multiplayerState?.entityUsage || {};
    const myId = window.multiplayerState?.playerId;

    if (!gameState.gameActive) {
        panel.style.display = 'none';
        return;
    }

    panel.style.display = 'block';
    buttonsContainer.innerHTML = '';

    if (gameState.currentRole === 'runner') {
        title.textContent = 'Select Runner (1-5)';
        runners.forEach((r, idx) => {
            if (r.active) {
                const btn = document.createElement('button');
                btn.className = 'character-btn';
                btn.textContent = `R${idx + 1}`;

                const entityId = `runner_${idx}`;
                const controller = usage[entityId];

                // Lock check
                if (controller && controller !== myId) {
                    btn.disabled = true;
                    btn.classList.add('locked');
                    btn.title = 'Controlled by another player';
                    btn.textContent += ' 🔒';
                } else {
                    btn.onclick = () => attemptSwitchToRunner(idx);
                }

                if (gameState.playerControlledRunner === idx) {
                    btn.classList.add('active');
                }

                buttonsContainer.appendChild(btn);
            }
        });
    } else {
        title.textContent = 'Select Tagger (1-5)';
        taggers.forEach((t, idx) => {
            const btn = document.createElement('button');
            btn.className = 'character-btn';
            btn.textContent = `T${t.id}`;

            const entityId = `tagger_${idx}`;
            const controller = usage[entityId];

            if (controller && controller !== myId) {
                btn.disabled = true;
                btn.classList.add('locked');
                btn.title = 'Controlled by another player';
                btn.textContent += ' 🔒';
            } else {
                btn.onclick = () => attemptSwitchToTagger(idx);
            }

            if (gameState.playerControlledTagger === idx) {
                btn.classList.add('active');
            }

            buttonsContainer.appendChild(btn);
        });
    }
}

/**
 * Release control of current entity
 */
async function releaseCurrentControl(prefix, index) {
    if (index === null) return;
    const lobbyId = window.multiplayerState.lobbyId;
    const entityId = `${prefix}_${index}`;
    // optimistic update?

    try {
        await update(ref(database, `lobbies/${lobbyId}/entityUsage`), {
            [entityId]: null
        });
    } catch (e) { console.error(e); }
}

/**
 * Attempt to switch to a runner
 */
export async function attemptSwitchToRunner(newIndex) {
    if (!gameState.gameActive || gameState.currentRole !== 'runner') return;
    if (newIndex === gameState.playerControlledRunner) return;

    // 1. Check "Player Out" Constraint
    const currentIdx = gameState.playerControlledRunner;

    // If I currently control a runner, check if it's active
    if (currentIdx !== null && runners[currentIdx]) {
        if (runners[currentIdx].active) {
            // I am still alive! I cannot switch!
            // Wait, what if I am just switching focus? 
            // "the player can only switch to bot if that player was already out"
            // This implies I cannot abandon my alive character to play a bot.
            alert("You cannot switch while your character is still active! Only tagged players can take over bots.");
            return;
        }
    }

    // If I don't control anyone (e.g. initial join or sync issue), assume I can join.
    // Or if I am "Out".

    const lobbyId = window.multiplayerState.lobbyId;
    const myId = window.multiplayerState.playerId;
    const targetEntityId = `runner_${newIndex}`;

    // 2. Firebase Transaction/Check
    // We do a simple get-then-set for now (race condition possible but low risk for small lobbies)
    // Or just try to update and see listener reflect it.

    const usageRef = ref(database, `lobbies/${lobbyId}/entityUsage/${targetEntityId}`);
    const snapshot = await get(usageRef);
    const controller = snapshot.val();

    if (controller && controller !== myId) {
        alert("This character is already controlled by someone else.");
        updateCharacterPanel(); // Refresh UI
        return;
    }

    // 3. Claim it
    await update(ref(database, `lobbies/${lobbyId}/entityUsage`), {
        [targetEntityId]: myId
    });

    // 4. Release old one (if I had one and it was inactive, or if we are swapping)
    // If I was Out, I effectively leave that body. It stays Out.
    if (currentIdx !== null) {
        await releaseCurrentControl('runner', currentIdx);
    }

    // 5. Local Switch
    performLocalRunnerSwitch(newIndex);
}

function performLocalRunnerSwitch(newIndex) {
    if (!runners[newIndex] || !runners[newIndex].active) return; // Can't switch to dead bot (unless we revive it? No)
    // Is user asking to play DEAD bots? "switch to bot if that player was already out" -> control a bot. Bot must be alive usually.

    // Convert old player runner to bot
    if (gameState.playerControlledRunner !== null && runners[gameState.playerControlledRunner]) {
        const oldRunner = runners[gameState.playerControlledRunner];
        oldRunner.type = 'bot'; // Revert to bot behavior (AI takes over or IDLE?)
        // If it was dead, it stays dead.

        oldRunner.el.style.border = '3px solid #fff';
        oldRunner.el.style.filter = 'hue-rotate(180deg)';
        oldRunner.el.style.zIndex = '10';

        // Update label
        const oldLabel = oldRunner.el.querySelector('.entity-label');
        if (oldLabel) oldLabel.textContent = `R${gameState.playerControlledRunner + 1}`;

        // Remove indicator
        const indicator = oldRunner.el.querySelector('.player-indicator');
        if (indicator) indicator.remove();

        oldRunner.el.classList.remove('player-controlled');
    }

    // Convert new runner to player
    const newRunner = runners[newIndex];
    newRunner.type = 'player';
    newRunner.el.style.filter = 'none';
    newRunner.el.style.zIndex = '20';
    newRunner.el.classList.add('player-controlled');

    // Add indicator
    const indicator = document.createElement('div');
    indicator.className = 'player-indicator';
    newRunner.el.appendChild(indicator);

    // Update label
    const newLabel = newRunner.el.querySelector('.entity-label');
    if (newLabel) newLabel.textContent = `R${newIndex + 1} (YOU)`;

    // Play Switch Sound
    const snd = document.getElementById('switchSound');
    if (snd) { snd.currentTime = 0; snd.play().catch(() => { }); }

    gameState.playerControlledRunner = newIndex;
    updateCharacterPanel();
}


/**
 * Attempt to switch to a tagger
 */
export async function attemptSwitchToTagger(newIndex) {
    if (!gameState.gameActive || gameState.currentRole !== 'tagger') return;
    if (newIndex === gameState.playerControlledTagger) return;

    // TAGGERS: "for the tagger if there's a bot there u can control it as long as no real players was controlling it"
    // No "Active/Out" restriction for Taggers managed here.

    const lobbyId = window.multiplayerState.lobbyId;
    const myId = window.multiplayerState.playerId;
    const targetEntityId = `tagger_${newIndex}`;
    const currentIdx = gameState.playerControlledTagger;

    // Check Lock
    const usageRef = ref(database, `lobbies/${lobbyId}/entityUsage/${targetEntityId}`);
    const snapshot = await get(usageRef);
    const controller = snapshot.val();

    if (controller && controller !== myId) {
        alert("This character is already controlled by someone else.");
        updateCharacterPanel();
        return;
    }

    // Claim
    await update(ref(database, `lobbies/${lobbyId}/entityUsage`), {
        [targetEntityId]: myId
    });

    // Release old
    if (currentIdx !== null) {
        await releaseCurrentControl('tagger', currentIdx);
    }

    performLocalTaggerSwitch(newIndex);
}


function performLocalTaggerSwitch(newIndex) {
    if (!taggers[newIndex]) return;

    // Convert old player tagger to bot
    if (gameState.playerControlledTagger !== null && taggers[gameState.playerControlledTagger]) {
        const oldTagger = taggers[gameState.playerControlledTagger];
        oldTagger.controller = 'bot';
        oldTagger.el.style.border = '3px solid #fff';
        oldTagger.el.style.zIndex = '10';
        oldTagger.el.classList.remove('player-tagger');

        // Update label
        const oldLabel = oldTagger.el.querySelector('.entity-label');
        if (oldLabel) oldLabel.textContent = `T${oldTagger.id}`;

        // Remove indicator
        const indicator = oldTagger.el.querySelector('.player-indicator');
        if (indicator) indicator.remove();

        oldTagger.el.classList.remove('player-tagger');
    }

    // Convert new tagger to player
    const newTagger = taggers[newIndex];
    newTagger.controller = 'player';
    newTagger.el.style.zIndex = '20';
    newTagger.el.classList.add('player-tagger');

    // Add indicator
    const indicator = document.createElement('div');
    indicator.className = 'player-indicator';
    newTagger.el.appendChild(indicator);

    // Update label
    const newLabel = newTagger.el.querySelector('.entity-label');
    if (newLabel) newLabel.textContent = `T${newTagger.id} (YOU)`;

    // Play Switch Sound
    const snd = document.getElementById('switchSound');
    if (snd) { snd.currentTime = 0; snd.play().catch(() => { }); }

    gameState.playerControlledTagger = newIndex;
    updateCharacterPanel();
}

// Export original aliases for compatibility if needed, but UI uses the attempt functions
export const switchToRunner = performLocalRunnerSwitch;
export const switchToTagger = performLocalTaggerSwitch;
