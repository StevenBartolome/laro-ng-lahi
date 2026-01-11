/**
 * Luksong Baka - Sound Management
 * Handles background music and sound effects with volume controls
 */

const Sound = {
    bgMusic: null,
    jumpSound: null,
    runSound: null,
    clickSound: null,
    overchargeSound: null,
    bgmVolume: 0.5,
    sfxVolume: 0.7,
    
    init() {
        this.bgMusic = document.getElementById('bgMusic');
        this.jumpSound = document.getElementById('jumpSound');
        this.runSound = document.getElementById('runSound');
        this.clickSound = document.getElementById('clickSound');
        this.overchargeSound = document.getElementById('overchargeSound');
        
        // Apply initial volumes
        if (this.runSound) this.runSound.volume = this.sfxVolume * 0.6;
        if (this.clickSound) this.clickSound.volume = this.sfxVolume; // Lower volume for running
        
        // Setup BGM volume slider
        const bgmSlider = document.getElementById('bgmVolume');
        if (bgmSlider) {
            bgmSlider.addEventListener('input', (e) => this.setBgmVolume(e.target.value / 100));
            
            // Load saved BGM volume
            const savedBgmVolume = localStorage.getItem('luksongBakaBgmVolume');
            if (savedBgmVolume !== null) {
                bgmSlider.value = parseFloat(savedBgmVolume) * 100;
                this.bgmVolume = parseFloat(savedBgmVolume);
            }
        }
        
        // Setup SFX volume slider
        const sfxSlider = document.getElementById('sfxVolume');
        if (sfxSlider) {
            sfxSlider.addEventListener('input', (e) => this.setSfxVolume(e.target.value / 100));
            
            // Load saved SFX volume
            const savedSfxVolume = localStorage.getItem('luksongBakaSfxVolume');
            if (savedSfxVolume !== null) {
                sfxSlider.value = parseFloat(savedSfxVolume) * 100;
                this.sfxVolume = parseFloat(savedSfxVolume);
            }
        }
        
        // Apply initial volumes
        if (this.bgMusic) this.bgMusic.volume = this.bgmVolume;
        if (this.jumpSound) this.jumpSound.volume = this.sfxVolume;
        
        // Try to autoplay BGM on load
        this.tryAutoplayBGM();
    },
    
    tryAutoplayBGM() {
        if (this.bgMusic) {
            const playPromise = this.bgMusic.play();
            if (playPromise !== undefined) {
                playPromise.catch(() => {
                    // Autoplay blocked - add click listener fallback
                    document.addEventListener('click', () => {
                        this.bgMusic.play().catch(() => {});
                    }, { once: true });
                });
            }
        }
    },
    
    startMusic() {
        if (this.bgMusic && this.bgmVolume > 0) {
            this.bgMusic.play().catch(() => {
                // Browser blocked autoplay
            });
        }
    },
    
    playJump() {
        if (this.jumpSound && this.sfxVolume > 0) {
            this.jumpSound.currentTime = 0;
            this.jumpSound.play().catch(() => {});
        }
    },

    playRun() {
        if (this.runSound && this.sfxVolume > 0 && this.runSound.paused) {
            this.runSound.play().catch(() => {});
        }
    },

    stopRun() {
        if (this.runSound) {
            this.runSound.pause();
            this.runSound.currentTime = 0;
        }
    },
    
    playClick() {
        if (this.clickSound && this.sfxVolume > 0) {
            this.clickSound.currentTime = 0;
            this.clickSound.play().catch(() => {});
        }
    },
    
    playOvercharge() {
        if (this.overchargeSound && this.sfxVolume > 0) {
            this.overchargeSound.currentTime = 0;
            this.overchargeSound.play().catch(() => {});
        }
    },
    
    setBgmVolume(volume) {
        this.bgmVolume = Math.max(0, Math.min(1, volume));
        
        if (this.bgMusic) {
            this.bgMusic.volume = this.bgmVolume;
            
            // If volume is 0, pause; if > 0 and paused, try to play
            if (this.bgmVolume === 0) {
                this.bgMusic.pause();
            } else if (this.bgMusic.paused) {
                this.bgMusic.play().catch(() => {});
            }
        }
        
        // Save to localStorage
        localStorage.setItem('luksongBakaBgmVolume', this.bgmVolume);
    },
    
    setSfxVolume(volume) {
        this.sfxVolume = Math.max(0, Math.min(1, volume));
        
        if (this.jumpSound) {
            this.jumpSound.volume = this.sfxVolume;
        }
        if (this.runSound) {
            this.runSound.volume = this.sfxVolume * 0.6;
        }
        if (this.clickSound) {
            this.clickSound.volume = this.sfxVolume;
        }
        if (this.overchargeSound) {
            this.overchargeSound.volume = this.sfxVolume;
        }
        
        // Save to localStorage
        localStorage.setItem('luksongBakaSfxVolume', this.sfxVolume);
    },
    
    pauseMusic() {
        if (this.bgMusic) {
            this.bgMusic.pause();
        }
        if (this.runSound) {
            this.runSound.pause();
        }
    },

    resumeMusic() {
        if (this.bgMusic && this.bgmVolume > 0) {
            this.bgMusic.play().catch(() => {});
        }
    }
};

// Make available globally
window.Sound = Sound;
