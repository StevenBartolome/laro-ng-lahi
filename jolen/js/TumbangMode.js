import Sound from "./Sound.js";

export function setup(level, canvasWidth, canvasHeight) {
  return {
    x: canvasWidth / 2,
    y: canvasHeight / 3,
    width: 20,
    height: 70,
    color: "#FF9800",
    knocked: false,
    angle: 0,
  };
}

export function update(playerMarble, target, score, canvasWidth, canvasHeight) {
  let scoreIncrease = 0;
  let anyMoving = false;

  // Check if target is knocked down
  if (target && !target.knocked) {
    const dx = playerMarble.x - target.x;
    const dy = playerMarble.y - target.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < playerMarble.radius + target.width / 2) {
      target.knocked = true;
      target.angle = Math.PI / 2;
      scoreIncrease += 50;
      Sound.playHit();
    }
  }

  return { scoreIncrease, anyMoving };
}

export function draw(ctx, target) {
  if (!target) return;

  ctx.save();
  ctx.translate(target.x, target.y);
  ctx.rotate(target.angle);

  // Draw target (can/cylinder)
  const gradient = ctx.createLinearGradient(
    -target.width / 2,
    0,
    target.width / 2,
    0
  );
  gradient.addColorStop(0, "#E65100");
  gradient.addColorStop(0.5, target.color);
  gradient.addColorStop(1, "#E65100");

  ctx.fillStyle = gradient;
  ctx.fillRect(
    -target.width / 2,
    -target.height / 2,
    target.width,
    target.height
  );

  // Draw outline
  ctx.strokeStyle = "#BF360C";
  ctx.lineWidth = 3;
  ctx.strokeRect(
    -target.width / 2,
    -target.height / 2,
    target.width,
    target.height
  );

  // Draw bands
  ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-target.width / 2, -10);
  ctx.lineTo(target.width / 2, -10);
  ctx.moveTo(-target.width / 2, 10);
  ctx.lineTo(target.width / 2, 10);
  ctx.stroke();

  ctx.restore();
}

export function checkLevelComplete(target) {
  return target && target.knocked;
}

export function countRemaining(target) {
  return target && !target.knocked ? 1 : 0;
}
