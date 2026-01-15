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

        // Initialize Achievements
        const initAchievements = async () => {
            const user = window.currentUser;
            if (window.achievementManager && user) {
                await window.achievementManager.init(user.id, user.isGuest);
                console.log('Achievement system initialized for Luksong Baka', user.isGuest ? '(Guest)' : '(User)');
            }
        };

        if (window.currentUser) {
            initAchievements();
        } else {
            window.addEventListener('user-ready', initAchievements);
        }

        // Global tracker function
        window.trackLuksongAchievements = async () => {
            const user = window.currentUser;
            if (window.achievementManager && user && !user.isGuest) {
                console.log('Tracking Luksong Baka game:', GameState.achievementStats);
                await window.achievementManager.trackLuksongGame(GameState.achievementStats);
            }
        };

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
                UI.hideFacts();
                UI.showDifficultyScreen('instructions'); // Show instructions only
                GameState.state = 'menu'; // Pause game logic
                GameState.openedViaInfoButton = true; // Track how overlay was opened

                // Show close button for instructions view
                const closeOverlayBtn = document.getElementById('closeOverlayBtn');
                if (closeOverlayBtn) closeOverlayBtn.style.display = 'flex';
            });
        }

        const factsBtn = document.getElementById('factsBtn');
        if (factsBtn) {
            factsBtn.addEventListener('click', () => {
                Sound.playClick();
                UI.showFacts();
                GameState.state = 'menu';

                // Facts Music Logic
                Sound.pauseMusic();
                const factsMusic = document.getElementById('factsMusic');
                if (factsMusic) {
                    factsMusic.volume = 0.5;
                    factsMusic.currentTime = 0;
                    factsMusic.play().catch(() => { });
                }

                // Generate Particles
                const container = document.querySelector('.facts-container');
                if (container) {
                    // Clear existing
                    const oldParticles = container.querySelectorAll('.particle');
                    oldParticles.forEach(p => p.remove());

                    // Spawn new ones
                    for (let i = 0; i < 50; i++) {
                        const p = document.createElement('div');
                        p.classList.add('particle');
                        p.style.left = Math.random() * 100 + '%';
                        p.style.top = Math.random() * 100 + '%';
                        p.style.width = (Math.random() * 10 + 5) + 'px';
                        p.style.height = p.style.width;
                        p.style.animationDelay = Math.random() * 2 + 's';
                        p.style.background = `radial-gradient(circle, ${['#00e5ff', '#ffd700', '#fff'][Math.floor(Math.random() * 3)]}, transparent)`;
                        container.appendChild(p);
                    }
                }
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

                // Facts Music Logic
                const factsMusic = document.getElementById('factsMusic');
                if (factsMusic) {
                    factsMusic.pause();
                    factsMusic.currentTime = 0;
                }
                Sound.resumeMusic();
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

        // Close button handler - enforce difficulty selection
        const closeBtn = document.getElementById('closeOverlayBtn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                Sound.playClick();

                // If game hasn't started yet (no difficulty selected)
                if (!GameState.difficulty) {
                    // If opened via info button on start screen, return to main difficulty view
                    if (GameState.openedViaInfoButton) {
                        UI.showDifficultyScreen('both');
                    } else {
                        // Otherwise it's the main close button, go back to game select
                        window.location.href = '../game_select.html';
                    }
                }
                // Game has started (Paused), simply resume
                else {
                    UI.hideDifficultyScreen();
                    if (GameState.state === 'menu') {
                        GameState.state = 'idle'; // Resume to idle (running waiting for jump)
                    }
                }

                // Always reset the flag
                GameState.openedViaInfoButton = false;
            });
        }

        // Setup generic button sounds (back buttons, etc)
        document.querySelectorAll('a, button').forEach(el => {
            el.addEventListener('click', () => Sound.playClick());
        });
    },

    start(difficulty) {
        // Show close button for future menu pauses
        const closeOverlayBtn = document.getElementById('closeOverlayBtn');
        if (closeOverlayBtn) closeOverlayBtn.style.display = 'flex';

        // Stop previous loop if running
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }

        // Store difficulty for later checks
        GameState.difficulty = difficulty;

        // Set angle speed and speed multiplier based on difficulty
        switch (difficulty) {
            case 'easy':
                GameState.angleSpeed = 3.5;
                GameState.difficultyMultiplier = 1.0;
                break;
            case 'normal':
                GameState.angleSpeed = 4.5;
                GameState.difficultyMultiplier = 1.2;
                break;
            case 'hard':
                GameState.angleSpeed = 6;
                GameState.difficultyMultiplier = 1.5;
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

    update(timeScale = 1.0) {
        switch (GameState.state) {
            case 'running':
                Player.x += CONFIG.runSpeed * GameState.difficultyMultiplier * timeScale;

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
                GameState.chargeAngle += GameState.angleDirection * GameState.angleSpeed * GameState.difficultyMultiplier * timeScale;
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
                const landed = GameLogic.updateJumpArc(timeScale);
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

    lastTime: 0,
    loop(timestamp) {
        if (!this.lastTime) this.lastTime = timestamp;
        const deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;

        // Target 60 FPS (approx 16.67ms per frame)
        const timeScale = deltaTime / (1000 / 60);
        // Clamp to avoid spiraling
        const clampedTimeScale = Math.min(timeScale, 4.0);

        this.update(clampedTimeScale);
        Rendering.render();
        this.animationFrameId = requestAnimationFrame((t) => this.loop(t));
    }
};

// Start when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    Game.init();
});
