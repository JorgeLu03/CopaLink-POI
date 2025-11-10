<?php
// Habilitar la visualización de errores para depuración
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json');
require_once '../../BD/Connection.php';

$response = ['success' => false, 'message' => ''];

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    $response['message'] = 'Método no permitido.';
    echo json_encode($response);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$user_id = $data['user_id'] ?? null;

if (!$user_id) {
    $response['message'] = 'ID de usuario requerido.';
    echo json_encode($response);
    exit;
}

// Actualizar el estado del usuario a offline
$stmt = $conn->prepare('UPDATE users SET connection_status = \'offline\', last_seen = NOW() WHERE id = ?');
$stmt->bind_param('i', $user_id);

if ($stmt->execute()) {
    $response['success'] = true;
    $response['message'] = 'Sesión cerrada correctamente.';
} else {
    $response['message'] = 'Error al cerrar sesión.';
}

$stmt->close();
$conn->close();
echo json_encode($response);
?>
