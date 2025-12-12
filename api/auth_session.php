<?php
session_start();
header('Content-Type: application/json');

// Get JSON input
$data = json_decode(file_get_contents('php://input'), true);

if ($data && isset($data['uid'])) {
    // SECURITY WARNING: In a production environment, you should verify the ID Token sent from client
    // instead of trusting the posted data directly. For this prototype, we accept the data.
    
    $_SESSION['user_id'] = $data['uid'];
    $_SESSION['email'] = $data['email'];
    $_SESSION['username'] = $data['username'] ?? explode('@', $data['email'])[0]; // Fallback to email prefix
    $_SESSION['displayname'] = $data['displayname'] ?? 'Player';
    $_SESSION['logged_in'] = true;
    
    // Crucial: write session data and close to ensure it saves before the redirect happens on client
    session_write_close();

    echo json_encode(['success' => true]);
} else {
    echo json_encode(['success' => false, 'error' => 'Invalid data']);
}
?>
