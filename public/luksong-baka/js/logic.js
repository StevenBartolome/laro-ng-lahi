/**
 * Luksong Baka - Game Logic
 * Core game functions: collision, jump physics, level management
 */

const GameLogic = {
    /**
     * Update player position during jump arc
     * @returns {boolean} - True if player has landed
     */
    updateJumpArc(timeScale = 1.0) {
        Player.x += Player.vx * timeScale;
        Player.y += Player.vy * timeScale;
        Player.vy += CONFIG.gravity * timeScale;

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

            // Achievement Update: Win
            if (GameState.achievementStats) {
                GameState.achievementStats.won = true;
                GameState.achievementStats.maxLevel = 5;
                GameState.achievementStats.streak++;

                // Track Game
                if (window.trackLuksongAchievements) window.trackLuksongAchievements();
            }

            UI.showGameComplete();
        } else {
            // Achievement Update
            if (GameState.achievementStats) {
                GameState.achievementStats.maxLevel = Math.max(GameState.achievementStats.maxLevel, GameState.currentLevel);
                GameState.achievementStats.streak++;
            }

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

        // Achievement Update: Loss/Imperfect
        if (GameState.achievementStats) {
            GameState.achievementStats.perfect = false;
            GameState.achievementStats.streak = 0;
        }

        UI.updateLivesDisplay();

        const isGameOver = GameState.lives <= 0;
        if (isGameOver && window.trackLuksongAchievements) {
            window.trackLuksongAchievements();
        }

        return isGameOver;
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
        const jumpForce = (CONFIG.jumpForce + levelBonus) * GameState.difficultyMultiplier;

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
