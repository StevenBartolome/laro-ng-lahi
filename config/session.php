<?php
// Common session configuration for the entire application
// Include this file BEFORE calling session_start() in any PHP file

// Configure session cookie parameters
session_set_cookie_params([
    'lifetime' => 0, // Session cookie (expires when browser closes)
    'path' => '/',
    'domain' => '', // Use default (current domain)
    'secure' => false, // Set to true if using HTTPS
    'httponly' => true, // Prevent JavaScript access to session cookie
    'samesite' => 'Lax' // CRITICAL: Allow cookies on same-site navigation
]);

// Start the session
session_start();
?>
