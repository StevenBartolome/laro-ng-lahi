import {
    MARBLE_RADIUS,
    TARGET_COLOR,
    distance,
    checkMarbleCollision,
    drawMarble,
    updateMarble,
} from "./Common.js";
import Sound from "../js/Sound.js";

/**
 * Setup line mode with targets based on target count
 * @param {number} targetCount - Number of targets (6-10)
 * @param {number} canvasWidth - Canvas width
 * @param {number} canvasHeight - Canvas height
 * @returns {Array} - Array of target marble objects
 */
export function setup(targetCount, canvasWidth, canvasHeight) {
    const targets = [];
    const numTargets = targetCount; // Use targetCount directly
    const margin = 100;
    const usableWidth = canvasWidth - 2 * margin;
    const usableHeight = canvasHeight / 2 - margin;

    for (let i = 0; i < numTargets; i++) {
        let x, y, overlapping;
        let attempts = 0;

        do {
            overlapping = false;
            x = margin + Math.random() * usableWidth;
            y = margin + Math.random() * usableHeight;

            for (let other of targets) {
                if (distance(x, y, other.x, other.y) < MARBLE_RADIUS * 4) {
                    overlapping = true;
                    break;
                }
            }
            attempts++;
        } while (overlapping && attempts < 50);

        targets.push({
            x: x,
            y: y,
            radius: MARBLE_RADIUS,
            vx: 0,
            vy: 0,
            color: TARGET_COLOR,
            colorIndex: i % 3,
            hit: false,
            hitOrder: i, // Order in which they must be hit (0, 1, 2, ...)
            hitBy: null, // Track which player hit this target
        });
    }
    return targets;
}

/**
 * Update line mode physics
 * @param {Object} playerMarbles - All player marbles keyed by playerId
 * @param {string} currentPlayerId - ID of player whose turn it is
 * @param {Array} targets - Array of target marble objects
 * @param {number} score - Current player's score
 * @param {number} canvasWidth - Canvas width
 * @param {number} canvasHeight - Canvas height
 * @returns {Object} - { scoreIncrease, anyMoving, hitCount }
 */
export function update(
    playerMarbles,
    currentPlayerId,
    targets,
    score,
    canvasWidth,
    canvasHeight
) {
    let scoreIncrease = 0;
    let anyMoving = false;
    let hitCount = 0; // Track targets hit by current player this turn

    // Update target marbles physics
    targets.forEach((target) => {
        if (!target.hit && updateMarble(target, canvasWidth, canvasHeight)) {
            anyMoving = true;
        }
    });

    // Check collisions between player marbles and targets
    Object.keys(playerMarbles).forEach(playerId => {
        const playerMarble = playerMarbles[playerId];

        // Hit targets in sequence only
        targets.forEach((target) => {
            if (!target.hit && checkMarbleCollision(playerMarble, target)) {
                Sound.playHit();

                // Check if this is the next target in sequence
                const previousHit = target.hitOrder === 0 || targets[target.hitOrder - 1].hit;

                if (previousHit) {
                    target.hit = true;
                    target.hitBy = playerId;
                    target.vx = 0;
                    target.vy = 0;

                    // Only give score to current player if they hit it
                    if (playerId === currentPlayerId) {
                        scoreIncrease += (target.hitOrder + 1); // Score = target number (1, 2, 3, etc.)
                        hitCount++;
                    }
                }
            }
        });
    });

    // Check collisions between targets
    for (let i = 0; i < targets.length; i++) {
        for (let j = i + 1; j < targets.length; j++) {
            if (!targets[i].hit && !targets[j].hit) {
                if (checkMarbleCollision(targets[i], targets[j])) {
                    Sound.playHit();
                }
            }
        }
    }

    return { scoreIncrease, anyMoving, hitCount };
}

/**
 * Draw the targets with numbers
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Array} targets - Array of target marble objects
 */
export function draw(ctx, targets) {
    targets.forEach((target, index) => {
        if (!target.hit) {
            // Draw target marble using drawMarble
            drawMarble(ctx, target, false, false);

            // Draw number on target
            ctx.save();
            ctx.fillStyle = "white";
            ctx.strokeStyle = "black";
            ctx.lineWidth = 3;
            ctx.font = "bold 20px Arial";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            const text = (index + 1).toString();
            ctx.strokeText(text, target.x, target.y);
            ctx.fillText(text, target.x, target.y);
            ctx.restore();
        }
    });
}

/**
 * Check if all targets are hit
 * @param {Array} targets - Array of target marble objects
 * @returns {boolean}
 */
export function checkLevelComplete(targets) {
    return targets.every((m) => m.hit);
}

/**
 * Count remaining unhit targets
 * @param {Array} targets - Array of target marble objects
 * @returns {number}
 */
export function countRemaining(targets) {
    return targets.filter((m) => !m.hit).length;
}
