/**
 * Luksong Baka - Game Configuration
 * All game constants and settings
 */

const CONFIG = {
    // Canvas
    canvasWidth: 1200,
    canvasHeight: 600,

    // Physics
    // Adjusted for slower, floatier jump (approx 50% slower motion)
    jumpForce: 14.5,            // Reduced from 18 to match lower gravity
    gravity: 0.35,              // Reduced from 0.55 for slower fall
    runSpeed: 3,

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
