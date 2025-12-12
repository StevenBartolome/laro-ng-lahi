<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Laro ng Lahi - Main Menu</title>
    <link rel="stylesheet" href="assets/css/start_menu.css">
    <link rel="stylesheet" href="assets/css/settings_modal.css">
    <link rel="manifest" href="manifest.json">
    <script>
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
          navigator.serviceWorker.register('service-worker.js')
            .then(reg => console.log('Service Worker registered!', reg))
            .catch(err => console.log('Service Worker registration failed:', err));
        });
      }
    </script>
    <style>
        /* Override specifically for guest view */
        .auth-buttons {
            position: absolute;
            top: 20px;
            right: 20px;
            z-index: 100;
            display: flex;
            gap: 15px;
        }
        
        .auth-btn {
            background: rgba(255, 255, 255, 0.2);
            backdrop-filter: blur(5px);
            padding: 8px 20px;
            border-radius: 20px;
            text-decoration: none;
            color: white;
            font-weight: bold;
            font-size: 14px;
            transition: all 0.3s;
            border: 1px solid rgba(255, 255, 255, 0.3);
        }
        
        .auth-btn:hover {
            background: rgba(255, 255, 255, 0.4);
            transform: translateY(-2px);
        }

        .auth-btn.primary {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border: none;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        }
        
        /* Initial state hidden for achievements to match request */
        .hidden {
            display: none !important;
        }

        /* Modal Styles */
        .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            display: flex; /* Hidden by default via inline style */
            justify-content: center;
            align-items: center;
            z-index: 1000;
            backdrop-filter: blur(5px);
        }

        .modal-content {
            background: white;
            padding: 40px;
            border-radius: 20px;
            text-align: center;
            max-width: 400px;
            width: 90%;
            box-shadow: 0 20px 50px rgba(0,0,0,0.3);
            animation: modalPop 0.3s ease-out;
        }

        @keyframes modalPop {
            from { transform: scale(0.8); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
        }

        .modal-content h2 {
            color: #333;
            margin-bottom: 10px;
            font-size: 24px;
        }

        .modal-content p {
            color: #666;
            margin-bottom: 30px;
        }

        .modal-buttons {
            display: flex;
            flex-direction: column;
            gap: 15px;
        }

        .modal-btn {
            padding: 15px;
            border: none;
            border-radius: 12px;
            font-weight: bold;
            font-size: 16px;
            cursor: pointer;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            text-decoration: none;
        }

        .modal-btn.guest {
            background: #f0f0f0;
            color: #333;
            border: 2px solid #ddd;
        }

        .modal-btn.guest:hover {
            background: #e0e0e0;
            transform: translateY(-2px);
        }

        .modal-btn.login {
            background: #667eea;
            color: white;
        }

        .modal-btn.login:hover {
            background: #5568d3;
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
        }

        .modal-note {
            margin-top: 20px !important;
            font-size: 12px;
            color: #999 !important;
            margin-bottom: 0 !important;
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
        
        <!-- Guest Auth Buttons instead of User Bar -->
        <div class="auth-buttons">
            <a href="login.php" class="auth-btn">Login</a>
            <a href="register.php" class="auth-btn primary">Register</a>
        </div>
        
        <!-- Game Title -->
        <div class="game-title">
            <img src="assets/startmenu/screen_title.png" alt="Laro ng Lahi">
        </div>
        
        <!-- Menu Buttons -->
        <div class="menu-container">
            <!-- Start Button - Redirects to login if not logged in (handled by game_select.php) -->
            <a href="login.php" class="start-btn" title="Start Game">
                <img src="assets/startmenu/start_button.png" alt="Start">
            </a>
            
            <!-- Secondary buttons - Horizontal layout -->
            <div class="secondary-buttons">
                <a href="facts.php" class="menu-btn" title="Laro Fact Cards">
                    <img src="assets/startmenu/fact_button.png" alt="Facts">
                </a>
                <!-- Achievements removed for guest -->
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

        <!-- Auth Mode Modal -->
        <div id="authModeModal" class="modal-overlay" style="display: none;">
            <div class="modal-content">
                <h2>Welcome, Player!</h2>
                <p>How would you like to play?</p>
                
                <div class="modal-buttons">
                    <button id="guestBtn" class="modal-btn guest">
                        <span>👤</span> Continue as Guest
                    </button>
                    <a href="login.php" class="modal-btn login">
                        <span>🔐</span> Login Account
                    </a>
                </div>
                <p class="modal-note">Guest progress will not be saved.</p>
            </div>
        </div>
    </div>
    
    <!-- Global Audio System -->
    <script src="assets/js/AudioManager.js"></script>
    <script src="assets/js/SettingsModal.js"></script>

    <script>
        // Check if user is already logged in, redirect to actual start menu
        // We can do this via simple PHP session check at top or JS check here
        // Since this file is .php, let's use PHP for faster redirect
        
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
                    bgMusic.play().catch(() => {});
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
            const allButtons = document.querySelectorAll('.menu-btn, .start-btn, button, a.auth-btn');
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
            
            // Start Button Click - Show Modal
            const startBtn = document.querySelector('.start-btn');
            const modal = document.getElementById('authModeModal');
            
            if (startBtn && modal) {
                startBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    modal.style.display = 'flex';
                });
            }

            // Guest Login Handler
            const guestBtn = document.getElementById('guestBtn');
            if (guestBtn) {
                guestBtn.addEventListener('click', () => {
                    localStorage.setItem('is_guest', 'true');
                    localStorage.setItem('guest_name', 'Guest Player');
                    window.location.href = 'start_menu.php';
                });
            }

            // Close modal when clicking outside
            window.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.style.display = 'none';
                }
            });

        });
    </script>
</body>
</html>
