<?php
session_start();

// If user is logged in (not guest), redirect to start_menu.php
if (isset($_SESSION['logged_in']) && $_SESSION['logged_in'] === true) {
    header("Location: start_menu.php");
    exit();
}
?>
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Laro ng Lahi - Main Menu</title>
    <link rel="stylesheet" href="assets/css/start_menu.css">
    <link rel="stylesheet" href="assets/css/settings_modal.css">
    <link rel="stylesheet" href="assets/css/achievements_modal.css">
    
    <!-- Firebase SDKs -->
    <script src="https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js"></script>
    <script src="https://www.gstatic.com/firebasejs/8.10.0/firebase-database.js"></script>
    <script src="assets/js/firebase-config.js"></script>

    <style>
        /* Hide the user bar (player name and logout) */
        .user-bar {
            display: none !important;
        }



        /* Start button styling (button element instead of link) */
        .start-btn {
            background: none;
            border: none;
            padding: 0;
            cursor: pointer;
            outline: inherit;
        }

        /* Login Options Container */
        .login-options-container {
            display: flex;
            flex-direction: column;
            gap: 15px;
            align-items: center;
            width: 100%;
        }

        .login-options-container .wood-btn {
            width: 100%;
            text-align: center;
            text-decoration: none;
            box-sizing: border-box;
            display: block;
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
            <button class="start-btn" id="startBtn" title="Start Game">
                <img src="assets/startmenu/start_button.png" alt="Start">
            </button>

            <!-- Secondary buttons - Horizontal layout -->
            <div class="secondary-buttons">
                <a href="facts.php" class="menu-btn" title="Laro Fact Cards">
                    <img src="assets/startmenu/fact_button.png" alt="Facts">
                </a>
                <a href="#" class="menu-btn achievements-btn" id="achievementsBtn" title="Achievements">
                    <img src="assets/startmenu/achievements_button.png" alt="Achievements">
                </a>
                <a href="settings.php" class="menu-btn" title="Settings">
                    <img src="assets/startmenu/settings_button.png" alt="Settings">
                </a>
            </div>
        </div>

        <!-- Version text -->
        <div class="version-text">Version 1.0.0 | © 2025 Laro ng Lahi</div>

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

    <!-- Login Modal -->
    <!-- Login Modal -->
    <div class="settings-modal-overlay hidden" id="loginModal">
        <div class="settings-modal-content">
            <div class="modal-header">
                <h2>Choose Login Option</h2>
                <div class="close-btn" id="closeModalCross">×</div>
            </div>
            <div class="login-options-container">
                <a href="login.php" class="wood-btn">Login</a>
                <a href="guest_session.php" class="wood-btn">Continue as Guest</a>
                <button class="wood-btn" id="closeModal" style="background: linear-gradient(to bottom, #d32f2f, #b71c1c); border-color: #ef5350;">Cancel</button>
            </div>
        </div>
    </div>

    <!-- Global Audio System -->
    <script src="assets/js/AudioManager.js"></script>
    <script src="assets/js/SettingsModal.js"></script>
    <script src="assets/js/AchievementManager.js"></script>
    <script src="assets/js/AchievementsModal.js"></script>

    <script>
        // User Data for Achievements (Guest Mode)
        window.currentUser = {
            isGuest: true
        };

        // Initialize Audio Manager with elements
        const bgMusic = document.getElementById('bgMusic');
        const clickSound = document.getElementById('clickSound');

        // Wait for manager to load
        window.addEventListener('load', () => {
            const audioMgr = window.audioManager;

            // Login Modal Handling
            const loginModal = document.getElementById('loginModal');
            const startBtn = document.getElementById('startBtn');
            const closeModal = document.getElementById('closeModal');
            const closeModalCross = document.getElementById('closeModalCross');

            // Function to close modal
            const hideLoginModal = () => {
                loginModal.classList.add('hidden');
            };

            // Show modal when start button is clicked
            startBtn.addEventListener('click', () => {
                loginModal.classList.remove('hidden');
            });

            // Close modal when cancel button is clicked
            if (closeModal) {
                closeModal.addEventListener('click', hideLoginModal);
            }
            
            // Close modal when X button is clicked
            if (closeModalCross) {
                closeModalCross.addEventListener('click', hideLoginModal);
            }

            // Close modal when clicking outside the modal content
            loginModal.addEventListener('click', (e) => {
                if (e.target === loginModal) {
                    hideLoginModal();
                }
            });

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

            // Achievements Button Wrapper
            const achievementsBtn = document.getElementById('achievementsBtn');
            if (achievementsBtn) {
                achievementsBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    window.achievementsModal.show();
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