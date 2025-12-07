// Game Configuration
const CONFIG = {
    runnerSpeed: 4,
    taggerSpeed: 2.5,
    fieldWidth: 100,
    botSpeed: 3.5
};

// Updated difficulties
const DIFFICULTY = {
    easy: { resp: 0.02, speed: 1, speedMult: 0.8 },
    medium: { resp: 0.05, speed: 3, speedMult: 1.0 },
    hard: { resp: 0.1, speed: 5, speedMult: 1.2 }
};

let selectedDifficulty = 'medium';
let gameActive = false;
let animationFrameId;

// Game Role State: 'runner' or 'tagger'
let currentRole = 'runner';
let initialRole = null; // Role determined by coin flip

// Timer and Game Phase
let gameTimer = 0; // No time limit - round ends when all runners are tagged
let timerInterval = null;
let gamePhase = 'first-round'; // 'first-round' or 'second-round'
let playerScore = 0; // Points earned by completing runs
let roundsCompleted = 0; // Track how many rounds have been completed

// Boost State (Player only)
let boost = {
    active: false,
    ready: true,
    cooldown: 5000,
    duration: 1500,
    multiplier: 1.5,
    lastUsed: 0
};

// Tagger Boost State (Player only)
let taggerBoost = {
    active: false,
    ready: true,
    cooldown: 5000,
    duration: 1500,
    multiplier: 2.0,
    lastUsed: 0
};

// Team Scoring
let playerTeamScore = 0;  // Score for player's team
let enemyTeamScore = 0;   // Score for enemy team

// Player Control State
let playerControlledRunner = null;  // Index of runner being controlled
let playerControlledTagger = null;  // Index of tagger being controlled

// Entities
let runners = [];
let taggers = [];
let keys = {
    ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false,
    w: false, a: false, s: false, d: false, ' ': false
};

function startGame(difficulty) {
    selectedDifficulty = difficulty || 'medium';

    // Highlight difficulty
    document.querySelectorAll('.runner-card').forEach(c => c.classList.remove('selected'));
    const chosen = document.getElementById(`diff-${selectedDifficulty}`);
    if (chosen) chosen.classList.add('selected');

    // Hide difficulty screen and show coin flip
    document.getElementById('difficultyScreen').style.display = 'none';
    document.getElementById('coinFlipScreen').style.display = 'block';

    // Perform coin flip after a short delay
    setTimeout(() => performCoinFlip(), 500);
}

function performCoinFlip() {
    const coin = document.getElementById('coin');
    const resultText = document.getElementById('coinResult');

    // Determine random role
    const isRunner = Math.random() < 0.5;
    initialRole = isRunner ? 'runner' : 'tagger';
    currentRole = initialRole;

    // Determine which side to show based on role
    const rotations = isRunner ? 0 : 180; // 0 = heads (runner), 180 = tails (tagger)

    // Animate coin flip
    coin.style.animation = 'none';
    setTimeout(() => {
        // Apply rotation based on result
        coin.style.transform = `rotateY(${rotations + 720}deg)`; // Add 720 for spinning effect
        coin.style.transition = 'transform 2s ease-out';

        // Show result after animation
        setTimeout(() => {
            resultText.textContent = `You will start as: ${initialRole.toUpperCase()}!`;
            resultText.style.color = initialRole === 'runner' ? '#4CAF50' : '#f44336';

            // Start game after showing result
            setTimeout(() => {
                document.getElementById('coinFlipScreen').style.display = 'none';
                document.getElementById('gameArea').classList.add('active');
                document.getElementById('boostMeter').classList.add('active');
                startRound();
            }, 2000);
        }, 2000);
    }, 50);
}

