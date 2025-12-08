import { gameState, boost, taggerBoost, runners, taggers } from './config.js';

/**
 * Activate boost (for both runner and tagger roles)
 */
export function activateBoost() {
    if (!gameState.gameActive) return;

    // Runner Boost
    if (gameState.currentRole === 'runner' && boost.ready) {
        boost.ready = false;
        boost.active = true;
        boost.lastUsed = Date.now();

        const player = runners.find(r => r.type === 'player');
        if (player && player.active) {
            player.el.style.boxShadow = '0 0 30px #00bcd4';
            player.el.style.borderColor = '#00bcd4';

            setTimeout(() => {
                boost.active = false;
                player.el.style.boxShadow = '';
                player.el.style.borderColor = '#FFD700';
            }, boost.duration);
        }
        setTimeout(() => { boost.ready = true; updateBoostUI(); }, boost.cooldown);
        updateBoostUI();
    }
    // Tagger Boost
    else if (gameState.currentRole === 'tagger' && taggerBoost.ready) {
        taggerBoost.ready = false;
        taggerBoost.active = true;
        taggerBoost.lastUsed = Date.now();

        const playerTagger = taggers[gameState.playerControlledTagger];
        if (playerTagger) {
            playerTagger.el.style.boxShadow = '0 0 30px #ff4444';
            playerTagger.el.style.borderColor = '#ff4444';

            setTimeout(() => {
                taggerBoost.active = false;
                playerTagger.el.style.boxShadow = '';
                playerTagger.el.style.borderColor = '#FFD700';
            }, taggerBoost.duration);
        }
        setTimeout(() => { taggerBoost.ready = true; updateBoostUI(); }, taggerBoost.cooldown);
        updateBoostUI();
    }
}

/**
 * Update boost meter UI
 */
export function updateBoostUI() {
    const fill = document.getElementById('boostFill');
    const container = document.getElementById('boostMeter');

    // Always show boost UI for both roles
    container.style.display = 'block';

    // Use appropriate boost state based on current role
    const currentBoost = gameState.currentRole === 'runner' ? boost : taggerBoost;
    const boostColor = gameState.currentRole === 'runner' ? '#00bcd4' : '#ff4444';

    if (currentBoost.ready) {
        fill.style.width = '100%';
        fill.style.backgroundColor = boostColor;
        container.classList.add('boost-ready');
    } else {
        fill.style.width = '0%';
        fill.style.backgroundColor = '#555';
        container.classList.remove('boost-ready');
        fill.style.transition = `width ${currentBoost.cooldown}ms linear`;
        void fill.offsetWidth;
        fill.style.width = '100%';
    }
}
