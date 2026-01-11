/**
 * Luksong Baka - Traditional Filipino Jumping Game
 * Core game engine with sprite-based animations
 */

document.addEventListener('DOMContentLoaded', () => {
    // ===== CANVAS SETUP =====
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = 1200;
    canvas.height = 600;
    
    // ===== DOM ELEMENTS =====
    const difficultyScreen = document.getElementById('difficultyScreen');
    const easyBtn = document.getElementById('easyBtn');
    const normalBtn = document.getElementById('normalBtn');
    const hardBtn = document.getElementById('hardBtn');
    const levelText = document.getElementById('levelText');
    const roundText = document.getElementById('roundText');
    const messageOverlay = document.getElementById('messageOverlay');
    const messageText = document.getElementById('messageText');
    
    // ===== GAME CONFIGURATION =====
    const CONFIG = {
        jumpForce: 18,              // Base jump force (scales with level)
        gravity: 0.55,              // Reduced from 0.65 (slower fall)
        runSpeed: 5,
        // Baka hitbox heights per level (5 levels total)
        bakaHeight: [50, 85, 125, 170, 220],  // Level 5 is the tallest
        levelSpeedMultiplier: 1.08,      // Reduced from 1.12
        successMargin: 25,               // Increased from 15 (more forgiving)
        groundY: 480,
        playerStartX: 80,
        bakaX: 700
    };
    
    // ===== GAME STATE =====
    let gameState = 'menu';
    let currentLevel = 1;
    let currentRound = 1;
    let chargeAngle = 35;
    let angleDirection = 1;
    let angleSpeed = 4;
    let difficultyMultiplier = 1;
    let totalJumps = 0;  // Track total successful jumps for score
    let lives = 3;       // Player has 3 lives
    
    // ===== SPRITE ASSETS =====
    const assets = {
        background: null,
        platform: new Image(),
        runningSprites: [],
        jumpChargeSprites: [],
        bakaLevels: []
    };
    
    const ASSET_PATH = '../assets/luksong_baka_assets/';
    
    function loadAssets() {
        // Platform/midground
        assets.platform.src = ASSET_PATH + 'player_platform_midground_variation_1.png';
        
        // Running sprites (1-4)
        for (let i = 1; i <= 4; i++) {
            const img = new Image();
            img.src = ASSET_PATH + `player_running_sprite_${i}.png`;
            assets.runningSprites.push(img);
        }
        
        // Jump charge sprites (1-4)
        for (let i = 1; i <= 4; i++) {
            const img = new Image();
            img.src = ASSET_PATH + `player_jump_charge_${i}.png`;
            assets.jumpChargeSprites.push(img);
        }
        
        // Baka (taya) level sprites (1-5, use 1-4 for game)
        for (let i = 1; i <= 5; i++) {
            const img = new Image();
            img.src = ASSET_PATH + `taya_${i}.png`;
            assets.bakaLevels.push(img);
        }
    }
    
    // ===== PLAYER OBJECT =====
    const player = {
        x: CONFIG.playerStartX,
        y: CONFIG.groundY,
        width: 90,
        height: 130,
        vx: 0,
        vy: 0,
        frameIndex: 0,
        frameTimer: 0,
        frameDelay: 7
    };
    
    // ===== BAKA (OBSTACLE) OBJECT =====
    const baka = {
        x: CONFIG.bakaX,
        y: CONFIG.groundY,
        width: 160,
        height: 100,
        level: 1
    };
    
    // ===== CORE GAME FUNCTIONS =====
    
    /**
     * Set baka obstacle level (1-4)
     * Switches baka sprite and updates obstacle height hitbox
     * @param {number} level - Baka level (1-4)
     */
    function setBakaLevel(level) {
        baka.level = Math.min(Math.max(level, 1), 5);  // Now 5 levels
        baka.height = CONFIG.bakaHeight[baka.level - 1];
        currentLevel = baka.level;
        levelText.textContent = currentLevel;
    }
    
    /**
     * Update player position during jump arc
     * Uses parabolic motion with gravity
     * @returns {boolean} - True if player has landed
     */
    function updateJumpArc() {
        // Apply velocity
        player.x += player.vx;
        player.y += player.vy;
        
        // Apply gravity
        player.vy += CONFIG.gravity;
        
        // Ground collision check
        if (player.y >= CONFIG.groundY) {
            player.y = CONFIG.groundY;
            player.vy = 0;
            player.vx = 0;
            return true; // Landed
        }
        
        return false; // Still in air
    }
    
    /**
     * Check if player's jump clears the baka obstacle
     * @returns {string} - 'clear', 'bounce', 'hit', or 'pending'
     */
    function checkBakaCollision() {
        // Player hitbox (reduced for fairness)
        const playerHitbox = {
            x: player.x + 20,
            y: player.y - player.height + 25,
            width: player.width - 40,
            height: player.height - 35
        };
        
        // Player feet position (bottom of hitbox)
        const playerFeetY = playerHitbox.y + playerHitbox.height;
        
        // Baka hitbox based on level
        const bakaHitbox = {
            x: baka.x + 25,
            y: CONFIG.groundY - baka.height,
            width: baka.width - 50,
            height: baka.height - CONFIG.successMargin
        };
        
        // Baka top surface
        const bakaTopY = bakaHitbox.y;
        
        // Check if player has cleared the baka (passed it horizontally)
        if (playerHitbox.x > bakaHitbox.x + bakaHitbox.width) {
            return 'clear';
        }
        
        // Check if player is within horizontal range of baka
        const horizontalOverlap = 
            playerHitbox.x < bakaHitbox.x + bakaHitbox.width &&
            playerHitbox.x + playerHitbox.width > bakaHitbox.x;
        
        if (horizontalOverlap) {
            // Check if player is landing on TOP of baka (feet near top surface, falling down)
            if (player.vy > 0 && // Moving downward
                playerFeetY >= bakaTopY - 20 && 
                playerFeetY <= bakaTopY + 30 &&
                playerHitbox.y < bakaTopY) {
                return 'bounce';  // Land on top and bounce!
            }
            
            // Check for side collision (hitting the baka body)
            if (playerHitbox.y < bakaHitbox.y + bakaHitbox.height &&
                playerHitbox.y + playerHitbox.height > bakaHitbox.y + 20) {
                return 'hit';  // Hit the side - fail!
            }
        }
        
        return 'pending';
    }
    
    /**
     * Advance to next baka level after success
     */
    function advanceLevel() {
        totalJumps++;  // Count successful jumps
        
        if (currentLevel >= 5) {
            // GAME COMPLETE! Show score
            gameState = 'gameover';
            showGameComplete();
        } else {
            // Move to next level
            setBakaLevel(currentLevel + 1);
            showMessage('Level ' + currentLevel + '!', 'success');
        }
    }
    
    /**
     * Show game complete screen with score
     */
    function showGameComplete() {
        messageText.innerHTML = `
            <div style="font-size: 36px; margin-bottom: 15px;">🎉 GAME COMPLETE! 🎉</div>
            <div style="font-size: 24px; margin-bottom: 10px;">You cleared all 5 levels!</div>
            <div style="font-size: 28px; color: #ffd700;">Score: ${totalJumps * 100} points</div>
            <div style="font-size: 18px; margin-top: 20px; color: #ccc;">Click to play again</div>
        `;
        messageText.className = 'levelup';
        messageOverlay.classList.remove('hidden');
        
        // Click to restart
        setTimeout(() => {
            messageOverlay.addEventListener('click', function restart() {
                messageOverlay.removeEventListener('click', restart);
                messageOverlay.classList.add('hidden');
                totalJumps = 0;
                resetGame();
                gameState = 'idle';
            }, { once: true });
        }, 1000);
    }
    
    // ===== HELPER FUNCTIONS =====
    
    function showMessage(text, type) {
        messageText.textContent = text;
        messageText.className = type;
        messageOverlay.classList.remove('hidden');
        
        setTimeout(() => {
            messageOverlay.classList.add('hidden');
        }, 1500);
    }
    
    /**
     * Update the visual hearts display
     */
    function updateLivesDisplay() {
        for (let i = 1; i <= 3; i++) {
            const heart = document.getElementById('heart' + i);
            if (i <= lives) {
                heart.classList.remove('lost');
            } else {
                heart.classList.add('lost');
            }
        }
    }
    
    /**
     * Handle losing a life
     * @returns {boolean} - True if game over (all lives lost)
     */
    function loseLife() {
        lives--;
        updateLivesDisplay();
        
        if (lives <= 0) {
            return true;  // Game over
        }
        return false;  // Still has lives
    }
    
    function resetPlayer() {
        player.x = CONFIG.playerStartX;
        player.y = CONFIG.groundY;
        player.vx = 0;
        player.vy = 0;
        player.frameIndex = 0;
    }
    
    function resetGame() {
        setBakaLevel(1);
        currentRound = 1;
        difficultyMultiplier = 1;
        lives = 3;
        updateLivesDisplay();
        resetPlayer();
        gameState = 'idle';
    }
    
    // ===== DRAWING FUNCTIONS =====
    
    function drawBackground() {
        // Sky gradient background
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(0.6, '#98D8C8');
        gradient.addColorStop(1, '#7CB342');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw ground/grass
        ctx.fillStyle = '#5D4037';
        ctx.fillRect(0, CONFIG.groundY, canvas.width, canvas.height - CONFIG.groundY);
        
        // Grass line
        ctx.fillStyle = '#4CAF50';
        ctx.fillRect(0, CONFIG.groundY - 5, canvas.width, 10);
    }
    
    function drawPlatform() {
        if (assets.platform.complete) {
            // Draw platform as midground
            ctx.drawImage(
                assets.platform,
                0,
                CONFIG.groundY - 62,
                canvas.width,
                200
            );
        }
    }
    
    function drawBaka() {
        const sprite = assets.bakaLevels[baka.level - 1];
        
        // Calculate sprite dimensions based on level
        const spriteHeight = CONFIG.bakaHeight[baka.level - 1] + 30;
        const spriteWidth = baka.width;
        
        if (sprite && sprite.complete) {
            ctx.drawImage(
                sprite,
                baka.x,
                CONFIG.groundY - spriteHeight,
                spriteWidth,
                spriteHeight
            );
        } else {
            // Fallback: draw rectangle
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(
                baka.x + 25,
                CONFIG.groundY - baka.height,
                baka.width - 50,
                baka.height
            );
            
            // Draw baka label
            ctx.fillStyle = 'white';
            ctx.font = '16px Nunito';
            ctx.textAlign = 'center';
            ctx.fillText('BAKA', baka.x + baka.width / 2, CONFIG.groundY - baka.height / 2);
        }
        
        // Debug hitbox (uncomment to see)
        // ctx.strokeStyle = 'red';
        // ctx.lineWidth = 2;
        // ctx.strokeRect(baka.x + 25, CONFIG.groundY - baka.height, baka.width - 50, baka.height);
    }
    
    function drawPlayer() {
        let sprite;
        
        switch (gameState) {
            case 'running':
                player.frameTimer++;
                if (player.frameTimer >= player.frameDelay) {
                    player.frameTimer = 0;
                    player.frameIndex = (player.frameIndex + 1) % 4;
                }
                sprite = assets.runningSprites[player.frameIndex];
                break;
                
            case 'charging':
                const chargeIndex = Math.floor((chargeAngle - 30) / 15);
                sprite = assets.jumpChargeSprites[Math.min(chargeIndex, 3)];
                break;
                
            case 'jumping':
                sprite = assets.jumpChargeSprites[3];
                break;
                
            default:
                sprite = assets.runningSprites[0];
        }
        
        if (sprite && sprite.complete) {
            ctx.drawImage(
                sprite,
                player.x,
                player.y - player.height,
                player.width,
                player.height
            );
        } else {
            // Fallback rectangle
            ctx.fillStyle = '#3498db';
            ctx.fillRect(player.x, player.y - player.height, player.width, player.height);
        }
        
        // Debug hitbox (uncomment to see)
        // ctx.strokeStyle = 'blue';
        // ctx.lineWidth = 2;
        // ctx.strokeRect(player.x + 20, player.y - player.height + 25, player.width - 40, player.height - 35);
    }
    
    function drawAngleIndicator() {
        if (gameState !== 'charging') return;
        
        ctx.save();
        ctx.translate(player.x + player.width / 2, player.y - player.height / 2);
        
        // Arc background
        ctx.beginPath();
        ctx.arc(0, 0, 65, -Math.PI * 0.9, -Math.PI * 0.15);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 5;
        ctx.stroke();
        
        // Angle indicator line
        const angleRad = -chargeAngle * (Math.PI / 180);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(angleRad) * 75, Math.sin(angleRad) * 75);
        ctx.strokeStyle = '#D2691E';
        ctx.lineWidth = 6;
        ctx.stroke();
        
        // Arrow head
        ctx.beginPath();
        ctx.arc(Math.cos(angleRad) * 75, Math.sin(angleRad) * 75, 10, 0, Math.PI * 2);
        ctx.fillStyle = '#D2691E';
        ctx.fill();
        
        ctx.restore();
    }
    
    function drawInstructions() {
        if (gameState === 'idle') {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            ctx.fillRect(canvas.width / 2 - 220, canvas.height - 85, 440, 55);
            
            ctx.fillStyle = 'white';
            ctx.font = '20px Nunito';
            ctx.textAlign = 'center';
            ctx.fillText('Press SPACE or CLICK to start running!', canvas.width / 2, canvas.height - 52);
        }
    }
    
    // ===== GAME UPDATE LOOP =====
    
    function update() {
        switch (gameState) {
            case 'running':
                player.x += CONFIG.runSpeed * difficultyMultiplier;
                
                // Stop at charging zone
                if (player.x >= baka.x - 280) {
                    player.x = baka.x - 280;
                }
                break;
                
            case 'charging':
                // Oscillate angle for timing mechanic
                chargeAngle += angleDirection * angleSpeed * difficultyMultiplier;
                if (chargeAngle >= 75) {
                    chargeAngle = 75;
                    angleDirection = -1;
                } else if (chargeAngle <= 30) {
                    chargeAngle = 30;
                    angleDirection = 1;
                }
                break;
                
            case 'jumping':
                const landed = updateJumpArc();
                const collision = checkBakaCollision();
                
                // Bounce off the top of the baka!
                if (collision === 'bounce') {
                    player.vy = -12;  // Bounce upward
                    player.vx = 5;    // Continue forward
                    player.y = CONFIG.groundY - baka.height - player.height + 20;
                }
                
                // Levels 1-3: IMPOSSIBLE TO FAIL (always succeed)
                // Levels 4-5: Normal collision detection
                const canFail = currentLevel >= 4;
                
                if (canFail && collision === 'hit') {
                    gameState = 'fail';
                    const isGameOver = loseLife();
                    if (isGameOver) {
                        showMessage('� Game Over!', 'fail');
                        setTimeout(() => {
                            resetGame();
                            gameState = 'idle';
                        }, 2000);
                    } else {
                        showMessage('💥 Hit! ' + lives + ' ❤️ left', 'fail');
                        setTimeout(() => {
                            resetPlayer();
                            gameState = 'idle';
                        }, 1500);
                    }
                } else if (landed) {
                    // Levels 1-3 always succeed, levels 4-5 check if cleared
                    if (!canFail || collision === 'clear' || player.x > baka.x + baka.width) {
                        gameState = 'success';
                        setTimeout(() => {
                            advanceLevel();
                            resetPlayer();
                            gameState = 'idle';
                        }, 500);
                    } else {
                        gameState = 'fail';
                        const isGameOver = loseLife();
                        if (isGameOver) {
                            showMessage('💔 Game Over!', 'fail');
                            setTimeout(() => {
                                resetGame();
                                gameState = 'idle';
                            }, 2000);
                        } else {
                            showMessage('❌ Too short! ' + lives + ' ❤️ left', 'fail');
                            setTimeout(() => {
                                resetPlayer();
                                gameState = 'idle';
                            }, 1500);
                        }
                    }
                }
                break;
        }
    }
    
    // ===== RENDER LOOP =====
    
    function render() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw order: background → platform → baka → player
        drawBackground();
        drawPlatform();
        drawBaka();
        drawPlayer();
        drawAngleIndicator();
        drawInstructions();
    }
    
    // ===== MAIN GAME LOOP =====
    
    function gameLoop() {
        update();
        render();
        requestAnimationFrame(gameLoop);
    }
    
    // ===== INPUT HANDLERS =====
    
    let isInputDown = false;
    
    function handleInputDown() {
        if (isInputDown) return;
        if (gameState === 'gameover') return;  // Block input after game complete
        isInputDown = true;
        
        if (gameState === 'idle') {
            gameState = 'running';
        } else if (gameState === 'running') {
            gameState = 'charging';
            chargeAngle = 35;
            angleDirection = 1;
        }
    }
    
    function handleInputUp() {
        if (!isInputDown) return;
        isInputDown = false;
        
        if (gameState === 'charging') {
            gameState = 'jumping';
            
            // Calculate jump velocity based on angle and level
            const angleRad = chargeAngle * (Math.PI / 180);
            // Jump power scales with level: +1.5 per level (not too much, still challenging)
            const levelBonus = (currentLevel - 1) * 1.5;
            const jumpForce = (CONFIG.jumpForce + levelBonus) * difficultyMultiplier;
            
            player.vx = Math.cos(angleRad) * jumpForce * 0.65;
            player.vy = -Math.sin(angleRad) * jumpForce;
        }
    }
    
    // ===== DIFFICULTY SELECTION =====
    
    function startGame(difficulty) {
        switch (difficulty) {
            case 'easy':
                angleSpeed = 1;     // Slowed from 2.5
                break;
            case 'normal':
                angleSpeed = 2;     // Slowed from 4
                break;
            case 'hard':
                angleSpeed = 4;       // Slowed from 6.5
                break;
        }
        
        difficultyScreen.classList.add('hidden');
        resetGame();
        
        // Input listeners
        window.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                handleInputDown();
            }
        });
        
        window.addEventListener('keyup', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                handleInputUp();
            }
        });
        
        canvas.addEventListener('mousedown', handleInputDown);
        canvas.addEventListener('mouseup', handleInputUp);
        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            handleInputDown();
        });
        canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            handleInputUp();
        });
        
        // Start game
        gameLoop();
    }
    
    // ===== INITIALIZATION =====
    
    easyBtn.addEventListener('click', () => startGame('easy'));
    normalBtn.addEventListener('click', () => startGame('normal'));
    hardBtn.addEventListener('click', () => startGame('hard'));
    
    loadAssets();
});
