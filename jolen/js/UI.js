export const UI = {
  elements: {},

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
        this.hideMenu();
      });
    }

    // --- Facts Init ---
    this.elements.factsBtn = document.getElementById("factsBtn");
    this.elements.factsOverlay = document.getElementById("factsOverlay");
    this.elements.closeFactsBtn = document.getElementById("closeFactsBtn");
    this.elements.factsBoard = document.getElementById("factsBoard");
    this.elements.dots = document.querySelectorAll(".dot");

    if (this.elements.factsBtn) {
      this.elements.factsBtn.addEventListener("click", () => {
        this.showFacts();
      });
    }

    if (this.elements.closeFactsBtn) {
      this.elements.closeFactsBtn.addEventListener("click", () => {
        this.hideFacts();
      });
    }

    if (this.elements.factsBoard) {
      this.elements.factsBoard.addEventListener("click", () => {
        this.nextFact();
      });
    }

    if (this.elements.dots) {
      this.elements.dots.forEach((dot) => {
        dot.addEventListener("click", (e) => {
          const index = parseInt(e.target.dataset.index);
          this.setFact(index);
        });
      });
    }
  },

  // --- Facts Logic ---
  facts: {
    current: 1,
    total: 3,
  },

  showFacts() {
    this.facts.current = 1;
    this.updateFactDisplay();
    if (this.elements.factsOverlay)
      this.elements.factsOverlay.classList.remove("hidden");
  },

  hideFacts() {
    if (this.elements.factsOverlay)
      this.elements.factsOverlay.classList.add("hidden");
  },

  nextFact() {
    this.facts.current++;
    if (this.facts.current > this.facts.total) {
      this.facts.current = 1;
    }
    this.updateFactDisplay();
  },

  setFact(index) {
    this.facts.current = index;
    this.updateFactDisplay();
  },

  updateFactDisplay() {
    const board = this.elements.factsBoard;
    const dots = this.elements.dots;

    if (!board) return;

    // Simple fade out/in effect
    board.style.opacity = "0";
    board.style.transform = "translateY(10px)";

    setTimeout(() => {
      // Using jolen assets
      board.src = `../assets/game_facts_assets/jolen_facts_board_${this.facts.current}.png`;
      board.style.opacity = "1";
      board.style.transform = "translateY(0)";

      // Update dots
      if (dots) {
        dots.forEach((dot) => {
          dot.classList.toggle(
            "active",
            parseInt(dot.dataset.index) === this.facts.current
          );
        });
      }
    }, 200);
  },

  showMenu(mode = "both", showClose = true) {
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
    if (this.elements.menuOverlay) {
      this.elements.menuOverlay.classList.add("hidden");
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
