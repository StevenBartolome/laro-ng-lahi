/**
 * Luksong Baka - Main Entry Point
 * Game initialization and main loop
 */

const Game = {
    canvas: null,

    init() {
        // Get canvas
        this.canvas = document.getElementById('gameCanvas');

        // Initialize modules
        Rendering.init(this.canvas);
        UI.init();
        Assets.load();
        Sound.init();

        // Setup difficulty buttons
        ['easyBtn', 'normalBtn', 'hardBtn'].forEach(id => {
            document.getElementById(id).addEventListener('click', () => {
                Sound.playClick();
                this.start(id.replace('Btn', ''));
            });
        });

        // Setup generic button sounds (back buttons, etc)
        document.querySelectorAll('a, button').forEach(el => {
            el.addEventListener('click', () => Sound.playClick());
        });
    },

    start(difficulty) {
        // Set angle speed based on difficulty
        switch (difficulty) {
            case 'easy':
                GameState.angleSpeed = 1;
                break;
            case 'normal':
                GameState.angleSpeed = 2;
                break;
            case 'hard':
                GameState.angleSpeed = 4;
                break;
        }

        // Hide difficulty screen and setup game
        UI.hideDifficultyScreen();
        GameLogic.resetGame();
        Input.init(this.canvas);
        Sound.startMusic();

        // Start game loop
        this.loop();
    },

    update() {
        switch (GameState.state) {
            case 'running':
                Player.x += CONFIG.runSpeed * GameState.difficultyMultiplier;

                // Check if player ran into the baka (didn't jump!)
                // Check if player ran into the baka (didn't jump!)
                if (Player.x + Player.width > Baka.x + 30) {
                    Sound.stopRun();
                    GameState.state = 'fail';
                    const isGameOver = GameLogic.loseLife();
                    if (isGameOver) {
                        GameState.state = 'gameover';
                        UI.showGameOver();
                    } else {
                        UI.showMessage('💥 Ran into baka! ' + GameState.lives + ' ❤️ left', 'fail');
                        setTimeout(() => {
                            Player.reset();
                            GameState.state = 'idle';
                        }, 1500);
                    }
                }
                break;

            case 'charging':
                // Oscillate angle with extended range
                GameState.chargeAngle += GameState.angleDirection * GameState.angleSpeed * GameState.difficultyMultiplier;
                if (GameState.chargeAngle >= CONFIG.maxAngle) {
                    GameState.chargeAngle = CONFIG.maxAngle;
                    GameState.angleDirection = -1;
                } else if (GameState.chargeAngle <= CONFIG.minAngle) {
                    GameState.chargeAngle = CONFIG.minAngle;
                    GameState.angleDirection = 1;
                }
                break;

            case 'jumping':
                const landed = GameLogic.updateJumpArc();
                const collision = GameLogic.checkBakaCollision();

                // Bounce off top - REQUIRES TIMING!
                if (collision === 'bounce') {
                    const timeSinceInput = Date.now() - GameState.bounceInputTime;

                    // Check if player pressed space recently (within 250ms)
                    if (timeSinceInput < 250) {
                        // SUCCESSFUL BOUNCE
                        GameLogic.handleBounce();
                        Sound.playJump();
                        UI.showMessage('✨ PERFECT! ✨', 'success');
                        GameState.bounceInputTime = 0; // Reset to prevent double bounce
                    } else {
                        // FAILED TO TIME IT - CRASH!
                        // FAILED TO TIME IT - CRASH!
                        GameState.state = 'fail';
                        const isGameOver = GameLogic.loseLife();
                        if (isGameOver) {
                            GameState.state = 'gameover';
                            UI.showGameOver();
                        } else {
                            UI.showMessage('❌ Missed Timing! ' + GameState.lives + ' ❤️ left', 'fail');
                            setTimeout(() => {
                                Player.reset();
                                GameState.state = 'idle';
                            }, 1500);
                        }
                    }
                }

                // Levels 1-3: Cannot hit the baka (collision disabled)
                // BUT landing short still costs a life on ALL levels!
                const canHitBaka = GameState.currentLevel >= 4;

                // Hit the baka body (only on levels 4-5)
                if (canHitBaka && collision === 'hit') {
                    GameState.state = 'fail';
                    const isGameOver = GameLogic.loseLife();
                    if (isGameOver) {
                        GameState.state = 'gameover';
                        UI.showGameOver();
                    } else {
                        UI.showMessage('💥 Hit! ' + GameState.lives + ' ❤️ left', 'fail');
                        setTimeout(() => {
                            Player.reset();
                            GameState.state = 'idle';
                        }, 1500);
                    }
                } else if (landed) {
                    // Check if cleared the baka
                    if (collision === 'clear' || Player.x > Baka.x + Baka.width) {
                        // SUCCESS - cleared the baka!
                        GameState.state = 'success';
                        setTimeout(() => {
                            GameLogic.advanceLevel();
                            // Only reset if NOT gameover (cleared all levels)
                            if (GameState.state !== 'gameover') {
                                Player.reset();
                                GameState.state = 'idle';
                            }
                        }, 500);
                    } else {
                        // FAIL - landed short! Costs a life on ALL levels
                        GameState.state = 'fail';
                        const isGameOver = GameLogic.loseLife();
                        if (isGameOver) {
                            GameState.state = 'gameover';
                            UI.showGameOver();
                        } else {
                            UI.showMessage('❌ Too short! ' + GameState.lives + ' ❤️ left', 'fail');
                            setTimeout(() => {
                                Player.reset();
                                GameState.state = 'idle';
                            }, 1500);
                        }
                    }
                }
                break;
        }
    },

    loop() {
        this.update();
        Rendering.render();
        requestAnimationFrame(() => this.loop());
    }
};

// Start when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    Game.init();
});
