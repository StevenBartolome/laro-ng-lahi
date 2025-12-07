export const FRICTION = 0.98;
export const MARBLE_RADIUS = 12;
export const PLAYER_COLOR = "#2196F3";
export const TARGET_COLOR = "#f44336";
export const MAX_DRAG_DISTANCE = 150;
export const POWER_MULTIPLIER = 0.15;
export const COLLISION_ELASTICITY = 0.8;
export const CIRCLE_RADIUS = 220;

export const images = {
  background: new Image(),
  playerMarble: new Image(),
  targetMarbleRed: new Image(),
  targetMarbleGreen: new Image(),
  targetMarbleYellow: new Image(),
};

export function loadAssets() {
  return new Promise((resolve) => {
    let assetsLoaded = 0;
    const totalAssets = 5;

    function onAssetLoad() {
      assetsLoaded++;
      if (assetsLoaded === totalAssets) {
        console.log("All jolen assets loaded!");
        resolve();
      }
    }

    images.background.onload = onAssetLoad;
    images.playerMarble.onload = onAssetLoad;
    images.targetMarbleRed.onload = onAssetLoad;
    images.targetMarbleGreen.onload = onAssetLoad;
    images.targetMarbleYellow.onload = onAssetLoad;

    images.background.src = "../assets/jolen_assets/game_background.png";
    images.playerMarble.src = "../assets/jolen_assets/player_marble.png";
    images.targetMarbleRed.src = "../assets/jolen_assets/target_marble_red.png";
    images.targetMarbleGreen.src =
      "../assets/jolen_assets/target_marble_green.png";
    images.targetMarbleYellow.src =
      "../assets/jolen_assets/target_marble_yellow.png";
  });
}

export function distance(x1, y1, x2, y2) {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

export function checkMarbleCollision(m1, m2) {
  const dx = m2.x - m1.x;
  const dy = m2.y - m1.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist < m1.radius + m2.radius) {
    // Collision detected
    const angle = Math.atan2(dy, dx);
    const sin = Math.sin(angle);
    const cos = Math.cos(angle);

    // Rotate velocities
    const vx1 = m1.vx * cos + m1.vy * sin;
    const vy1 = m1.vy * cos - m1.vx * sin;
    const vx2 = m2.vx * cos + m2.vy * sin;
    const vy2 = m2.vy * cos - m2.vx * sin;

    // Exchange velocities with elasticity
    const temp = vx1;
    m1.vx = vx2 * COLLISION_ELASTICITY * cos - vy1 * sin;
    m1.vy = vy1 * cos + vx2 * COLLISION_ELASTICITY * sin;
    m2.vx = temp * COLLISION_ELASTICITY * cos - vy2 * sin;
    m2.vy = vy2 * cos + temp * COLLISION_ELASTICITY * sin;

    // Separate marbles
    const overlap = (m1.radius + m2.radius - dist) / 2;
    const separateX = overlap * cos;
    const separateY = overlap * sin;

    m1.x -= separateX;
    m1.y -= separateY;
    m2.x += separateX;
    m2.y += separateY;

    return true;
  }
  return false;
}

export function updateMarble(marble, canvasWidth, canvasHeight) {
  // Apply friction
  marble.vx *= FRICTION;
  marble.vy *= FRICTION;

  // Update position
  marble.x += marble.vx;
  marble.y += marble.vy;

  // Wall collisions
  if (marble.x - marble.radius < 0) {
    marble.x = marble.radius;
    marble.vx *= -COLLISION_ELASTICITY;
  }
  if (marble.x + marble.radius > canvasWidth) {
    marble.x = canvasWidth - marble.radius;
    marble.vx *= -COLLISION_ELASTICITY;
  }
  if (marble.y - marble.radius < 0) {
    marble.y = marble.radius;
    marble.vy *= -COLLISION_ELASTICITY;
  }
  if (marble.y + marble.radius > canvasHeight) {
    marble.y = canvasHeight - marble.radius;
    marble.vy *= -COLLISION_ELASTICITY;
  }

  // Check if stopped
  if (Math.abs(marble.vx) < 0.1 && Math.abs(marble.vy) < 0.1) {
    marble.vx = 0;
    marble.vy = 0;
    return false; // Not moving
  }
  return true; // Still moving
}

export function drawMarble(ctx, marble, glow = false, isPlayer = false) {
  ctx.save();

  // Draw glow effect
  if (glow) {
    ctx.shadowBlur = 20;
    ctx.shadowColor = marble.color || PLAYER_COLOR;
  }

  // Determine which image to use
  let marbleImage = null;
  if (isPlayer) {
    marbleImage = images.playerMarble;
  } else if (marble.colorIndex !== undefined) {
    switch (marble.colorIndex) {
      case 0:
        marbleImage = images.targetMarbleRed;
        break;
      case 1:
        marbleImage = images.targetMarbleGreen;
        break;
      case 2:
        marbleImage = images.targetMarbleYellow;
        break;
    }
  }

  // Draw marble with image if loaded, otherwise use gradient
  if (marbleImage && marbleImage.complete && marbleImage.naturalWidth > 0) {
    const size = marble.radius * 2;
    ctx.drawImage(
      marbleImage,
      marble.x - marble.radius,
      marble.y - marble.radius,
      size,
      size
    );
  } else {
    // Fallback to gradient rendering
    const gradient = ctx.createRadialGradient(
      marble.x - marble.radius / 3,
      marble.y - marble.radius / 3,
      marble.radius / 4,
      marble.x,
      marble.y,
      marble.radius
    );
    gradient.addColorStop(0, "rgba(255, 255, 255, 0.8)");
    gradient.addColorStop(0.4, marble.color || PLAYER_COLOR);
    gradient.addColorStop(1, "rgba(0, 0, 0, 0.5)");

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(marble.x, marble.y, marble.radius, 0, Math.PI * 2);
    ctx.fill();

    // Draw highlight
    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    ctx.beginPath();
    ctx.arc(
      marble.x - marble.radius / 3,
      marble.y - marble.radius / 3,
      marble.radius / 3,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // Draw outline
    ctx.strokeStyle = "rgba(0, 0, 0, 0.3)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(marble.x, marble.y, marble.radius, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();
}
