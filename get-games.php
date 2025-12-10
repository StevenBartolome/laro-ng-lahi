<?php
// get-games.php - Use this version if you use MySQLi instead of PDO
error_reporting(0);
header('Content-Type: application/json');

session_start();

// Check if user is logged in
if (!isset($_SESSION['logged_in']) || !$_SESSION['logged_in']) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Unauthorized']);
    exit();
}

// Database connection settings - UPDATE THESE
$host = 'localhost';
$username = 'root';
$password = 'password';
$database = 'laro_ng_lahi';

try {
    // Create MySQLi connection
    $conn = new mysqli($host, $username, $password, $database);
    
    if ($conn->connect_error) {
        throw new Exception('Connection failed: ' . $conn->connect_error);
    }
    
    $conn->set_charset('utf8mb4');
    
    $sql = "SELECT game_id, name, description, category, min_players, max_players, game_path 
        FROM games 
        WHERE status = 'active' AND is_multiplayer = 1
        ORDER BY name ASC";
    
    $result = $conn->query($sql);
    
    if (!$result) {
        throw new Exception('Query failed: ' . $conn->error);
    }
    
    $games = [];
    while ($row = $result->fetch_assoc()) {
        $games[] = $row;
    }
    
    $conn->close();
    
    echo json_encode(['success' => true, 'games' => $games]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>