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

// Boost State (Player only)
let boost = {
    active: false,
    ready: true,
    cooldown: 5000,
    duration: 1500,
    multiplier: 1.5,
    lastUsed: 0
};

// Entities
let runners = [];
let taggers = [];
let keys = {
    ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false,
    w: false, a: false, s: false, d: false, ' ': false
};

function startGame(difficulty) {
    selectedDifficulty = difficulty || 'medium';
    // Reset to initial state
    currentRole = 'runner';

    // UI Setup
    document.getElementById('difficultyScreen').style.display = 'none';
    document.getElementById('gameArea').classList.add('active');
    document.getElementById('boostMeter').classList.add('active');

    // Highlight difficulty
    document.querySelectorAll('.runner-card').forEach(c => c.classList.remove('selected'));
    const chosen = document.getElementById(`diff-${selectedDifficulty}`);
    if (chosen) chosen.classList.add('selected');

    startRound();
}

function startRound() {
    const field = document.getElementById('field');
    const fw = field.offsetWidth;
    const diff = DIFFICULTY[selectedDifficulty];
    CONFIG.taggerSpeed = diff.speed;

    // Reset Boost
    boost.ready = true;
    boost.active = false;
    updateBoostUI();

    // Clear Entities
    document.querySelectorAll('.entity').forEach(e => e.remove());
    runners = [];
    taggers = [];

    // --- SETUP BASED ON ROLE ---
    if (currentRole === 'runner') {
        // Player is Runner [0], + 2 Bots
        createRunner('player', fw / 2, 50);
        createRunner('bot', fw * 0.3, 50);
        createRunner('bot', fw * 0.7, 50);

        // 5 Bot Taggers
        createTagger(1, 'horizontal', field.offsetHeight * 0.2, diff, 'bot');
        createTagger(2, 'horizontal', field.offsetHeight * 0.4, diff, 'bot');
        createTagger(3, 'vertical', 0, diff, 'bot');
        createTagger(4, 'horizontal', field.offsetHeight * 0.6, diff, 'bot');
        createTagger(5, 'horizontal', field.offsetHeight * 0.8, diff, 'bot');

        updateStatus("ROLE: RUNNER - Reach the bottom and return!");

    } else {
        // Player is Vertical Tagger (Center), + 4 Bot Taggers
        createTagger(1, 'horizontal', field.offsetHeight * 0.2, diff, 'bot');
        createTagger(2, 'horizontal', field.offsetHeight * 0.4, diff, 'bot');
        createTagger(3, 'vertical', 0, diff, 'player'); // Player Controlled
        createTagger(4, 'horizontal', field.offsetHeight * 0.6, diff, 'bot');
        createTagger(5, 'horizontal', field.offsetHeight * 0.8, diff, 'bot');

        // 3 Bot Runners
        createRunner('bot', fw / 2, 50);
        createRunner('bot', fw * 0.3, 50);
        createRunner('bot', fw * 0.7, 50);

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
    const runner = {
        id: runners.length,
        type: type,
        x: x,
        y: y,
        active: true,
        reachedBottom: false,
        el: createEntity(type === 'player' ? 'entity runner' : 'entity runner bot', '', x, y)
    };
    if (type === 'bot') runner.el.style.filter = 'hue-rotate(180deg)';
    field.appendChild(runner.el);
    runners.push(runner);
}

function createTagger(id, type, fixedPos, diff, controller) {
    const field = document.getElementById('field');
    const x = field.offsetWidth / 2;
    const y = type === 'vertical' ? field.offsetHeight / 2 : fixedPos;

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
    taggerObj.el = createEntity(className, `Tagger ${id}`, x, y);

    if (controller === 'player') {
        taggerObj.el.style.border = '4px solid #FFD700'; // Gold border for player tagger
        taggerObj.el.style.zIndex = '20';
    }

    field.appendChild(taggerObj.el);
    taggers.push(taggerObj);
}

function createEntity(className, labelText, x, y) {
    const div = document.createElement('div');
    div.className = className;
    div.style.left = `${x}px`;
    div.style.top = `${y}px`;
    // Removed text labels for cleaner look as per previous iteration preference
    // if (labelText) ... 
    return div;
}

// ... Boost functions remain similar ...
function activateBoost() {
    if (!boost.ready || !gameActive || currentRole !== 'runner') return; // Only Runner can boost
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
            player.el.style.borderColor = '#fff';
        }, boost.duration);
    }
    setTimeout(() => { boost.ready = true; updateBoostUI(); }, boost.cooldown);
    updateBoostUI();
}

