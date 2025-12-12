<?php
session_start();

// Set guest session
$_SESSION['is_guest'] = true;
$_SESSION['logged_in'] = false;
$_SESSION['username'] = 'Guest';
$_SESSION['displayname'] = 'Guest Player';
$_SESSION['email'] = '';

// Redirect to game selection
header("Location: game_select.php");
exit();
?>
