document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const difficultyScreen = document.getElementById('difficulty-screen');
    const gameContainer = document.getElementById('game-container');
    const easyBtn = document.getElementById('easy-btn');
    const normalBtn = document.getElementById('normal-btn');
    const hardBtn = document.getElementById('hard-btn');

    // UI Elements
    const levelDisplay = document.getElementById('level-display');
    const scoreDisplay = document.getElementById('score-display');
    const timingBarContainer = document.getElementById('timing-bar-container');
    const timingBarFill = document.getElementById('timing-bar-fill');
    const timingBarIndicator = document.getElementById('timing-bar-indicator');

    canvas.width = 800;
    canvas.height = 400;

    // --- Game Constants ---
    const GRAVITY = 0.5;
    const RUN_SPEED = 3;
    const PLAYER_SIZE = 30;
    const GROUND_Y = canvas.height - 50;

    // --- Game State ---
    let gameState = 'idle'; // idle, running, charging, jumping, success, fault
    let level = 1;
    let score = 0;
    let powerLevel = 0; // 0-100
    let powerDirection = 1; // 1 for increasing, -1 for decreasing
    let powerSpeed = 1.5; // Default to normal
    let message = '';
    let messageTimer = 0;

    // --- Game Objects ---
    const player = {
        x: 50,
        y: GROUND_Y - PLAYER_SIZE,
        width: PLAYER_SIZE,
        height: PLAYER_SIZE,
        color: '#4A90E2',
        vx: 0,
        vy: 0
    };

    const obstacle = {
        x: canvas.width - 200,
        baseWidth: 50,
        baseHeight: 20,
        color: '#E74C3C',
        stack: []
    };

    function buildObstacle() {
        obstacle.stack = [];
        for (let i = 0; i < level; i++) {
            obstacle.stack.push({
                x: obstacle.x,
                y: GROUND_Y - (i + 1) * obstacle.baseHeight,
                width: obstacle.baseWidth,
                height: obstacle.baseHeight
            });
        }
    }

    // --- Drawing Functions ---
    function drawGround() {
        // Draw grass
        ctx.fillStyle = '#2ECC71';
        ctx.fillRect(0, GROUND_Y, canvas.width, canvas.height - GROUND_Y);

        // Draw ground line
        ctx.beginPath();
        ctx.moveTo(0, GROUND_Y);
        ctx.lineTo(canvas.width, GROUND_Y);
        ctx.strokeStyle = '#27AE60';
        ctx.lineWidth = 4;
        ctx.stroke();
    }

    function drawPlayer() {
        // Draw shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.beginPath();
        ctx.ellipse(
            player.x + player.width / 2,
            GROUND_Y + 5,
            player.width / 2,
            5,
            0,
            0,
            Math.PI * 2
        );
        ctx.fill();

        // Draw player body
        ctx.fillStyle = player.color;
        ctx.fillRect(player.x, player.y, player.width, player.height);

        // Draw player outline
        ctx.strokeStyle = '#2C3E50';
        ctx.lineWidth = 2;
        ctx.strokeRect(player.x, player.y, player.width, player.height);

        // Draw eyes
        ctx.fillStyle = '#fff';
        ctx.fillRect(player.x + 8, player.y + 8, 6, 6);
        ctx.fillRect(player.x + 16, player.y + 8, 6, 6);

        ctx.fillStyle = '#000';
        ctx.fillRect(player.x + 10, player.y + 10, 3, 3);
        ctx.fillRect(player.x + 18, player.y + 10, 3, 3);
    }

    function drawObstacle() {
        obstacle.stack.forEach((part, index) => {
            // Draw hand/obstacle
            ctx.fillStyle = obstacle.color;
            ctx.fillRect(part.x, part.y, part.width, part.height);

            // Draw outline
            ctx.strokeStyle = '#C0392B';
            ctx.lineWidth = 2;
            ctx.strokeRect(part.x, part.y, part.width, part.height);

            // Draw hand details
            ctx.fillStyle = '#C0392B';
            for (let i = 0; i < 4; i++) {
                ctx.fillRect(part.x + 5 + i * 10, part.y + 5, 3, 10);
            }
        });

        // Draw level indicator above obstacle
        ctx.fillStyle = '#2C3E50';
        ctx.font = 'bold 16px Poppins, Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`Level ${level}`, obstacle.x + obstacle.baseWidth / 2, obstacle.stack[0].y - 20);
    }

    function drawMessage() {
        if (messageTimer > 0) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(0, canvas.height / 2 - 60, canvas.width, 120);

            ctx.fillStyle = message.includes('Success') ? '#2ECC71' : '#E74C3C';
            ctx.font = 'bold 40px Poppins, Arial';
            ctx.textAlign = 'center';
            ctx.fillText(message, canvas.width / 2, canvas.height / 2);

            if (message.includes('Success')) {
                ctx.fillStyle = '#fff';
                ctx.font = '20px Poppins, Arial';
                ctx.fillText(`+${level * 10} points!`, canvas.width / 2, canvas.height / 2 + 40);
            }

            messageTimer--;
        } else {
            message = '';
        }
    }

    // --- Power Bar Functions ---
    function updatePowerBar() {
        if (gameState === 'charging') {
            // Oscillate power level
            powerLevel += powerDirection * powerSpeed;

            if (powerLevel >= 100) {
                powerLevel = 100;
                powerDirection = -1;
            } else if (powerLevel <= 0) {
                powerLevel = 0;
                powerDirection = 1;
            }

            // Update UI
            timingBarFill.style.width = powerLevel + '%';
            timingBarIndicator.style.left = powerLevel + '%';
        }
    }

    function getPowerZone() {
        if (powerLevel <= 30) return 'weak';
        if (powerLevel <= 70) return 'good';
        return 'perfect';
    }

    function calculateJumpVelocity() {
        // Map power level (0-100) to jump velocity
        // Weak: 8-12, Good: 12-16, Perfect: 16-20
        const minVelocity = 8;
        const maxVelocity = 20;
        return minVelocity + (powerLevel / 100) * (maxVelocity - minVelocity);
    }

    // --- Game Logic & Physics ---
    function resetGame(isSuccess) {
        if (isSuccess) {
            level++;
            score += level * 10;
            levelDisplay.textContent = level;
            scoreDisplay.textContent = score;
        } else {
            level = 1;
            score = 0;
            levelDisplay.textContent = level;
            scoreDisplay.textContent = score;
        }

        player.x = 50;
        player.y = GROUND_Y - PLAYER_SIZE;
        player.vx = 0;
        player.vy = 0;
        player.color = '#4A90E2';
        gameState = 'idle';
        powerLevel = 0;
        powerDirection = 1;
        buildObstacle();

        // Hide timing bar
        timingBarContainer.style.display = 'none';
    }

    function update() {
        // --- State Updates ---
        switch (gameState) {
            case 'running':
                player.x += player.vx;
                // Check for running into the obstacle
                if (player.x + player.width > obstacle.x) {
                    gameState = 'fault';
                    message = 'Too Late! 😢';
                    messageTimer = 120; // 2 seconds
                    setTimeout(() => resetGame(false), 2000);
                }
                break;

            case 'charging':
                updatePowerBar();
                break;

            case 'jumping':
                // Apply physics
                player.x += player.vx;
                player.y += player.vy;
                player.vy += GRAVITY;

                // Collision with obstacle
                let hit = false;
                obstacle.stack.forEach(part => {
                    if (
                        player.x < part.x + part.width &&
                        player.x + player.width > part.x &&
                        player.y < part.y + part.height &&
                        player.y + player.height > part.y
                    ) {
                        hit = true;
                    }
                });

                if (hit) {
                    gameState = 'fault';
                    player.color = '#95A5A6';
                    message = 'Hit the Hands! 💥';
                    messageTimer = 120;
                    setTimeout(() => resetGame(false), 2000);
                }

                // Collision with ground
                if (player.y + player.height >= GROUND_Y) {
                    player.y = GROUND_Y - player.height;
                    player.vy = 0;

                    // Check if successfully cleared
                    if (gameState === 'jumping') {
                        if (player.x > obstacle.x + obstacle.baseWidth) {
                            gameState = 'success';
                            message = 'Success! 🎉';
                            messageTimer = 120;
                            setTimeout(() => resetGame(true), 2000);
                        } else {
                            gameState = 'fault';
                            message = 'Didn\'t Clear! 😔';
                            messageTimer = 120;
                            setTimeout(() => resetGame(false), 2000);
                        }
                    }
                }
                break;
        }

        // --- Drawing ---
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawGround();
        drawObstacle();
        drawPlayer();
        drawMessage();

        requestAnimationFrame(update);
    }

    // --- Input Handlers ---
    let isInputDown = false;

    function handleInputDown() {
        if (isInputDown) return;
        isInputDown = true;

        if (gameState === 'idle') {
            gameState = 'running';
            player.vx = RUN_SPEED;
        } else if (gameState === 'running') {
            gameState = 'charging';
            player.vx = 0; // Stop horizontal movement
            powerLevel = 0;
            powerDirection = 1;
            timingBarContainer.style.display = 'block';
        }
    }

    function handleInputUp() {
        if (!isInputDown) return;
        isInputDown = false;

        if (gameState === 'charging') {
            gameState = 'jumping';
            timingBarContainer.style.display = 'none';

            // Launch the player based on power level
            const jumpVelocity = calculateJumpVelocity();
            const angle = 60; // Fixed angle, power determines strength
            const angleRad = angle * (Math.PI / 180);

            player.vx = Math.cos(angleRad) * jumpVelocity;
            player.vy = -Math.sin(angleRad) * jumpVelocity;

            // Visual feedback based on power zone
            const zone = getPowerZone();
            if (zone === 'perfect') {
                player.color = '#2ECC71';
            } else if (zone === 'good') {
                player.color = '#F39C12';
            } else {
                player.color = '#E74C3C';
            }
        }
    }

    // --- Difficulty Selection ---
    function startGame(difficulty) {
        switch (difficulty) {
            case 'easy':
                powerSpeed = 1.0;
                break;
            case 'normal':
                powerSpeed = 1.5;
                break;
            case 'hard':
                powerSpeed = 2.5;
                break;
        }

        difficultyScreen.style.display = 'none';
        gameContainer.style.display = 'flex';

        // Event Listeners for game
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

        // --- Start Game ---
        resetGame(false); // Initial setup for level 1
        update();
    }

    easyBtn.addEventListener('click', () => startGame('easy'));
    normalBtn.addEventListener('click', () => startGame('normal'));
    hardBtn.addEventListener('click', () => startGame('hard'));
});
