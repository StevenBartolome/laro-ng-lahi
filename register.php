<?php
session_start();

// Handle reset FIRST - before any output
if (isset($_GET['reset'])) {
    unset($_SESSION['reg_step']);
    unset($_SESSION['temp_username']);
    unset($_SESSION['temp_email']);
    unset($_SESSION['temp_password']);
    unset($_SESSION['temp_displayname']);
    unset($_SESSION['otp']);
    unset($_SESSION['otp_time']);
    header("Location: register.php");
    exit();
}

// Database configuration
$servername = "localhost";
$db_username = "root";
$db_password = "password";
$dbname = "laro_ng_lahi";

$conn = new mysqli($servername, $db_username, $db_password, $dbname);

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require 'vendor/autoload.php';

$message = "";

// Initialize step - ensure it defaults to 1 if not set
if (!isset($_SESSION['reg_step'])) {
    $_SESSION['reg_step'] = 1;
}
$step = $_SESSION['reg_step'];

// Handle form submissions
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    
    // Step 1: Basic Account Information
    if (isset($_POST['step1'])) {
        $username = trim($_POST['username']);
        $email = trim($_POST['email']);
        $password = $_POST['password'];
        $confirm_password = $_POST['confirm_password'];
        
        // Validation
        if (empty($username) || empty($email) || empty($password)) {
            $message = "<div class='error'>All fields are required.</div>";
        } elseif ($password !== $confirm_password) {
            $message = "<div class='error'>Passwords do not match.</div>";
        } elseif (strlen($password) < 8) {
            $message = "<div class='error'>Password must be at least 8 characters.</div>";
        } else {
            // Check if username exists
            $stmt = $conn->prepare("SELECT * FROM users WHERE username = ?");
            $stmt->bind_param("s", $username);
            $stmt->execute();
            $result = $stmt->get_result();
            
            if ($result->num_rows > 0) {
                $message = "<div class='error'>Username already exists.</div>";
            } else {
                // Check if email exists
                $stmt = $conn->prepare("SELECT * FROM users WHERE email = ?");
                $stmt->bind_param("s", $email);
                $stmt->execute();
                $emailResult = $stmt->get_result();
                
                if ($emailResult->num_rows > 0) {
                    $message = "<div class='error'>Email already registered.</div>";
                } else {
                    // Store in session and move to step 2
                    $_SESSION['temp_username'] = $username;
                    $_SESSION['temp_email'] = $email;
                    $_SESSION['temp_password'] = password_hash($password, PASSWORD_DEFAULT);
                    $_SESSION['reg_step'] = 2;
                    $step = 2;
                }
            }
            $stmt->close();
        }
    }
    
    // Step 2: Personal Profile & Send OTP
    elseif (isset($_POST['step2'])) {
        $displayname = trim($_POST['displayname']);
        
        if (empty($displayname)) {
            $message = "<div class='error'>Display name is required.</div>";
        } else {
            // Generate OTP
            $otp = rand(100000, 999999);
            $_SESSION['otp'] = $otp;
            $_SESSION['otp_time'] = time();
            $_SESSION['temp_displayname'] = $displayname;
            
            // Send OTP via email
            $mail = new PHPMailer(true);
            try {
                $mail->isSMTP();
                $mail->Host = 'smtp.gmail.com';
                $mail->SMTPAuth = true;
                $mail->Username = 'jrbtruckingservices.2014@gmail.com';
                $mail->Password = 'orfx wkgt vuae yfds';
                $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
                $mail->Port = 587;
                
                $mail->setFrom('noreply@laronglahi.com', 'Laro ng Lahi');
                $mail->addAddress($_SESSION['temp_email']);
                
                $mail->isHTML(true);
                $mail->Subject = 'Email Verification - Laro ng Lahi';
                $mail->Body = "
                    <h2>Welcome to Laro ng Lahi!</h2>
                    <p>Your verification code is: <strong style='font-size: 24px; color: #4CAF50;'>$otp</strong></p>
                    <p>This code is valid for 5 minutes.</p>
                    <p>If you didn't request this, please ignore this email.</p>
                ";
                $mail->AltBody = "Your OTP for registration is: $otp. It is valid for 5 minutes.";
                
                $mail->send();
                
                // Redirect to verification page
                header("Location: verify_email.php");
                exit();
                
            } catch (Exception $e) {
                $message = "<div class='error'>Failed to send verification email. Error: {$mail->ErrorInfo}</div>";
            }
        }
    }
}