function startRound() {
    const field = document.getElementById('field');
    const fw = field.offsetWidth;
    const diff = DIFFICULTY[selectedDifficulty];
    CONFIG.taggerSpeed = diff.speed;

    // Initialize/Reset Timer (counting up for display purposes)
    gameTimer = 0;
    updateTimerDisplay();

    // Start timer counting up
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(updateTimer, 1000);

    // Update UI displays
    document.getElementById('myTeamScore').textContent = playerTeamScore;
    document.getElementById('enemyTeamScore').textContent = enemyTeamScore;
    document.getElementById('roleValue').textContent = currentRole.toUpperCase();

    // Reset Boost
    boost.ready = true;
    boost.active = false;
    taggerBoost.ready = true;
    taggerBoost.active = false;
    updateBoostUI();

    // Clear Entities
    document.querySelectorAll('.entity').forEach(e => e.remove());
    runners = [];
    taggers = [];

    // --- SETUP BASED ON ROLE ---
    if (currentRole === 'runner') {
        // Player is Runner [0], + 4 Bots = 5 Total Runners
        createRunner('player', fw / 2, 50);
        createRunner('bot', fw * 0.25, 50);
        createRunner('bot', fw * 0.4, 50);
        createRunner('bot', fw * 0.6, 50);
        createRunner('bot', fw * 0.75, 50);

        // 5 Bot Taggers
        createTagger(1, 'horizontal', field.offsetHeight * 0.2, diff, 'bot');
        createTagger(2, 'horizontal', field.offsetHeight * 0.4, diff, 'bot');
        createTagger(3, 'vertical', 0, diff, 'bot');
        createTagger(4, 'horizontal', field.offsetHeight * 0.6, diff, 'bot');
        createTagger(5, 'horizontal', field.offsetHeight * 0.8, diff, 'bot');

        updateStatus("ROLE: RUNNER - Complete runs to earn points!");

    } else {
        // Player is Vertical Tagger (Center), + 4 Bot Taggers = 5 Total Taggers
        createTagger(1, 'horizontal', field.offsetHeight * 0.2, diff, 'bot');
        createTagger(2, 'horizontal', field.offsetHeight * 0.4, diff, 'bot');
        createTagger(3, 'vertical', 0, diff, 'player'); // Player Controlled
        createTagger(4, 'horizontal', field.offsetHeight * 0.6, diff, 'bot');
        createTagger(5, 'horizontal', field.offsetHeight * 0.8, diff, 'bot');

        // 5 Bot Runners
        createRunner('bot', fw / 2, 50);
        createRunner('bot', fw * 0.25, 50);
        createRunner('bot', fw * 0.4, 50);
        createRunner('bot', fw * 0.6, 50);
        createRunner('bot', fw * 0.75, 50);

        updateStatus("ROLE: TAGGER - Stop them all!");
    }

    gameActive = true;
    gameLoop();
}

function updateStatus(msg) {
    // Optional: Add a status element to HTML if not present, or just log/toast
    // Let's create a temporary toast
    const toast = document.createElement('div');
    toast.style.position = 'absolute';
    toast.style.top = '20%';
    toast.style.left = '50%';
    toast.style.transform = 'translate(-50%, -50%)';
    toast.style.background = 'rgba(0,0,0,0.8)';
    toast.style.color = '#fff';
    toast.style.padding = '20px';
    toast.style.borderRadius = '10px';
    toast.style.fontSize = '24px';
    toast.style.fontWeight = 'bold';
    toast.style.zIndex = '1000';
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
}

function createRunner(type, x, y) {
    const field = document.getElementById('field');
    const runnerIndex = runners.length;
    const label = type === 'player' ? `R${runnerIndex + 1} (YOU)` : `R${runnerIndex + 1}`;

    const runner = {
        id: runnerIndex,
        type: type,
        x: x,
        y: y,
        active: true,
        reachedBottom: false,
        el: createEntity(type === 'player' ? 'entity runner' : 'entity runner bot', label, x, y)
    };

    if (type === 'player') {
        runner.el.style.border = '4px solid #FFD700'; // Gold border for player
        runner.el.style.zIndex = '20';
        playerControlledRunner = runnerIndex;
    } else {
        runner.el.style.filter = 'hue-rotate(180deg)';
    }

    field.appendChild(runner.el);
    runners.push(runner);
}

