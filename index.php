<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Laro ng Lahi - Main Menu</title>
    <link rel="stylesheet" href="assets/css/start_menu.css">
    <link rel="stylesheet" href="assets/css/settings_modal.css">
    <style>
        /* Hide the user bar (player name and logout) */
        .user-bar {
            display: none !important;
        }

        /* Hide the achievements button */
        .achievements-btn {
            display: none !important;
        }
    </style>
</head>

<body>
    <div class="game-container">
        <!-- Decorative glow -->
        <div class="glow-effect"></div>

        <!-- Floating particles -->
        <div class="particles">
            <div class="particle"></div>
            <div class="particle"></div>
            <div class="particle"></div>
            <div class="particle"></div>
            <div class="particle"></div>
            <div class="particle"></div>
            <div class="particle"></div>
        </div>

        <!-- User info bar (hidden) -->
        <div class="user-bar">
            <div class="user-avatar">G</div>
            <span class="user-name">Guest</span>
            <a href="logout.php" class="logout-btn">Logout</a>
        </div>

        <!-- Game Title -->
        <div class="game-title">
            <img src="assets/startmenu/screen_title.png" alt="Laro ng Lahi">
        </div>

        <!-- Menu Buttons -->
        <div class="menu-container">
            <!-- Start Button - Centered and prominent -->
            <a href="game_select.php" class="start-btn" title="Start Game">
                <img src="assets/startmenu/start_button.png" alt="Start">
            </a>

            <!-- Secondary buttons - Horizontal layout -->
            <div class="secondary-buttons">
                <a href="facts.php" class="menu-btn" title="Laro Fact Cards">
                    <img src="assets/startmenu/fact_button.png" alt="Facts">
                </a>
                <a href="achievements.php" class="menu-btn achievements-btn" title="Achievements">
                    <img src="assets/startmenu/achievements_button.png" alt="Achievements">
                </a>
                <a href="settings.php" class="menu-btn" title="Settings">
                    <img src="assets/startmenu/settings_button.png" alt="Settings">
                </a>
            </div>
        </div>

        <!-- Version text -->
        <div class="version-text">Version 1.0.0 | © 2024 Laro ng Lahi</div>

        <!-- Background Music -->
        <audio id="bgMusic" loop autoplay>
            <source src="assets/bgmusic/startmenuMusic.mp3" type="audio/mpeg">
        </audio>
        <audio id="clickSound">
            <source src="assets/game_sfx/button_click_sound.mp3" type="audio/mpeg">
        </audio>

        <!-- Music Toggle Button -->
        <button id="musicToggle" class="music-toggle" title="Toggle Music">
            🔊
        </button>
    </div>

    <!-- Global Audio System -->
    <script src="assets/js/AudioManager.js"></script>
    <script src="assets/js/SettingsModal.js"></script>

    <script>
        // Initialize Audio Manager with elements
        const bgMusic = document.getElementById('bgMusic');
        const clickSound = document.getElementById('clickSound');

        // Wait for manager to load
        window.addEventListener('load', () => {
            const audioMgr = window.audioManager;

            // Register Elements
            audioMgr.registerMusic(bgMusic);
            audioMgr.registerSFX(clickSound);

            // Auto-play music (with interaction fallback)
            bgMusic.play().catch(() => {
                document.addEventListener('click', () => {
                    bgMusic.play().catch(() => { });
                }, { once: true });
            });

            // Music Toggle Button (Simple mute toggle that syncs with global settings)
            const musicToggle = document.getElementById('musicToggle');
            const updateToggleButton = () => {
                musicToggle.textContent = audioMgr.settings.isMuted ? '🔇' : '🔊';
            };

            // Initial state
            updateToggleButton();

            musicToggle.addEventListener('click', (e) => {
                e.preventDefault();
                audioMgr.toggleMute();
                updateToggleButton();
            });

            // Listen for global changes (in case changed from modal)
            window.addEventListener('audioSettingsChanged', () => {
                updateToggleButton();
            });

            // Settings Button Wrapper
            const settingsBtn = document.querySelector('a[href="settings.php"]');
            if (settingsBtn) {
                settingsBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    window.settingsModal.show();
                });
            }

            // Universal button click sound
            const allButtons = document.querySelectorAll('.menu-btn, .start-btn, button, a');
            allButtons.forEach(btn => {
                btn.addEventListener('click', () => {
                    if (clickSound) audioMgr.playSFX(clickSound);

                    // Add animation
                    if (btn.classList.contains('menu-btn') || btn.classList.contains('start-btn')) {
                        btn.style.transform = 'scale(0.9)';
                        setTimeout(() => {
                            btn.style.transform = '';
                        }, 100);
                    }
                });
            });

            // Parallax Effect
            document.addEventListener('mousemove', (e) => {
                const title = document.querySelector('.game-title');
                const glow = document.querySelector('.glow-effect');

                if (title && glow) {
                    const centerX = window.innerWidth / 2;
                    const centerY = window.innerHeight / 2;

                    const moveX = (e.clientX - centerX) / 50;
                    const moveY = (e.clientY - centerY) / 50;

                    title.style.transform = `translate(${moveX}px, ${moveY}px)`;
                    glow.style.transform = `translate(calc(-50% + ${moveX * 2}px), ${moveY * 2}px)`;
                }
            });
        });
    </script>
</body>

</html>