document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const modeScreen = document.getElementById('mode-screen');
    const difficultyScreen = document.getElementById('difficulty-screen');
    const targetModeBtn = document.getElementById('target-mode-btn');
    const circleModeBtn = document.getElementById('circle-mode-btn');
    const holeModeBtn = document.getElementById('hole-mode-btn');
    const tumbangModeBtn = document.getElementById('tumbang-mode-btn');
    const lineModeBtn = document.getElementById('line-mode-btn');
    const backToModesBtn = document.getElementById('back-to-modes-btn');
    const modeTitleDisplay = document.getElementById('mode-title-display');
    const easyBtn = document.getElementById('easy-btn');
    const normalBtn = document.getElementById('normal-btn');
    const hardBtn = document.getElementById('hard-btn');
    const powerGauge = document.getElementById('power-gauge');
    const powerIndicator = document.getElementById('power-indicator');
    const levelDisplay = document.getElementById('level-number');
    const scoreDisplay = document.getElementById('score-display');
    const targetsLeftDisplay = document.getElementById('targets-left');
    const instructionPrompt = document.getElementById('instruction-prompt');
    const helpBtn = document.getElementById('help-btn');
    const helpModal = document.getElementById('help-modal');
    const closeModal = document.querySelector('.close');

    canvas.width = 1280;
    canvas.height = 720;

    // --- Game Mode ---
    let gameMode = 'target'; // target, circle, hole, tumbang, line

    // --- Game Constants ---
    const FRICTION = 0.98;
    const MARBLE_RADIUS = 12;
    const PLAYER_COLOR = '#2196F3';
    const TARGET_COLOR = '#f44336';
    const MAX_DRAG_DISTANCE = 150;
    const POWER_MULTIPLIER = 0.15;
    const COLLISION_ELASTICITY = 0.8;
    const CIRCLE_RADIUS = 220;

    // --- Game State ---
    let gameState = 'idle'; // idle, dragging, shooting, success, gameOver
    let level = 1;
    let score = 0;
    let message = '';
    let messageTimer = 0;
    let isDragging = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let dragCurrentX = 0;
    let dragCurrentY = 0;

    // --- Game Objects ---
    const playerMarble = {
        x: canvas.width / 2,
        y: canvas.height - 100,
        radius: MARBLE_RADIUS,
        vx: 0,
        vy: 0,
        color: PLAYER_COLOR,
        isMoving: false
    };

    let targetMarbles = [];
    let holes = [];
    let tumbangTarget = null;
    let lineMarbles = [];
    let circleCenter = { x: canvas.width / 2, y: canvas.height / 2 - 50 };
    let startingPosition = { x: canvas.width / 2, y: canvas.height - 100 };

    // --- Helper Functions ---
    function distance(x1, y1, x2, y2) {
        return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    }

    function resetPlayerMarble() {
        playerMarble.x = startingPosition.x;
        playerMarble.y = startingPosition.y;
        playerMarble.vx = 0;
        playerMarble.vy = 0;
        playerMarble.isMoving = false;
    }

    function stopPlayerMarble() {
        // Keep marble at current position
        playerMarble.vx = 0;
        playerMarble.vy = 0;
        playerMarble.isMoving = false;
    }

    function createTargetMarbles() {
        targetMarbles = [];
        
        if (gameMode === 'target') {
            // Target Shooting: Scatter marbles across play area
            const numTargets = level + 3;
            const margin = 80;
            const usableWidth = canvas.width - 2 * margin;
            const usableHeight = canvas.height / 2 - margin;

            for (let i = 0; i < numTargets; i++) {
                let x, y, overlapping;
                let attempts = 0;
                
                do {
                    overlapping = false;
                    x = margin + Math.random() * usableWidth;
                    y = margin + Math.random() * usableHeight;
                    
                    for (let other of targetMarbles) {
                        if (distance(x, y, other.x, other.y) < MARBLE_RADIUS * 4) {
                            overlapping = true;
                            break;
                        }
                    }
                    attempts++;
                } while (overlapping && attempts < 50);

                targetMarbles.push({
                    x: x,
                    y: y,
                    radius: MARBLE_RADIUS,
                    vx: 0,
                    vy: 0,
                    color: TARGET_COLOR,
                    hit: false
                });
            }
        } else if (gameMode === 'circle') {
            // Circle Game: Place marbles inside circle
            const numTargets = level + 4;
            const innerRadius = CIRCLE_RADIUS - 40;
            
            for (let i = 0; i < numTargets; i++) {
                const angle = Math.random() * Math.PI * 2;
                const dist = Math.random() * (innerRadius - MARBLE_RADIUS * 2);
                const x = circleCenter.x + Math.cos(angle) * dist;
                const y = circleCenter.y + Math.sin(angle) * dist;
                
                targetMarbles.push({
                    x: x,
                    y: y,
                    radius: MARBLE_RADIUS,
                    vx: 0,
                    vy: 0,
                    color: TARGET_COLOR,
                    hit: false,
                    outOfCircle: false
                });
            }
        } else if (gameMode === 'line') {
            // Line Game: Scatter marbles randomly (must hit in numbered sequence)
            const numTargets = level + 2;
            const margin = 100;
            const usableWidth = canvas.width - 2 * margin;
            const usableHeight = canvas.height / 2 - margin;
            
            for (let i = 0; i < numTargets; i++) {
                let x, y, overlapping;
                let attempts = 0;
                
                do {
                    overlapping = false;
                    x = margin + Math.random() * usableWidth;
                    y = margin + Math.random() * usableHeight;
                    
                    for (let other of targetMarbles) {
                        if (distance(x, y, other.x, other.y) < MARBLE_RADIUS * 4) {
                            overlapping = true;
                            break;
                        }
                    }
                    attempts++;
                } while (overlapping && attempts < 50);
                
                targetMarbles.push({
                    x: x,
                    y: y,
                    radius: MARBLE_RADIUS,
                    vx: 0,
                    vy: 0,
                    color: TARGET_COLOR,
                    hit: false,
                    hitOrder: i
                });
            }
        } else if (gameMode === 'tumbang') {
            // Tumbang Preso: Single target to knock down
            tumbangTarget = {
                x: canvas.width / 2,
                y: canvas.height / 3,
                width: 20,
                height: 70,
                color: '#FF9800',
                knocked: false,
                angle: 0
            };
        }
    }

    function createHoles() {
        holes = [];
        if (gameMode === 'hole') {
            const numHoles = Math.min(level + 1, 5);
            const margin = 120;
            const usableWidth = canvas.width - 2 * margin;
            const usableHeight = canvas.height / 2 - margin;
            
            for (let i = 0; i < numHoles; i++) {
                let x, y, overlapping;
                let attempts = 0;
                
                do {
                    overlapping = false;
                    x = margin + Math.random() * usableWidth;
                    y = margin + Math.random() * usableHeight;
                    
                    for (let other of holes) {
                        if (distance(x, y, other.x, other.y) < 100) {
                            overlapping = true;
                            break;
                        }
                    }
                    attempts++;
                } while (overlapping && attempts < 50);
                
                holes.push({
                    x: x,
                    y: y,
                    radius: 20,
                    filled: false
                });
            }
        }
    }

    function resetGame(isSuccess) {
        if (isSuccess) {
            level++;
            score += 100 * level;
        } else {
            level = 1;
            score = 0;
        }
        
        levelDisplay.textContent = level;
        scoreDisplay.textContent = score;
        resetPlayerMarble();
        createTargetMarbles();
        createHoles();
        updateTargetsLeft();
        gameState = 'idle';
        isDragging = false;
        instructionPrompt.style.display = 'block';
    }

    function updateTargetsLeft() {
        let activeTargets = 0;
        
        if (gameMode === 'target') {
            activeTargets = targetMarbles.filter(m => !m.hit).length;
        } else if (gameMode === 'circle') {
            activeTargets = targetMarbles.filter(m => !m.outOfCircle).length;
        } else if (gameMode === 'hole') {
            activeTargets = holes.filter(h => !h.filled).length;
        } else if (gameMode === 'tumbang') {
            activeTargets = tumbangTarget && !tumbangTarget.knocked ? 1 : 0;
        } else if (gameMode === 'line') {
            activeTargets = targetMarbles.filter(m => !m.hit).length;
        }
        
        targetsLeftDisplay.textContent = activeTargets;
    }

    // --- Physics ---
    function checkMarbleCollision(m1, m2) {
        const dx = m2.x - m1.x;
        const dy = m2.y - m1.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < m1.radius + m2.radius) {
            // Collision detected
            const angle = Math.atan2(dy, dx);
            const sin = Math.sin(angle);
            const cos = Math.cos(angle);
            
            // Rotate velocities
            const vx1 = m1.vx * cos + m1.vy * sin;
            const vy1 = m1.vy * cos - m1.vx * sin;
            const vx2 = m2.vx * cos + m2.vy * sin;
            const vy2 = m2.vy * cos - m2.vx * sin;
            
            // Exchange velocities with elasticity
            const temp = vx1;
            m1.vx = (vx2 * COLLISION_ELASTICITY) * cos - vy1 * sin;
            m1.vy = vy1 * cos + (vx2 * COLLISION_ELASTICITY) * sin;
            m2.vx = (temp * COLLISION_ELASTICITY) * cos - vy2 * sin;
            m2.vy = vy2 * cos + (temp * COLLISION_ELASTICITY) * sin;
            
            // Separate marbles
            const overlap = (m1.radius + m2.radius - dist) / 2;
            const separateX = overlap * cos;
            const separateY = overlap * sin;
            
            m1.x -= separateX;
            m1.y -= separateY;
            m2.x += separateX;
            m2.y += separateY;
            
            return true;
        }
        return false;
    }

    function updateMarble(marble) {
        // Apply friction
        marble.vx *= FRICTION;
        marble.vy *= FRICTION;
        
        // Update position
        marble.x += marble.vx;
        marble.y += marble.vy;
        
        // Wall collisions
        if (marble.x - marble.radius < 0) {
            marble.x = marble.radius;
            marble.vx *= -COLLISION_ELASTICITY;
        }
        if (marble.x + marble.radius > canvas.width) {
            marble.x = canvas.width - marble.radius;
            marble.vx *= -COLLISION_ELASTICITY;
        }
        if (marble.y - marble.radius < 0) {
            marble.y = marble.radius;
            marble.vy *= -COLLISION_ELASTICITY;
        }
        if (marble.y + marble.radius > canvas.height) {
            marble.y = canvas.height - marble.radius;
            marble.vy *= -COLLISION_ELASTICITY;
        }
        
        // Check if stopped
        if (Math.abs(marble.vx) < 0.1 && Math.abs(marble.vy) < 0.1) {
            marble.vx = 0;
            marble.vy = 0;
            return false; // Not moving
        }
        return true; // Still moving
    }

    // --- Drawing Functions ---
    function drawMarble(marble, glow = false) {
        ctx.save();
        
        // Draw glow effect
        if (glow) {
            ctx.shadowBlur = 20;
            ctx.shadowColor = marble.color;
        }
        
        // Draw marble body
        const gradient = ctx.createRadialGradient(
            marble.x - marble.radius / 3, 
            marble.y - marble.radius / 3, 
            marble.radius / 4,
            marble.x, 
            marble.y, 
            marble.radius
        );
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
        gradient.addColorStop(0.4, marble.color);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.5)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(marble.x, marble.y, marble.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.beginPath();
        ctx.arc(marble.x - marble.radius / 3, marble.y - marble.radius / 3, marble.radius / 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw outline
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(marble.x, marble.y, marble.radius, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.restore();
    }

    function drawCircle() {
        if (gameMode !== 'circle') return;
        
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.lineWidth = 4;
        ctx.setLineDash([10, 10]);
        ctx.beginPath();
        ctx.arc(circleCenter.x, circleCenter.y, CIRCLE_RADIUS, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
    }

    function drawHoles() {
        if (gameMode !== 'hole') return;
        
        holes.forEach(hole => {
            ctx.save();
            
            // Draw hole shadow
            const gradient = ctx.createRadialGradient(
                hole.x, hole.y, 0,
                hole.x, hole.y, hole.radius
            );
            
            if (hole.filled) {
                gradient.addColorStop(0, 'rgba(33, 150, 243, 0.8)');
                gradient.addColorStop(1, 'rgba(33, 150, 243, 0.3)');
            } else {
                gradient.addColorStop(0, 'rgba(0, 0, 0, 0.8)');
                gradient.addColorStop(1, 'rgba(0, 0, 0, 0.3)');
            }
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(hole.x, hole.y, hole.radius, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw hole rim
            ctx.strokeStyle = hole.filled ? '#2196F3' : '#654321';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(hole.x, hole.y, hole.radius, 0, Math.PI * 2);
            ctx.stroke();
            
            ctx.restore();
        });
    }

    function drawTumbangTarget() {
        if (gameMode !== 'tumbang' || !tumbangTarget) return;
        
        ctx.save();
        ctx.translate(tumbangTarget.x, tumbangTarget.y);
        ctx.rotate(tumbangTarget.angle);
        
        // Draw target (can/cylinder)
        const gradient = ctx.createLinearGradient(
            -tumbangTarget.width / 2, 0,
            tumbangTarget.width / 2, 0
        );
        gradient.addColorStop(0, '#E65100');
        gradient.addColorStop(0.5, tumbangTarget.color);
        gradient.addColorStop(1, '#E65100');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(
            -tumbangTarget.width / 2,
            -tumbangTarget.height / 2,
            tumbangTarget.width,
            tumbangTarget.height
        );
        
        // Draw outline
        ctx.strokeStyle = '#BF360C';
        ctx.lineWidth = 3;
        ctx.strokeRect(
            -tumbangTarget.width / 2,
            -tumbangTarget.height / 2,
            tumbangTarget.width,
            tumbangTarget.height
        );
        
        // Draw bands
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-tumbangTarget.width / 2, -10);
        ctx.lineTo(tumbangTarget.width / 2, -10);
        ctx.moveTo(-tumbangTarget.width / 2, 10);
        ctx.lineTo(tumbangTarget.width / 2, 10);
        ctx.stroke();
        
        ctx.restore();
    }

    function drawLineNumbers() {
        if (gameMode !== 'line') return;
        
        targetMarbles.forEach((marble, index) => {
            if (!marble.hit) {
                ctx.save();
                ctx.fillStyle = 'white';
                ctx.strokeStyle = 'black';
                ctx.lineWidth = 3;
                ctx.font = 'bold 20px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                const text = (index + 1).toString();
                ctx.strokeText(text, marble.x, marble.y);
                ctx.fillText(text, marble.x, marble.y);
                ctx.restore();
            }
        });
    }

    function drawDragLine() {
        if (!isDragging || gameState !== 'dragging') return;
        
        ctx.save();
        
        // Calculate drag vector
        const dx = dragCurrentX - playerMarble.x;
        const dy = dragCurrentY - playerMarble.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const clampedDistance = Math.min(distance, MAX_DRAG_DISTANCE);
        
        // Draw drag line (from marble to drag point)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.lineWidth = 4;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(playerMarble.x, playerMarble.y);
        ctx.lineTo(dragCurrentX, dragCurrentY);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Draw trajectory line (opposite direction - where marble will go)
        const trajectoryLength = clampedDistance * 1.5;
        const shootAngle = Math.atan2(-dy, -dx); // Opposite direction
        const endX = playerMarble.x + Math.cos(shootAngle) * trajectoryLength;
        const endY = playerMarble.y + Math.sin(shootAngle) * trajectoryLength;
        
        ctx.strokeStyle = 'rgba(255, 200, 0, 0.8)';
        ctx.lineWidth = 3;
        ctx.setLineDash([10, 5]);
        ctx.beginPath();
        ctx.moveTo(playerMarble.x, playerMarble.y);
        ctx.lineTo(endX, endY);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Draw arrow head
        ctx.fillStyle = 'rgba(255, 200, 0, 0.8)';
        ctx.beginPath();
        ctx.moveTo(endX, endY);
        ctx.lineTo(
            endX - 15 * Math.cos(shootAngle - Math.PI / 6),
            endY - 15 * Math.sin(shootAngle - Math.PI / 6)
        );
        ctx.lineTo(
            endX - 15 * Math.cos(shootAngle + Math.PI / 6),
            endY - 15 * Math.sin(shootAngle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fill();
        
        // Draw power indicator circle
        const powerPercent = (clampedDistance / MAX_DRAG_DISTANCE) * 100;
        ctx.strokeStyle = powerPercent > 75 ? '#f44336' : powerPercent > 50 ? '#FF9800' : '#4CAF50';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(playerMarble.x, playerMarble.y, playerMarble.radius + 5, 0, Math.PI * 2);
        ctx.stroke();
        
        // Draw power text
        ctx.fillStyle = 'white';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 3;
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const powerText = `${Math.round(powerPercent)}%`;
        ctx.strokeText(powerText, playerMarble.x, playerMarble.y - 30);
        ctx.fillText(powerText, playerMarble.x, playerMarble.y - 30);
        
        ctx.restore();
    }

    function drawMessage() {
        if (messageTimer > 0) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(0, canvas.height / 2 - 50, canvas.width, 100);
            ctx.fillStyle = 'white';
            ctx.font = 'bold 36px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(message, canvas.width / 2, canvas.height / 2 + 10);
            messageTimer--;
        } else {
            message = '';
        }
    }

    // --- Game Loop ---
    function update() {
        // Update marbles
        if (gameState === 'shooting') {
            let anyMoving = false;
            
            // Update player marble
            if (updateMarble(playerMarble)) {
                anyMoving = true;
            }
            
            // Update target marbles
            targetMarbles.forEach(target => {
                if (!target.hit && updateMarble(target)) {
                    anyMoving = true;
                }
            });
            
            // Game mode specific collision checks
            if (gameMode === 'target') {
                // Hit targets directly
                targetMarbles.forEach(target => {
                    if (!target.hit && checkMarbleCollision(playerMarble, target)) {
                        target.hit = true;
                        target.vx = 0;
                        target.vy = 0;
                        score += 10;
                        scoreDisplay.textContent = score;
                        updateTargetsLeft();
                    }
                });
            } else if (gameMode === 'circle') {
                // Check collisions between player and targets
                targetMarbles.forEach(target => {
                    if (!target.outOfCircle) {
                        checkMarbleCollision(playerMarble, target);
                    }
                });
                
                // Check if ANY marbles (after any collision) are now out of circle
                targetMarbles.forEach(target => {
                    if (!target.outOfCircle) {
                        const dist = distance(target.x, target.y, circleCenter.x, circleCenter.y);
                        if (dist > CIRCLE_RADIUS + target.radius) {
                            target.outOfCircle = true;
                            score += 15;
                            scoreDisplay.textContent = score;
                            updateTargetsLeft();
                        }
                    }
                });
            } else if (gameMode === 'hole') {
                // Check if player marble falls into holes
                holes.forEach(hole => {
                    if (!hole.filled) {
                        const dist = distance(playerMarble.x, playerMarble.y, hole.x, hole.y);
                        if (dist < hole.radius) {
                            hole.filled = true;
                            playerMarble.vx = 0;
                            playerMarble.vy = 0;
                            playerMarble.x = hole.x;
                            playerMarble.y = hole.y;
                            score += 20;
                            scoreDisplay.textContent = score;
                            updateTargetsLeft();
                        }
                    }
                });
            } else if (gameMode === 'tumbang') {
                // Check if target is knocked down
                if (tumbangTarget && !tumbangTarget.knocked) {
                    const dx = playerMarble.x - tumbangTarget.x;
                    const dy = playerMarble.y - tumbangTarget.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    
                    if (dist < playerMarble.radius + tumbangTarget.width / 2) {
                        tumbangTarget.knocked = true;
                        tumbangTarget.angle = Math.PI / 2;
                        score += 50;
                        scoreDisplay.textContent = score;
                        updateTargetsLeft();
                    }
                }
            } else if (gameMode === 'line') {
                // Hit marbles in sequence
                targetMarbles.forEach(target => {
                    if (!target.hit && checkMarbleCollision(playerMarble, target)) {
                        // Check if this is the next marble in sequence
                        const previousHit = target.hitOrder === 0 || 
                            targetMarbles[target.hitOrder - 1].hit;
                        
                        if (previousHit) {
                            target.hit = true;
                            target.vx = 0;
                            target.vy = 0;
                            score += 15 * (target.hitOrder + 1);
                            scoreDisplay.textContent = score;
                            updateTargetsLeft();
                        }
                    }
                });
            }
            
            // Check collisions between targets
            for (let i = 0; i < targetMarbles.length; i++) {
                for (let j = i + 1; j < targetMarbles.length; j++) {
                    if (gameMode === 'target' && !targetMarbles[i].hit && !targetMarbles[j].hit) {
                        checkMarbleCollision(targetMarbles[i], targetMarbles[j]);
                    } else if (gameMode === 'circle' && !targetMarbles[i].outOfCircle && !targetMarbles[j].outOfCircle) {
                        checkMarbleCollision(targetMarbles[i], targetMarbles[j]);
                    } else if (gameMode === 'line' && !targetMarbles[i].hit && !targetMarbles[j].hit) {
                        checkMarbleCollision(targetMarbles[i], targetMarbles[j]);
                    }
                }
            }
            
            // Check if level complete
            if (!anyMoving) {
                let levelComplete = false;
                
                if (gameMode === 'target') {
                    levelComplete = targetMarbles.every(m => m.hit);
                } else if (gameMode === 'circle') {
                    levelComplete = targetMarbles.every(m => m.outOfCircle);
                } else if (gameMode === 'hole') {
                    levelComplete = holes.every(h => h.filled);
                } else if (gameMode === 'tumbang') {
                    levelComplete = tumbangTarget && tumbangTarget.knocked;
                } else if (gameMode === 'line') {
                    levelComplete = targetMarbles.every(m => m.hit);
                }
                
                if (levelComplete) {
                    gameState = 'success';
                    message = 'Level Complete!';
                    messageTimer = 90;
                } else {
                    gameState = 'idle';
                    stopPlayerMarble();
                    instructionPrompt.style.display = 'block';
                }
            }
        }

        // Handle success
        if (gameState === 'success' && messageTimer === 1) {
            resetGame(true);
        }

        // --- Drawing ---
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw game mode specific elements
        drawCircle();
        drawHoles();
        drawTumbangTarget();
        
        // Draw target marbles
        targetMarbles.forEach(target => {
            if (gameMode === 'target' && !target.hit) {
                drawMarble(target);
            } else if (gameMode === 'circle' && !target.outOfCircle) {
                drawMarble(target);
            } else if (gameMode === 'line' && !target.hit) {
                drawMarble(target);
            }
        });
        
        // Draw line numbers
        drawLineNumbers();
        
        // Draw player marble
        drawMarble(playerMarble, gameState === 'idle' || gameState === 'dragging');
        
        // Draw drag line
        drawDragLine();
        
        // Draw message
        drawMessage();
        
        requestAnimationFrame(update);
    }

    // --- Input Handlers ---
    function getMousePos(e) {
        const rect = canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }

    function isMouseOnMarble(mouseX, mouseY) {
        const dx = mouseX - playerMarble.x;
        const dy = mouseY - playerMarble.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance <= playerMarble.radius + 10; // Extra tolerance
    }

    function handleMouseDown(e) {
        if (gameState !== 'idle') return;
        
        const pos = getMousePos(e);
        if (isMouseOnMarble(pos.x, pos.y)) {
            isDragging = true;
            dragStartX = pos.x;
            dragStartY = pos.y;
            dragCurrentX = pos.x;
            dragCurrentY = pos.y;
            gameState = 'dragging';
            instructionPrompt.style.display = 'none';
        }
    }

    function handleMouseMove(e) {
        if (!isDragging || gameState !== 'dragging') return;
        
        const pos = getMousePos(e);
        dragCurrentX = pos.x;
        dragCurrentY = pos.y;
    }

    function handleMouseUp(e) {
        if (!isDragging || gameState !== 'dragging') return;
        
        // Calculate shoot vector (opposite of drag)
        const dx = dragCurrentX - playerMarble.x;
        const dy = dragCurrentY - playerMarble.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 5) { // Minimum drag distance
            const clampedDistance = Math.min(distance, MAX_DRAG_DISTANCE);
            const power = clampedDistance * POWER_MULTIPLIER;
            
            // Shoot in opposite direction
            const angle = Math.atan2(-dy, -dx);
            playerMarble.vx = Math.cos(angle) * power;
            playerMarble.vy = Math.sin(angle) * power;
            playerMarble.isMoving = true;
            
            gameState = 'shooting';
        } else {
            gameState = 'idle';
            instructionPrompt.style.display = 'block';
        }
        
        isDragging = false;
    }

    function handleTouchStart(e) {
        e.preventDefault();
        if (gameState !== 'idle') return;
        
        const touch = e.touches[0];
        const pos = getMousePos(touch);
        if (isMouseOnMarble(pos.x, pos.y)) {
            isDragging = true;
            dragStartX = pos.x;
            dragStartY = pos.y;
            dragCurrentX = pos.x;
            dragCurrentY = pos.y;
            gameState = 'dragging';
            instructionPrompt.style.display = 'none';
        }
    }

    function handleTouchMove(e) {
        e.preventDefault();
        if (!isDragging || gameState !== 'dragging') return;
        
        const touch = e.touches[0];
        const pos = getMousePos(touch);
        dragCurrentX = pos.x;
        dragCurrentY = pos.y;
    }

    function handleTouchEnd(e) {
        e.preventDefault();
        if (!isDragging || gameState !== 'dragging') return;
        
        const dx = dragCurrentX - playerMarble.x;
        const dy = dragCurrentY - playerMarble.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 5) {
            const clampedDistance = Math.min(distance, MAX_DRAG_DISTANCE);
            const power = clampedDistance * POWER_MULTIPLIER;
            
            const angle = Math.atan2(-dy, -dx);
            playerMarble.vx = Math.cos(angle) * power;
            playerMarble.vy = Math.sin(angle) * power;
            playerMarble.isMoving = true;
            
            gameState = 'shooting';
        } else {
            gameState = 'idle';
            instructionPrompt.style.display = 'block';
        }
        
        isDragging = false;
    }

    // --- Modal Handlers ---
    helpBtn.addEventListener('click', () => {
        helpModal.style.display = 'block';
    });

    closeModal.addEventListener('click', () => {
        helpModal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
        if (e.target === helpModal) {
            helpModal.style.display = 'none';
        }
    });

    // --- Difficulty Selection ---
    function startGame(difficulty) {
        // Difficulty doesn't affect drag controls, but can affect other parameters
        difficultyScreen.style.display = 'none';
        document.getElementById('game-container').style.display = 'block';

        // Mouse input listeners
        canvas.addEventListener('mousedown', handleMouseDown);
        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('mouseup', handleMouseUp);
        
        // Touch input listeners for mobile
        canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
        canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
        canvas.addEventListener('touchend', handleTouchEnd, { passive: false });

        // Start game
        resetGame(true);
        update();
    }

    // --- Mode Selection ---
    function selectMode(mode, modeName) {
        gameMode = mode;
        modeScreen.style.display = 'none';
        difficultyScreen.style.display = 'flex';
        modeTitleDisplay.textContent = modeName;
    }

    targetModeBtn.addEventListener('click', () => selectMode('target', 'TARGET SHOOTING'));
    circleModeBtn.addEventListener('click', () => selectMode('circle', 'CIRCLE GAME'));
    holeModeBtn.addEventListener('click', () => selectMode('hole', 'HOLE GAME'));
    tumbangModeBtn.addEventListener('click', () => selectMode('tumbang', 'TUMBANG PRESO'));
    lineModeBtn.addEventListener('click', () => selectMode('line', 'LINE GAME'));

    backToModesBtn.addEventListener('click', () => {
        difficultyScreen.style.display = 'none';
        modeScreen.style.display = 'flex';
    });

    // --- Initial Setup ---
    easyBtn.addEventListener('click', () => startGame('easy'));
    normalBtn.addEventListener('click', () => startGame('normal'));
    hardBtn.addEventListener('click', () => startGame('hard'));
});
