<?php
session_start();

// TEMPORARY: Comment out login check for testing
// if (!isset($_SESSION['logged_in']) || $_SESSION['logged_in'] !== true) {
//     header("Location: login.php");
//     exit();
// }

// TEMPORARY: Dummy values for testing
$username = "TestUser";
$displayname = "Test Player";
$email = "test@example.com";

// Uncomment below and remove dummy values when database is ready:
// $username = $_SESSION['username'];
// $displayname = $_SESSION['displayname'];
// $email = $_SESSION['email'];
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Laro ng Lahi - Main Menu</title>
    <link rel="stylesheet" href="assets/css/start_menu.css">
</head>
<body>
    <!-- Click to Enter Overlay -->
    <div id="enterOverlay" class="enter-overlay">
        <div class="enter-content">
            <img src="assets/startmenu/screen_title.png" alt="Laro ng Lahi" class="enter-title">
            <div class="enter-text">Click anywhere to enter</div>
        </div>
    </div>
    
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
        
        <!-- User info bar -->
        <div class="user-bar">
            <div class="user-avatar"><?php echo strtoupper(substr($displayname, 0, 1)); ?></div>
            <span class="user-name"><?php echo htmlspecialchars($displayname); ?></span>
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
                <a href="settings.php" class="menu-btn" title="Settings">
                    <img src="assets/startmenu/settings_button.png" alt="Settings">
                </a>
                <a href="facts.php" class="menu-btn" title="Laro Fact Cards">
                    <img src="assets/startmenu/fact_button.png" alt="Facts">
                </a>
                <a href="achievements.php" class="menu-btn achievements-btn" title="Achievements">
                    <img src="assets/startmenu/achievements_button.png" alt="Achievements">
                </a>
            </div>
        </div>
        
        <!-- Version text -->
        <div class="version-text">Version 1.0.0 | © 2024 Laro ng Lahi</div>
        
        <!-- Background Music -->
        <audio id="bgMusic" loop autoplay>
            <source src="assets/bgmusic/startmenuMusic.mp3" type="audio/mpeg">
        </audio>
        
        <!-- Music Toggle Button -->
        <button id="musicToggle" class="music-toggle" title="Toggle Music">
            🔊
        </button>
    </div>
    
    <script>
        // Elements
        const bgMusic = document.getElementById('bgMusic');
        const musicToggle = document.getElementById('musicToggle');
        const enterOverlay = document.getElementById('enterOverlay');
        let isMuted = false;
        
        // Set volume and ensure loop
        bgMusic.volume = 0.5;
        bgMusic.loop = true;
        
        // Handle "Click to Enter" overlay
        enterOverlay.addEventListener('click', () => {
            // Start the music
            bgMusic.play();
            // Hide the overlay with fade
            enterOverlay.classList.add('hidden');
        });
        
        // Fallback: ensure music restarts if it ends (extra safety for looping)
        bgMusic.addEventListener('ended', () => {
            bgMusic.currentTime = 0;
            bgMusic.play();
        });
        
        musicToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            if (isMuted) {
                bgMusic.muted = false;
                bgMusic.play();
                musicToggle.textContent = '🔊';
                isMuted = false;
            } else {
                bgMusic.muted = true;
                musicToggle.textContent = '🔇';
                isMuted = true;
            }
        });
        
        // Add subtle parallax effect on mouse move
        document.addEventListener('mousemove', (e) => {
            const title = document.querySelector('.game-title');
            const glow = document.querySelector('.glow-effect');
            
            const centerX = window.innerWidth / 2;
            const centerY = window.innerHeight / 2;
            
            const moveX = (e.clientX - centerX) / 50;
            const moveY = (e.clientY - centerY) / 50;
            
            title.style.transform = `translate(${moveX}px, ${moveY}px)`;
            glow.style.transform = `translate(calc(-50% + ${moveX * 2}px), ${moveY * 2}px)`;
        });
        
        // Button click animation
        const allButtons = document.querySelectorAll('.menu-btn, .start-btn');
        allButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                btn.style.transform = 'scale(0.9)';
                setTimeout(() => {
                    btn.style.transform = '';
                }, 100);
            });
        });
    </script>
</body>
</html>