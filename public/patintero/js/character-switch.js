import { gameState, runners, taggers } from './config.js';

/**
 * Update the character selection panel UI
 */
export function updateCharacterPanel() {
    const panel = document.getElementById('characterPanel');
    const buttonsContainer = document.getElementById('characterButtons');
    const title = document.getElementById('characterPanelTitle');

    if (!gameState.gameActive) {
        panel.style.display = 'none';
        return;
    }

    panel.style.display = 'block';
    buttonsContainer.innerHTML = '';

    if (gameState.currentRole === 'runner') {
        title.textContent = 'Select Runner to Control (1-5)';
        runners.forEach((r, idx) => {
            if (r.active) {
                const btn = document.createElement('button');
                btn.className = 'character-btn';
                btn.textContent = `R${idx + 1}`;
                btn.onclick = () => switchToRunner(idx);

                if (gameState.playerControlledRunner === idx) {
                    btn.classList.add('active');
                }

                buttonsContainer.appendChild(btn);
            }
        });
    } else {
        title.textContent = 'Select Tagger to Control (1-5)';
        taggers.forEach((t, idx) => {
            const btn = document.createElement('button');
            btn.className = 'character-btn';
            btn.textContent = `T${t.id}`;
            btn.onclick = () => switchToTagger(idx);

            if (gameState.playerControlledTagger === idx) {
                btn.classList.add('active');
            }

            buttonsContainer.appendChild(btn);
        });
    }
}

/**
 * Switch to controlling a different runner
 */
export function switchToRunner(newIndex) {
    if (!gameState.gameActive || gameState.currentRole !== 'runner') return;
    if (newIndex === gameState.playerControlledRunner) return;
    if (!runners[newIndex] || !runners[newIndex].active) return;

    // Convert old player runner to bot
    if (gameState.playerControlledRunner !== null && runners[gameState.playerControlledRunner]) {
        const oldRunner = runners[gameState.playerControlledRunner];
        oldRunner.type = 'bot';
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
    if (snd) { snd.currentTime = 0; snd.play().catch(()=>{}); }

    gameState.playerControlledRunner = newIndex;
    updateCharacterPanel();
}

/**
 * Switch to controlling a different tagger
 */
export function switchToTagger(newIndex) {
    if (!gameState.gameActive || gameState.currentRole !== 'tagger') return;
    if (newIndex === gameState.playerControlledTagger) return;
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
    if (snd) { snd.currentTime = 0; snd.play().catch(()=>{}); }

    gameState.playerControlledTagger = newIndex;
    updateCharacterPanel();
}
