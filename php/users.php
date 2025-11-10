<?php
// Controlador de Usuarios - Maneja todas las operaciones relacionadas con usuarios
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json');
require_once '../../BD/Connection.php';

$response = ['success' => false, 'message' => '', 'data' => null];

// Obtener la acción del parámetro
$action = $_GET['action'] ?? $_POST['action'] ?? null;

if (!$action) {
    $response['message'] = 'Acción no especificada.';
    echo json_encode($response);
    exit;
}

switch ($action) {
    case 'get_list':
        getUsersList($conn, $response);
        break;
    
    case 'get_profile':
        getUserProfile($conn, $response);
        break;
    
    case 'update_status':
        updateUserStatus($conn, $response);
        break;
    
    default:
        $response['message'] = 'Acción no válida.';
        break;
}

echo json_encode($response);
$conn->close();

// ==================== FUNCIONES ====================

function getUsersList($conn, &$response) {
    $user_id = $_GET['user_id'] ?? null;

    if (!$user_id) {
        $response['message'] = 'ID de usuario requerido.';
        return;
    }

    $stmt = $conn->prepare('SELECT id, username, email, connection_status, last_seen FROM users WHERE id != ? ORDER BY username ASC');
    $stmt->bind_param('i', $user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $users = [];

    while ($row = $result->fetch_assoc()) {
        $users[] = $row;
    }

    $response['success'] = true;
    $response['data'] = $users;
    $stmt->close();
}

function getUserProfile($conn, &$response) {
    $user_id = $_GET['profile_id'] ?? null;

    if (!$user_id) {
        $response['message'] = 'ID de usuario requerido.';
        return;
    }

    $stmt = $conn->prepare('SELECT id, username, email, connection_status, last_seen, created_at FROM users WHERE id = ?');
    $stmt->bind_param('i', $user_id);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($row = $result->fetch_assoc()) {
        $response['success'] = true;
        $response['data'] = $row;
    } else {
        $response['message'] = 'Usuario no encontrado.';
    }
    $stmt->close();
}

function updateUserStatus($conn, &$response) {
    $data = json_decode(file_get_contents('php://input'), true);
    $user_id = $data['user_id'] ?? null;
    $status = $data['status'] ?? 'offline';

    if (!$user_id) {
        $response['message'] = 'ID de usuario requerido.';
        return;
    }

    $stmt = $conn->prepare('UPDATE users SET connection_status = ?, last_seen = NOW() WHERE id = ?');
    $stmt->bind_param('si', $status, $user_id);

    if ($stmt->execute()) {
        $response['success'] = true;
        $response['message'] = 'Estado actualizado correctamente.';
    } else {
        $response['message'] = 'Error al actualizar estado.';
    }
    $stmt->close();
}
?>
