document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const difficultyScreen = document.getElementById('difficulty-screen');
    const easyBtn = document.getElementById('easy-btn');
    const normalBtn = document.getElementById('normal-btn');
    const hardBtn = document.getElementById('hard-btn');

    canvas.width = 800;
    canvas.height = 400;

    // --- Game Constants ---
    const GRAVITY = 0.5;
    const RUN_SPEED = 3;
    const JUMP_VELOCITY = 15;
    const PLAYER_SIZE = 30;
    const GROUND_Y = canvas.height - 50;

    // --- Game State ---
    let gameState = 'idle'; // idle, running, charging, jumping, success, fault
    let level = 1;
    let chargeAngle = 20;
    let angleDirection = 1; // 1 for increasing, -1 for decreasing
    let angleSpeed = 5; // Default to normal
    let message = '';
    let messageTimer = 0;

    // --- Game Objects ---
    const player = {
        x: 50,
        y: GROUND_Y - PLAYER_SIZE,
        width: PLAYER_SIZE,
        height: PLAYER_SIZE,
        color: 'blue',
        vx: 0,
        vy: 0
    };

    const obstacle = {
        x: canvas.width - 200,
        baseWidth: 50,
        baseHeight: 20,
        color: 'red',
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
        ctx.beginPath();
        ctx.moveTo(0, GROUND_Y);
        ctx.lineTo(canvas.width, GROUND_Y);
        ctx.strokeStyle = 'green';
        ctx.lineWidth = 4;
        ctx.stroke();
    }

    function drawPlayer() {
        ctx.fillStyle = player.color;
        ctx.fillRect(player.x, player.y, player.width, player.height);
    }

    function drawObstacle() {
        ctx.fillStyle = obstacle.color;
        obstacle.stack.forEach(part => {
            ctx.fillRect(part.x, part.y, part.width, part.height);
        });
    }

    function drawAngleIndicator() {
        ctx.save();
        ctx.translate(player.x + player.width / 2, player.y + player.height / 2);

        // Draw protractor
        ctx.beginPath();
        ctx.arc(0, 0, 40, -Math.PI * (85 / 180), -Math.PI * (20 / 180));
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw angle line
        const angleRad = -chargeAngle * (Math.PI / 180);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(angleRad) * 40, Math.sin(angleRad) * 40);
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.restore();
    }

    function drawMessage() {
        if (messageTimer > 0) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(0, canvas.height / 2 - 50, canvas.width, 100);
            ctx.fillStyle = 'white';
            ctx.font = '30px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(message, canvas.width / 2, canvas.height / 2);
            messageTimer--;
        } else {
            message = '';
        }
    }

    // --- Game Logic & Physics ---
    function resetGame(isSuccess) {
        if (isSuccess) {
            level++;
        } else {
            level = 1;
        }
        player.x = 50;
        player.y = GROUND_Y - PLAYER_SIZE;
        player.vx = 0;
        player.vy = 0;
        player.color = 'blue';
        gameState = 'idle';
        buildObstacle();
    }

    function update() {
        // --- State Updates ---
        switch (gameState) {
            case 'running':
                player.x += player.vx;
                // Check for running into the obstacle
                if (player.x + player.width > obstacle.x) {
                    gameState = 'fault';
                    message = 'Fault! Too late to jump.';
                    messageTimer = 120; // 2 seconds
                    resetGame(false);
                }
                break;

            case 'charging':
                // Oscillate angle based on difficulty
                chargeAngle += angleDirection * angleSpeed;
                if (chargeAngle >= 85 || chargeAngle <= 20) {
                    angleDirection *= -1;
                }
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
                    player.color = 'gray';
                    message = 'Fault! Hit the hands.';
                    messageTimer = 120;
                    // No reset here, wait for message to finish
                }

                // Collision with ground
                if (player.y + player.height >= GROUND_Y) {
                    player.y = GROUND_Y - player.height;
                    // Check if successfully cleared
                    if (gameState === 'jumping') { // if not already faulted
                        if (player.x > obstacle.x + obstacle.baseWidth) {
                            gameState = 'success';
                            message = 'Success!';
                            messageTimer = 120;
                        } else {
                             // This case should ideally not be hit if collision works
                             gameState = 'fault';
                             message = 'Fault! Did not clear.';
                             messageTimer = 120;
                        }
                    }
                }
                break;
            
            case 'success':
                if (messageTimer === 1) { // On the last frame of the message
                    resetGame(true);
                }
                break;

            case 'fault':
                 if (messageTimer === 1) {
                    resetGame(false);
                }
                break;
        }


        // --- Drawing ---
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawGround();
        drawObstacle();
        drawPlayer();

        if (gameState === 'charging') {
            drawAngleIndicator();
        }

        drawMessage();

        requestAnimationFrame(update);
    }

    // --- Input Handlers ---
    let isInputDown = false;

    function handleInputDown() {
        if (isInputDown) return;
        isInputDown = true;

        if (gameState === 'running') {
            gameState = 'charging';
            player.vx = 0; // Stop horizontal movement
        }
    }

    function handleInputUp() {
        if (!isInputDown) return;
        isInputDown = false;

        if (gameState === 'idle') {
            gameState = 'running';
            player.vx = RUN_SPEED;
        } else if (gameState === 'charging') {
            gameState = 'jumping';
            // Launch the player
            const angleRad = chargeAngle * (Math.PI / 180);
            player.vx = Math.cos(angleRad) * JUMP_VELOCITY;
            player.vy = -Math.sin(angleRad) * JUMP_VELOCITY; // Negative for upward direction
        }
    }

    // --- Difficulty Selection ---
    function startGame(difficulty) {
        switch (difficulty) {
            case 'easy':
                angleSpeed = 3;
                break;
            case 'normal':
                angleSpeed = 5;
                break;
            case 'hard':
                angleSpeed = 8;
                break;
        }
        difficultyScreen.style.display = 'none';
        canvas.style.display = 'block';

        // Event Listeners for game
        window.addEventListener('keydown', (e) => {
            if (e.code === 'Space') handleInputDown();
        });
        window.addEventListener('keyup', (e) => {
            if (e.code === 'Space') handleInputUp();
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
