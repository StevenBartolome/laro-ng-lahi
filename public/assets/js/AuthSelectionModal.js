/**
 * AuthSelectionModal.js
 * Modal for selecting between Login and Guest Play
 */

class AuthSelectionModal {
    constructor() {
        this.modal = null;
        this.isVisible = false;
        this.init();
    }

    init() {
        // Create modal HTML structure
        const modalHTML = `
            <div id="authSelectionModal" class="settings-modal-overlay hidden">
                <div class="settings-modal-content" style="max-width: 400px; text-align: center;">
                    <button class="close-btn" id="closeAuthSelection">&times;</button>
                    
                    <div class="modal-header">
                        <h2>WELCOME</h2>
                    </div>
                    
                    <div class="modal-body" style="display: flex; flex-direction: column; gap: 20px; padding: 20px 0;">
                        <button class="wood-btn" id="loginBtn">LOGIN</button>
                        <div style="font-size: 14px; opacity: 0.8;">- OR -</div>
                        <button class="wood-btn" id="guestBtn" style="background: linear-gradient(to bottom, #6d4c41, #3e2723);">PLAY AS GUEST</button>
                    </div>
                </div>
            </div>
        `;

        // Inject into body if not exists
        if (!document.getElementById('authSelectionModal')) {
            document.body.insertAdjacentHTML('beforeend', modalHTML);
        }

        this.modal = document.getElementById('authSelectionModal');
        this.bindEvents();
    }

    bindEvents() {
        // Close button
        document.getElementById('closeAuthSelection').addEventListener('click', () => this.hide());

        // Login Button
        document.getElementById('loginBtn').addEventListener('click', () => {
            window.audioManager.playClick();
            window.location.href = 'login.html';
        });

        // Guest Button
        document.getElementById('guestBtn').addEventListener('click', () => {
            window.audioManager.playClick();
            // Set guest mode flag
            localStorage.setItem('guestMode', 'true');
            // Redirect to game select
            window.location.href = 'game_select.html';
        });

        // Close on outside click
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.hide();
            }
        });
    }

    show() {
        this.modal.classList.remove('hidden');
        this.isVisible = true;
    }

    hide() {
        this.modal.classList.add('hidden');
        this.isVisible = false;
    }
}

// Initialize on load
window.addEventListener('DOMContentLoaded', () => {
    window.authSelectionModal = new AuthSelectionModal();
});
