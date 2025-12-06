/**
 * Luksong Baka - Sound Management
 * Handles background music and sound effects with volume controls
 */

const Sound = {
    bgMusic: null,
    jumpSound: null,
    bgmVolume: 0.5,
    sfxVolume: 0.7,
    
    init() {
        this.bgMusic = document.getElementById('bgMusic');
        this.jumpSound = document.getElementById('jumpSound');
        
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
        
        // Save to localStorage
        localStorage.setItem('luksongBakaSfxVolume', this.sfxVolume);
    }
};

// Make available globally
window.Sound = Sound;
