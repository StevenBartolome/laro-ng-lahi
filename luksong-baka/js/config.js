/**
 * Luksong Baka - Game Configuration
 * All game constants and settings
 */

const CONFIG = {
    // Canvas
    canvasWidth: 1200,
    canvasHeight: 600,
    
    // Physics
    jumpForce: 18,
    gravity: 0.55,
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
    groundY: 480,
    playerStartX: 80,
    bakaX: 700,
    
    // Player
    playerWidth: 90,
    playerHeight: 130,
    
    // Baka
    bakaWidth: 160,
    
    // Lives
    maxLives: 3,
    
    // Asset path
    assetPath: '../assets/luksong_baka_assets/'
};

// Make CONFIG available globally
window.CONFIG = CONFIG;