$conn->close();
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Register - Laro ng Lahi</title>
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
        
        .logo {
            text-align: center;
            margin-bottom: 30px;
        }
        
        .logo h1 {
            color: #667eea;
            font-size: 32px;
            margin-bottom: 5px;
        }
        
        .logo p {
            color: #666;
            font-size: 14px;
        }
        
        .progress-bar {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
            position: relative;
        }
        
        .progress-bar::before {
            content: '';
            position: absolute;
            top: 15px;
            left: 0;
            right: 0;
            height: 2px;
            background: #ddd;
            z-index: 0;
        }
        
        .progress-step {
            width: 30px;
            height: 30px;
            border-radius: 50%;
            background: #ddd;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            color: #999;
            position: relative;
            z-index: 1;
        }
        
        .progress-step.active {
            background: #667eea;
            color: white;
        }
        
        .progress-step.completed {
            background: #4CAF50;
            color: white;
        }
        
        .form-group {
            margin-bottom: 20px;
        }
        
        label {
            display: block;
            margin-bottom: 8px;
            color: #333;
            font-weight: 500;
        }
        
        input[type="text"],
        input[type="email"],
        input[type="password"] {
            width: 100%;
            padding: 12px;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            font-size: 14px;
            transition: border-color 0.3s;
        }
        
        input:focus {
            outline: none;
            border-color: #667eea;
        }
        
        .btn {
            width: 100%;
            padding: 12px;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
        }
        
        .btn-primary {
            background: #667eea;
            color: white;
        }
        
        .btn-primary:hover {
            background: #5568d3;
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
        }
        
        .error {
            background: #ffebee;
            color: #c62828;
            padding: 12px;
            border-radius: 8px;
            margin-bottom: 20px;
            border-left: 4px solid #c62828;
        }
        
        .success {
            background: #e8f5e9;
            color: #2e7d32;
            padding: 12px;
            border-radius: 8px;
            margin-bottom: 20px;
            border-left: 4px solid #2e7d32;
        }
        
        .login-link {
            text-align: center;
            margin-top: 20px;
            color: #666;
        }
        
        .login-link a {
            color: #667eea;
            text-decoration: none;
            font-weight: 600;
        }
        
        .login-link a:hover {
            text-decoration: underline;
        }
        
        .step-title {
            font-size: 20px;
            color: #333;
            margin-bottom: 20px;
            text-align: center;
        }
        
        .back-btn {
            background: none;
            border: none;
            color: #667eea;
            cursor: pointer;
            font-size: 14px;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            padding: 0;
        }
        
        .back-btn:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">
            <h1>Laro ng Lahi</h1>
            <p>Create your account</p>
        </div>
        
        <div class="progress-bar">
            <div class="progress-step <?php echo $step >= 1 ? 'active' : ''; ?> <?php echo $step > 1 ? 'completed' : ''; ?>">1</div>
            <div class="progress-step <?php echo $step >= 2 ? 'active' : ''; ?>">2</div>
        </div>
        
        <?php if (!empty($message)) echo $message; ?>
        
        <?php if ($step == 1): ?>
            <h2 class="step-title">Basic Account Information</h2>
            <form method="POST" action="">
                <div class="form-group">
                    <label for="username">Username *</label>
                    <input type="text" id="username" name="username" required 
                           pattern="[a-zA-Z0-9_]{3,20}" 
                           title="3-20 characters, letters, numbers and underscore only"
                           value="<?php echo isset($_SESSION['temp_username']) ? htmlspecialchars($_SESSION['temp_username']) : ''; ?>">
                </div>
                
                <div class="form-group">
                    <label for="email">Email Address *</label>
                    <input type="email" id="email" name="email" required
                           value="<?php echo isset($_SESSION['temp_email']) ? htmlspecialchars($_SESSION['temp_email']) : ''; ?>">
                </div>
                
                <div class="form-group">
                    <label for="password">Password *</label>
                    <input type="password" id="password" name="password" required minlength="8">
                </div>
                
                <div class="form-group">
                    <label for="confirm_password">Confirm Password *</label>
                    <input type="password" id="confirm_password" name="confirm_password" required>
                </div>
                
                <button type="submit" name="step1" class="btn btn-primary">Next</button>
            </form>
        
        <?php elseif ($step == 2): ?>
            <button class="back-btn" onclick="window.location.href='register.php?reset=1'">← Back</button>
            <h2 class="step-title">Personal Profile</h2>
            <form method="POST" action="">
                <div class="form-group">
                    <label for="displayname">Display Name / Nickname *</label>
                    <input type="text" id="displayname" name="displayname" required 
                           maxlength="50" 
                           placeholder="How should we call you in-game?"
                           value="<?php echo isset($_SESSION['temp_displayname']) ? htmlspecialchars($_SESSION['temp_displayname']) : ''; ?>">
                </div>
                
                <button type="submit" name="step2" class="btn btn-primary">Send Verification Code</button>
            </form>
        <?php else: ?>
            <div class="error">Invalid registration step. Please start over.</div>
            <button class="btn btn-primary" onclick="window.location.href='register.php?reset=1'">Start Registration</button>
        <?php endif; ?>
        
        <div class="login-link">
            Already have an account? <a href="login.php">Login here</a>
        </div>
    </div>
</body>
</html>