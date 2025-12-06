document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const difficultyScreen = document.getElementById('difficulty-screen');
    const easyBtn = document.getElementById('easy-btn');
    const normalBtn = document.getElementById('normal-btn');
    const hardBtn = document.getElementById('hard-btn');
    const gaugesContainer = document.getElementById('gauges-container');
    const runSpeedBar = document.getElementById('run-speed-bar');
    const jumpPowerBar = document.getElementById('jump-power-bar');

    canvas.width = 800;
    canvas.height = 400;

    // --- Game Constants ---
    const GRAVITY = 0.5;
    const BASE_RUN_SPEED = 2;
    const BASE_JUMP_VELOCITY = 10;
    const PLAYER_SIZE = 30;
    const GROUND_Y = canvas.height - 50;

    // --- Game State ---
    let gameState = 'idle'; // idle, poweringRun, running, poweringJump, chargingAngle, jumping, success, fault
    let level = 1;
    let chargeAngle = 45;
    let angleDirection = 1; // 1 for increasing, -1 for decreasing
    let angleSpeed = 5; // Default to normal
    let message = '';
    let messageTimer = 0;
    let runSpeedPower = 0;
    let jumpPower = 0;
    let gaugeValue = 0;
    let gaugeSpeed = 5;
    let gaugeDirection = 1;

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

    function updateGauges() {
        if (gameState === 'poweringRun') {
            runSpeedBar.style.left = `${gaugeValue}%`;
        } else if (gameState === 'poweringJump') {
            jumpPowerBar.style.left = `${gaugeValue}%`;
        }
    }

    // --- Game Logic & Physics ---
    function resetGame(isSuccess) {
        if (isSuccess) {
            level++;
        } else {
            // on fail, reset to level 1
            level = 1;
        }
        player.x = 50;
        player.y = GROUND_Y - PLAYER_SIZE;
        player.vx = 0;
        player.vy = 0;
        player.color = 'blue';
        gameState = 'idle';
        gaugesContainer.style.display = 'none';
        runSpeedBar.style.left = '0%';
        jumpPowerBar.style.left = '0%';
        gaugeValue = 0;
        runSpeedPower = 0;
        jumpPower = 0;
        buildObstacle();
    }

    function update() {
        // --- State Updates ---
        switch (gameState) {
            case 'poweringRun':
            case 'poweringJump':
                gaugeValue += gaugeDirection * gaugeSpeed;
                if (gaugeValue >= 100 || gaugeValue <= 0) {
                    gaugeDirection *= -1;
                    // Ensure value stays within bounds
                    gaugeValue = Math.max(0, Math.min(100, gaugeValue));
                }
                updateGauges();
                break;

            case 'running':
                player.x += player.vx;
                // Check for running into the obstacle before jump is initiated
                if (player.x + player.width > obstacle.x) {
                    gameState = 'fault';
                    message = 'Fault! Too late to jump.';
                    messageTimer = 120; // 2 seconds
                }
                break;

            case 'chargingAngle':
                // Oscillate angle
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
                    message = 'Fault! Hit the obstacle.';
                    messageTimer = 120;
                }

                // Collision with ground after jump
                if (player.y + player.height >= GROUND_Y) {
                    player.y = GROUND_Y - player.height;
                    if (gameState === 'jumping') { 
                        if (player.x > obstacle.x + obstacle.baseWidth) {
                            gameState = 'success';
                            message = 'Success!';
                            messageTimer = 120;
                        } else {
                             gameState = 'fault';
                             message = 'Fault! Did not clear the obstacle.';
                             messageTimer = 120;
                        }
                    }
                }
                break;
            
            case 'success':
                if (messageTimer === 1) { 
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

        if (gameState === 'chargingAngle') {
            drawAngleIndicator();
        }

        drawMessage();

        requestAnimationFrame(update);
    }

    // --- Input Handlers ---
    function handleInput() {
        switch (gameState) {
            case 'idle':
                gameState = 'poweringRun';
                gaugeValue = 0;
                gaugeDirection = 1;
                gaugesContainer.style.display = 'flex';
                runSpeedBar.style.left = '0%';
                jumpPowerBar.style.left = '0%';
                break;
            case 'poweringRun':
                runSpeedPower = gaugeValue;
                gameState = 'running';
                player.vx = BASE_RUN_SPEED + (runSpeedPower / 100) * BASE_RUN_SPEED;
                break;
            case 'running':
                gameState = 'poweringJump';
                player.vx = 0; // Stop running to power up jump
                gaugeValue = 0;
                gaugeDirection = 1;
                break;
            case 'poweringJump':
                jumpPower = gaugeValue;
                gameState = 'chargingAngle';
                break;
            case 'chargingAngle':
                gameState = 'jumping';
                const angleRad = chargeAngle * (Math.PI / 180);
                const totalJumpVelocity = BASE_JUMP_VELOCITY + (jumpPower / 100) * BASE_JUMP_VELOCITY;
                // Carry over some momentum from the run
                const runMomentum = (runSpeedPower / 100) * BASE_RUN_SPEED;
                player.vx = Math.cos(angleRad) * totalJumpVelocity + runMomentum;
                player.vy = -Math.sin(angleRad) * totalJumpVelocity;
                gaugesContainer.style.display = 'none';
                break;
        }
    }


    // --- Difficulty Selection ---
    function startGame(difficulty) {
        switch (difficulty) {
            case 'easy':
                angleSpeed = 3;
                gaugeSpeed = 3;
                break;
            case 'normal':
                angleSpeed = 5;
                gaugeSpeed = 5;
                break;
            case 'hard':
                angleSpeed = 8;
                gaugeSpeed = 7;
                break;
        }
        difficultyScreen.style.display = 'none';
        canvas.style.display = 'block';

        // A single event listener for all game inputs
        let inputHandled = false;
        window.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && !inputHandled) {
                e.preventDefault();
                handleInput();
                inputHandled = true;
            }
        });
         window.addEventListener('keyup', (e) => {
            if (e.code === 'Space') {
                inputHandled = false;
            }
        });
        canvas.addEventListener('mousedown', () => {
             if (!inputHandled) {
                handleInput();
                inputHandled = true;
            }
        });
        canvas.addEventListener('mouseup', () => {
            inputHandled = false;
        });


        // --- Start Game ---
        resetGame(true); // Initial setup for level 1
        update();
    }

    // --- Initial Setup ---
    easyBtn.addEventListener('click', () => startGame('easy'));
    normalBtn.addEventListener('click', () => startGame('normal'));
    hardBtn.addEventListener('click', () => startGame('hard'));
});
