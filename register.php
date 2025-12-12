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

    <style>
        /* Reusing styles for consistency */
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
        }
        .container {
            background: white;
            border-radius: 15px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            max-width: 450px;
            width: 100%;
            padding: 40px;
        }
        .logo { text-align: center; margin-bottom: 30px; }
        .logo h1 { color: #667eea; font-size: 32px; margin-bottom: 5px; }
        .logo p { color: #666; font-size: 14px; }
        .form-group { margin-bottom: 20px; }
        label { display: block; margin-bottom: 8px; color: #333; font-weight: 500; }
        input[type="text"], input[type="email"], input[type="password"] {
            width: 100%; padding: 12px; border: 2px solid #e0e0e0;
            border-radius: 8px; font-size: 14px; transition: border-color 0.3s;
        }
        input:focus { outline: none; border-color: #667eea; }
        .btn {
            width: 100%; padding: 12px; border: none; border-radius: 8px;
            font-size: 16px; font-weight: 600; cursor: pointer;
            transition: all 0.3s; background: #667eea; color: white;
            position: relative;
        }
        .btn:hover { background: #5568d3; transform: translateY(-2px); }
        .btn:disabled { background: #99a3d6; cursor: wait; }
        .error {
            background: #ffebee; color: #c62828; padding: 12px;
            border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #c62828;
            display: none;
        }
        .login-link { text-align: center; margin-top: 20px; color: #666; }
        .login-link a { color: #667eea; text-decoration: none; font-weight: 600; }
        .spinner {
            display: none; width: 20px; height: 20px;
            border: 3px solid rgba(255,255,255,0.3); border-radius: 50%;
            border-top-color: #fff; animation: spin 1s ease-in-out infinite;
            position: absolute; right: 15px; top: 12px;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">
            <h1>Laro ng Lahi</h1>
            <p>Create your account</p>
        </div>
        
        <div id="error-message" class="error"></div>
        
        <form id="registerForm">
            <div class="form-group">
                <label for="username">Username</label>
                <input type="text" id="username" required pattern="[a-zA-Z0-9_]{3,20}" title="Letters, numbers, underscores only (3-20 chars)">
            </div>
            
            <div class="form-group">
                <label for="displayname">Display Name</label>
                <input type="text" id="displayname" required maxlength="20" placeholder="Your in-game name">
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
                Get Started
                <div class="spinner" id="spinner"></div>
            </button>
        </form>
        
        <div class="login-link">
            Already have an account? <a href="login.php">Login here</a>
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
                window.location.href = 'start_menu.php';
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
            spinner.style.display = isLoading ? 'block' : 'none';
        }
    </script>
</body>
</html>