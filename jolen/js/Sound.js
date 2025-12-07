/**
 * Jolen - Sound Module
 * Manages background music and sound effects
 */

const Sound = {
    bgMusic: null,
    clickSound: null,
    
    // Volume settings (0.0 to 1.0)
    bgmVolume: 0.5,
    sfxVolume: 0.7,
    
    init() {
        this.bgMusic = document.getElementById('bgMusic');
        this.clickSound = document.getElementById('clickSound');
        
        // Set initial volumes
        if (this.bgMusic) this.bgMusic.volume = this.bgmVolume;
        if (this.clickSound) this.clickSound.volume = this.sfxVolume;
        this.hitSound = document.getElementById('hitSound');
        if (this.hitSound) this.hitSound.volume = this.sfxVolume;
        
        // Setup volume sliders
        this.setupVolumeControls();
        
        // Try autoplay BGM (might be blocked by browser)
        this.playBGM();
    },
    
    setupVolumeControls() {
        const bgmSlider = document.getElementById('bgmVolume');
        const sfxSlider = document.getElementById('sfxVolume');
        
        if (bgmSlider) {
            bgmSlider.addEventListener('input', (e) => {
                this.bgmVolume = e.target.value / 100;
                if (this.bgMusic) this.bgMusic.volume = this.bgmVolume;
            });
        }
        
        if (sfxSlider) {
            sfxSlider.addEventListener('input', (e) => {
                this.sfxVolume = e.target.value / 100;
                if (this.clickSound) this.clickSound.volume = this.sfxVolume;
                if (this.hitSound) this.hitSound.volume = this.sfxVolume;
            });
        }
    },
    
    playBGM() {
        if (this.bgMusic) {
            const playPromise = this.bgMusic.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.log("Auto-play prevented. Music will start on interaction.");
                    // Add one-time click listener to start music
                    document.addEventListener('click', () => {
                        this.bgMusic.play();
                    }, { once: true });
                });
            }
        }
    },
    
    playClick() {
        if (this.clickSound) {
            this.clickSound.currentTime = 0;
            this.clickSound.play().catch(e => {});
        }
    },

    playHit() {
        if (this.hitSound) {
            this.hitSound.currentTime = 0;
            this.hitSound.play().catch(e => {});
        }
    },

    stopBGM() {
        if (this.bgMusic) {
            this.bgMusic.pause();
            this.bgMusic.currentTime = 0;
        }
    }
};

export default Sound;
