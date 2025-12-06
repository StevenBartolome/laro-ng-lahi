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
            difficultyScreen: document.getElementById('difficultyScreen')
        };
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
                    UI.elements.messageOverlay.classList.add('hidden');
                    UI.elements.messageOverlay.classList.remove('game-complete-backdrop');
                    GameState.totalJumps = 0;
                    GameLogic.resetGame();
                    GameState.state = 'idle';
                });
            }
        }, 100);
    },
    
    hideDifficultyScreen() {
        this.elements.difficultyScreen.classList.add('hidden');
    }
};

// Make available globally
window.UI = UI;
