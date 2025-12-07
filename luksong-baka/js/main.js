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
        document.getElementById('easyBtn').addEventListener('click', () => this.start('easy'));
        document.getElementById('normalBtn').addEventListener('click', () => this.start('normal'));
        document.getElementById('hardBtn').addEventListener('click', () => this.start('hard'));
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
                if (Player.x + Player.width > Baka.x + 30) {
                    GameState.state = 'fail';
                    const isGameOver = GameLogic.loseLife();
                    if (isGameOver) {
                        UI.showMessage('💔 Game Over!', 'fail');
                        setTimeout(() => {
                            GameLogic.resetGame();
                            GameState.state = 'idle';
                        }, 2000);
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
                
                // Bounce off top
                if (collision === 'bounce') {
                    GameLogic.handleBounce();
                }
                
                // Levels 1-3: Cannot hit the baka (collision disabled)
                // BUT landing short still costs a life on ALL levels!
                const canHitBaka = GameState.currentLevel >= 4;
                
                // Hit the baka body (only on levels 4-5)
                if (canHitBaka && collision === 'hit') {
                    GameState.state = 'fail';
                    const isGameOver = GameLogic.loseLife();
                    if (isGameOver) {
                        UI.showMessage('💔 Game Over!', 'fail');
                        setTimeout(() => {
                            GameLogic.resetGame();
                            GameState.state = 'idle';
                        }, 2000);
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
                            Player.reset();
                            GameState.state = 'idle';
                        }, 500);
                    } else {
                        // FAIL - landed short! Costs a life on ALL levels
                        GameState.state = 'fail';
                        const isGameOver = GameLogic.loseLife();
                        if (isGameOver) {
                            UI.showMessage('💔 Game Over!', 'fail');
                            setTimeout(() => {
                                GameLogic.resetGame();
                                GameState.state = 'idle';
                            }, 2000);
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
