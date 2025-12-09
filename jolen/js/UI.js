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
      modeBtns: document.querySelectorAll(".mode-btn"),
      diffBtns: document.querySelectorAll(".diff-btn"),
      overlayContent: document.querySelector(".overlay-content"),
      gameContainer: document.getElementById("game-container"),
      appContainer: document.querySelector(".app-container"),
    };

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
