<?php
// Database configuration
$servername = "localhost";
$db_username = "root";
$db_password = "password";
$dbname = "laro_ng_lahi";

$conn = new mysqli($servername, $db_username, $db_password, $dbname);

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// Set charset to utf8
$conn->set_charset("utf8");
?>