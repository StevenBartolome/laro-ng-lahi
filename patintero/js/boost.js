import { gameState, boost, taggerBoost, runners, taggers } from './config.js';

/**
 * Activate boost (for both runner and tagger roles)
 */
/**
 * Activate boost (for both runner and tagger roles)
 */
export function activateBoost() {
    if (!gameState.gameActive) return;

    // Runner Boost (Limited Charges)
    if (gameState.currentRole === 'runner' && boost.currentCharges > 0 && !boost.active) {
        boost.currentCharges--;
        boost.active = true;
        boost.lastUsed = Date.now();
        
        // Play Sound
        const snd = document.getElementById('boostSound');
        if (snd) { snd.currentTime = 0; snd.play().catch(()=>{}); }

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
        updateBoostUI();
    }
    // Tagger Boost (Cooldown based)
    else if (gameState.currentRole === 'tagger' && taggerBoost.ready) {
        taggerBoost.ready = false;
        taggerBoost.active = true;
        taggerBoost.lastUsed = Date.now();
        
        // Play Sound
        const snd = document.getElementById('boostSound'); // Reuse sound
        if (snd) { snd.currentTime = 0; snd.play().catch(()=>{}); }

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
    const indicators = document.querySelector('.boost-indicators');

    // Always show boost UI for both roles
    container.style.display = 'block';

    if (gameState.currentRole === 'runner') {
        indicators.style.display = 'flex'; // Show icons
        
        // Update Icons based on Charges
        for(let i=1; i<=3; i++) {
            const icon = document.getElementById(`boost-${i}`);
            if (icon) {
                if (i <= boost.currentCharges) {
                    icon.classList.remove('used');
                    icon.classList.add('active');
                } else {
                    icon.classList.add('used');
                    icon.classList.remove('active');
                }
            }
        }
        
        // Bar is full if we have charges, empty if 0
        fill.style.width = boost.currentCharges > 0 ? '100%' : '0%';
        fill.style.backgroundColor = '#00bcd4';
        fill.style.transition = 'width 0.3s ease';
        
    } else {
        // Tagger UI (Old Cooldown Bar)
        indicators.style.display = 'none'; // Hide icons
        const currentBoost = taggerBoost;
        const boostColor = '#ff4444';

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
}
