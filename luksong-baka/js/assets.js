/**
 * Luksong Baka - Asset Loading
 * Handles loading all game sprites and images
 */

const Assets = {
    platform: new Image(),
    runningSprites: [],
    jumpChargeSprites: [],
    bakaLevels: [],
    lifeHeart: new Image(),
    
    load() {
        const path = CONFIG.assetPath;
        
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
    }
};

// Make available globally
window.Assets = Assets;
