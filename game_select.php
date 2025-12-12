<?php
session_start();

// Check if user is logged in OR is a guest
$isLoggedIn = isset($_SESSION['logged_in']) && $_SESSION['logged_in'] === true;
$isGuest = isset($_SESSION['is_guest']) && $_SESSION['is_guest'] === true;

// If neither logged in nor guest, redirect to index
if (!$isLoggedIn && !$isGuest) {
    header("Location: index.php");
    exit();
}

// Set user info based on login status
if ($isLoggedIn) {
    $username = $_SESSION['username'];
    $displayname = $_SESSION['displayname'];
    $email = $_SESSION['email'];
} else {
    // Guest user
    $username = "Guest";
    $displayname = "Guest Player";
    $email = "";
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Select Game - Laro ng Lahi</title>
    <link rel="stylesheet" href="assets/css/game_select.css">
    <link rel="stylesheet" href="assets/css/achievement-notifications.css">
    
    <!-- Firebase SDKs -->
    <script src="https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js"></script>
    <script src="https://www.gstatic.com/firebasejs/8.10.0/firebase-database.js"></script>
    <script src="assets/js/firebase-config.js"></script>
    <script src="assets/js/AchievementManager.js"></script>
</head>
<body>
    <div class="game-select-container">
        <!-- Floating particles -->
        <div class="particles">
            <div class="particle"></div>
            <div class="particle"></div>
            <div class="particle"></div>
            <div class="particle"></div>
            <div class="particle"></div>
            <div class="particle"></div>
        </div>
        
        
        <!-- Select Game Title -->
        <div class="select-title">
            <img src="assets/startmenu/select_game_title.png" alt="Select Game">
        </div>
        
        <!-- Game Cards -->
        <div class="game-cards-container">
            <a href="patintero/index.php" class="game-card" title="Play Patintero">
                <img src="assets/startmenu/patintero_gamecard.png" alt="Patintero">
            </a>
            <a href="jolen/index.php" class="game-card" title="Play Jolen">
                <img src="assets/startmenu/jolen_gamecard.png" alt="Luksong Tinik">
            </a>
            <a href="luksong-baka/index.php" class="game-card" title="Play Luksong Baka">
                <img src="assets/startmenu/luksong_baka_gamecard.png" alt="Luksong Baka">
            </a>
        </div>
        
        <!-- Back Button - Moved to bottom -->
        <a href="index.php" class="back-btn" title="Back to Menu">
            <img src="assets/startmenu/back_button.png" alt="Back">
        </a>
    </div>
    
    <!-- Background Music (continues from main menu if playing) -->
    <audio id="bgMusic" loop>
        <source src="assets/bgmusic/startmenuMusic.mp3" type="audio/mpeg">
    </audio>
    <audio id="clickSound">
        <source src="assets/game_sfx/button_click_sound.mp3" type="audio/mpeg">
    </audio>
    
    <!-- Audio Manager -->
    <script src="assets/js/AudioManager.js"></script>
    
    <!-- Music Toggle -->
    <button id="musicToggle" class="music-toggle" title="Toggle Music">
        <img src="assets/startmenu/volume.png" alt="Toggle Music">
    </button>
    
    <script>
        document.addEventListener('DOMContentLoaded', () => {
            // Audio Manager Setup
            const audioMgr = new AudioManager(); // Using singleton pattern internally or global instance
            const bgMusic = document.getElementById('bgMusic');
            const clickSound = document.getElementById('clickSound');
            const musicToggle = document.getElementById('musicToggle');
            const toggleIcon = musicToggle.querySelector('img');
            
            audioMgr.registerMusic(bgMusic);
            audioMgr.registerSFX(clickSound);
            
            // Sync Toggle Button State
            const updateToggleIcon = () => {
                const isMuted = audioMgr.settings.isMuted;
                toggleIcon.src = isMuted ? 'assets/startmenu/mute.png' : 'assets/startmenu/volume.png';
            };
            updateToggleIcon();
            
            // Handle Toggle Click
            musicToggle.addEventListener('click', (e) => {
                // Ensure music starts if browser blocked it initially
                if (bgMusic.paused && !audioMgr.settings.isMuted) {
                    bgMusic.play().catch(() => {});
                }
                
                audioMgr.toggleMute();
                updateToggleIcon();
                
                // Button animation
                musicToggle.style.transform = 'translateY(2px)';
                setTimeout(() => {
                   musicToggle.style.transform = ''; 
                }, 100);
            });
            
            // Attempt autoplay if not muted
            if (!audioMgr.settings.isMuted) {
                bgMusic.play().catch(() => {
                    // Browser policy blocked autoplay - wait for interaction
                    console.log("Autoplay blocked - waiting for interaction");
                });
            }
            
            // Interaction fallback to start music
            document.addEventListener('click', () => {
                if (bgMusic.paused && !audioMgr.settings.isMuted) {
                    bgMusic.play().catch(() => {});
                }
            }, { once: true });
            
            // Card click animation and sound
            const gameCards = document.querySelectorAll('.game-card, .back-btn');
            
            gameCards.forEach(card => {
                card.addEventListener('click', (e) => {
                    // Play sound via Manager
                    audioMgr.playSFX(clickSound);
                    
                    // Basic animation for cards (CSS handles most hover effects)
                    // Adding a small click scale effect here if needed
                    if (card.classList.contains('game-card')) {
                         // CSS :active handles this, but we can enforce logic if needed
                    }
                });
            });
        });
    </script>
</body>
</html>