function createTagger(id, type, fixedPos, diff, controller) {
    const field = document.getElementById('field');
    const x = field.offsetWidth / 2;
    const y = type === 'vertical' ? field.offsetHeight / 2 : fixedPos;
    const label = controller === 'player' ? `T${id} (YOU)` : `T${id}`;

    const taggerObj = {
        id: id,
        type: type,
        controller: controller, // 'player' or 'bot'
        x: x,
        y: y,
        speed: diff.speed,
        baseSpeed: diff.speed,
        direction: Math.random() < 0.5 ? 1 : -1,
        fixedPos: fixedPos,
        resp: diff.resp,
        speedMult: diff.speedMult
    };

    // Visual distinction for Player Tagger if needed
    const className = controller === 'player' ? 'entity tagger player-tagger' : 'entity tagger';
    taggerObj.el = createEntity(className, label, x, y);

    if (controller === 'player') {
        taggerObj.el.style.border = '4px solid #FFD700'; // Gold border for player tagger
        taggerObj.el.style.zIndex = '20';
        playerControlledTagger = taggers.length; // Set index before pushing
    }

    field.appendChild(taggerObj.el);
    taggers.push(taggerObj);
}

function createEntity(className, labelText, x, y) {
    const div = document.createElement('div');
    div.className = className;
    div.style.left = `${x}px`;
    div.style.top = `${y}px`;

    // Add label if provided
    if (labelText) {
        const label = document.createElement('div');
        label.className = 'entity-label';
        label.textContent = labelText;
        label.style.position = 'absolute';
        label.style.top = '-25px';
        label.style.left = '50%';
        label.style.transform = 'translateX(-50%)';
        label.style.fontSize = '12px';
        label.style.fontWeight = 'bold';
        label.style.color = '#fff';
        label.style.background = 'rgba(0,0,0,0.7)';
        label.style.padding = '2px 6px';
        label.style.borderRadius = '3px';
        label.style.whiteSpace = 'nowrap';
        label.style.pointerEvents = 'none';
        div.appendChild(label);
    }

    return div;
}

// ... Boost functions remain similar ...
function activateBoost() {
    if (!gameActive) return;

    // Runner Boost
    if (currentRole === 'runner' && boost.ready) {
        boost.ready = false;
        boost.active = true;
        boost.lastUsed = Date.now();

        const player = runners.find(r => r.type === 'player');
        if (player && player.active) {
            player.el.style.boxShadow = '0 0 30px #00bcd4';
            player.el.style.borderColor = '#00bcd4';

            setTimeout(() => {
                boost.active = false;
                player.el.style.boxShadow = '';
                player.el.style.borderColor = '#FFD700';
            }, boost.duration);
        }
        setTimeout(() => { boost.ready = true; updateBoostUI(); }, boost.cooldown);
        updateBoostUI();
    }
    // Tagger Boost
    else if (currentRole === 'tagger' && taggerBoost.ready) {
        taggerBoost.ready = false;
        taggerBoost.active = true;
        taggerBoost.lastUsed = Date.now();

        const playerTagger = taggers[playerControlledTagger];
        if (playerTagger) {
            playerTagger.el.style.boxShadow = '0 0 30px #ff4444';
            playerTagger.el.style.borderColor = '#ff4444';

            setTimeout(() => {
                taggerBoost.active = false;
                playerTagger.el.style.boxShadow = '';
                playerTagger.el.style.borderColor = '#FFD700';
            }, taggerBoost.duration);
        }
        setTimeout(() => { taggerBoost.ready = true; updateBoostUI(); }, taggerBoost.cooldown);
        updateBoostUI();
    }
}

