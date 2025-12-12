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
            <a href="patintero/index.html" class="game-card" title="Play Patintero">
                <img src="assets/startmenu/patintero_gamecard.png" alt="Patintero">
            </a>
            <a href="jolen/index.php" class="game-card" title="Play Jolen">
                <img src="assets/startmenu/jolen_gamecard.png" alt="Luksong Tinik">
            </a>
            <a href="luksong-baka/index.html" class="game-card" title="Play Luksong Baka">
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
    
    <script>
        // Music persistence across pages
        const bgMusic = document.getElementById('bgMusic');
        bgMusic.volume = 0.5;
        bgMusic.loop = true;
        
        // Check if music was muted
        const isMuted = localStorage.getItem('musicMuted') === 'true';
        if (isMuted) {
            bgMusic.muted = true;
        }
        
        // Resume music from saved position
        const savedTime = localStorage.getItem('musicTime');
        if (savedTime) {
            bgMusic.currentTime = parseFloat(savedTime);
        }
        
        // Try to autoplay
        bgMusic.play().catch(() => {
            document.addEventListener('click', function initAudio() {
                bgMusic.play().catch(() => {});
            }, { once: true });
        });
        
        // Save music position periodically
        setInterval(() => {
            if (!bgMusic.paused) {
                localStorage.setItem('musicTime', bgMusic.currentTime);
            }
        }, 500);
        
        // Save position before leaving page
        window.addEventListener('beforeunload', () => {
            localStorage.setItem('musicTime', bgMusic.currentTime);
        });
        
        // Save when clicking any link
        document.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                localStorage.setItem('musicTime', bgMusic.currentTime);
            });
        });
        
        // Fallback: restart if ended
        bgMusic.addEventListener('ended', () => {
            bgMusic.currentTime = 0;
            bgMusic.play();
        });
        
        // Card click animation and sound
        const gameCards = document.querySelectorAll('.game-card, .back-btn');
        const clickSound = document.getElementById('clickSound');
        
        gameCards.forEach(card => {
            card.addEventListener('click', (e) => {
                // Play sound
                if (clickSound) {
                    clickSound.currentTime = 0;
                    clickSound.play().catch(() => {});
                }
                
                // Animation for cards
                if (card.classList.contains('game-card')) {
                    card.style.transform = 'scale(0.9)';
                    setTimeout(() => {
                        card.style.transform = '';
                    }, 150);
                }
            });
        });
    </script>
</body>
</html>
