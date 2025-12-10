/**
 * Luksong Baka - Game Configuration
 * All game constants and settings
 */

const CONFIG = {
    // Canvas
    canvasWidth: 1200,
    canvasHeight: 600,

    // Physics
    // Adjusted for very snappy, fast-paced feel
    jumpForce: 22,              // Increased from 18
    gravity: 0.8,              // Increased from 0.6
    runSpeed: 8,                // Increased from 6

    // Jump angle range (extended for better control)
    minAngle: 0,
    maxAngle: 100,

    // Baka hitbox heights per level (5 levels)
    bakaHeight: [50, 85, 125, 170, 220],

    // Difficulty
    levelSpeedMultiplier: 1.08,
    successMargin: 25,

    // Positions
    groundY: 520,
    playerStartX: 80,
    bakaX: 700,

    // Player
    playerWidth: 90,
    playerHeight: 130,

    // Baka
    bakaWidth: 160,

    // Lives
    maxLives: 3,

    // Asset path - detect if we're in multiplayer subfolder
    assetPath: window.location.pathname.includes('/multiplayer/')
        ? '../../assets/luksong_baka_assets/'
        : '../assets/luksong_baka_assets/'
};

// Make CONFIG available globally
window.CONFIG = CONFIG;
