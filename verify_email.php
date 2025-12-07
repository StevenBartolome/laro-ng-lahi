<?php
session_start();

// Check if user has completed registration steps
if (!isset($_SESSION['temp_username']) || !isset($_SESSION['temp_email']) || !isset($_SESSION['otp'])) {
    header("Location: register.php");
    exit();
}

// Include database configuration
require_once 'config/db.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require 'vendor/autoload.php';

$message = "";

// Handle form submissions
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    
    // Verify OTP
    if (isset($_POST['verify_otp'])) {
        $entered_otp = $_POST['otp'];
        
        // Check if OTP is expired (5 minutes = 300 seconds)
        if (time() - $_SESSION['otp_time'] > 300) {
            $message = "<div class='error'>OTP has expired. Please request a new one.</div>";
        } elseif ($entered_otp != $_SESSION['otp']) {
            $message = "<div class='error'>Invalid OTP. Please try again.</div>";
        } else {
            // OTP verified, insert into database
            $conn->begin_transaction();
            
            try {
                // Insert into users table
                $stmt = $conn->prepare("INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)");
                $stmt->bind_param("sss", $_SESSION['temp_username'], $_SESSION['temp_email'], $_SESSION['temp_password']);
                $stmt->execute();
                $user_id = $conn->insert_id;
                $stmt->close();
                
                // Insert into user_profile table
                $stmt = $conn->prepare("INSERT INTO user_profile (displayname, user_id) VALUES (?, ?)");
                $stmt->bind_param("si", $_SESSION['temp_displayname'], $user_id);
                $stmt->execute();
                $stmt->close();
                
                $conn->commit();
                
                // Clear session variables
                unset($_SESSION['temp_username']);
                unset($_SESSION['temp_email']);
                unset($_SESSION['temp_password']);
                unset($_SESSION['temp_displayname']);
                unset($_SESSION['otp']);
                unset($_SESSION['otp_time']);
                unset($_SESSION['reg_step']);
                
                $message = "<div class='success'>✓ Registration successful! Redirecting to login...</div>";
                header("refresh:2;url=login.php");
                
            } catch (Exception $e) {
                $conn->rollback();
                $message = "<div class='error'>Registration failed. Please try again.</div>";
            }
        }
    }
    
    // Resend OTP
    elseif (isset($_POST['resend_otp'])) {
        $otp = rand(100000, 999999);
        $_SESSION['otp'] = $otp;
        $_SESSION['otp_time'] = time();
        
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
                <p>Your new verification code is: <strong style='font-size: 24px; color: #4CAF50;'>$otp</strong></p>
                <p>This code is valid for 5 minutes.</p>
                <p>If you didn't request this, please ignore this email.</p>
            ";
            $mail->AltBody = "Your new verification code is: $otp. Valid for 5 minutes.";
            
            $mail->send();
            $message = "<div class='success'>✓ New verification code sent to your email!</div>";
        } catch (Exception $e) {
            $message = "<div class='error'>Failed to resend code. Error: {$mail->ErrorInfo}</div>";
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
    <title>Email Verification - Laro ng Lahi</title>
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
        
        .verification-icon {
            text-align: center;
            margin-bottom: 20px;
        }
        
        .verification-icon svg {
            width: 80px;
            height: 80px;
            stroke: #667eea;
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
        
        input[type="text"] {
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
        
        .btn-secondary {
            background: #f0f0f0;
            color: #666;
            margin-top: 10px;
        }
        
        .btn-secondary:hover {
            background: #e0e0e0;
        }
        
        .btn-secondary:disabled {
            opacity: 0.6;
            cursor: not-allowed;
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
        
        .step-title {
            font-size: 20px;
            color: #333;
            margin-bottom: 20px;
            text-align: center;
        }
        
        .otp-input {
            text-align: center;
            font-size: 24px;
            letter-spacing: 10px;
            font-weight: bold;
        }
        
        .email-info {
            background: #f5f5f5;
            padding: 15px;
            border-radius: 8px;
            text-align: center;
            margin-bottom: 20px;
        }
        
        .email-info p {
            color: #666;
            margin-bottom: 5px;
        }
        
        .email-info strong {
            color: #333;
            font-size: 16px;
        }
        
        .timer {
            text-align: center;
            margin-bottom: 20px;
            color: #666;
            font-size: 14px;
        }
        
        .timer.expired {
            color: #c62828;
            font-weight: bold;
        }
        
        .instructions {
            background: #e3f2fd;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            border-left: 4px solid #2196F3;
        }
        
        .instructions p {
            color: #1565c0;
            font-size: 14px;
            line-height: 1.6;
        }
        
        .instructions ul {
            margin-top: 10px;
            margin-left: 20px;
            color: #1565c0;
        }
        
        .instructions li {
            margin-bottom: 5px;
            font-size: 13px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">
            <h1>Laro ng Lahi</h1>
            <p>Email Verification</p>
        </div>
        
        <div class="verification-icon">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
        </div>
        
        <?php echo $message; ?>
        
        <div class="instructions">
            <p><strong>📧 Check your email inbox</strong></p>
            <ul>
                <li>We've sent a 6-digit code to your email</li>
                <li>The code is valid for 5 minutes</li>
                <li>Check your spam folder if you don't see it</li>
            </ul>
        </div>
        
        <div class="email-info">
            <p>Verification code sent to:</p>
            <strong><?php echo htmlspecialchars($_SESSION['temp_email']); ?></strong>
        </div>
        
        <form method="POST" action="">
            <div class="form-group">
                <label for="otp">Enter 6-Digit Code *</label>
                <input type="text" id="otp" name="otp" required 
                       pattern="[0-9]{6}" 
                       maxlength="6" 
                       class="otp-input"
                       placeholder="000000"
                       autocomplete="off">
            </div>
            
            <button type="submit" name="verify_otp" class="btn btn-primary">Verify & Complete Registration</button>
            
            <button type="submit" name="resend_otp" class="btn btn-secondary" id="resendBtn">
                Resend Code
            </button>
        </form>
    </div>
    
    <script>        
        // Auto-focus on OTP input
        document.getElementById('otp').focus();
        
        // Only allow numbers in OTP input
        document.getElementById('otp').addEventListener('input', function(e) {
            this.value = this.value.replace(/[^0-9]/g, '');
        });
    </script>
</body>
</html>