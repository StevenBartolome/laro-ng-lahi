/**
 * Luksong Baka - Game State
 * All game state variables and objects
 */

const GameState = {
    // Current state
    state: 'menu',  // menu, idle, running, charging, jumping, success, fail, gameover

    // Level tracking
    currentLevel: 1,
    currentRound: 1,

    // Achievement Stats
    achievementStats: {
        maxLevel: 1,
        perfect: true,
        streak: 0,
        won: false
    },

    // Jump mechanics
    chargeAngle: 35,
    angleDirection: 1,
    angleSpeed: 4,
    difficultyMultiplier: 1,

    // Score
    totalJumps: 0,
    lives: 3,

    // Input
    isInputDown: false,
    bounceInputTime: 0,
    chargeStartTime: 0,
    chargeCycles: 0,

    // Reset to initial state
    reset() {
        this.state = 'idle';
        this.currentLevel = 1;
        this.currentRound = 1;
        this.difficultyMultiplier = 1;
        this.totalJumps = 0;
        this.lives = CONFIG.maxLives;
        this.chargeAngle = CONFIG.minAngle + 15;
        this.angleDirection = 1;
        this.bounceInputTime = 0;

        this.achievementStats = {
            maxLevel: 1,
            perfect: true,
            streak: 0,
            won: false
        };
    }
};

// Player object
const Player = {
    x: CONFIG.playerStartX,
    y: CONFIG.groundY,
    width: CONFIG.playerWidth,
    height: CONFIG.playerHeight,
    vx: 0,
    vy: 0,
    frameIndex: 0,
    frameTimer: 0,
    frameDelay: 7,

    reset() {
        this.x = CONFIG.playerStartX;
        this.y = CONFIG.groundY;
        this.vx = 0;
        this.vy = 0;
        this.frameIndex = 0;
    }
};

// Baka (obstacle) object
const Baka = {
    x: CONFIG.bakaX,
    y: CONFIG.groundY,
    width: CONFIG.bakaWidth,
    height: CONFIG.bakaHeight[0],
    level: 1,

    setLevel(level) {
        this.level = Math.min(Math.max(level, 1), 5);
        this.height = CONFIG.bakaHeight[this.level - 1];
        GameState.currentLevel = this.level;

        // Update UI
        const levelText = document.getElementById('levelText');
        if (levelText) levelText.textContent = this.level;
    }
};

// Make available globally
window.GameState = GameState;
window.Player = Player;
window.Baka = Baka;
