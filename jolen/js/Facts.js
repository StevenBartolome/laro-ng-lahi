import Sound from "./Sound.js";

const Facts = {
    currentPage: 1,
    totalPages: 3,
    
    elements: {
        overlay: null,
        openBtn: null,
        closeBtn: null,
        board: null,
        dots: null,
    },

    init() {
        this.elements.overlay = document.getElementById('factsOverlay');
        this.elements.openBtn = document.getElementById('factsBtn');
        this.elements.closeBtn = document.getElementById('closeFactsBtn');
        this.elements.board = document.getElementById('factsBoard');
        this.elements.dots = document.querySelectorAll('.dot');

        if (!this.elements.openBtn || !this.elements.overlay) return;

        this.bindEvents();
    },

    bindEvents() {
        // Open
        this.elements.openBtn.addEventListener('click', () => {
            Sound.playClick();
            this.show();
        });

        // Close
        this.elements.closeBtn.addEventListener('click', () => {
            Sound.playClick();
            this.hide();
        });

        // Next Page (Click Board)
        if (this.elements.board) {
            this.elements.board.addEventListener('click', () => {
                Sound.playClick();
                this.nextPage();
            });
        }

        // Dot Navigation
        this.elements.dots.forEach(dot => {
            dot.addEventListener('click', (e) => {
                Sound.playClick();
                const index = parseInt(e.target.dataset.index);
                this.gotoPage(index);
            });
        });
    },

    show() {
        this.elements.overlay.classList.remove('hidden');
        this.gotoPage(1); // Reset to page 1
    },

    hide() {
        this.elements.overlay.classList.add('hidden');
    },

    nextPage() {
        this.currentPage++;
        if (this.currentPage > this.totalPages) {
            this.currentPage = 1;
        }
        this.updateUI();
    },

    gotoPage(index) {
        if (index >= 1 && index <= this.totalPages) {
            this.currentPage = index;
            this.updateUI();
        }
    },

    updateUI() {
        // Update Image
        if (this.elements.board) {
            this.elements.board.src = `../assets/jolen_assets/jolen_facts_board_${this.currentPage}.png`;
        }

        // Update Dots
        this.elements.dots.forEach(dot => {
            if (parseInt(dot.dataset.index) === this.currentPage) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
    }
};

export default Facts;
