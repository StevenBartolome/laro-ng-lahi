export const UI = {
  elements: {},
  gameStarted: false,
  currentMenuMode: 'both',

  setGameStarted(val) {
    console.log('UI: Game started set to', val);
    this.gameStarted = val;
  },

  init() {
    this.elements = {
      menuOverlay: document.getElementById("menuOverlay"),
      closeOverlayBtn: document.getElementById("closeOverlayBtn"),
      levelDisplay: document.getElementById("level-display"),
      scoreDisplay: document.getElementById("score-display"),
      livesDisplay: document.getElementById("livesDisplay"),
      messageOverlay: document.getElementById("messageOverlay"),
      messageText: document.getElementById("messageText"),
      modeBtns: document.querySelectorAll(".mode-btn"),
      diffBtns: document.querySelectorAll(".diff-btn"),
      overlayContent: document.querySelector(".overlay-content"),
      gameContainer: document.getElementById("game-container"),
      appContainer: document.querySelector(".app-container"),
    };

    this.messageTimeout = null;

    if (this.elements.closeOverlayBtn) {
      this.elements.closeOverlayBtn.addEventListener("click", () => {
        if (this.gameStarted) {
          this.hideMenu();
        } else {
          // If viewing instructions specifically, go back to main menu
          if (this.currentMenuMode === 'instructions') {
            this.showMenu('both', true);
          } else {
            // Otherwise (e.g. 'both' or 'difficulty'), exit to game select
            window.location.href = '../game_select.php';
          }
        }
      });
    }


  },



  showMenu(mode = "both", showClose = true) {
    this.currentMenuMode = mode;
    console.log('UI: showMenu', { mode, showClose, gameStarted: this.gameStarted });
    if (!this.elements.menuOverlay) return;

    // Manage Close Button Visibility
    if (this.elements.closeOverlayBtn) {
      this.elements.closeOverlayBtn.style.display = showClose
        ? "block"
        : "none";
    }

    const instructionsPanel = this.elements.menuOverlay.querySelector(
      ".instructions-panel"
    );
    const difficultyPanel =
      this.elements.menuOverlay.querySelector(".difficulty-panel");
    const menuGrid = this.elements.menuOverlay.querySelector(".menu-grid");
    const overlayContent = this.elements.overlayContent;

    // Reset display
    if (instructionsPanel) instructionsPanel.style.display = "block";
    if (difficultyPanel) difficultyPanel.style.display = "block";
    if (menuGrid) {
      menuGrid.style.gridTemplateColumns = "1fr 1.2fr";
      menuGrid.style.display = "grid";
    }

    if (mode === "instructions") {
      if (difficultyPanel) difficultyPanel.style.display = "none";
      if (menuGrid) {
        menuGrid.style.gridTemplateColumns = "1fr";
        menuGrid.style.display = "block"; // Or grid with 1 col
      }
      if (overlayContent) overlayContent.style.maxWidth = "500px";
    } else if (mode === "difficulty") {
      if (instructionsPanel) instructionsPanel.style.display = "none";
      if (menuGrid) {
        menuGrid.style.gridTemplateColumns = "1fr";
        menuGrid.style.display = "block";
      }
      if (overlayContent) overlayContent.style.maxWidth = "600px";
    } else {
      // Both
      if (overlayContent) overlayContent.style.maxWidth = "1000px";
    }

    this.elements.menuOverlay.classList.remove("hidden");
  },

  hideMenu() {
    // Check if game container is visible to determine state
    const isGameVisible = this.elements.gameContainer && this.elements.gameContainer.style.display === "block";
    console.log('UI: hideMenu called. isGameVisible:', isGameVisible);

    if (!isGameVisible) {
      console.log('UI: Game not visible, forcing Main Menu return');
      this.showMenu('both', false);
    } else {
      console.log('UI: Game visible, hiding overlay');
      if (this.elements.menuOverlay) {
        this.elements.menuOverlay.classList.add("hidden");
      }
    }
  },

  updateScore(score) {
    if (this.elements.scoreDisplay) {
      this.elements.scoreDisplay.textContent = score;
    }
  },

  updateLevel(level) {
    if (this.elements.levelDisplay) {
      this.elements.levelDisplay.textContent = level;
    }
  },

  updateLives(lives) {
    for (let i = 1; i <= 3; i++) {
      const heart = document.getElementById('heart' + i);
      if (heart) {
        if (i <= lives) {
          heart.classList.remove('lost');
        } else {
          heart.classList.add('lost');
        }
      }
    }
  },

  showMessage(text, type) {
    if (this.messageTimeout) clearTimeout(this.messageTimeout);

    if (this.elements.messageText && this.elements.messageOverlay) {
      this.elements.messageText.textContent = text;
      this.elements.messageText.className = type || '';
      this.elements.messageOverlay.classList.remove('hidden');

      this.messageTimeout = setTimeout(() => {
        this.elements.messageOverlay.classList.add('hidden');
      }, 1500);
    }
  },

  showGameOver(score) {
    if (this.messageTimeout) clearTimeout(this.messageTimeout);

    if (!this.elements.messageOverlay || !this.elements.messageText) return;

    // Add backdrop class to overlay
    this.elements.messageOverlay.classList.add('game-complete-backdrop');

    this.elements.messageText.innerHTML = `
      <div class="game-complete-content">
        <div class="complete-header fail">GAME OVER</div>
        <div class="complete-sub">You ran out of lives!</div>
        <div class="complete-score">Score: ${score}</div>
        <div class="complete-buttons">
          <button id="retryBtn" class="restart-btn">Try Again</button>
          <a href="../game_select.php" class="back-menu-btn">Main Menu</a>
        </div>
      </div>
    `;
    this.elements.messageText.className = 'game-complete-box';
    this.elements.messageOverlay.classList.remove('hidden');

    // Setup retry button
    setTimeout(() => {
      const retryBtn = document.getElementById('retryBtn');
      if (retryBtn) {
        retryBtn.addEventListener('click', () => {
          // Reload the page to restart the game
          window.location.reload();
        });
      }

      // Back to menu button sound (if Sound module exists)
      const backBtn = document.querySelector('.back-menu-btn');
      if (backBtn && window.Sound) {
        backBtn.addEventListener('click', () => Sound.playClick());
      }
    }, 100);
  },

  highlightMode(modeId) {
    this.elements.modeBtns.forEach((btn) => {
      if (btn.id === "mode-" + modeId) {
        btn.style.borderColor = "#ffd700"; // Highlight
        btn.style.background = "rgba(141, 110, 99, 0.8)";
      } else {
        btn.style.borderColor = "";
        btn.style.background = "";
      }
    });
  },
};
