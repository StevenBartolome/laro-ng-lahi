/**
 * Luksong Baka - UI Functions
 * Message overlays and UI updates
 */

const UI = {
    elements: {},
    
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
        this.elements.messageText.textContent = text;
        this.elements.messageText.className = type;
        this.elements.messageOverlay.classList.remove('hidden');
        
        setTimeout(() => {
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
        // Add backdrop class to overlay
        this.elements.messageOverlay.classList.add('game-complete-backdrop');
        
        this.elements.messageText.innerHTML = `
            <div class="game-complete-content">
                <div style="font-size: 42px; margin-bottom: 15px;">🎉 GAME COMPLETE! 🎉</div>
                <div style="font-size: 24px; margin-bottom: 10px;">You cleared all 5 levels!</div>
                <div style="font-size: 32px; color: #ffd700; margin-bottom: 25px;">Score: ${GameState.totalJumps * 100} points</div>
                <div class="complete-buttons">
                    <button id="restartBtn" class="restart-btn">🔄 Play Again</button>
                    <a href="../game_select.php" class="back-menu-btn">🏠 Back to Menu</a>
                </div>
            </div>
        `;
        this.elements.messageText.className = 'levelup game-complete-box';
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
        this.elements.messageOverlay.classList.add('game-complete-backdrop');
        
        this.elements.messageText.innerHTML = `
            <div class="game-complete-content">
                <div style="font-size: 42px; margin-bottom: 15px; color: #e74c3c;">💔 GAME OVER 💔</div>
                <div style="font-size: 24px; margin-bottom: 10px;">You ran out of lives!</div>
                <div style="font-size: 28px; color: #ffd700; margin-bottom: 25px;">Score: ${GameState.totalJumps * 100} points</div>
                <div class="complete-buttons">
                    <button id="retryBtn" class="restart-btn">🔄 Try Again</button>
                    <a href="../game_select.php" class="back-menu-btn">🏠 Menu</a>
                </div>
            </div>
        `;
        this.elements.messageText.className = 'fail game-complete-box';
        this.elements.messageOverlay.classList.remove('hidden');
        
        // Setup retry button
        setTimeout(() => {
            const retryBtn = document.getElementById('retryBtn');
            if (retryBtn) {
                retryBtn.addEventListener('click', () => {
                    Sound.playClick();
                    UI.elements.messageOverlay.classList.add('hidden');
                    UI.elements.messageOverlay.classList.remove('game-complete-backdrop');
                    GameState.totalJumps = 0;
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
            overlayContent.style.maxWidth = '900px';
            menuGrid.classList.remove('single');
            instructionsPanel.style.display = 'block';
            difficultyPanel.style.display = 'flex';
        } else if (mode === 'instructions') {
            overlayContent.style.maxWidth = '500px';
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
