import {
  MARBLE_RADIUS,
  TARGET_COLOR,
  distance,
  checkMarbleCollision,
  drawMarble,
  updateMarble,
} from "./Common.js";
import Sound from "./Sound.js";

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
    });
  }
  return targets;
}

export function update(
  playerMarble,
  targets,
  score,
  canvasWidth,
  canvasHeight,
  timeScale
) {
  let scoreIncrease = 0;
  let anyMoving = false;

  // Update target marbles physics
  targets.forEach((target) => {
    if (!target.hit && updateMarble(target, canvasWidth, canvasHeight, timeScale)) {
      anyMoving = true;
    }
  });

  // Hit targets directly (Player -> Target)
  targets.forEach((target) => {
    if (!target.hit && checkMarbleCollision(playerMarble, target)) {
      target.hit = true;
      target.vx = 0;
      target.vy = 0;
      target.vx = 0;
      target.vy = 0;
      scoreIncrease += 10;
      Sound.playHit();
    }
  });

  // Check collisions between targets (Target <-> Target)
  for (let i = 0; i < targets.length; i++) {
    for (let j = i + 1; j < targets.length; j++) {
      if (!targets[i].hit && !targets[j].hit) {
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
    if (!target.hit) {
      drawMarble(ctx, target, false, false);
    }
  });
}

export function checkLevelComplete(targets) {
  return targets.every((m) => m.hit);
}

export function countRemaining(targets) {
  return targets.filter((m) => !m.hit).length;
}