function updateBoostUI() {
    const fill = document.getElementById('boostFill');
    const container = document.getElementById('boostMeter');

    // Always show boost UI for both roles
    container.style.display = 'block';

    // Use appropriate boost state based on current role
    const currentBoost = currentRole === 'runner' ? boost : taggerBoost;
    const boostColor = currentRole === 'runner' ? '#00bcd4' : '#ff4444';

    if (currentBoost.ready) {
        fill.style.width = '100%';
        fill.style.backgroundColor = boostColor;
        container.classList.add('boost-ready');
    } else {
        fill.style.width = '0%';
        fill.style.backgroundColor = '#555';
        container.classList.remove('boost-ready');
        fill.style.transition = `width ${currentBoost.cooldown}ms linear`;
        void fill.offsetWidth;
        fill.style.width = '100%';
    }
}

function gameLoop() {
    if (!gameActive) return;

    if (keys[' ']) {
        if (boost.ready) activateBoost();
    }

    updateRunners();
    updateTaggers();
    checkCollisions();

    // Check if all runners are tagged
    const allRunnersTagged = runners.every(r => !r.active);
    if (allRunnersTagged && runners.length > 0) {
        // All runners tagged
        gameActive = false;
        clearInterval(timerInterval);
        roundsCompleted++;

        if (roundsCompleted === 1) {
            // First round complete - switch roles for second round
            showRoundModal(
                "ROUND 1 COMPLETE!",
                `${currentRole === 'runner' ? 'My Team' : 'Enemy Team'} scored ${currentRole === 'runner' ? playerTeamScore : enemyTeamScore} points!\n\nSwitching roles...`,
                () => {
                    switchRolesAfterTag();
                }
            );
        } else {
            // Both rounds complete - end game
            endGame();
        }
        return;
    }

    // Update character selection panel
    updateCharacterPanel();

    animationFrameId = requestAnimationFrame(gameLoop);
}

function updateRunners() {
    const field = document.getElementById('field');
    const fw = field.offsetWidth;
    const fh = field.offsetHeight;

    runners.forEach(r => {
        if (!r.active) return;

        let dx = 0, dy = 0;
        let speed = CONFIG.runnerSpeed;
        if (r.type === 'bot') speed = CONFIG.botSpeed;

        if (r.type === 'player') {
            // Player Movement
            if (boost.active) speed *= boost.multiplier;
            if (keys.ArrowUp || keys.w) dy -= speed;
            if (keys.ArrowDown || keys.s) dy += speed;
            if (keys.ArrowLeft || keys.a) dx -= speed;
            if (keys.ArrowRight || keys.d) dx += speed;
        } else {
            // Bot AI Logic
            // Target: Bottom (if not reached) or Top (if reached)
            let targetY = r.reachedBottom ? 20 : fh - 40;

            // Basic Pathfinding
            if (r.y < targetY) dy += speed * 0.6;
            else if (r.y > targetY) dy -= speed * 0.6;

            // Evasion Logic: Run away from nearest tagger
            let nearestTagger = null;
            let minDist = 100;
            taggers.forEach(t => {
                const dist = Math.sqrt((r.x - t.x) ** 2 + (r.y - t.y) ** 2);
                if (dist < minDist) {
                    minDist = dist;
                    nearestTagger = t;
                }
            });

            if (nearestTagger) {
                // Simple flee behavior
                if (nearestTagger.x < r.x) dx += speed * 0.5;
                else dx -= speed * 0.5;

                // Wait behavior if tagger is directly ahead
                if (Math.abs(nearestTagger.y - r.y) < 60 && Math.abs(nearestTagger.x - r.x) < 50) {
                    dy = 0; // Stop and wait
                }
            }

            // Random Jitter
            if (Math.random() < 0.05) dx += (Math.random() - 0.5) * 10;
        }

        r.x += dx;
        r.y += dy;

        // Bounds
        if (r.x < 20) r.x = 20; if (r.x > fw - 20) r.x = fw - 20;
        if (r.y < 20) r.y = 20; if (r.y > fh - 20) r.y = fh - 20;

        // Check Round Trip
        if (!r.reachedBottom && r.y > fh - 50) {
            r.reachedBottom = true;
            r.el.style.border = '3px solid #00FF00'; // Visual indicator: Turn Green
        }

        // Check if completed round trip (reached bottom and back to top)
        if (r.reachedBottom && r.y < 50) {
            // Award point based on current role
            if (currentRole === 'runner') {
                // Player is runner - runners score for player's team
                playerTeamScore++;
                document.getElementById('myTeamScore').textContent = playerTeamScore;
                if (r.type === 'player') {
                    showPointNotification("+1 POINT FOR MY TEAM!");
                } else {
                    showPointNotification("+1 POINT (Bot Runner)", 'team');
                }
            } else {
                // Player is tagger - runners score for enemy team
                enemyTeamScore++;
                document.getElementById('enemyTeamScore').textContent = enemyTeamScore;
                showPointNotification("+1 POINT FOR ENEMY TEAM!", 'enemy');
            }

            // Reset runner for another run
            r.reachedBottom = false;
            r.el.style.border = '3px solid #fff';
            r.y = 50; // Reset to start position
        }

        r.el.style.left = `${r.x}px`;
        r.el.style.top = `${r.y}px`;
    });
}

