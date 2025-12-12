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
    <style>
        /* Hide the user bar (player name and logout) */
        .user-bar {
            display: none !important;
        }

        /* Hide the achievements button */
        .achievements-btn {
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

        /* Login Modal */
        .login-modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            backdrop-filter: blur(10px);
            z-index: 1000;
            align-items: center;
            justify-content: center;
        }

        .login-modal.active {
            display: flex;
            animation: fadeIn 0.3s ease;
        }

        .login-modal-content {
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            border-radius: 20px;
            padding: 40px;
            max-width: 500px;
            width: 90%;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
            border: 2px solid rgba(255, 255, 255, 0.1);
            animation: slideUp 0.3s ease;
        }

        .login-modal-title {
            font-size: 28px;
            font-weight: bold;
            color: #fff;
            text-align: center;
            margin-bottom: 30px;
            text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
        }

        .login-options {
            display: flex;
            flex-direction: column;
            gap: 15px;
        }

        .login-option-btn {
            padding: 18px 30px;
            font-size: 18px;
            font-weight: bold;
            border: none;
            border-radius: 12px;
            cursor: pointer;
            transition: all 0.3s ease;
            text-decoration: none;
            text-align: center;
            display: block;
        }

        .login-btn {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
        }

        .login-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
        }

        .guest-btn {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            color: white;
            box-shadow: 0 4px 15px rgba(245, 87, 108, 0.4);
        }

        .guest-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(245, 87, 108, 0.6);
        }

        .close-modal-btn {
            background: rgba(255, 255, 255, 0.1);
            color: #fff;
            margin-top: 15px;
        }

        .close-modal-btn:hover {
            background: rgba(255, 255, 255, 0.2);
            transform: translateY(-2px);
        }

        @keyframes fadeIn {
            from {
                opacity: 0;
            }
            to {
                opacity: 1;
            }
        }

        @keyframes slideUp {
            from {
                transform: translateY(50px);
                opacity: 0;
            }
            to {
                transform: translateY(0);
                opacity: 1;
            }
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

    <!-- Login Modal -->
    <div class="login-modal" id="loginModal">
        <div class="login-modal-content">
            <h2 class="login-modal-title">Choose Login Option</h2>
            <div class="login-options">
                <a href="login.php" class="login-option-btn login-btn">Login</a>
                <a href="guest_session.php" class="login-option-btn guest-btn">Continue as Guest</a>
                <button class="login-option-btn close-modal-btn" id="closeModal">Cancel</button>
            </div>
        </div>
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

            // Login Modal Handling
            const loginModal = document.getElementById('loginModal');
            const startBtn = document.getElementById('startBtn');
            const closeModal = document.getElementById('closeModal');

            // Show modal when start button is clicked
            startBtn.addEventListener('click', () => {
                loginModal.classList.add('active');
            });

            // Close modal when cancel button is clicked
            closeModal.addEventListener('click', () => {
                loginModal.classList.remove('active');
            });

            // Close modal when clicking outside the modal content
            loginModal.addEventListener('click', (e) => {
                if (e.target === loginModal) {
                    loginModal.classList.remove('active');
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