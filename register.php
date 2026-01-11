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
    <title>Register - Laro ng Lahi</title>
    
    <!-- Firebase SDKs -->
    <script src="https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js"></script>
    <script src="https://www.gstatic.com/firebasejs/8.10.0/firebase-auth.js"></script>
    <script src="https://www.gstatic.com/firebasejs/8.10.0/firebase-firestore.js"></script>
    <script src="https://www.gstatic.com/firebasejs/8.10.0/firebase-database.js"></script>
    
    <!-- Custom Scripts -->
    <script src="assets/js/firebase-config.js"></script>
    <script src="assets/js/auth.js"></script>

    <link rel="stylesheet" href="assets/css/register.css">
</head>
<body>
    <div class="container">
        <div class="logo">
            <img src="assets/startmenu/screen_title.png" alt="Laro ng Lahi">
        </div>
        
        <div id="error-message" class="error"></div>
        
        <form id="registerForm">
            <div class="form-group">
                <label for="username">Username</label>
                <input type="text" id="username" required pattern="[a-zA-Z0-9_]{3,20}" title="Letters, numbers, underscores only (3-20 chars)">
            </div>
            
            <div class="form-group">
                <label for="displayname">Display Name</label>
                <input type="text" id="displayname" required maxlength="20">
            </div>

            <div class="form-group">
                <label for="email">Email Address</label>
                <input type="email" id="email" required>
            </div>
            
            <div class="form-group">
                <label for="password">Password</label>
                <input type="password" id="password" required minlength="6">
            </div>
            
            <div class="form-group">
                <label for="confirm_password">Confirm Password</label>
                <input type="password" id="confirm_password" required>
            </div>
            
            <button type="submit" class="btn" id="regBtn">
                REGISTER
                <div class="spinner" id="spinner" style="display: none;"></div>
            </button>
        </form>
        
        <div class="login-link">
            Already have an account? <a href="login.php">LOGIN</a>
        </div>
    </div>

    <script>
        document.getElementById('registerForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const username = document.getElementById('username').value;
            const displayname = document.getElementById('displayname').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const confirm = document.getElementById('confirm_password').value;
            
            if (password !== confirm) {
                showError("Passwords do not match.");
                return;
            }
            
            toggleLoading(true);
            
            // Check username availability logic could go here by querying Firestore first
            // For now, we proceed to register
            
            const result = await Auth.register(email, password, username, displayname);
            
            if (result.success) {
                alert(result.message);
                window.location.href = 'login.php';
            } else {
                showError(result.message);
                toggleLoading(false);
            }
        });
        
        function showError(msg) {
            const el = document.getElementById('error-message');
            el.textContent = msg;
            el.style.display = 'block';
        }
        
        function toggleLoading(isLoading) {
            const btn = document.getElementById('regBtn');
            const spinner = document.getElementById('spinner');
            btn.disabled = isLoading;
            spinner.style.display = isLoading ? 'inline-block' : 'none';
        }
    </script>
</body>
</html>