function updateTaggers() {
    const field = document.getElementById('field');
    const fw = field.offsetWidth;
    const fh = field.offsetHeight;
    const horizontalZoneThreshold = 120

    taggers.forEach(t => {
        // PLAYER CONTROLLED TAGGER
        if (t.controller === 'player') {
            let dx = 0, dy = 0;
            let speed = CONFIG.taggerSpeed * 1.5; // Slightly faster for player fun

            // Apply boost multiplier if active
            if (taggerBoost.active) {
                speed *= taggerBoost.multiplier;
            }

            if (keys.ArrowUp || keys.w) dy -= speed;
            if (keys.ArrowDown || keys.s) dy += speed;
            if (keys.ArrowLeft || keys.a) dx -= speed;
            if (keys.ArrowRight || keys.d) dx += speed;

            t.x += dx;
            t.y += dy;

            // Apply movement constraints based on tagger type
            if (t.type === 'vertical') {
                // Vertical tagger: locked to center X, free Y movement
                t.x = fw / 2; // Locked to center line
                // Y bounds
                if (t.y < fh * 0.2) t.y = fh * 0.2; // Safe zone
                if (t.y > fh - 20) t.y = fh - 20;
            } else if (t.type === 'horizontal') {
                // Horizontal tagger: free X movement, locked to fixed Y
                t.y = t.fixedPos; // Lock to horizontal line
                // X bounds
                if (t.x < 20) t.x = 20;
                if (t.x > fw - 20) t.x = fw - 20;
            }

            t.el.style.top = `${t.y}px`;
            t.el.style.left = `${t.x}px`;
            return; // Skip AI logic
        }

        // AI TAGGER LOGIC
        // Focus nearest active runner
        let target = null;
        let minDist = Infinity;
        runners.forEach(r => {
            if (!r.active) return;
            const dist = Math.abs(r.y - t.y) + Math.abs(r.x - t.x);
            if (dist < minDist) {
                minDist = dist;
                target = r;
            }
        });

        if (!target) return;

        let desiredX = t.x;
        let desiredY = t.y;
        let chasing = false;

        if (t.type === 'horizontal') {
            const distY = Math.abs(target.y - t.y);
            if (distY < horizontalZoneThreshold) chasing = true;

            if (chasing) {
                desiredX = target.x;

                // Calculate distance to target
                const distanceToTarget = Math.abs(desiredX - t.x);

                // Distance-based responsiveness: closer = faster, farther = slower
                const maxDistance = fw * 0.5; // Half the field width
                const minResponsiveness = t.resp * 0.1; // Minimum 10% of base responsiveness

                // Calculate scaled responsiveness (inversely proportional to distance)
                const distanceRatio = Math.min(distanceToTarget / maxDistance, 1);
                const scaledResp = t.resp * (1 - distanceRatio * 0.9) + minResponsiveness;

                t.x += (desiredX - t.x) * scaledResp;
            } else {
                // Return to center
                t.x += ((fw / 2) - t.x) * 0.05;
            }
            // Clamp
            if (t.x < 20) t.x = 20;
            if (t.x > fw - 20) t.x = fw - 20;
            t.el.style.left = `${t.x}px`;

        } else if (t.type === 'vertical') {
            chasing = true; // Always chase
            t.x = fw / 2;
            desiredY = target.y;

            // Calculate distance to target
            const distanceToTarget = Math.abs(desiredY - t.y);

            // Distance-based responsiveness: closer = faster, farther = slower
            // Base responsiveness is t.resp, but we scale it down based on distance
            // Max distance for scaling (beyond this, responsiveness is minimal)
            const maxDistance = fh * 0.5; // Half the field height
            const minResponsiveness = t.resp * 0.1; // Minimum 10% of base responsiveness

            // Calculate scaled responsiveness (inversely proportional to distance)
            // When distance is 0, use full responsiveness
            // When distance is maxDistance or more, use minResponsiveness
            const distanceRatio = Math.min(distanceToTarget / maxDistance, 1);
            const scaledResp = t.resp * (1 - distanceRatio * 0.9) + minResponsiveness;

            t.y += (desiredY - t.y) * scaledResp;

            // Constraints
            const safeZoneY = fh * 0.2;
            if (t.y < safeZoneY) t.y = safeZoneY;
            if (t.y > fh - 20) t.y = fh - 20;

            t.el.style.top = `${t.y}px`;
            t.el.style.left = `${t.x}px`;
        }
    });
}

