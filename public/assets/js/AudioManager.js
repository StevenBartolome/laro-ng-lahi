/**
 * AudioManager.js
 * Centralized audio management for Laro ng Lahi
 * Handles music, SFX, and master volume with localStorage persistence
 */

class AudioManager {
    constructor() {
        if (AudioManager.instance) {
            return AudioManager.instance;
        }
        AudioManager.instance = this;

        // Default settings
        this.settings = {
            masterVolume: 1.0,
            musicVolume: 0.5,
            sfxVolume: 1.0,
            isMuted: false
        };

        // Audio elements registry
        this.musicElements = new Set();
        this.sfxElements = new Set();
        
        // Initialize
        this.loadSettings();
        this.setupStorageListener();
    }

    /**
     * Load settings from localStorage
     */
    loadSettings() {
        const saved = localStorage.getItem('laro_audio_settings');
        if (saved) {
            try {
                this.settings = { ...this.settings, ...JSON.parse(saved) };
            } catch (e) {
                console.error('Failed to load audio settings', e);
            }
        }
        this.applySettings();
    }

    /**
     * Save settings to localStorage
     */
    saveSettings() {
        localStorage.setItem('laro_audio_settings', JSON.stringify(this.settings));
        // Broadcast change for other tabs/windows
        window.dispatchEvent(new CustomEvent('audioSettingsChanged', { detail: this.settings }));
    }

    /**
     * Register a music element to be controlled handles
     * @param {HTMLAudioElement} audio 
     */
    registerMusic(audio) {
        if (!audio) return;
        this.musicElements.add(audio);
        this.updateElementVolume(audio, 'music');
    }

    /**
     * Register an SFX element to be controlled handles
     * @param {HTMLAudioElement} audio 
     */
    registerSFX(audio) {
        if (!audio) return;
        this.sfxElements.add(audio);
        this.updateElementVolume(audio, 'sfx');
    }

    /**
     * Update volume for a specific element
     */
    updateElementVolume(audio, type) {
        if (this.settings.isMuted) {
            audio.volume = 0;
            return;
        }

        const master = this.settings.masterVolume;
        const typeVol = type === 'music' ? this.settings.musicVolume : this.settings.sfxVolume;
        
        // Final volume = Master * Type Volume
        audio.volume = Math.min(Math.max(master * typeVol, 0), 1);
    }

    /**
     * Apply current settings to all registered elements
     */
    applySettings() {
        this.musicElements.forEach(el => this.updateElementVolume(el, 'music'));
        this.sfxElements.forEach(el => this.updateElementVolume(el, 'sfx'));
    }

    /**
     * Setters for volume controls
     */
    setMasterVolume(value) {
        this.settings.masterVolume = parseFloat(value);
        this.saveSettings();
        this.applySettings();
    }

    setMusicVolume(value) {
        this.settings.musicVolume = parseFloat(value);
        this.saveSettings();
        this.applySettings();
    }

    setSFXVolume(value) {
        this.settings.sfxVolume = parseFloat(value);
        this.saveSettings();
        this.applySettings();
    }

    toggleMute() {
        this.settings.isMuted = !this.settings.isMuted;
        this.saveSettings();
        this.applySettings();
        return this.settings.isMuted;
    }

    /**
     * Helper to play SFX (handling overlap)
     */
    playSFX(audioElement) {
        if (!audioElement) return;
        
        // cloneNode to allow overlapping sounds (rapid fire)
        // or just reset currentTime if we want simple behavior
        if (audioElement.paused) {
            this.registerSFX(audioElement);
            audioElement.currentTime = 0;
            audioElement.play().catch(() => {});
        } else {
            // If already playing, creating a clone might be better for "rapid fire"
            // but for simple UI clicks, resetting is fine.
            audioElement.currentTime = 0;
            audioElement.play().catch(() => {});
        }
    }

    setupStorageListener() {
        // Listen for changes from other tabs
        window.addEventListener('storage', (e) => {
            if (e.key === 'laro_audio_settings') {
                this.loadSettings();
            }
        });
    }
}

// Export global instance
window.audioManager = new AudioManager();
