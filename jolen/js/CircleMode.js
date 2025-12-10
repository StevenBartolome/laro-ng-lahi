import {
  MARBLE_RADIUS,
  TARGET_COLOR,
  CIRCLE_RADIUS,
  distance,
  checkMarbleCollision,
  drawMarble,
  updateMarble,
} from "./Common.js";
import Sound from "./Sound.js";

export function setup(level, canvasWidth, canvasHeight) {
  const targets = [];
  const startY = canvasHeight / 2 - 50;
  const circleCenter = { x: canvasWidth / 2, y: startY };
  const numTargets = level + 4;
  const innerRadius = CIRCLE_RADIUS - 40;

  for (let i = 0; i < numTargets; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.random() * (innerRadius - MARBLE_RADIUS * 2);
    const x = circleCenter.x + Math.cos(angle) * dist;
    const y = circleCenter.y + Math.sin(angle) * dist;

    targets.push({
      x: x,
      y: y,
      radius: MARBLE_RADIUS,
      vx: 0,
      vy: 0,
      color: TARGET_COLOR,
      colorIndex: i % 3,
      hit: false,
      outOfCircle: false,
    });
  }
  return { targets, circleCenter };
}

export function update(playerMarble, state, score, canvasWidth, canvasHeight, timeScale) {
  const { targets, circleCenter } = state;
  let scoreIncrease = 0;
  let anyMoving = false;

  // Update target marbles physics
  targets.forEach((target) => {
    if (
      !target.outOfCircle &&
      updateMarble(target, canvasWidth, canvasHeight, timeScale)
    ) {
      anyMoving = true;
    }
  });

  // Check collisions between player and targets
  targets.forEach((target) => {
    if (!target.outOfCircle) {
      if (checkMarbleCollision(playerMarble, target)) {
        Sound.playHit();
      }
    }
  });

  // Check collisions between targets
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
        scoreIncrease += 15;
      }
    }
  });

  return { scoreIncrease, anyMoving };
}

export function draw(ctx, state) {
  const { targets, circleCenter } = state;

  // Draw Circle
  ctx.save();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
  ctx.lineWidth = 4;
  ctx.setLineDash([10, 10]);
  ctx.beginPath();
  ctx.arc(circleCenter.x, circleCenter.y, CIRCLE_RADIUS, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  // Draw Marbles
  targets.forEach((target) => {
    if (!target.outOfCircle) {
      drawMarble(ctx, target, false, false);
    }
  });
}

export function checkLevelComplete(state) {
  return state.targets.every((m) => m.outOfCircle);
}

export function countRemaining(state) {
  return state.targets.filter((m) => !m.outOfCircle).length;
}