function checkCollisions() {
    const hitDist = 30;
    runners.forEach(r => {
        if (!r.active) return;
        for (let t of taggers) {
            const dist = Math.sqrt((r.x - t.x) ** 2 + (r.y - t.y) ** 2);
            if (dist < hitDist) {
                r.active = false;
                r.el.style.opacity = '0.3';
                r.el.style.filter = 'grayscale(100%)';
            }
        }
    });
}

function showRoundModal(titleText, msgText, callback) {
    const modal = document.getElementById('gameOverModal');
    const title = document.getElementById('modalTitle');
    const msg = document.getElementById('modalMessage');
    const btn = document.querySelector('.game-over-modal .btn');

    title.textContent = titleText;
    msg.textContent = msgText;
    btn.textContent = "Start Next Round";

    // Override button click
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);

    newBtn.onclick = () => {
        modal.style.display = 'none';
        callback();
    };

    modal.style.display = 'block';
}

function updateTimerDisplay() {
    const minutes = Math.floor(gameTimer / 60);
    const seconds = gameTimer % 60;
    const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    document.getElementById('timerValue').textContent = timeString;

    // Keep timer white (counting up, no urgency)
    const timerValue = document.getElementById('timerValue');
    timerValue.style.color = 'white';
    timerValue.style.animation = 'none';
}

function updateTimer() {
    gameTimer++; // Count up instead of down
    updateTimerDisplay();
    // No time limit - game continues until all runners are tagged
}

function switchRoles() {
    gameActive = false;
    gamePhase = 'second-round';

    // Switch to opposite role
    currentRole = currentRole === 'runner' ? 'tagger' : 'runner';

    showRoundModal(
        "ROUND 2 STARTING!",
        `Switching roles... You are now: ${currentRole.toUpperCase()}`,
        () => {
            startRound();
        }
    );
}

