/**
 * Luksong Baka - Input Handling
 * Keyboard and mouse/touch input
 */

const Input = {
    init(canvas) {
        // Keyboard
        window.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                this.handleDown();
            }
        });
        
        window.addEventListener('keyup', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                this.handleUp();
            }
        });
        
        // Mouse
        canvas.addEventListener('mousedown', () => this.handleDown());
        canvas.addEventListener('mouseup', () => this.handleUp());
        
        // Touch
        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handleDown();
        });
        canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.handleUp();
        });
    },
    
    handleDown() {
        if (GameState.isInputDown) return;
        if (GameState.state === 'gameover') return;
        
        GameState.isInputDown = true;
        
        if (GameState.state === 'idle') {
            GameState.state = 'running';
            Sound.playRun(); // Start sound
        } else if (GameState.state === 'running') {
            GameState.state = 'charging';
            Sound.stopRun(); // Stop sound
            GameState.chargeAngle = CONFIG.minAngle + 15;
            GameState.angleDirection = 1;
            GameState.chargeStartTime = Date.now();
            GameState.chargeCycles = 0;
        } else if (GameState.state === 'jumping') {
            // Player is trying to bounce!
            GameState.bounceInputTime = Date.now();
        }
    },
    
    handleUp() {
        if (!GameState.isInputDown) return;
        GameState.isInputDown = false;
        
        if (GameState.state === 'charging') {
            GameState.state = 'jumping';
            GameLogic.executeJump();
            Sound.playJump();  // Play jump sound!
        }
    }
};

// Make available globally
window.Input = Input;
