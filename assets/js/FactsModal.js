/**
 * FactsModal.js
 * Manages the Facts Modal UI
 * Allows users to choose a game and view fact cards
 */

class FactsModal {
    constructor() {
        this.modal = null;
        this.isVisible = false;
        this.currentView = 'menu'; // 'menu' or 'viewer'
        this.selectedGame = null;
        this.currentSlide = 0;

        // Data Configuration
        this.games = {
            'jolen': {
                title: 'Jolen',
                icon: '🎯',
                slides: 3,
                pathPrefix: 'assets/game_facts_assets/jolen_facts_board_',
                cardImage: 'assets/startmenu/jolen_gamecard.png'
            },
            'patintero': {
                title: 'Patintero',
                icon: '🏃',
                slides: 3,
                pathPrefix: 'assets/patintero_assets/patintero_facts_board_',
                cardImage: 'assets/startmenu/patintero_gamecard.png'
            },
            'luksong': {
                title: 'Luksong Baka',
                icon: '🦘',
                slides: 3,
                pathPrefix: 'assets/game_facts_assets/luksong_baka_facts_board_',
                cardImage: 'assets/startmenu/luksong_baka_gamecard.png'
            }
        };

        this.init();
    }

    init() {
        // Create modal HTML structure
        const modalHTML = `
            <div id="factsModal" class="facts-modal-overlay hidden">
                <div class="facts-modal-content">
                    <div class="facts-modal-header">
                        <h2 id="factsTitle">Did You Know?</h2>
                        <button class="facts-close-btn" id="closeFacts">&times;</button>
                    </div>
                    
                    <div class="facts-modal-body" id="factsBody">
                        <!-- Content injected dynamically -->
                    </div>
                </div>
            </div>
        `;

        // Inject into body if not already present
        if (!document.getElementById('factsModal')) {
            document.body.insertAdjacentHTML('beforeend', modalHTML);
        }

        this.modal = document.getElementById('factsModal');
        this.body = document.getElementById('factsBody');
        this.title = document.getElementById('factsTitle');

        this.bindEvents();
    }

    bindEvents() {
        // Close button
        const closeBtn = document.getElementById('closeFacts');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hide());
        }

        // Close/Back on outside click
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                if (this.currentView === 'viewer') {
                    this.renderMenu();
                } else {
                    this.hide();
                }
            }
        });
    }

    show() {
        this.modal.classList.remove('hidden');
        this.isVisible = true;
        this.renderMenu();

        // Handle Music
        this.toggleMusic(true);
    }

    hide() {
        this.modal.classList.add('hidden');
        this.isVisible = false;

        // Handle Music
        this.toggleMusic(false);
    }

    toggleMusic(enabled) {
        const bgMusic = document.getElementById('bgMusic');
        const factsMusic = document.getElementById('factsMusic');

        if (enabled) {
            if (bgMusic) bgMusic.pause();
            if (factsMusic) {
                factsMusic.currentTime = 0;
                factsMusic.volume = 0.5;
                factsMusic.play().catch(e => console.log('Autoplay blocked:', e));
            }
        } else {
            if (factsMusic) {
                factsMusic.pause();
                factsMusic.currentTime = 0;
            }
            if (bgMusic) bgMusic.play().catch(e => console.log('Autoplay blocked:', e));
        }
    }

    renderMenu() {
        this.currentView = 'menu';
        this.selectedGame = null;
        this.title.textContent = 'DID YOU KNOW?';

        let gridHTML = '<div class="facts-game-grid">';

        for (const [key, game] of Object.entries(this.games)) {
            gridHTML += `
                <div class="fact-game-card" onclick="window.factsModal.selectGame('${key}')">
                    <img src="${game.cardImage}" alt="${game.title}" class="fact-game-img">
                </div>
            `;
        }

        gridHTML += '</div>';
        this.body.innerHTML = gridHTML;
    }

    selectGame(gameKey) {
        this.selectedGame = gameKey;
        this.currentSlide = 1; // Start at 1
        this.currentView = 'viewer';
        this.renderViewer();
    }

    renderViewer() {
        const game = this.games[this.selectedGame];
        this.title.textContent = game.title.toUpperCase();

        const imagePath = `${game.pathPrefix}${this.currentSlide}.png`;

        let dotsHTML = '<div class="facts-dots">';
        for (let i = 1; i <= game.slides; i++) {
            const activeClass = i === this.currentSlide ? 'active' : '';
            dotsHTML += `<div class="facts-dot ${activeClass}" onclick="window.factsModal.gotoSlide(${i})"></div>`;
        }
        dotsHTML += '</div>';

        this.body.innerHTML = `
            <div class="facts-viewer">
                <div class="facts-slide-container">
                    <img src="${imagePath}" class="facts-image" alt="Fact Card" onclick="window.factsModal.nextSlide()">
                </div>
                ${dotsHTML}
            </div>
        `;
    }

    nextSlide() {
        if (!this.selectedGame) return;
        const game = this.games[this.selectedGame];

        this.currentSlide++;
        if (this.currentSlide > game.slides) {
            this.currentSlide = 1;
        }
        this.renderViewer();
    }

    prevSlide() {
        if (!this.selectedGame) return;
        const game = this.games[this.selectedGame];

        this.currentSlide--;
        if (this.currentSlide < 1) {
            this.currentSlide = game.slides;
        }
        this.renderViewer();
    }

    gotoSlide(index) {
        if (!this.selectedGame) return;
        this.currentSlide = index;
        this.renderViewer();
    }
}

// Initialize on load
window.addEventListener('DOMContentLoaded', () => {
    window.factsModal = new FactsModal();
});
