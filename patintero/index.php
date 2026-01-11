<?php
session_start();

// Check if user is logged in OR is a guest
$isLoggedIn = isset($_SESSION['logged_in']) && $_SESSION['logged_in'] === true;
$isGuest = isset($_SESSION['is_guest']) && $_SESSION['is_guest'] === true;

// Set user info
if ($isLoggedIn) {
    $userId = $_SESSION['username'];
} else {
    $userId = '';
}
?>
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Patintero - Laro ng Lahi</title>
    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Fredoka+One&family=Nunito:wght@400;600;700;800&display=swap"
        rel="stylesheet">
    <link rel="stylesheet" href="css/core.css">
    <link rel="stylesheet" href="css/overlays.css">
    <link rel="stylesheet" href="css/hud.css">
    <link rel="stylesheet" href="css/game.css">
    <link rel="stylesheet" href="../assets/css/achievement-notifications.css">
    
    <!-- Firebase SDKs -->
    <script src="https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js"></script>
    <script src="https://www.gstatic.com/firebasejs/8.10.0/firebase-database.js"></script>
    <script src="../assets/js/firebase-config.js"></script>
    <script src="../assets/js/AchievementManager.js"></script>
    
    <!-- User Session Data -->
    <script>
        const userId = '<?php echo $userId; ?>';
        const isGuest = <?php echo ($isGuest ? 'true' : 'false'); ?>;
    </script>
</head>

