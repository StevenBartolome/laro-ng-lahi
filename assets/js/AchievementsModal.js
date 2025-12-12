/**
 * AchievementsModal.js
 * Manages the Achievements Modal UI, similar to SettingsModal
 * Handles display of achievements and guest/user states
 */

class AchievementsModal {
    constructor() {
        this.modal = null;
        this.isVisible = false;
        this.init();
    }

    init() {
        // Create modal HTML structure
        const modalHTML = `
            <div id="achievementsModal" class="achievements-modal-overlay hidden">
                <div class="achievements-modal-content">
                    <div class="achievements-modal-header">
                        <h2>🏆 Achievements</h2>
                        <button class="achievements-close-btn" id="closeAchievements">&times;</button>
                    </div>
                    
                    <div class="achievements-modal-body" id="achievementsBody">
                        <!-- Content will be injected here -->
                    </div>
                </div>
            </div>
        `;

        // Inject into body if not already present
        if (!document.getElementById('achievementsModal')) {
            document.body.insertAdjacentHTML('beforeend', modalHTML);
        }

        this.modal = document.getElementById('achievementsModal');
        this.body = document.getElementById('achievementsBody');

        this.bindEvents();
    }

    bindEvents() {
        // Close button
        const closeBtn = document.getElementById('closeAchievements');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hide());
        }

        // Close on outside click
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.hide();
            }
        });
    }

    show() {
        this.renderContent();
        this.modal.classList.remove('hidden');
        this.isVisible = true;
    }

    hide() {
        this.modal.classList.add('hidden');
        this.isVisible = false;
    }

    renderContent() {
        // Access global user state
        const isGuest = window.currentUser ? window.currentUser.isGuest : true;

        if (isGuest) {
            this.renderGuestMessage();
        } else {
            this.renderAchievements();
        }
    }

    renderGuestMessage() {
        this.body.innerHTML = `
            <div class="modal-guest-message">
                <div class="modal-guest-icon">🔒</div>
                <h3 class="modal-guest-title">Achievements Locked</h3>
                <p class="modal-guest-text">
                    You are currently playing as a Guest. <br>
                    Log in to track your progress and unlock achievements!
                </p>
                <a href="login.php" class="modal-login-btn">Login Now</a>
            </div>
        `;
    }

    async renderAchievements() {
        const am = window.achievementManager;

        if (!am || !am.initialized) {
            this.body.innerHTML = '<div class="modal-guest-message"><p>Loading achievements...</p></div>';
            // Retry briefly if not initialized (though it should be by the time user clicks)
            if (am && !am.initialized && window.currentUser && window.currentUser.id) {
                await am.init(window.currentUser.id, false);
            } else if (!am) {
                this.body.innerHTML = '<div class="modal-guest-message"><p>Error loading Achievement Manager.</p></div>';
                return;
            }
        }

        const progress = am.getProgress();

        let html = `
            <div class="modal-progress-container">
                <div class="modal-progress-bar-bg">
                    <div class="modal-progress-bar-fill" style="width: ${progress.percentage}%"></div>
                </div>
                <div class="modal-progress-text">
                    ${progress.unlocked} of ${progress.total} Unlocked (${progress.percentage}%)
                </div>
            </div>
        `;

        const categories = [
            { id: 'general', name: 'General', icon: '🎮' },
            { id: 'jolen', name: 'Jolen', icon: '🎯' },
            { id: 'patintero', name: 'Patintero', icon: '🏃' },
            { id: 'luksong', name: 'Luksong Baka', icon: '🦘' },
            { id: 'special', name: 'Special', icon: '🏆' }
        ];

        categories.forEach(cat => {
            const achievements = am.getAchievementsByCategory(cat.id);
            if (achievements.length > 0) {
                html += `
                    <div class="modal-category-section">
                        <div class="modal-category-header">
                            <span>${cat.icon}</span> ${cat.name} Achievements
                        </div>
                        <div class="modal-achievements-grid">
                            ${achievements.map(ach => this.createCardHTML(ach)).join('')}
                        </div>
                    </div>
                `;
            }
        });

        this.body.innerHTML = html;
    }

    createCardHTML(ach) {
        const unlockedClass = ach.unlocked ? 'unlocked' : 'locked';
        const badge = ach.unlocked ? '<div class="modal-status-badge">UNLOCKED</div>' : '';

        return `
            <div class="modal-achievement-card ${unlockedClass}">
                ${badge}
                <div class="modal-achievement-icon">${ach.icon}</div>
                <div class="modal-achievement-details">
                    <div class="modal-achievement-name">${ach.name}</div>
                    <div class="modal-achievement-desc">${ach.description}</div>
                </div>
            </div>
        `;
    }
}

// Initialize on load
window.addEventListener('DOMContentLoaded', () => {
    window.achievementsModal = new AchievementsModal();
});
