import {
    MARBLE_RADIUS,
    TARGET_COLOR,
    distance,
    checkMarbleCollision,
    drawMarble,
    updateMarble,
    COLLISION_ELASTICITY,
} from "./Common.js";
import Sound from "../js/Sound.js";

export function setup(targetCount, canvasWidth, canvasHeight) {
    const targets = [];
    const numTargets = targetCount; // Use targetCount directly (6-10)
    const margin = 80;
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
            offScreen: false, // Track if target moved off screen
        });
    }
    return targets;
}

export function update(
    playerMarbles,
    currentPlayerId,
    targets,
    score,
    canvasWidth,
    canvasHeight
) {
    // Validate state structure (prevent errors during mode transitions)
    if (!targets || !Array.isArray(targets)) {
        console.warn('TargetMode.update: Invalid targets array, skipping update');
        return { scoreIncrease: 0, anyMoving: false, hitCount: 0 };
    }

    let scoreIncrease = 0;
    let anyMoving = false;
    let hitCount = 0; // Track number of targets hit by current player this turn

    // Update ALL target marbles physics (including hit ones that are moving)
    targets.forEach((target) => {
        if (updateMarble(target, canvasWidth, canvasHeight)) {
            anyMoving = true;
        }

        // Update hit delay timer
        if (target.hit && target.hitDelay > 0) {
            target.hitDelay--;
        }

        // Check if hit target moved off screen
        if (target.hit && !target.offScreen) {
            const buffer = 50;
            if (target.x < -buffer || target.x > canvasWidth + buffer ||
                target.y < -buffer || target.y > canvasHeight + buffer) {
                target.offScreen = true;
            }
        }
    });

    // Check collisions: Player Marbles -> Targets
    // All player marbles can hit targets, but only current player gets credit
    Object.keys(playerMarbles).forEach(playerId => {
        const playerMarble = playerMarbles[playerId];

        targets.forEach((target) => {
            // Only check collision with unhit, on-screen targets
            // Once a target is hit, it becomes non-interactive (ghost-like)
            if (target.hit || target.offScreen) {
                return; // Skip this target
            }

            if (checkMarbleCollision(playerMarble, target)) {
                // Mark as hit on first collision
                target.hit = true;
                target.hitDelay = 5; // Keep visible for ~5 frames to show the bounce

                // Only count this hit if it's the current player's marble
                if (playerId === currentPlayerId) {
                    hitCount++;
                    scoreIncrease += 10;
                }
                Sound.playHit();
            }
        });
    });

    // Check collisions: Player Marbles <-> Player Marbles
    // Players' marbles bounce off each other but don't disappear
    const playerIds = Object.keys(playerMarbles);
    for (let i = 0; i < playerIds.length; i++) {
        for (let j = i + 1; j < playerIds.length; j++) {
            const marble1 = playerMarbles[playerIds[i]];
            const marble2 = playerMarbles[playerIds[j]];

            if (checkMarbleCollision(marble1, marble2)) {
                Sound.playHit();
                // checkMarbleCollision already applies physics, so they bounce
            }
        }
    }

    // Check collisions between targets (Target <-> Target)
    // Only check collisions between UNHIT targets to avoid chain reactions
    for (let i = 0; i < targets.length; i++) {
        for (let j = i + 1; j < targets.length; j++) {
            // Skip if either target is hit or off-screen
            if (targets[i].hit || targets[j].hit ||
                targets[i].offScreen || targets[j].offScreen) {
                continue;
            }

            if (checkMarbleCollision(targets[i], targets[j])) {
                Sound.playHit();
            }
        }
    }

    return { scoreIncrease, anyMoving, hitCount };
}

export function draw(ctx, targets) {
    // Validate state structure
    if (!targets || !Array.isArray(targets)) {
        console.warn('TargetMode.draw: Invalid targets array');
        return;
    }
    targets.forEach((target) => {
        // Only draw targets that haven't been hit OR are still in their "hit delay" phase
        if (!target.hit || (target.hitDelay && target.hitDelay > 0)) {
            drawMarble(ctx, target, false, false);
        }
    });
}

export function checkLevelComplete(targets) {
    // Level is complete when all targets are either hit AND off-screen, or just hit
    return targets.every((target) => target.hit);
}


export function countRemaining(targets) {
    // Validate state structure
    if (!targets || !Array.isArray(targets)) {
        console.warn('TargetMode.countRemaining: Invalid targets array');
        return 0;
    }
    return targets.filter((target) => !target.hit).length;
}