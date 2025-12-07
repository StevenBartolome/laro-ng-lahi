import { distance } from "./Common.js";

export function setup(level, canvasWidth, canvasHeight) {
  const holes = [];
  const numHoles = Math.min(level + 1, 5);
  const margin = 120;
  const usableWidth = canvasWidth - 2 * margin;
  const usableHeight = canvasHeight / 2 - margin;

  for (let i = 0; i < numHoles; i++) {
    let x, y, overlapping;
    let attempts = 0;

    do {
      overlapping = false;
      x = margin + Math.random() * usableWidth;
      y = margin + Math.random() * usableHeight;

      for (let other of holes) {
        if (distance(x, y, other.x, other.y) < 100) {
          overlapping = true;
          break;
        }
      }
      attempts++;
    } while (overlapping && attempts < 50);

    holes.push({
      x: x,
      y: y,
      radius: 20,
      filled: false,
    });
  }
  return holes;
}

export function update(playerMarble, holes, score, canvasWidth, canvasHeight) {
  let scoreIncrease = 0;
  let anyMoving = false;

  // Check if player marble falls into holes
  holes.forEach((hole) => {
    if (!hole.filled) {
      const dist = distance(playerMarble.x, playerMarble.y, hole.x, hole.y);
      if (dist < hole.radius) {
        hole.filled = true;
        playerMarble.vx = 0;
        playerMarble.vy = 0;
        playerMarble.x = hole.x;
        playerMarble.y = hole.y;
        scoreIncrease += 20;
      }
    }
  });

  return { scoreIncrease, anyMoving }; // Note: hole mode doesn't have moving targets generally
}

export function draw(ctx, holes) {
  holes.forEach((hole) => {
    ctx.save();

    // Draw hole shadow
    const gradient = ctx.createRadialGradient(
      hole.x,
      hole.y,
      0,
      hole.x,
      hole.y,
      hole.radius
    );

    if (hole.filled) {
      gradient.addColorStop(0, "rgba(33, 150, 243, 0.8)");
      gradient.addColorStop(1, "rgba(33, 150, 243, 0.3)");
    } else {
      gradient.addColorStop(0, "rgba(0, 0, 0, 0.8)");
      gradient.addColorStop(1, "rgba(0, 0, 0, 0.3)");
    }

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(hole.x, hole.y, hole.radius, 0, Math.PI * 2);
    ctx.fill();

    // Draw hole rim
    ctx.strokeStyle = hole.filled ? "#2196F3" : "#654321";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(hole.x, hole.y, hole.radius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  });
}

export function checkLevelComplete(holes) {
  return holes.every((h) => h.filled);
}

export function countRemaining(holes) {
  return holes.filter((h) => !h.filled).length;
}
