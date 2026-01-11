/**
 * Achievement Integration Example
 * 
 * This file shows how to integrate achievement tracking into your game files.
 * Copy the relevant sections into your game's <script> tags.
 */

// ============================================
// INITIALIZATION (Add to game start)
// ============================================

// IMPORTANT: The PHP code is commented out to avoid syntax errors.
// When you integrate this into a PHP file, uncomment the PHP lines.

// For PHP-based game files, use this (uncomment in your PHP file):
// const userId = '<?php echo $_SESSION["username"] ?? ""; ?>';
// const isGuest = <?php echo (isset($_SESSION['is_guest']) && $_SESSION['is_guest']) ? 'true' : 'false'; ?>;

// For testing or HTML files, use URL parameters:
const userId = new URLSearchParams(window.location.search).get('userId') || '';
const isGuest = new URLSearchParams(window.location.search).get('isGuest') === 'true';

// Initialize achievement manager when game loads
async function initAchievements() {
    if (window.achievementManager) {
        await window.achievementManager.init(userId, isGuest);
        console.log('Achievement system initialized');
    }
}

// Call on game load
window.addEventListener('load', initAchievements);

// ============================================
// JOLEN GAME EXAMPLE
// ============================================

// Track when Jolen game ends
function onJolenGameEnd(gameResult) {
    if (window.achievementManager && !isGuest) {
        window.achievementManager.trackJolenGame({
            won: gameResult.won,          // boolean: did player win?
            streak: gameResult.streak,    // number: max consecutive hits
            perfect: gameResult.perfect   // boolean: no misses?
        });
    }
}

// Example usage:
// onJolenGameEnd({ won: true, streak: 15, perfect: true });

// ============================================
// PATINTERO GAME EXAMPLE
// ============================================

// Track when Patintero game ends
function onPatinteroGameEnd(gameResult) {
    if (window.achievementManager && !isGuest) {
        window.achievementManager.trackPatinteroGame({
            points: gameResult.points,      // number: points scored as runner
            tags: gameResult.tags,          // number: runners tagged as tagger
            flawless: gameResult.flawless,  // boolean: won without being tagged?
            duration: gameResult.duration   // number: game duration in seconds
        });
    }
}

// Example usage:
// onPatinteroGameEnd({ points: 3, tags: 0, flawless: true, duration: 95 });

// ============================================
// LUKSONG BAKA GAME EXAMPLE
// ============================================

// Track when Luksong Baka game ends
function onLuksongBakaGameEnd(gameResult) {
    if (window.achievementManager && !isGuest) {
        window.achievementManager.trackLuksongGame({
            won: gameResult.won,            // boolean: completed successfully?
            maxLevel: gameResult.maxLevel,  // number: highest level reached
            perfect: gameResult.perfect,    // boolean: no fails?
            streak: gameResult.streak       // number: consecutive successful jumps
        });
    }
}

// Example usage:
// onLuksongBakaGameEnd({ won: true, maxLevel: 10, perfect: true, streak: 12 });

// ============================================
// PLAYTIME TRACKING (Optional)
// ============================================

let gameStartTime = null;

function startPlaytimeTracking() {
    gameStartTime = Date.now();
}

function stopPlaytimeTracking() {
    if (gameStartTime && window.achievementManager && !isGuest) {
        const playedSeconds = Math.floor((Date.now() - gameStartTime) / 1000);
        window.achievementManager.trackPlaytime(playedSeconds);
        gameStartTime = null;
    }
}

// Call when game starts
// startPlaytimeTracking();

// Call when game ends  
// stopPlaytimeTracking();

// ============================================
// MANUAL ACHIEVEMENT UNLOCK (if needed)
// ============================================

// Unlock a specific achievement manually
async function unlockSpecificAchievement(achievementId) {
    if (window.achievementManager && !isGuest) {
        await window.achievementManager.unlockAchievement(achievementId);
    }
}

// Example:
// unlockSpecificAchievement('first_steps');
