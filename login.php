<?php
session_start();
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
    <title>Login - Laro ng Lahi</title>
    
    <!-- Firebase SDKs -->
    <script src="https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js"></script>
    <script src="https://www.gstatic.com/firebasejs/8.10.0/firebase-auth.js"></script>
    <script src="https://www.gstatic.com/firebasejs/8.10.0/firebase-firestore.js"></script>
    <script src="https://www.gstatic.com/firebasejs/8.10.0/firebase-database.js"></script>
    
    <!-- Custom Scripts -->
    <script src="assets/js/firebase-config.js"></script>
    <script src="assets/js/auth.js"></script>

    <link rel="stylesheet" href="assets/css/login.css">
</head>
<body>
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

    <!-- Audio System -->
    <audio id="bgMusic" loop>
        <source src="assets/game_sfx/login_background_music.mp3" type="audio/mpeg">
    </audio>
    <audio id="clickSound">
        <source src="assets/game_sfx/button_click_sound.mp3" type="audio/mpeg">
    </audio>

    <div class="container">
        <div class="logo">
            <img src="assets/startmenu/screen_title.png" alt="Laro ng Lahi">
        </div>
        
        <div id="error-message" class="error"></div>
        
        <form id="loginForm">
            <div class="form-group">
                <label for="email">Username</label>
                <input type="text" id="email" required>
            </div>
            
            <div class="form-group">
                <label for="password">Password</label>
                <input type="password" id="password" required>
            </div>
            
            <div class="button-row">
                <button type="submit" class="btn btn-login" id="loginBtn">
                    LOGIN
                </button>
                <a href="register.php" class="btn btn-register">REGISTER</a>
            </div>

            <div class="divider">or</div>

                <a href="guest_session.php" class="btn btn-guest">
                    PLAY AS GUEST
                </a>
        </form>
    </div>

    <!-- Audio Manager -->
    <script src="assets/js/AudioManager.js"></script>

    <!-- Music Toggle -->
    <button id="musicToggle" class="music-toggle" title="Toggle Music">
        <img src="assets/startmenu/volume.png" alt="Toggle Music">
    </button>

    <script>
        // Init Audio
        window.addEventListener('load', () => {
            const audioMgr = window.audioManager;
            const bgMusic = document.getElementById('bgMusic');
            const clickSound = document.getElementById('clickSound');
            const musicToggle = document.getElementById('musicToggle');
            const toggleIcon = musicToggle.querySelector('img');
            
            audioMgr.registerMusic(bgMusic);
            audioMgr.registerSFX(clickSound);

            // Update Toggle Icon based on state
            const updateToggleIcon = () => {
                const isMuted = audioMgr.settings.isMuted;
                toggleIcon.src = isMuted ? 'assets/startmenu/mute.png' : 'assets/startmenu/volume.png';
            };
            updateToggleIcon();

            // Handle Toggle Click
            musicToggle.addEventListener('click', (e) => {
                e.preventDefault();
                // This click also satisfies browser autoplay policy
                bgMusic.play().catch(() => {});
                
                audioMgr.toggleMute();
                updateToggleIcon();
            });

            // Fallback: Play music on first interaction if not yet playing
            document.addEventListener('click', () => {
                if (bgMusic.paused && !audioMgr.settings.isMuted) {
                    bgMusic.play().catch(() => {});
                }
            }, { once: true });

            // Button click sounds
            document.querySelectorAll('.btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    audioMgr.playSFX(clickSound);
                });
            });
        });

        document.getElementById('loginForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const btn = document.getElementById('loginBtn');
            const spinner = document.getElementById('spinner');
            const errorMsg = document.getElementById('error-message');
            
            // UI Loading State
            btn.disabled = true;
            if (spinner) spinner.style.display = 'block';
            errorMsg.style.display = 'none';
            
            // Call Auth
            const result = await Auth.login(email, password);
            
            if (result.success) {
                window.location.replace('start_menu.php');
            } else {
                errorMsg.textContent = result.message;
                errorMsg.style.display = 'block';
                // Shake effect on error
                errorMsg.style.animation = 'shake 0.5s';
                setTimeout(() => { errorMsg.style.animation = ''; }, 500);
                
                btn.disabled = false;
                if (spinner) spinner.style.display = 'none';
            }
        });
        
        function handleResetPassword() {
            const email = document.getElementById('email').value;
            if(!email) {
                alert('Please enter your email address first to reset password.');
                return;
            }
            
            firebase.auth().sendPasswordResetEmail(email)
                .then(() => {
                    alert('Password reset email sent! Check your inbox.');
                })
                .catch((error) => {
                    alert('Error: ' + error.message);
                });
        }
    </script>
</body>
</html>