<body>
    <!-- Audio Elements -->
    <!-- Audio Elements -->
    <audio id="bgMusic" loop>
        <source src="../assets/patintero_assets/patintero_bgm.mp3" type="audio/mpeg">
    </audio>
    <audio id="clickSound">
        <source src="../assets/game_sfx/button_click_sound.mp3" type="audio/mpeg">
    </audio>
    <audio id="boostSound">
        <source src="../assets/patintero_assets/boost_sound.mp3" type="audio/mpeg">
    </audio>
    <audio id="tagSound">
        <source src="../assets/patintero_assets/patintero_character_tag.mp3" type="audio/mpeg">
    </audio>
    <audio id="switchSound">
        <source src="../assets/patintero_assets/patintero_character_switch.mp3" type="audio/mpeg">
    </audio>

    <audio id="factsMusic" loop>
        <source src="../assets/game_facts_assets/fact_cards_music.mp3" type="audio/mpeg">
    </audio>

    <!-- Sound Controls (Top Left) -->
    <div class="sound-controls">
        <div class="volume-control">
            <span class="volume-label">🎵 BGM</span>
            <input type="range" id="bgmVolume" class="volume-slider" min="0" max="100" value="50"
                title="Background Music Volume">
        </div>
        <div class="volume-control">
            <span class="volume-label">🔊 SFX</span>
            <input type="range" id="sfxVolume" class="volume-slider" min="0" max="100" value="70"
                title="Sound Effects Volume">
        </div>
    </div>

    <!-- Difficulty Selection Overlay -->
    <div id="difficultyScreen" class="overlay">
        <div class="overlay-content enhanced-overlay">
            <button id="closeOverlayBtn" class="close-btn" title="Close">×</button>
            <div class="header-area">
                <h1 class="game-title">PATINTERO</h1>
                <p class="subtitle">Traditional Filipino Tag Game</p>
            </div>

            <div class="menu-grid">
                <!-- Left Column: Instructions -->
                <div class="instructions-panel">
                    <h3>How to Play</h3>

                    <div class="tutorial-step">
                        <div class="step-icon">🕹️</div>
                        <div class="step-text">
                            <h4>Move</h4>
                            <p>Use <strong>WASD</strong> to run</p>
                        </div>
                    </div>

                    <div class="tutorial-step">
                        <div class="step-icon">⚡</div>
                        <div class="step-text">
                            <h4>Sprint</h4>
                            <p>Press <strong>SPACE</strong> to boost</p>
                        </div>
                    </div>

                    <div class="tutorial-step">
                        <div class="step-icon">🔃</div>
                        <div class="step-text">
                            <h4>Switch</h4>
                            <p>Press <strong>1-5</strong> to swap players</p>
                        </div>
                    </div>

                    <div class="tutorial-step">
                        <div class="step-icon">🏆</div>
                        <div class="step-text">
                            <h4>Win</h4>
                            <p>Cross the lines to score!</p>
                        </div>
                    </div>
                </div>

                <!-- Right Column: Difficulty Selection -->
                <div class="difficulty-panel">
                    <h3>Select Difficulty</h3>

                    <button id="easyBtn" class="diff-btn easy" onclick="startGame('easy')">
                        <span class="diff-name">Easy</span>
                        <span class="diff-desc">Slow taggers. Relaxed pace.</span>
                    </button>

                    <button id="normalBtn" class="diff-btn normal" onclick="startGame('medium')">
                        <span class="diff-name">Normal</span>
                        <span class="diff-desc">Balanced challenge.</span>
                    </button>

                    <button id="hardBtn" class="diff-btn hard" onclick="startGame('hard')">
                        <span class="diff-name">Hard</span>
                        <span class="diff-desc">Fast taggers! Precision required.</span>
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- Coin Flip Screen -->
    <div class="overlay hidden" id="coinFlipScreen">
        <div class="overlay-content">
            <h2>Determining Your Starting Role...</h2>
            <div class="coin-container">
                <div class="coin" id="coin">
                    <div class="coin-side coin-heads">RUNNER</div>
                    <div class="coin-side coin-tails">TAGGER</div>
                </div>
            </div>
            <p id="coinResult" class="coin-result"></p>
        </div>
    </div>

    <!-- Game Container -->
    <div class="game-container" id="gameArea">
        <!-- Game UI (Top Right) -->
        <div id="gameUI">
            <div class="stat-box">
                <span class="stat-label">Time</span>
                <span class="stat-value" id="timerValue">2:00</span>
            </div>
            <div class="stat-box">
                <span class="stat-label">My Team</span>
                <span class="stat-value score-green" id="myTeamScore">0</span>
            </div>
            <div class="stat-box">
                <span class="stat-label">Enemy</span>
                <span class="stat-value score-red" id="enemyTeamScore">0</span>
            </div>
            <div class="stat-box role-box">
                <span class="stat-label">Role</span>
                <span class="stat-value" id="roleValue">RUNNER</span>
            </div>

            <!-- Settings Button -->
            <button id="menuBtn" class="ui-icon-btn" title="Menu">
                <svg viewBox="0 0 24 24" width="32" height="32" fill="white">
                    <path
                        d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L3.16 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.58 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
                </svg>
            </button>
        </div>

        <!-- Game Field -->
        <div class="field" id="field">
            <div class="start-zone">Start</div>
            <div class="end-zone">Finish</div>

            <!-- Grid Lines -->
            <div class="line horizontal-line" style="top: 20%"></div>
            <div class="line horizontal-line" style="top: 40%"></div>
            <div class="line horizontal-line" style="top: 60%"></div>
            <div class="line horizontal-line" style="top: 80%"></div>
            <div class="line vertical-line"></div>
        </div>

        <!-- Controls Hint (Always visible during game) -->
        <div class="controls-hint" id="controlsHint">
            <div class="hint-item">
                <span class="hint-keys">WASD</span>
                <span class="hint-text">Move</span>
            </div>
            <div class="hint-item">
                <span class="hint-keys">SPACE</span>
                <span class="hint-text">Boost!</span>
            </div>
            <div class="hint-item">
                <span class="hint-keys">1-5</span>
                <span class="hint-text">Switch</span>
            </div>
        </div>

        <!-- Bottom Controls Row -->
        <div class="bottom-controls">
            <!-- Character Selection Panel -->
            <div class="character-selection-panel" id="characterPanel">
                <h3 id="characterPanelTitle">🎮 Switch (1-5)</h3>
                <div class="character-buttons" id="characterButtons">
                    <!-- Buttons will be dynamically generated -->
                </div>
            </div>

            <!-- Back Button -->
            <a href="../game_select.php" class="back-btn" title="Back to Game Select">
                <img src="../assets/startmenu/back_button.png" alt="Back">
            </a>

            <!-- Boost Meter -->
            <div class="boost-meter-container" id="boostMeter">
                <!-- Boost Indicators (3 Uses) -->
                <div class="boost-indicators" id="boostIndicators">
                    <img src="../assets/patintero_assets/boost_icon.png" class="boost-icon active" id="boost-1">
                    <img src="../assets/patintero_assets/boost_icon.png" class="boost-icon active" id="boost-2">
                    <img src="../assets/patintero_assets/boost_icon.png" class="boost-icon active" id="boost-3">
                </div>
                <div class="boost-fill" id="boostFill"></div>
                <span class="boost-text">⚡ BOOST (SPACE)</span>
            </div>
        </div>
    </div>

    <!-- Game Over / Round Complete Modal -->
    <div id="messageOverlay" class="message-overlay hidden">
        <div class="game-complete-box" id="messageBox">
            <div class="game-complete-content">
                <div class="complete-header" id="modalTitle">GAME OVER</div>
                <div class="complete-sub" id="modalMessage">You ran out of lives!</div>
                <!-- Optional Score Section -->
                <div class="complete-score" id="modalScore" style="display: none;">Score: 0</div>

                <div class="complete-buttons">
                    <button id="modalActionBtn" class="restart-btn">Try Again</button>
                    <a href="../game_select.php" id="modalMenuBtn" class="back-menu-btn">Main Menu</a>
                </div>
            </div>
        </div>
    </div>

    <!-- Facts Button (Above How to Play) -->
    <button id="factsBtn" class="info-fab facts-btn" title="Game Facts">
        <img src="../assets/game_facts_assets/fact_icon.png" alt="Facts">
    </button>

    <!-- How to Play Button (Bottom Right) -->
    <button id="infoBtn" class="info-fab" title="How to Play">
        ❓
    </button>

    <!-- Facts Overlay -->
    <div id="factsOverlay" class="overlay hidden">
        <div class="overlay-content facts-content">
            <button id="closeFactsBtn" class="close-btn" title="Close">×</button>
            <img src="../assets/patintero_assets/patintero_facts_title.png" class="facts-title" alt="Facts">

            <div class="facts-container">
                <img id="factsBoard" src="../assets/patintero_assets/patintero_facts_board_1.png" class="facts-board"
                    alt="Fact Board">
                <div class="facts-nav">
                    <span class="dot active" data-index="1"></span>
                    <span class="dot" data-index="2"></span>
                    <span class="dot" data-index="3"></span>
                </div>
            </div>
            <p class="click-hint">Click board to read next page ➡️</p>
        </div>
    </div>

    <script type="module" src="js/main.js"></script>

    <!-- Sound and UI Initialization -->
    <script>
        // Sound Controls
        const bgMusic = document.getElementById('bgMusic');
        const clickSound = document.getElementById('clickSound');
        const bgmSlider = document.getElementById('bgmVolume');
        const sfxSlider = document.getElementById('sfxVolume');

        bgmSlider.addEventListener('input', (e) => {
            bgMusic.volume = e.target.value / 100;
        });

        sfxSlider.addEventListener('input', (e) => {
            clickSound.volume = e.target.value / 100;
        });

        // Initialize volumes
        bgMusic.volume = 0.5;
        clickSound.volume = 0.7;

        // Play click sound on interactive elements
        document.addEventListener('click', (e) => {
            if (e.target.closest('.btn') || e.target.closest('.diff-btn') ||
                e.target.closest('.info-fab') || e.target.tagName === 'BUTTON') {
                clickSound.currentTime = 0;
                clickSound.play().catch(() => { });
            }
        });

        // Try to start background music immediately
        const playPromise = bgMusic.play();
        if (playPromise !== undefined) {
            playPromise.catch(() => {
                // Autoplay blocked - add click listener fallback
                document.addEventListener('click', () => {
                    bgMusic.play().catch(() => { });
                }, { once: true });
            });
        }

        // Close overlay button
        // Close overlay button
        document.getElementById('closeOverlayBtn')?.addEventListener('click', () => {
            if (window.handleCloseOverlay) {
                window.handleCloseOverlay();
            } else {
                window.location.href = '../game_select.php';
            }
        });

        // Info button - show instructions only
        document.getElementById('infoBtn')?.addEventListener('click', () => {
            if (window.showDifficultyScreen) {
                window.showDifficultyScreen('instructions');
            }
        });

        // Menu button - show difficulty only
        document.getElementById('menuBtn')?.addEventListener('click', () => {
            if (window.showDifficultyScreen) {
                window.showDifficultyScreen('difficulty');
            }
        });

        // Facts overlay
        const factsBtn = document.getElementById('factsBtn');
        const factsOverlay = document.getElementById('factsOverlay');
        const closeFactsBtn = document.getElementById('closeFactsBtn');
        const factsBoard = document.getElementById('factsBoard');
        const dots = document.querySelectorAll('.facts-nav .dot');
        let currentFactIndex = 1;
        const totalFacts = 3;

        const factsMusic = document.getElementById('factsMusic');

        // Set volume for facts music matching bgm
        if (factsMusic) factsMusic.volume = 0.5;

        factsBtn?.addEventListener('click', () => {
            factsOverlay.classList.remove('hidden');

            // Pause BGM and play Facts Music
            bgMusic.pause();
            if (factsMusic) {
                factsMusic.currentTime = 0;
                factsMusic.play().catch(() => { });
            }

            // Generate Particles
            const container = document.querySelector('.facts-container');
            if (container) {
                // Clear existing
                const oldParticles = container.querySelectorAll('.particle');
                oldParticles.forEach(p => p.remove());

                // Spawn new ones
                for (let i = 0; i < 50; i++) {
                    const p = document.createElement('div');
                    p.classList.add('particle');
                    p.style.left = Math.random() * 100 + '%';
                    p.style.top = Math.random() * 100 + '%';
                    p.style.width = (Math.random() * 10 + 5) + 'px';
                    p.style.height = p.style.width;
                    p.style.animationDelay = Math.random() * 2 + 's';
                    p.style.background = `radial-gradient(circle, ${['#00e5ff', '#ffd700', '#fff'][Math.floor(Math.random() * 3)]}, transparent)`;
                    container.appendChild(p);
                }
            }
        });

        closeFactsBtn?.addEventListener('click', () => {
            factsOverlay.classList.add('hidden');
            // Stop Facts Music and Resume BGM
            if (factsMusic) {
                factsMusic.pause();
                factsMusic.currentTime = 0;
            }
            bgMusic.play().catch(() => { });
        });

        factsBoard?.addEventListener('click', () => {
            currentFactIndex = currentFactIndex % totalFacts + 1;
            factsBoard.src = `../assets/patintero_assets/patintero_facts_board_${currentFactIndex}.png`;
            dots.forEach((dot, i) => {
                dot.classList.toggle('active', i + 1 === currentFactIndex);
            });
        });

        dots.forEach(dot => {
            dot.addEventListener('click', (e) => {
                e.stopPropagation();
                currentFactIndex = parseInt(dot.dataset.index);
                factsBoard.src = `../assets/patintero_assets/patintero_facts_board_${currentFactIndex}.png`;
                dots.forEach((d, i) => {
                    d.classList.toggle('active', i + 1 === currentFactIndex);
                });
            });
        });

        // Responsive Scaling Logic
        function resizeGame() {
            const gameContainer = document.getElementById('gameArea');
            if (!gameContainer) return;

            // Base dimensions of the game content (approx field + controls height)
            const baseWidth = 1200;
            const baseHeight = 900; 

            const windowWidth = window.innerWidth;
            const windowHeight = window.innerHeight;

            // Calculate scale
            // Scale based on width (primary constraint)
            let scale = windowWidth / (baseWidth + 40); // 40px padding safety
            
            // Check if height constraint needs more scaling
            if ((baseHeight * scale) > (windowHeight - 20)) {
                scale = (windowHeight - 20) / baseHeight;
            }

            // Cap at 1.0 to prevent upscaling blurriness on large screens (optional, but good for pixel art)
            // Or cap at 1.2
            if (scale > 1.2) scale = 1.2;
            
            // Apply scale
            const gameUI = document.getElementById('gameUI');
            
            if (scale < 1) {
                gameContainer.style.transform = `scale(${scale})`;
                // Center vertically if needed or keep top aligned
                // gameContainer.style.transformOrigin = 'top center'; // Already in CSS
                
                // Adjust margin to reduce gap
                const heightDiff = baseHeight - (baseHeight * scale);
                gameContainer.style.marginBottom = `-${heightDiff}px`;
            } else {
                gameContainer.style.transform = 'none';
                gameContainer.style.marginBottom = '0';
            }
        }

        window.addEventListener('resize', resizeGame);
        window.addEventListener('load', resizeGame);
        
        // Initial call
        resizeGame();
    </script>
</body>

</html>