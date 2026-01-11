/**
 * Luksong Baka - Asset Loading
 * Handles loading all game sprites and images
 */

const Assets = {
    background: new Image(),
    platform: new Image(),
    runningSprites: [],
    jumpChargeSprites: [],
    bakaLevels: [],
    lifeHeart: new Image(),
    
    load() {
        const path = CONFIG.assetPath;

        // Background
        this.background.src = path + 'game_background.png';
        
        // Platform/midground
        this.platform.src = path + 'player_platform_midground_variation_1.png';
        
        // Life heart
        this.lifeHeart.src = path + 'player-life.png';
        
        // Running sprites (1-4)
        for (let i = 1; i <= 4; i++) {
            const img = new Image();
            img.src = path + `player_running_sprite_${i}.png`;
            this.runningSprites.push(img);
        }
        
        // Jump charge sprites (1-4)
        for (let i = 1; i <= 4; i++) {
            const img = new Image();
            img.src = path + `player_jump_charge_${i}.png`;
            this.jumpChargeSprites.push(img);
        }
        
        // Baka (taya) level sprites (1-5)
        for (let i = 1; i <= 5; i++) {
            const img = new Image();
            img.src = path + `taya_${i}.png`;
            this.bakaLevels.push(img);
        }

        // Facts Boards (1-3)
        for (let i = 1; i <= 3; i++) {
            const img = new Image();
            img.src = '../assets/game_facts_assets/luksong_baka_facts_board_' + i + '.png';
            // We don't necessarily need to store them if we just want to prime the cache,
            // but let's keep a reference just in case.
            // But since UI uses direct src assignment, just creating the Image object is enough to trigger download.
        }
    }
};

// Make available globally
window.Assets = Assets;
