/**
 * SettingsModal.js
 * Manages the Settings Modal UI and interaction with AudioManager
 */

class SettingsModal {
    constructor() {
        this.modal = null;
        this.isVisible = false;
        this.init();
    }

    init() {
        // Create modal HTML structure
        const modalHTML = `
            <div id="settingsModal" class="settings-modal-overlay hidden">
                <div class="settings-modal-content">
                    <div class="modal-header">
                        <h2>SETTINGS</h2>
                        <button class="close-btn" id="closeSettings">&times;</button>
                    </div>
                    
                    <div class="modal-body">
                        <div class="setting-group">
                            <label>Master Volume</label>
                            <input type="range" id="masterVolumeParams" min="0" max="1" step="0.1" value="1">
                        </div>

                        <div class="setting-group">
                            <label>Music Volume</label>
                            <input type="range" id="musicVolumeParams" min="0" max="1" step="0.1" value="0.5">
                        </div>

                        <div class="setting-group">
                            <label>SFX Volume</label>
                            <input type="range" id="sfxVolumeParams" min="0" max="1" step="0.1" value="1">
                        </div>
                        
                        <div class="setting-group checkbox-group">
                            <label for="muteToggle">Mute All</label>
                            <input type="checkbox" id="muteToggle">
                        </div>
                    </div>
                    
                    <div class="modal-footer">
                        <button class="wood-btn" id="saveSettings">Done</button>
                    </div>
                </div>
            </div>
        `;

        // Inject into body
        if (!document.getElementById('settingsModal')) {
            document.body.insertAdjacentHTML('beforeend', modalHTML);
        }

        this.modal = document.getElementById('settingsModal');
        this.bindEvents();
        this.syncUI();
    }

    bindEvents() {
        const audioMgr = window.audioManager;
        
        // Close buttons
        document.getElementById('closeSettings').addEventListener('click', () => this.hide());
        document.getElementById('saveSettings').addEventListener('click', () => this.hide());
        
        // Sliders
        const masterSlider = document.getElementById('masterVolumeParams');
        masterSlider.addEventListener('input', (e) => {
            audioMgr.setMasterVolume(e.target.value);
        });

        const musicSlider = document.getElementById('musicVolumeParams');
        musicSlider.addEventListener('input', (e) => {
            audioMgr.setMusicVolume(e.target.value);
        });

        const sfxSlider = document.getElementById('sfxVolumeParams');
        sfxSlider.addEventListener('input', (e) => {
            audioMgr.setSFXVolume(e.target.value);
            // Play a test sound if available
            // const clickSound = document.getElementById('clickSound');
            // if(clickSound) audioMgr.playSFX(clickSound);
        });

        // Mute Toggle
        const muteToggle = document.getElementById('muteToggle');
        muteToggle.addEventListener('change', (e) => {
            audioMgr.toggleMute();
        });

        // Close on outside click
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.hide();
            }
        });
    }

    syncUI() {
        const settings = window.audioManager.settings;
        document.getElementById('masterVolumeParams').value = settings.masterVolume;
        document.getElementById('musicVolumeParams').value = settings.musicVolume;
        document.getElementById('sfxVolumeParams').value = settings.sfxVolume;
        document.getElementById('muteToggle').checked = settings.isMuted;
    }

    show() {
        this.syncUI();
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
    window.settingsModal = new SettingsModal();
});
