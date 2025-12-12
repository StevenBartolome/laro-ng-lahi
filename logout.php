<?php
session_start();
session_unset();
session_destroy();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Logging out...</title>
    <!-- Firebase SDKs -->
    <script src="https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js"></script>
    <script src="https://www.gstatic.com/firebasejs/8.10.0/firebase-auth.js"></script>
    <script src="assets/js/firebase-config.js"></script>
</head>
<body>
    <script>
        // Ensure Firebase session is also cleared
        firebase.auth().signOut().then(() => {
            window.location.href = 'login.php';
        }).catch((error) => {
            console.error(error);
            window.location.href = 'login.php';
        });
    </script>
</body>
</html>