/**
 * Luksong Baka - UI Functions
 * Message overlays and UI updates
 */

const UI = {
    elements: {},
    messageTimeout: null,

    init() {
        this.elements = {
            messageOverlay: document.getElementById('messageOverlay'),
            messageText: document.getElementById('messageText'),
            levelText: document.getElementById('levelText'),
            levelText: document.getElementById('levelText'),
            difficultyScreen: document.getElementById('difficultyScreen'),
            factsOverlay: document.getElementById('factsOverlay')
        };
    },

    // Facts Logic
    facts: {
        current: 1,
        total: 3
    },

    showFacts() {
        this.facts.current = 1;
        this.updateFactDisplay();
        this.elements.factsOverlay.classList.remove('hidden');
    },

    hideFacts() {
        this.elements.factsOverlay.classList.add('hidden');
    },

    nextFact() {
        this.facts.current++;
        if (this.facts.current > this.facts.total) {
            this.facts.current = 1;
        }
        this.updateFactDisplay();
    },

    setFact(index) {
        this.facts.current = index;
        this.updateFactDisplay();
    },

    updateFactDisplay() {
        const board = document.getElementById('factsBoard');
        const dots = document.querySelectorAll('.dot');

        // Simple fade out/in effect
        board.style.opacity = '0';
        board.style.transform = 'translateY(10px)';

        setTimeout(() => {
            board.src = `../assets/game_facts_assets/luksong_baka_facts_board_${this.facts.current}.png`;
            board.style.opacity = '1';
            board.style.transform = 'translateY(0)';

            // Update dots
            dots.forEach(dot => {
                dot.classList.toggle('active', parseInt(dot.dataset.index) === this.facts.current);
            });
        }, 200);
    },

    showMessage(text, type) {
        if (this.messageTimeout) clearTimeout(this.messageTimeout);

        this.elements.messageText.textContent = text;
        this.elements.messageText.className = type;
        this.elements.messageOverlay.classList.remove('hidden');

        this.messageTimeout = setTimeout(() => {
            this.elements.messageOverlay.classList.add('hidden');
        }, 1500);
    },

    updateLivesDisplay() {
        for (let i = 1; i <= CONFIG.maxLives; i++) {
            const heart = document.getElementById('heart' + i);
            if (heart) {
                if (i <= GameState.lives) {
                    heart.classList.remove('lost');
                } else {
                    heart.classList.add('lost');
                }
            }
        }
    },

    showGameComplete() {
        if (this.messageTimeout) clearTimeout(this.messageTimeout);

        // Add backdrop class to overlay
        this.elements.messageOverlay.classList.add('game-complete-backdrop');

        this.elements.messageText.innerHTML = `
            <div class="game-complete-content">
                <div class="complete-header">🎉 VICTORY! 🎉</div>
                <div class="complete-sub">You cleared all 5 levels!</div>
                <div class="complete-score">Score: ${GameState.totalJumps * 100}</div>
                <div class="complete-buttons">
                    <button id="restartBtn" class="restart-btn">Play Again</button>
                    <a href="../game_select.php" class="back-menu-btn">Main Menu</a>
                </div>
            </div>
        `;
        this.elements.messageText.className = 'game-complete-box';
        this.elements.messageOverlay.classList.remove('hidden');

        // Setup restart button
        setTimeout(() => {
            const restartBtn = document.getElementById('restartBtn');
            if (restartBtn) {
                restartBtn.addEventListener('click', () => {
                    Sound.playClick();
                    UI.elements.messageOverlay.classList.add('hidden');
                    UI.elements.messageOverlay.classList.remove('game-complete-backdrop');
                    GameState.reset();
                    Player.reset();
                    Baka.setLevel(1);
                    GameLogic.resetGame();
                    GameState.state = 'idle';
                });
            }

            // Back to menu button
            const backBtn = document.querySelector('.back-menu-btn');
            if (backBtn) {
                backBtn.addEventListener('click', () => Sound.playClick());
            }
        }, 100);
    },

    showGameOver() {
        if (this.messageTimeout) clearTimeout(this.messageTimeout);

        this.elements.messageOverlay.classList.add('game-complete-backdrop');

        this.elements.messageText.innerHTML = `
            <div class="game-complete-content">
                <div class="complete-header fail">GAME OVER</div>
                <div class="complete-sub">You ran out of lives!</div>
                <div class="complete-score">Score: ${GameState.totalJumps * 100}</div>
                <div class="complete-buttons">
                    <button id="retryBtn" class="restart-btn">Try Again</button>
                    <a href="../game_select.php" class="back-menu-btn">Main Menu</a>
                </div>
            </div>
        `;
        this.elements.messageText.className = 'game-complete-box';
        this.elements.messageOverlay.classList.remove('hidden');

        // Setup retry button
        setTimeout(() => {
            const retryBtn = document.getElementById('retryBtn');
            if (retryBtn) {
                retryBtn.addEventListener('click', () => {
                    Sound.playClick();
                    UI.elements.messageOverlay.classList.add('hidden');
                    UI.elements.messageOverlay.classList.remove('game-complete-backdrop');

                    // CRITICAL FIX: Explicitly call Game.start to reset multipliers and speed!
                    // This ensures "Try Again" doesn't revert to Easy mode physics
                    if (window.Game) {
                        Game.start(GameState.difficulty || 'normal');
                    } else {
                        // Fallback if Game object isn't global yet (rare)
                        GameState.totalJumps = 0;
                        GameLogic.resetGame();
                        GameState.state = 'idle';
                    }
                });
            }

            // Back to menu button
            const backBtn = document.querySelector('.back-menu-btn');
            if (backBtn) {
                backBtn.addEventListener('click', () => Sound.playClick());
            }
        }, 100);
    },

    hideDifficultyScreen() {
        this.elements.difficultyScreen.classList.add('hidden');
    },

    showDifficultyScreen(mode = 'both') {
        const difficultyScreen = this.elements.difficultyScreen;
        const instructionsPanel = difficultyScreen.querySelector('.instructions-panel');
        const difficultyPanel = difficultyScreen.querySelector('.difficulty-panel');
        const overlayContent = difficultyScreen.querySelector('.overlay-content');
        const menuGrid = difficultyScreen.querySelector('.menu-grid');

        // Reset layout based on mode
        if (mode === 'both') {
            overlayContent.style.maxWidth = '1100px';
            menuGrid.classList.remove('single');
            instructionsPanel.style.display = 'block';
            difficultyPanel.style.display = 'flex';
        } else if (mode === 'instructions') {
            overlayContent.style.maxWidth = '800px';
            menuGrid.classList.add('single');
            instructionsPanel.style.display = 'block';
            difficultyPanel.style.display = 'none';
        } else if (mode === 'difficulty') {
            overlayContent.style.maxWidth = '500px';
            menuGrid.classList.add('single');
            instructionsPanel.style.display = 'none';
            difficultyPanel.style.display = 'flex';
        }

        difficultyScreen.classList.remove('hidden');
    }
};

// Make available globally
window.UI = UI;