function endGame() {
    gameActive = false;
    clearInterval(timerInterval);

    const modal = document.getElementById('gameOverModal');
    const title = document.getElementById('modalTitle');
    const msg = document.getElementById('modalMessage');
    const btn = document.querySelector('.game-over-modal .btn');

    title.textContent = "GAME OVER!";

    // Determine winner
    const winner = playerTeamScore > enemyTeamScore ? 'My Team' :
        playerTeamScore < enemyTeamScore ? 'Enemy Team' : 'Tie';
    const winnerColor = playerTeamScore > enemyTeamScore ? '#4CAF50' :
        playerTeamScore < enemyTeamScore ? '#f44336' : '#FFA500';

    msg.innerHTML = `
        <div style="font-size: 1.5em; margin: 20px 0;">
            <div style="margin-bottom: 15px;">
                My Team: <span style="color: #4CAF50; font-size: 1.2em;">${playerTeamScore}</span> | 
                Enemy Team: <span style="color: #f44336; font-size: 1.2em;">${enemyTeamScore}</span>
            </div>
            <div style="color: ${winnerColor}; font-size: 1.4em; font-weight: bold;">
                ${winner === 'Tie' ? "IT'S A TIE!" : winner + " WINS!"}
            </div>
        </div>
        <div style="color: #666;">
            ${winner === 'My Team' ? "Great job! You won!" :
            winner === 'Enemy Team' ? "Better luck next time!" :
                "Close match!"}
        </div>
    `;
    btn.textContent = "Play Again";

    // Override button click
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);

    newBtn.onclick = () => {
        resetGame();
    };

    modal.style.display = 'block';
}

function showPointNotification(text, type = 'player') {
    const notification = document.createElement('div');
    notification.style.position = 'absolute';
    notification.style.top = '30%';
    notification.style.left = '50%';
    notification.style.transform = 'translate(-50%, -50%)';

    // Different colors based on type
    if (type === 'enemy') {
        notification.style.background = 'rgba(244, 67, 54, 0.9)'; // Red for enemy
    } else if (type === 'team') {
        notification.style.background = 'rgba(33, 150, 243, 0.9)'; // Blue for team bot
    } else {
        notification.style.background = 'rgba(76, 175, 80, 0.9)'; // Green for player
    }

    notification.style.color = '#fff';
    notification.style.padding = '15px 30px';
    notification.style.borderRadius = '10px';
    notification.style.fontSize = '28px';
    notification.style.fontWeight = 'bold';
    notification.style.zIndex = '1000';
    notification.style.animation = 'fadeInOut 1.5s ease-out';
    notification.textContent = text;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 1500);
}

function resetGame() {
    // Reset all game state
    gamePhase = 'first-round';
    playerScore = 0;
    playerTeamScore = 0;
    enemyTeamScore = 0;
    gameTimer = 0;
    roundsCompleted = 0;
    initialRole = null;
    currentRole = 'runner';

    if (timerInterval) clearInterval(timerInterval);

    location.reload(); // Simplest full reset
}

window.addEventListener('keydown', (e) => {
    if (keys.hasOwnProperty(e.key) || keys.hasOwnProperty(e.key.toLowerCase())) {
        keys[e.key] = true;
        if (e.key.length === 1) keys[e.key.toLowerCase()] = true;
        if (e.key === ' ') e.preventDefault();
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) e.preventDefault();
    }
});

window.addEventListener('keyup', (e) => {
    if (keys.hasOwnProperty(e.key) || keys.hasOwnProperty(e.key.toLowerCase())) {
        keys[e.key] = false;
        if (e.key.length === 1) keys[e.key.toLowerCase()] = false;
    }
});

