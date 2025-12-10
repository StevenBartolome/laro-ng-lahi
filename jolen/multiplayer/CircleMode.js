// CircleMode.js - Multiplayer version for Circle Mode gameplay
// Players try to knock marbles out of a circle. Player with most marbles knocked out wins.

import {
    MARBLE_RADIUS,
    TARGET_COLOR,
    CIRCLE_RADIUS,
    distance,
    checkMarbleCollision,
    drawMarble,
    updateMarble,
} from "./Common.js";
import Sound from "../js/Sound.js";

/**
 * Setup the circle mode with target marbles inside
 * @param {number} targetCount - Number of target marbles (6-10)
 * @param {number} canvasWidth - Canvas width
 * @param {number} canvasHeight - Canvas height
 * @returns {{ targets: Array, circleCenter: { x: number, y: number } }}
 */
export function setup(targetCount, canvasWidth, canvasHeight) {
    const targets = [];
    const startY = canvasHeight / 2 - 50;
    const circleCenter = { x: canvasWidth / 2, y: startY };
    const numTargets = targetCount;
    const innerRadius = CIRCLE_RADIUS - 40;

    for (let i = 0; i < numTargets; i++) {
        let x, y, overlapping;
        let attempts = 0;

        // Find non-overlapping position
        do {
            overlapping = false;
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.random() * (innerRadius - MARBLE_RADIUS * 2);
            x = circleCenter.x + Math.cos(angle) * dist;
            y = circleCenter.y + Math.sin(angle) * dist;

            for (let other of targets) {
                if (distance(x, y, other.x, other.y) < MARBLE_RADIUS * 3) {
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
            outOfCircle: false,
            knockedOutBy: null, // Track which player knocked this out
        });
    }
    return { targets, circleCenter };
}

/**
 * Update circle mode physics and collisions
 * @param {Object} playerMarbles - All player marbles keyed by playerId
 * @param {string} currentPlayerId - ID of player whose turn it is
 * @param {Object} state - { targets, circleCenter }
 * @param {number} score - Current player's score
 * @param {number} canvasWidth - Canvas width
 * @param {number} canvasHeight - Canvas height
 * @returns {{ scoreIncrease: number, anyMoving: boolean, hitCount: number }}
 */
export function update(
    playerMarbles,
    currentPlayerId,
    state,
    score,
    canvasWidth,
    canvasHeight
) {
    const { targets, circleCenter } = state;
    let scoreIncrease = 0;
    let anyMoving = false;
    let hitCount = 0; // Track marbles knocked out this turn

    // Update target marbles physics
    targets.forEach((target) => {
        if (!target.outOfCircle && updateMarble(target, canvasWidth, canvasHeight)) {
            anyMoving = true;
        }
    });

    // Check collisions: Player Marbles -> Targets
    Object.keys(playerMarbles).forEach(playerId => {
        const playerMarble = playerMarbles[playerId];

        targets.forEach((target) => {
            if (!target.outOfCircle) {
                if (checkMarbleCollision(playerMarble, target)) {
                    Sound.playHit();
                    // Mark that this player is the last to hit this marble
                    target.lastHitBy = playerId;
                }
            }
        });
    });

    // Check collisions: Player Marbles <-> Player Marbles
    const playerIds = Object.keys(playerMarbles);
    for (let i = 0; i < playerIds.length; i++) {
        for (let j = i + 1; j < playerIds.length; j++) {
            const marble1 = playerMarbles[playerIds[i]];
            const marble2 = playerMarbles[playerIds[j]];

            if (checkMarbleCollision(marble1, marble2)) {
                Sound.playHit();
            }
        }
    }

    // Check collisions between targets (Target <-> Target)
    for (let i = 0; i < targets.length; i++) {
        for (let j = i + 1; j < targets.length; j++) {
            if (!targets[i].outOfCircle && !targets[j].outOfCircle) {
                if (checkMarbleCollision(targets[i], targets[j])) {
                    Sound.playHit();
                }
            }
        }
    }

    // Check if ANY marbles are now out of circle
    targets.forEach((target) => {
        if (!target.outOfCircle) {
            const dist = distance(target.x, target.y, circleCenter.x, circleCenter.y);
            if (dist > CIRCLE_RADIUS + target.radius) {
                target.outOfCircle = true;
                // Credit goes to the player who last hit this marble
                // If no one hit it (pushed by another marble), credit current player
                target.knockedOutBy = target.lastHitBy || currentPlayerId;

                // Only give score to current player if they knocked it out
                if (target.knockedOutBy === currentPlayerId) {
                    scoreIncrease += 15;
                    hitCount++;
                }
            }
        }
    });

    return { scoreIncrease, anyMoving, hitCount };
}

/**
 * Draw the circle mode elements
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Object} state - { targets, circleCenter }
 */
export function draw(ctx, state) {
    const { targets, circleCenter } = state;

    // Draw Circle boundary
    ctx.save();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
    ctx.lineWidth = 4;
    ctx.setLineDash([10, 10]);
    ctx.beginPath();
    ctx.arc(circleCenter.x, circleCenter.y, CIRCLE_RADIUS, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Inner glow effect
    const gradient = ctx.createRadialGradient(
        circleCenter.x, circleCenter.y, CIRCLE_RADIUS - 20,
        circleCenter.x, circleCenter.y, CIRCLE_RADIUS
    );
    gradient.addColorStop(0, "rgba(255, 255, 255, 0)");
    gradient.addColorStop(1, "rgba(255, 255, 255, 0.1)");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(circleCenter.x, circleCenter.y, CIRCLE_RADIUS, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // Draw target marbles (only those still in circle)
    targets.forEach((target) => {
        if (!target.outOfCircle) {
            drawMarble(ctx, target, false, false);
        }
    });
}

/**
 * Check if all marbles are out of the circle
 * @param {Object} state - { targets, circleCenter }
 * @returns {boolean}
 */
export function checkLevelComplete(state) {
    return state.targets.every((m) => m.outOfCircle);
}

/**
 * Count remaining marbles in the circle
 * @param {Object} state - { targets, circleCenter }
 * @returns {number}
 */
export function countRemaining(state) {
    return state.targets.filter((m) => !m.outOfCircle).length;
}

/**
 * Get scores for each player based on marbles knocked out
 * @param {Object} state - { targets, circleCenter }
 * @returns {Object} - { playerId: knockoutCount }
 */
export function getKnockoutScores(state) {
    const scores = {};
    state.targets.forEach((target) => {
        if (target.outOfCircle && target.knockedOutBy) {
            scores[target.knockedOutBy] = (scores[target.knockedOutBy] || 0) + 1;
        }
    });
    return scores;
}
