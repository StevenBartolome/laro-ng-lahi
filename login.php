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
    <div class="container">
        <div class="logo">
            <h1>Laro ng Lahi</h1>
            <p>Welcome back!</p>
        </div>
        
        <div id="error-message" class="error"></div>
        
        <form id="loginForm">
            <div class="form-group">
                <label for="email">Email Address</label>
                <input type="text" id="email" required placeholder="Enter your email">
            </div>
            
            <div class="form-group">
                <label for="password">Password</label>
                <input type="password" id="password" required placeholder="Enter your password">
            </div>
            
            <div class="forgot-password">
                <a onclick="handleResetPassword()">Forgot password?</a>
            </div>
            
            <button type="submit" class="btn" id="loginBtn">
                Login
                <div class="spinner" id="spinner"></div>
            </button>
        </form>
        
        <div class="register-link">
            Don't have an account? <a href="register.php">Register here</a>
        </div>
    </div>

    <script>
        document.getElementById('loginForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const btn = document.getElementById('loginBtn');
            const spinner = document.getElementById('spinner');
            const errorMsg = document.getElementById('error-message');
            
            // UI Loading State
            btn.disabled = true;
            spinner.style.display = 'block';
            errorMsg.style.display = 'none';
            
            // Call Auth
            const result = await Auth.login(email, password);
            
            if (result.success) {
                window.location.replace('start_menu.php');
            } else {
                errorMsg.textContent = result.message;
                errorMsg.style.display = 'block';
                btn.disabled = false;
                spinner.style.display = 'none';
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