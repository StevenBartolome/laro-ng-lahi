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
  const numTargets = level + 2;
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
      hitOrder: i,
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

  // Hit marbles in sequence
  targets.forEach((target) => {
    if (!target.hit && checkMarbleCollision(playerMarble, target)) {
      Sound.playHit();
      // Check if this is the next marble in sequence
      const previousHit =
        target.hitOrder === 0 || targets[target.hitOrder - 1].hit;

      if (previousHit) {
        target.hit = true;
        target.vx = 0;
        target.vy = 0;
        scoreIncrease += 15 * (target.hitOrder + 1);
      }
    }
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

  return { scoreIncrease, anyMoving };
}

export function draw(ctx, targets) {
  targets.forEach((target, index) => {
    if (!target.hit) {
      // Draw marble
      drawMarble(ctx, target, false, false);

      // Draw number
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

export function checkLevelComplete(targets) {
  return targets.every((m) => m.hit);
}

export function countRemaining(targets) {
  return targets.filter((m) => !m.hit).length;
}
