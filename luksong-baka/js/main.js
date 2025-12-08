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

        // Setup in-game UI buttons
        const diffBtn = document.getElementById('difficultyBtn');
        if (diffBtn) {
            diffBtn.addEventListener('click', () => {
                Sound.playClick();
                UI.showDifficultyScreen('difficulty'); // Show difficulty only
                GameState.state = 'menu'; // Pause game logic
            });
        }

        const infoBtn = document.getElementById('infoBtn');
        if (infoBtn) {
            infoBtn.addEventListener('click', () => {
                Sound.playClick();
                UI.showDifficultyScreen('instructions'); // Show instructions only
                GameState.state = 'menu'; // Pause game logic
            });
        }
        
        const closeBtn = document.getElementById('closeOverlayBtn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                Sound.playClick();
                UI.hideDifficultyScreen();
                if (GameState.state === 'menu') {
                     GameState.state = 'idle';
                }
            });
        }
        
        // Facts Feature listeners
        const factsBtn = document.getElementById('factsBtn');
        if (factsBtn) {
            factsBtn.addEventListener('click', () => {
                Sound.playClick();
                UI.showFacts();
                GameState.state = 'menu';
            });
        }
        
        const closeFactsBtn = document.getElementById('closeFactsBtn');
        if (closeFactsBtn) {
            closeFactsBtn.addEventListener('click', () => {
                Sound.playClick();
                UI.hideFacts();
                if (GameState.state === 'menu') {
                    GameState.state = 'idle';
                }
            });
        }
        
        const factsBoard = document.getElementById('factsBoard');
        if (factsBoard) {
            factsBoard.addEventListener('click', () => {
                UI.nextFact();
            });
        }
        
        document.querySelectorAll('.dot').forEach(dot => {
            dot.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                UI.setFact(index);
            });
        });
        
        // Hide close button initially (must select difficulty to start)
        const closeOverlayBtn = document.getElementById('closeOverlayBtn');
        if (closeOverlayBtn) closeOverlayBtn.style.display = 'none';
        
        // Setup generic button sounds (back buttons, etc)
        document.querySelectorAll('a, button').forEach(el => {
            el.addEventListener('click', () => Sound.playClick());
        });
    },
    
    start(difficulty) {
        // Show close button for future menu pauses
        const closeOverlayBtn = document.getElementById('closeOverlayBtn');
        if (closeOverlayBtn) closeOverlayBtn.style.display = 'block';
        
        // Stop previous loop if running
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
        
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
        
        // Hide overlay/menu logic handled by UI
        UI.hideDifficultyScreen();
        // Reset panels visibility for next time (handled in UI)
        
        GameLogic.resetGame();
        Input.init(this.canvas);
        Sound.startMusic();
        
        // Start game loop
        this.loop();
    },
    
    animationFrameId: null,
    
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
                    
                    // Increment cycle count
                    GameState.chargeCycles++;
                    
                    // Warning sound when holding too long (1 full cycle)
                    if (GameState.chargeCycles === 1) {
                        Sound.playOvercharge();
                    }
                    
                    // Penalize if held even longer (2 full cycles)
                    if (GameState.chargeCycles >= 2) {
                        GameState.state = 'fail';
                        const isGameOver = GameLogic.loseLife();
                        if (isGameOver) {
                            GameState.state = 'gameover';
                            UI.showGameOver();
                        } else {
                            UI.showMessage('⚠️ Lost Momentum! ⚠️', 'fail');
                            setTimeout(() => {
                                Player.reset();
                                GameState.state = 'idle';
                            }, 1500);
                        }
                    }
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
        this.animationFrameId = requestAnimationFrame(() => this.loop());
    }
};

// Start when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    Game.init();
});
