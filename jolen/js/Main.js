import {
  FRICTION,
  MARBLE_RADIUS,
  PLAYER_COLOR,
  MAX_DRAG_DISTANCE,
  POWER_MULTIPLIER,
  COLLISION_ELASTICITY,
  loadAssets,
  images,
  updateMarble,
  drawMarble,
} from "./Common.js";

import * as TargetMode from "./TargetMode.js";
import * as CircleMode from "./CircleMode.js";
import * as HoleMode from "./HoleMode.js";
import * as TumbangMode from "./TumbangMode.js";
import * as LineMode from "./LineMode.js";

document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");
  const modeScreen = document.getElementById("mode-screen");
  const difficultyScreen = document.getElementById("difficulty-screen");
  const targetModeBtn = document.getElementById("target-mode-btn");
  const circleModeBtn = document.getElementById("circle-mode-btn");
  const holeModeBtn = document.getElementById("hole-mode-btn");
  const tumbangModeBtn = document.getElementById("tumbang-mode-btn");
  const lineModeBtn = document.getElementById("line-mode-btn");
  const backToModesBtn = document.getElementById("back-to-modes-btn");
  const modeTitleDisplay = document.getElementById("mode-title-display");
  const easyBtn = document.getElementById("easy-btn");
  const normalBtn = document.getElementById("normal-btn");
  const hardBtn = document.getElementById("hard-btn");
  const levelDisplay = document.getElementById("level-number");
  const scoreDisplay = document.getElementById("score-display");
  const targetsLeftDisplay = document.getElementById("targets-left");
  const instructionPrompt = document.getElementById("instruction-prompt");
  const helpBtn = document.getElementById("help-btn");
  const helpModal = document.getElementById("help-modal");
  const closeModal = document.querySelector(".close-btn");

  canvas.width = 1280;
  canvas.height = 720;

  // --- Game State ---
  let gameMode = "target"; // target, circle, hole, tumbang, line
  let currentModeModule = TargetMode;
  let modeState = null;

  let gameState = "idle"; // idle, dragging, shooting, success, gameOver
  let level = 1;
  let score = 0;
  let message = "";
  let messageTimer = 0;
  let isDragging = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let dragCurrentX = 0;
  let dragCurrentY = 0;

  let startingPosition = { x: canvas.width / 2, y: canvas.height - 100 };

  const playerMarble = {
    x: startingPosition.x,
    y: startingPosition.y,
    radius: MARBLE_RADIUS,
    vx: 0,
    vy: 0,
    color: PLAYER_COLOR,
    isMoving: false,
  };

  // --- Initialization ---
  loadAssets().then(() => {
    // console.log("Assets loaded");
  });

  // --- Helper Functions ---
  function resetPlayerMarble() {
    playerMarble.x = startingPosition.x;
    playerMarble.y = startingPosition.y;
    playerMarble.vx = 0;
    playerMarble.vy = 0;
    playerMarble.isMoving = false;
  }

  function stopPlayerMarble() {
    playerMarble.vx = 0;
    playerMarble.vy = 0;
    playerMarble.isMoving = false;
  }

  function resetGame(isSuccess) {
    if (isSuccess) {
      level++;
      score += 100 * level;
    } else {
      level = 1;
      score = 0;
    }

    levelDisplay.textContent = level;
    scoreDisplay.textContent = score;
    resetPlayerMarble();

    // Initialize Mode State
    modeState = currentModeModule.setup(level, canvas.width, canvas.height);

    updateTargetsLeft();
    gameState = "idle";
    isDragging = false;
    instructionPrompt.style.display = "flex";
  }

  function updateTargetsLeft() {
    const count = currentModeModule.countRemaining(modeState);
    targetsLeftDisplay.textContent = count;
  }

  // --- Drawing ---
  function drawDragLine() {
    if (!isDragging || gameState !== "dragging") return;

    ctx.save();

    // Calculate drag vector
    const dx = dragCurrentX - playerMarble.x;
    const dy = dragCurrentY - playerMarble.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const clampedDistance = Math.min(distance, MAX_DRAG_DISTANCE);

    // Draw drag line
    ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
    ctx.lineWidth = 4;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(playerMarble.x, playerMarble.y);
    ctx.lineTo(dragCurrentX, dragCurrentY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw trajectory line
    const trajectoryLength = clampedDistance * 1.5;
    const shootAngle = Math.atan2(-dy, -dx);
    const endX = playerMarble.x + Math.cos(shootAngle) * trajectoryLength;
    const endY = playerMarble.y + Math.sin(shootAngle) * trajectoryLength;

    ctx.strokeStyle = "rgba(255, 200, 0, 0.8)";
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 5]);
    ctx.beginPath();
    ctx.moveTo(playerMarble.x, playerMarble.y);
    ctx.lineTo(endX, endY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw arrow head
    ctx.fillStyle = "rgba(255, 200, 0, 0.8)";
    ctx.beginPath();
    ctx.moveTo(endX, endY);
    ctx.lineTo(
      endX - 15 * Math.cos(shootAngle - Math.PI / 6),
      endY - 15 * Math.sin(shootAngle - Math.PI / 6)
    );
    ctx.lineTo(
      endX - 15 * Math.cos(shootAngle + Math.PI / 6),
      endY - 15 * Math.sin(shootAngle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fill();

    // Power UI
    const powerPercent = (clampedDistance / MAX_DRAG_DISTANCE) * 100;
    ctx.strokeStyle =
      powerPercent > 75 ? "#f44336" : powerPercent > 50 ? "#FF9800" : "#4CAF50";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(
      playerMarble.x,
      playerMarble.y,
      playerMarble.radius + 5,
      0,
      Math.PI * 2
    );
    ctx.stroke();

    ctx.fillStyle = "white";
    ctx.strokeStyle = "black";
    ctx.lineWidth = 3;
    ctx.font = "bold 18px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const powerText = `${Math.round(powerPercent)}%`;
    ctx.strokeText(powerText, playerMarble.x, playerMarble.y - 30);
    ctx.fillText(powerText, playerMarble.x, playerMarble.y - 30);

    ctx.restore();
  }

  function drawMessage() {
    if (messageTimer > 0) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
      ctx.fillRect(0, canvas.height / 2 - 50, canvas.width, 100);
      ctx.fillStyle = "white";
      ctx.font = "bold 36px Arial";
      ctx.textAlign = "center";
      ctx.fillText(message, canvas.width / 2, canvas.height / 2 + 10);
      messageTimer--;
    } else {
      message = "";
    }
  }

  // --- Game Loop ---
  function update() {
    // Update marbles
    if (gameState === "shooting") {
      let anyMoving = false;

      // Update player marble
      if (updateMarble(playerMarble, canvas.width, canvas.height)) {
        anyMoving = true;
      }

      // Update Mode Logic
      const result = currentModeModule.update(
        playerMarble,
        modeState,
        score,
        canvas.width,
        canvas.height
      );

      if (result.anyMoving) anyMoving = true;
      if (result.scoreIncrease) {
        score += result.scoreIncrease;
        scoreDisplay.textContent = score;
        updateTargetsLeft();
      }

      // Check if level complete
      if (!anyMoving) {
        const levelComplete = currentModeModule.checkLevelComplete(modeState);

        if (levelComplete) {
          gameState = "success";
          message = "Level Complete!";
          messageTimer = 90;
        } else {
          gameState = "idle";
          stopPlayerMarble();
          instructionPrompt.style.display = "flex";
        }
      }
    }

    // Handle success
    if (gameState === "success" && messageTimer === 1) {
      resetGame(true);
    }

    // --- Drawing ---
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background
    if (images.background.complete && images.background.naturalWidth > 0) {
      ctx.drawImage(images.background, 0, 0, canvas.width, canvas.height);
    }

    // Draw Mode Specifics
    currentModeModule.draw(ctx, modeState);

    // Draw player marble
    drawMarble(
      ctx,
      playerMarble,
      gameState === "idle" || gameState === "dragging",
      true
    );

    // Draw drag line
    drawDragLine();

    // Draw message
    drawMessage();

    requestAnimationFrame(update);
  }

  // --- Input Handlers ---
  function getMousePos(e) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }

  function isMouseOnMarble(mouseX, mouseY) {
    const dx = mouseX - playerMarble.x;
    const dy = mouseY - playerMarble.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance <= playerMarble.radius + 10;
  }

  function handleMouseDown(e) {
    if (gameState !== "idle") return;

    const pos = getMousePos(e);
    if (isMouseOnMarble(pos.x, pos.y)) {
      isDragging = true;
      dragStartX = pos.x;
      dragStartY = pos.y;
      dragCurrentX = pos.x;
      dragCurrentY = pos.y;
      gameState = "dragging";
      instructionPrompt.style.display = "none";
    }
  }

  function handleMouseMove(e) {
    if (!isDragging || gameState !== "dragging") return;
    const pos = getMousePos(e);
    dragCurrentX = pos.x;
    dragCurrentY = pos.y;
  }

  function handleMouseUp(e) {
    if (!isDragging || gameState !== "dragging") return;

    const dx = dragCurrentX - playerMarble.x;
    const dy = dragCurrentY - playerMarble.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 5) {
      const clampedDistance = Math.min(distance, MAX_DRAG_DISTANCE);
      const power = clampedDistance * POWER_MULTIPLIER;
      const angle = Math.atan2(-dy, -dx);
      playerMarble.vx = Math.cos(angle) * power;
      playerMarble.vy = Math.sin(angle) * power;
      playerMarble.isMoving = true;
      gameState = "shooting";
    } else {
      gameState = "idle";
      instructionPrompt.style.display = "flex";
    }
    isDragging = false;
  }

  // Add Touch support functions (omitted for brevity but added in final if needed, similar to original)
  // I will add them back to be safe.

  function handleTouchStart(e) {
    e.preventDefault();
    if (gameState !== "idle") return;
    const touch = e.touches[0];
    const pos = getMousePos(touch);
    if (isMouseOnMarble(pos.x, pos.y)) {
      isDragging = true;
      dragStartX = pos.x;
      dragStartY = pos.y;
      dragCurrentX = pos.x;
      dragCurrentY = pos.y;
      gameState = "dragging";
      instructionPrompt.style.display = "none";
    }
  }
  function handleTouchMove(e) {
    e.preventDefault();
    if (!isDragging || gameState !== "dragging") return;
    const touch = e.touches[0];
    const pos = getMousePos(touch);
    dragCurrentX = pos.x;
    dragCurrentY = pos.y;
  }
  function handleTouchEnd(e) {
    e.preventDefault();
    if (!isDragging || gameState !== "dragging") return;
    // ... same logic as mouse up ...
    // To avoid duplication, I will just call handleMouseUp logic or copy it.
    // Copying to ensure availability of variables like dragCurrentX.
    const dx = dragCurrentX - playerMarble.x;
    const dy = dragCurrentY - playerMarble.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 5) {
      const clampedDistance = Math.min(distance, MAX_DRAG_DISTANCE);
      const power = clampedDistance * POWER_MULTIPLIER;
      const angle = Math.atan2(-dy, -dx);
      playerMarble.vx = Math.cos(angle) * power;
      playerMarble.vy = Math.sin(angle) * power;
      playerMarble.isMoving = true;
      gameState = "shooting";
    } else {
      gameState = "idle";
      instructionPrompt.style.display = "flex";
    }
    isDragging = false;
  }

  // --- Modal Handlers ---
  helpBtn.addEventListener("click", () => {
    helpModal.style.display = "block";
  });
  closeModal.addEventListener("click", () => {
    helpModal.style.display = "none";
  });
  window.addEventListener("click", (e) => {
    if (e.target === helpModal) {
      helpModal.style.display = "none";
    }
  });

  // --- Difficulty Selection ---
  function startGame(difficulty) {
    difficultyScreen.style.display = "none";
    document.getElementById("game-container").style.display = "block";

    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseup", handleMouseUp);
    canvas.addEventListener("touchstart", handleTouchStart, { passive: false });
    canvas.addEventListener("touchmove", handleTouchMove, { passive: false });
    canvas.addEventListener("touchend", handleTouchEnd, { passive: false });

    resetGame(true);
    update();
  }

  // --- Mode Selection ---
  function selectMode(mode, modeName) {
    gameMode = mode;
    switch (mode) {
      case "target":
        currentModeModule = TargetMode;
        break;
      case "circle":
        currentModeModule = CircleMode;
        break;
      case "hole":
        currentModeModule = HoleMode;
        break;
      case "tumbang":
        currentModeModule = TumbangMode;
        break;
      case "line":
        currentModeModule = LineMode;
        break;
    }
    modeScreen.style.display = "none";
    difficultyScreen.style.display = "flex";
    modeTitleDisplay.textContent = modeName;
  }

  targetModeBtn.addEventListener("click", () =>
    selectMode("target", "TARGET SHOOTING")
  );
  circleModeBtn.addEventListener("click", () =>
    selectMode("circle", "CIRCLE GAME")
  );
  holeModeBtn.addEventListener("click", () => selectMode("hole", "HOLE GAME"));
  tumbangModeBtn.addEventListener("click", () =>
    selectMode("tumbang", "TUMBANG PRESO")
  );
  lineModeBtn.addEventListener("click", () => selectMode("line", "LINE GAME"));

  backToModesBtn.addEventListener("click", () => {
    difficultyScreen.style.display = "none";
    modeScreen.style.display = "flex";
  });

  easyBtn.addEventListener("click", () => startGame("easy"));
  normalBtn.addEventListener("click", () => startGame("normal"));
  hardBtn.addEventListener("click", () => startGame("hard"));
});
