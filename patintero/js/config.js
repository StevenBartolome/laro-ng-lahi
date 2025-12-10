// Game Configuration
// Game Configuration
export const CONFIG = {
    runnerSpeed: 10,      // Significantly increased
    taggerSpeed: 10,       // Increased to match pace
    fieldWidth: 100,
    botSpeed: 10          // Equal to runnerSpeed
};

// Difficulty presets
export const DIFFICULTY = {
    easy: { resp: 0.04, speed: 1, speedMult: 0.8 },
    medium: { resp: 0.05, speed: 3, speedMult: 1.0 },
    hard: { resp: 0.1, speed: 5, speedMult: 1.2 }
};

// Game State (mutable, shared across modules)
export const gameState = {
    selectedDifficulty: 'medium',
    gameActive: false,
    animationFrameId: null,
    currentRole: 'runner',
    initialRole: null,
    gameTimer: 120,
    timerInterval: null,
    gamePhase: 'first-round',
    playerScore: 0,
    roundsCompleted: 0,
    playerTeamScore: 0,
    enemyTeamScore: 0,
    playerControlledRunner: null,
    playerControlledTagger: null
};

// Boost State (Player Runner)
export const boost = {
    active: false,
    ready: true,
    cooldown: 5000,
    duration: 1500,
    multiplier: 1.5,
    lastUsed: 0,
    maxCharges: 3,
    currentCharges: 3
};

// Tagger Boost State (Player Tagger)
export const taggerBoost = {
    active: false,
    ready: true,
    cooldown: 5000,
    duration: 1500,
    multiplier: 2.0,
    lastUsed: 0
};

// Entity Arrays
export const runners = [];
export const taggers = [];

// Input State
export const keys = {
    ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false,
    w: false, a: false, s: false, d: false, ' ': false
};