// Character Selection and Switching
function updateCharacterPanel() {
    const panel = document.getElementById('characterPanel');
    const buttonsContainer = document.getElementById('characterButtons');
    const title = document.getElementById('characterPanelTitle');

    if (!gameActive) {
        panel.style.display = 'none';
        return;
    }

    panel.style.display = 'block';
    buttonsContainer.innerHTML = '';

    if (currentRole === 'runner') {
        title.textContent = 'Select Runner to Control (1-5)';
        runners.forEach((r, idx) => {
            if (r.active) {
                const btn = document.createElement('button');
                btn.className = 'character-btn';
                btn.textContent = `R${idx + 1}`;
                btn.onclick = () => switchToRunner(idx);

                if (playerControlledRunner === idx) {
                    btn.classList.add('active');
                }

                buttonsContainer.appendChild(btn);
            }
        });
    } else {
        title.textContent = 'Select Tagger to Control (1-5)';
        taggers.forEach((t, idx) => {
            const btn = document.createElement('button');
            btn.className = 'character-btn';
            btn.textContent = `T${t.id}`;
            btn.onclick = () => switchToTagger(idx);

            if (playerControlledTagger === idx) {
                btn.classList.add('active');
            }

            buttonsContainer.appendChild(btn);
        });
    }
}

function switchToRunner(newIndex) {
    if (!gameActive || currentRole !== 'runner') return;
    if (newIndex === playerControlledRunner) return;
    if (!runners[newIndex] || !runners[newIndex].active) return;

    // Convert old player runner to bot
    if (playerControlledRunner !== null && runners[playerControlledRunner]) {
        const oldRunner = runners[playerControlledRunner];
        oldRunner.type = 'bot';
        oldRunner.el.style.border = '3px solid #fff';
        oldRunner.el.style.filter = 'hue-rotate(180deg)';
        oldRunner.el.style.zIndex = '10';

        // Update label
        const oldLabel = oldRunner.el.querySelector('.entity-label');
        if (oldLabel) oldLabel.textContent = `R${playerControlledRunner + 1}`;
    }

    // Convert new runner to player
    const newRunner = runners[newIndex];
    newRunner.type = 'player';
    newRunner.el.style.border = '4px solid #FFD700';
    newRunner.el.style.filter = 'none';
    newRunner.el.style.zIndex = '20';

    // Update label
    const newLabel = newRunner.el.querySelector('.entity-label');
    if (newLabel) newLabel.textContent = `R${newIndex + 1} (YOU)`;

    playerControlledRunner = newIndex;
    updateCharacterPanel();
}

function switchToTagger(newIndex) {
    if (!gameActive || currentRole !== 'tagger') return;
    if (newIndex === playerControlledTagger) return;
    if (!taggers[newIndex]) return;

    // Convert old player tagger to bot
    if (playerControlledTagger !== null && taggers[playerControlledTagger]) {
        const oldTagger = taggers[playerControlledTagger];
        oldTagger.controller = 'bot';
        oldTagger.el.style.border = '3px solid #fff';
        oldTagger.el.style.zIndex = '10';
        oldTagger.el.classList.remove('player-tagger');

        // Update label
        const oldLabel = oldTagger.el.querySelector('.entity-label');
        if (oldLabel) oldLabel.textContent = `T${oldTagger.id}`;
    }

    // Convert new tagger to player
    const newTagger = taggers[newIndex];
    newTagger.controller = 'player';
    newTagger.el.style.border = '4px solid #FFD700';
    newTagger.el.style.zIndex = '20';
    newTagger.el.classList.add('player-tagger');

    // Update label
    const newLabel = newTagger.el.querySelector('.entity-label');
    if (newLabel) newLabel.textContent = `T${newTagger.id} (YOU)`;

    playerControlledTagger = newIndex;
    updateCharacterPanel();
}

// Number key bindings for quick switching
window.addEventListener('keydown', (e) => {
    if (!gameActive) return;

    const num = parseInt(e.key);
    if (isNaN(num) || num < 1) return;

    if (currentRole === 'runner' && num <= 5) {
        switchToRunner(num - 1);
    } else if (currentRole === 'tagger' && num <= 5) {
        switchToTagger(num - 1);
    }
});

function switchRolesAfterTag() {
    // Switch to opposite role
    currentRole = currentRole === 'runner' ? 'tagger' : 'runner';

    // Reset control indices
    playerControlledRunner = null;
    playerControlledTagger = null;

    // Reset timer for second round
    gameTimer = 0;

    // Start new round with switched roles
    startRound();
}
