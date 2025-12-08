/**
 * Luksong Baka - Rendering
 * All drawing functions for the game
 */

let canvas, ctx;

const Rendering = {
    init(canvasElement) {
        canvas = canvasElement;
        ctx = canvas.getContext('2d');
        canvas.width = CONFIG.canvasWidth;
        canvas.height = CONFIG.canvasHeight;
        
        // Disable smoothing for pixel art look
        ctx.imageSmoothingEnabled = false;
        ctx.mozImageSmoothingEnabled = false;
        ctx.webkitImageSmoothingEnabled = false;
        ctx.msImageSmoothingEnabled = false;
    },
    
    clear() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    },
    
    drawBackground() {
        if (Assets.background.complete) {
            ctx.drawImage(Assets.background, 0, 0, canvas.width, canvas.height);
        } else {
            // Sky gradient
            const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            gradient.addColorStop(0, '#87CEEB');
            gradient.addColorStop(0.6, '#98D8C8');
            gradient.addColorStop(1, '#7CB342');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Ground
            ctx.fillStyle = '#5D4037';
            ctx.fillRect(0, CONFIG.groundY, canvas.width, canvas.height - CONFIG.groundY);
            
            // Grass line
            ctx.fillStyle = '#4CAF50';
            ctx.fillRect(0, CONFIG.groundY - 5, canvas.width, 10);
        }
    },
    
    drawPlatform() {
        if (Assets.platform.complete) {
            // Use tiling/pattern instead of stretching to prevent distortion
            const overflow = 20;
            const y = CONFIG.groundY - 38;
            const height = 300; // Enough to cover bottom
            
            const pattern = ctx.createPattern(Assets.platform, 'repeat');
            ctx.fillStyle = pattern;
            
            ctx.save();
            ctx.translate(-overflow, y); // Align pattern start
            ctx.fillRect(0, 0, canvas.width + (overflow * 2), height);
            ctx.restore();
        }
    },
    
    drawBaka() {
        const sprite = Assets.bakaLevels[Baka.level - 1];
        const spriteHeight = CONFIG.bakaHeight[Baka.level - 1] + 30;
        
        if (sprite && sprite.complete) {
            ctx.drawImage(
                sprite,
                Baka.x,
                CONFIG.groundY - spriteHeight,
                Baka.width,
                spriteHeight
            );
        } else {
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(
                Baka.x + 25,
                CONFIG.groundY - Baka.height,
                Baka.width - 50,
                Baka.height
            );
        }
    },
    
    drawPlayer() {
        let sprite;
        
        switch (GameState.state) {
            case 'running':
                Player.frameTimer++;
                if (Player.frameTimer >= Player.frameDelay) {
                    Player.frameTimer = 0;
                    Player.frameIndex = (Player.frameIndex + 1) % 4;
                }
                sprite = Assets.runningSprites[Player.frameIndex];
                break;
                
            case 'charging':
                const chargeIndex = Math.floor((GameState.chargeAngle - CONFIG.minAngle) / 15);
                sprite = Assets.jumpChargeSprites[Math.min(chargeIndex, 3)];
                break;
                
            case 'jumping':
                sprite = Assets.jumpChargeSprites[3];
                break;
                
            default:
                sprite = Assets.runningSprites[0];
        }
        
        if (sprite && sprite.complete) {
            ctx.drawImage(
                sprite,
                Player.x,
                Player.y - Player.height,
                Player.width,
                Player.height
            );
        } else {
            ctx.fillStyle = '#3498db';
            ctx.fillRect(Player.x, Player.y - Player.height, Player.width, Player.height);
        }
    },
    
    drawAngleIndicator() {
        if (GameState.state !== 'charging') return;
        
        ctx.save();
        
        // Warning shake and color
        let indicatorColor = 'rgba(255, 255, 255, 0.4)';
        if (GameState.chargeCycles >= 1) {
             const shake = (Date.now() % 100 < 50) ? 3 : -3; 
             ctx.translate(shake, 0);
             indicatorColor = '#ff4444'; // Red warning
        }
        
        ctx.translate(Player.x + Player.width / 2, Player.y - Player.height / 2);
        
        // Extended arc (20° to 80°)
        ctx.beginPath();
        ctx.arc(0, 0, 65, -Math.PI * (CONFIG.maxAngle / 180), -Math.PI * (CONFIG.minAngle / 180));
        ctx.strokeStyle = indicatorColor;
        ctx.lineWidth = 5;
        ctx.stroke();
        
        // Angle indicator line
        const angleRad = -GameState.chargeAngle * (Math.PI / 180);
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
    },
    
    drawBounceIndicator() {
        // Show indicator when player is above baka
        if (GameState.state === 'jumping' && 
            Player.x > Baka.x - 50 && 
            Player.x < Baka.x + Baka.width + 50) {
            
            const bakaCenterX = Baka.x + Baka.width / 2;
            const bakaTopY = CONFIG.groundY - Baka.height;
            const distY = Math.abs((Player.y + Player.height) - bakaTopY);
            
            // Draw target circle (static)
            ctx.beginPath();
            ctx.arc(bakaCenterX, bakaTopY, 50, 0, Math.PI * 2); // Larger target
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.lineWidth = 4;
            ctx.stroke();
            
            // Draw shrinking timing ring
            if (distY < 200) { // Show earlier
                const ringSize = Math.max(10, Math.min(80, distY / 2));
                ctx.beginPath();
                ctx.arc(bakaCenterX, bakaTopY, ringSize, 0, Math.PI * 2);
                
                // Color changes based on timing
                if (ringSize <= 30) {
                    ctx.strokeStyle = '#00ff00'; // Bright Green/Lime
                    ctx.lineWidth = 6;
                    ctx.shadowBlur = 10;
                    ctx.shadowColor = '#00ff00';
                    
                    // Show "PRESS!" text when in zone
                    ctx.fillStyle = '#00ff00';
                    ctx.font = 'bold 24px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText('PRESS NOW!', bakaCenterX, bakaTopY - 60);
                } else {
                    ctx.strokeStyle = '#ffff00'; // Bright Yellow
                    ctx.lineWidth = 4;
                    ctx.shadowBlur = 0;
                }
                ctx.stroke();
                ctx.shadowBlur = 0; // Reset shadow
            }
        }
    },
    
    drawInstructions() {
        if (GameState.state === 'idle') {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            ctx.fillRect(canvas.width / 2 - 220, canvas.height - 85, 440, 55);
            
            ctx.fillStyle = 'white';
            ctx.font = '20px Nunito';
            ctx.textAlign = 'center';
            ctx.fillText('Press SPACE or CLICK to start running!', canvas.width / 2, canvas.height - 52);
        }
    },
    
    render() {
        this.clear();
        this.drawBackground();
        this.drawPlatform();
        this.drawBaka();
        this.drawPlayer();
        this.drawBounceIndicator();
        this.drawAngleIndicator();
        this.drawInstructions();
    }
};

// Make available globally
window.Rendering = Rendering;
