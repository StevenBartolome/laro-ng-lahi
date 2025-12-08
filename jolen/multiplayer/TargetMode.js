import {
    MARBLE_RADIUS,
    TARGET_COLOR,
    distance,
    checkMarbleCollision,
    drawMarble,
    updateMarble,
} from "./Common.js";
import Sound from "../js/Sound.js";

export function setup(level, canvasWidth, canvasHeight) {
    const targets = [];
    const numTargets = level + 3;
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
    playerMarble,
    targets,
    score,
    canvasWidth,
    canvasHeight
) {
    let scoreIncrease = 0;
    let anyMoving = false;

    // Update ALL target marbles physics (including hit ones that are moving)
    targets.forEach((target) => {
        if (updateMarble(target, canvasWidth, canvasHeight)) {
            anyMoving = true;
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

    // Hit targets directly (Player -> Target)
    // checkMarbleCollision automatically applies physics!
    targets.forEach((target) => {
        if (!target.hit && checkMarbleCollision(playerMarble, target)) {
            target.hit = true;
            scoreIncrease += 10;
            Sound.playHit();
        }
    });

    // Check collisions between targets (Target <-> Target)
    for (let i = 0; i < targets.length; i++) {
        for (let j = i + 1; j < targets.length; j++) {
            if (!targets[i].offScreen && !targets[j].offScreen) {
                if (checkMarbleCollision(targets[i], targets[j])) {
                    Sound.playHit();
                }
            }
        }
    }

    return { scoreIncrease, anyMoving };
}

export function draw(ctx, targets) {
    targets.forEach((target) => {
        // Only draw targets that haven't moved off screen
        if (!target.offScreen) {
            drawMarble(ctx, target, false, false);
        }
    });
}

export function checkLevelComplete(targets) {
    // Level is complete when all targets are either hit AND off-screen, or just hit
    return targets.every((target) => target.hit);
}

export function countRemaining(targets) {
    return targets.filter((target) => !target.hit).length;
}
