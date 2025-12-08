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

        // Generate Particles
        const container = document.querySelector('.facts-container');
        if (container) {
            // Clear existing
            const oldParticles = container.querySelectorAll('.particle');
            oldParticles.forEach(p => p.remove());

            // Spawn new ones
            for (let i = 0; i < 50; i++) {
                const p = document.createElement('div');
                p.classList.add('particle');
                p.style.left = Math.random() * 100 + '%';
                p.style.top = Math.random() * 100 + '%';
                p.style.width = (Math.random() * 10 + 5) + 'px';
                p.style.height = p.style.width;
                p.style.animationDelay = Math.random() * 2 + 's';
                p.style.background = `radial-gradient(circle, ${['#00e5ff', '#ffd700', '#fff'][Math.floor(Math.random()*3)]}, transparent)`;
                container.appendChild(p);
            }
        }
        
        // Pause BGM and Play Facts Music
        const bgMusic = document.getElementById('bgMusic');
        const factsMusic = document.getElementById('factsMusic');
        if (bgMusic) bgMusic.pause();
        if (factsMusic) {
            factsMusic.volume = 0.5;
            factsMusic.currentTime = 0;
            factsMusic.play().catch(()=>{});
        }
    },

    hide() {
        this.elements.overlay.classList.add('hidden');

        // Stop Facts Music and Resume BGM
        const bgMusic = document.getElementById('bgMusic');
        const factsMusic = document.getElementById('factsMusic');
        if (factsMusic) {
            factsMusic.pause();
            factsMusic.currentTime = 0;
        }
        if (bgMusic) bgMusic.play().catch(()=>{});
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
            this.elements.board.src = `../assets/game_facts_assets/jolen_facts_board_${this.currentPage}.png`;
        }

        // Update Dots
        if (this.elements.dots) {
            this.elements.dots.forEach(dot => {
                if (parseInt(dot.dataset.index) === this.currentPage) {
                    dot.classList.add('active');
                } else {
                    dot.classList.remove('active');
                }
            });
        }
    }
};

export default Facts;