function updateBoostUI() {
    const fill = document.getElementById('boostFill');
    const container = document.getElementById('boostMeter');

    // Hide boost UI if playing as Tagger
    if (currentRole === 'tagger') {
        container.style.display = 'none';
        return;
    } else {
        container.style.display = 'block';
    }

    if (boost.ready) {
        fill.style.width = '100%';
        fill.style.backgroundColor = '#00bcd4';
        container.classList.add('boost-ready');
    } else {
        fill.style.width = '0%';
        fill.style.backgroundColor = '#555';
        container.classList.remove('boost-ready');
        fill.style.transition = `width ${boost.cooldown}ms linear`;
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

    // Check Round End Conditions

    const activeRunners = runners.filter(r => r.active);

    // 1. All Runners Eliminated
    if (activeRunners.length === 0) {
        if (currentRole === 'runner') {
            // Player Team Wiped -> Switch to Tagger
            showRoundModal("ALL TAGGED!", "Switching Sides...", () => {
                currentRole = 'tagger';
                startRound();
            });
        } else {
            // Bot Team Wiped (Player Tagger Won) -> Switch to Runner
            showRoundModal("DEFENSE SUCCESSFUL!", "Switching Sides...", () => {
                currentRole = 'runner';
                startRound();
            });
        }
        gameActive = false; // Pause loop during modal
        return;
    }

    // 2. Win Condition (Round Trip)
    // Check if ANY runner completed the round trip
    const winner = runners.find(r => r.active && r.reachedBottom && r.y < 30);

    if (winner) {
        if (currentRole === 'runner') {
            // Player Team Scored -> Keep Playing as Runner (Next Level?)
            const msg = winner.type === 'player' ? "YOU SCORED!" : "TEAMMATE SCORED!";
            showRoundModal(msg, "Resetting Positions...", () => {
                // currentRole stays 'runner'
                startRound();
            });
        } else {
            // Bot Team Scored -> Player Tagger Failed -> Retry as Tagger
            showRoundModal("THEY SCORED!", "Try Again...", () => {
                // currentRole stays 'tagger'
                startRound();
            });
        }
        gameActive = false;
        return;
    }

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

        r.el.style.left = `${r.x}px`;
        r.el.style.top = `${r.y}px`;
    });
}

function updateTaggers() {
    const field = document.getElementById('field');
    const fw = field.offsetWidth;
    const fh = field.offsetHeight;
    const horizontalZoneThreshold = 90;

    taggers.forEach(t => {
        // PLAYER CONTROLLED TAGGER
        if (t.controller === 'player') {
            let dx = 0, dy = 0;
            const speed = CONFIG.taggerSpeed * 1.5; // Slightly faster for player fun

            if (keys.ArrowUp || keys.w) dy -= speed;
            if (keys.ArrowDown || keys.s) dy += speed;
            if (keys.ArrowLeft || keys.a) dx -= speed;
            if (keys.ArrowRight || keys.d) dx += speed;

            t.x += dx;
            t.y += dy;

            // Vertical Tagger Constraints (Center Only? Or Free roam in bounds?)
            // Let's implement specific constraints for authenticity
            if (t.type === 'vertical') {
                t.x = fw / 2; // Locked to center line
                // Y bounds
                if (t.y < fh * 0.2) t.y = fh * 0.2; // Safe zone
                if (t.y > fh - 20) t.y = fh - 20;
            } else {
                // Horizontal constraints (if we allowed player to be horizontal, which we don't currently)
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
                t.x += (desiredX - t.x) * t.resp;
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
            t.y += (desiredY - t.y) * t.resp;

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

function resetGame() {
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