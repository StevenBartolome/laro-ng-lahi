/**
 * Luksong Baka - Game Logic
 * Core game functions: collision, jump physics, level management
 */

const GameLogic = {
    /**
     * Update player position during jump arc
     * @returns {boolean} - True if player has landed
     */
    updateJumpArc() {
        Player.x += Player.vx;
        Player.y += Player.vy;
        Player.vy += CONFIG.gravity;

        if (Player.y >= CONFIG.groundY) {
            Player.y = CONFIG.groundY;
            Player.vy = 0;
            Player.vx = 0;
            return true;
        }
        return false;
    },

    /**
     * Check if player's jump clears the baka
     * @returns {string} - 'clear', 'bounce', 'hit', or 'pending'
     */
    checkBakaCollision() {
        const playerHitbox = {
            x: Player.x + 20,
            y: Player.y - Player.height + 25,
            width: Player.width - 40,
            height: Player.height - 35
        };

        const playerFeetY = playerHitbox.y + playerHitbox.height;

        const bakaHitbox = {
            x: Baka.x + 25,
            y: CONFIG.groundY - Baka.height,
            width: Baka.width - 50,
            height: Baka.height - CONFIG.successMargin
        };

        const bakaTopY = bakaHitbox.y;

        // Cleared the baka
        if (playerHitbox.x > bakaHitbox.x + bakaHitbox.width) {
            return 'clear';
        }

        // Horizontal overlap check
        const horizontalOverlap =
            playerHitbox.x < bakaHitbox.x + bakaHitbox.width &&
            playerHitbox.x + playerHitbox.width > bakaHitbox.x;

        if (horizontalOverlap) {
            // Landing on top - bounce!
            if (Player.vy > 0 &&
                playerFeetY >= bakaTopY - 20 &&
                playerFeetY <= bakaTopY + 30 &&
                playerHitbox.y < bakaTopY) {
                return 'bounce';
            }

            // Side collision
            if (playerHitbox.y < bakaHitbox.y + bakaHitbox.height &&
                playerHitbox.y + playerHitbox.height > bakaHitbox.y + 20) {
                return 'hit';
            }
        }

        return 'pending';
    },

    /**
     * Advance to next baka level
     */
    advanceLevel() {
        GameState.totalJumps++;

        if (GameState.currentLevel >= 5) {
            GameState.state = 'gameover';
            UI.showGameComplete();
        } else {
            Baka.setLevel(GameState.currentLevel + 1);
            UI.showMessage('Level ' + GameState.currentLevel + '!', 'success');
        }
    },

    /**
     * Handle losing a life
     * @returns {boolean} - True if game over
     */
    loseLife() {
        GameState.lives--;
        UI.updateLivesDisplay();
        return GameState.lives <= 0;
    },

    /**
     * Reset game to initial state
     */
    resetGame() {
        Baka.setLevel(1);
        GameState.reset();
        UI.updateLivesDisplay();
        Player.reset();
    },

    /**
     * Execute jump with current angle
     */
    executeJump() {
        const angleRad = GameState.chargeAngle * (Math.PI / 180);
        const levelBonus = (GameState.currentLevel - 1) * 1.5;
        // SPEED NORMALIZATION: Removed difficultyMultiplier
        const jumpForce = CONFIG.jumpForce + levelBonus;

        Player.vx = Math.cos(angleRad) * jumpForce * 0.65;
        Player.vy = -Math.sin(angleRad) * jumpForce;
    },

    /**
     * Handle bounce off baka top
     */
    handleBounce() {
        Player.vy = -12;
        Player.vx = 5;
        Player.y = CONFIG.groundY - Baka.height - Player.height + 20;
    }
};

// Make available globally
window.GameLogic = GameLogic;
