<?php
session_start();
// clear any old session
session_unset();
session_destroy();

// start fresh
session_start();

$_SESSION['logged_in'] = true;
$_SESSION['username'] = 'Guest';
$_SESSION['displayname'] = 'Guest Player';
$_SESSION['email'] = 'guest@example.com';
$_SESSION['is_guest'] = true;

echo json_encode(['success' => true]);
?>
