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
import * as LineMode from "./LineMode.js";

import { UI } from "./UI.js";
import Sound from "./Sound.js";
import Facts from "./Facts.js";

document.addEventListener("DOMContentLoaded", () => {
  // Init Modules
  Sound.init();
  UI.init();
  Facts.init();

  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");

  // Input Listeners (Global)
  canvas.addEventListener("mousedown", handleMouseDown);
  window.addEventListener("mousemove", handleMouseMove);
  window.addEventListener("mouseup", handleMouseUp);

  const instructionPrompt = document.getElementById("instruction-prompt");

  canvas.width = 1280;
  canvas.height = 720;

  // --- Game State ---
  let gameMode = "target"; // target, circle, hole, tumbang, line
  let currentModeModule = TargetMode;
  let modeState = null;

  let gameState = "idle"; // idle, dragging, shooting, success, gameOver
  let level = 1;
  let score = 0;
  let lives = 3;
  let shotScore = 0; // Track score gained in current shot to detect misses
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
    console.log("Assets loaded");
    // Show menu initially, disable close button to force selection
    UI.showMenu('both', true);
    UI.highlightMode(gameMode); // Highlight default mode
  });

  // --- Achievement Tracking ---
  let currentStreak = 0;
  let maxStreak = 0;
  let totalHits = 0;
  let totalShots = 0;
  let isPerfectGame = true;

  function trackAchievement() {
    if (window.achievementManager) {
      window.achievementManager.trackJolenGame({
        won: true,
        streak: maxStreak,
        perfect: isPerfectGame
      });
    }
  }

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
      lives = 3;
    }

    UI.updateLevel(level);
    UI.updateScore(score);
    UI.updateLives(lives);
    resetPlayerMarble();

    // Initialize Mode State
    modeState = currentModeModule.setup(level, canvas.width, canvas.height);

    updateTargetsLeft();
    gameState = "idle";
    isDragging = false;
    if (instructionPrompt) instructionPrompt.style.display = "flex";
  }

  function updateTargetsLeft() {
    const count = currentModeModule.countRemaining(modeState);
    const targetsDisplay = document.getElementById('targets-left');
    if (targetsDisplay) targetsDisplay.textContent = count;
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
  let lastTime = 0;
  function update(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;

    // Target 60 FPS (approx 16.67ms per frame)
    // timeScale will be ~1.0 at 60fps, ~0.5 at 120fps, ~2.0 at 30fps
    const timeScale = deltaTime / (1000 / 60);

    // Limit timeScale to prevent huge jumps if lag occurs (e.g. max 3 frames skipped)
    const clampedTimeScale = Math.min(timeScale, 4.0);

    // Update marbles
    if (gameState === "shooting") {
      let anyMoving = false;

      // Update player marble
      if (updateMarble(playerMarble, canvas.width, canvas.height, clampedTimeScale)) {
        anyMoving = true;
      }

      // Update Mode Logic
      const result = currentModeModule.update(
        playerMarble,
        modeState,
        score,
        canvas.width,
        canvas.height,
        clampedTimeScale
      );

      if (result.anyMoving) anyMoving = true;
      if (result.scoreIncrease) {
        score += result.scoreIncrease;
        shotScore += result.scoreIncrease; // Track score gained in this shot
        UI.updateScore(score);
        updateTargetsLeft();
      }

      // Check if level complete
      if (!anyMoving) {
        const levelComplete = currentModeModule.checkLevelComplete(modeState);

        if (levelComplete) {
          gameState = "success";
          message = "Level Complete!";
          messageTimer = 90;
        } else if (shotScore === 0) {
          // Player missed (didn't hit any targets) - deduct a life
          lives--;
          UI.updateLives(lives);

          if (lives <= 0) {
            // Game Over - show game over screen
            gameState = "gameOver";
            UI.showGameOver(score);
          } else {
            // Still has lives - show miss notification
            UI.showMessage(`Miss! ${lives} ❤️ left`, 'fail');
            gameState = "idle";
            stopPlayerMarble();
            if (instructionPrompt) instructionPrompt.style.display = "flex";
          }
        } else {
          // Hit target(s) but didn't complete level - just continue playing
          gameState = "idle";
          stopPlayerMarble();
          if (instructionPrompt) instructionPrompt.style.display = "flex";
        }

        // Reset shot score for next shot
        shotScore = 0;
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
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
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
      if (instructionPrompt) instructionPrompt.style.display = "none";
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
      if (instructionPrompt) instructionPrompt.style.display = "flex";
    }
    isDragging = false;
  }

  // --- Difficulty Selection ---
  function startGame(difficulty) {
    UI.setGameStarted(true);
    UI.hideMenu();
    document.getElementById("game-container").style.display = "block";

    UI.hideMenu();
    document.getElementById("game-container").style.display = "block";

    // Listeners are global now
    // Add touch if needed

    resetGame(false); // Reset to level 1
    update();
  }

  // --- Mode Selection ---
  function selectMode(mode) {
    gameMode = mode;
    UI.highlightMode(mode);

    switch (mode) {
      case "target": currentModeModule = TargetMode; break;
      case "circle": currentModeModule = CircleMode; break;
      case "hole": currentModeModule = HoleMode; break;
      case "line": currentModeModule = LineMode; break;
      default: currentModeModule = TargetMode; break;
    }
  }

  // --- Bind Buttons ---

  // Global button click sound
  document.querySelectorAll('button, a').forEach(btn => {
    btn.addEventListener('click', () => {
      Sound.playClick();
    });
  });

  if (UI.elements.modeBtns) {
    UI.elements.modeBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        // Sound.playClick(); // Handled globally above, but specific logic below
        const modeParts = btn.id.split('-'); // mode-target
        const mode = modeParts[1];
        selectMode(mode);
      });
    });
  }

  if (UI.elements.diffBtns) {
    UI.elements.diffBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        // Sound.playClick(); 
        const diffParts = btn.id.split('-'); // diff-easy
        const diff = diffParts[1];
        startGame(diff);
      });
    });
  }

  const menuBtn = document.getElementById('menuBtn');
  if (menuBtn) menuBtn.addEventListener('click', () => {
    UI.showMenu('both', true);
  });

  const infoBtn = document.getElementById('infoBtn');
  if (infoBtn) infoBtn.addEventListener('click', () => {
    UI.showMenu('instructions', true);
  });
});
