<?php
session_start();

// Check if user is logged in
if (!isset($_SESSION['logged_in']) || $_SESSION['logged_in'] !== true) {
    header("Location: login.php");
    exit();
}

// Get user information from session
$username = $_SESSION['username'];
$displayname = $_SESSION['displayname'];
$email = $_SESSION['email'];
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard - Laro ng Lahi</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        
        .navbar {
            background: white;
            border-radius: 10px;
            padding: 20px 30px;
            margin-bottom: 30px;
            box-shadow: 0 5px 20px rgba(0,0,0,0.1);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .navbar h1 {
            color: #667eea;
            font-size: 24px;
        }
        
        .navbar .user-info {
            display: flex;
            align-items: center;
            gap: 20px;
        }
        
        .navbar .user-name {
            color: #333;
            font-weight: 600;
        }
        
        .navbar .logout-btn {
            padding: 8px 20px;
            background: #667eea;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            text-decoration: none;
            font-weight: 600;
        }
        
        .navbar .logout-btn:hover {
            background: #5568d3;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        
        .welcome-card {
            background: white;
            border-radius: 15px;
            padding: 40px;
            box-shadow: 0 5px 20px rgba(0,0,0,0.1);
            margin-bottom: 30px;
            text-align: center;
        }
        
        .welcome-card h2 {
            color: #333;
            margin-bottom: 10px;
            font-size: 32px;
        }
        
        .welcome-card p {
            color: #666;
            font-size: 18px;
        }
        
        .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .info-card {
            background: white;
            border-radius: 10px;
            padding: 25px;
            box-shadow: 0 5px 20px rgba(0,0,0,0.1);
        }
        
        .info-card h3 {
            color: #667eea;
            margin-bottom: 15px;
            font-size: 18px;
        }
        
        .info-card .info-row {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #f0f0f0;
        }
        
        .info-card .info-row:last-child {
            border-bottom: none;
        }
        
        .info-card .label {
            color: #666;
            font-weight: 500;
        }
        
        .info-card .value {
            color: #333;
            font-weight: 600;
        }
        
        .game-section {
            background: white;
            border-radius: 15px;
            padding: 40px;
            box-shadow: 0 5px 20px rgba(0,0,0,0.1);
            text-align: center;
        }
        
        .game-section h2 {
            color: #333;
            margin-bottom: 20px;
        }
        
        .game-btn {
            padding: 15px 40px;
            background: #667eea;
            color: white;
            border: none;
            border-radius: 10px;
            font-size: 18px;
            font-weight: 600;
            cursor: pointer;
            margin: 10px;
            transition: all 0.3s;
        }
        
        .game-btn:hover {
            background: #5568d3;
            transform: translateY(-3px);
            box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
        }
    </style>
</head>
<body>
    <div class="navbar">
        <h1>🎮 Laro ng Lahi</h1>
        <div class="user-info">
            <span class="user-name">Welcome, <?php echo htmlspecialchars($displayname); ?>!</span>
            <a href="logout.php" class="logout-btn">Logout</a>
        </div>
    </div>
    
    <div class="container">
        <div class="welcome-card">
            <h2>Mabuhay, <?php echo htmlspecialchars($displayname); ?>! 🎉</h2>
            <p>Ready to play traditional Filipino games?</p>
        </div>
        
        <div class="info-grid">
            <div class="info-card">
                <h3>Account Information</h3>
                <div class="info-row">
                    <span class="label">Username:</span>
                    <span class="value"><?php echo htmlspecialchars($username); ?></span>
                </div>
                <div class="info-row">
                    <span class="label">Display Name:</span>
                    <span class="value"><?php echo htmlspecialchars($displayname); ?></span>
                </div>
                <div class="info-row">
                    <span class="label">Email:</span>
                    <span class="value"><?php echo htmlspecialchars($email); ?></span>
                </div>
            </div>
            
            <div class="info-card">
                <h3>Game Stats</h3>
                <div class="info-row">
                    <span class="label">Games Played:</span>
                    <span class="value">0</span>
                </div>
                <div class="info-row">
                    <span class="label">Total Score:</span>
                    <span class="value">0</span>
                </div>
                <div class="info-row">
                    <span class="label">Rank:</span>
                    <span class="value">Beginner</span>
                </div>
            </div>
        </div>
        
        <div class="game-section">
            <h2>Start Playing!</h2>
            <p style="color: #666; margin-bottom: 30px;">Choose your favorite Filipino traditional game</p>
            <button class="game-btn">🎯 Patintero</button>
            <button class="game-btn">🏃 Tumbang Preso</button>
            <button class="game-btn">🎭 Langit Lupa</button>
            <button class="game-btn">🎪 Luksong Tinik</button>
        </div>
    </div>
</body>
</html>