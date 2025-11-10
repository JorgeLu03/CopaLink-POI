<?php
// Controlador de Mensajes - Maneja todas las operaciones relacionadas con mensajes
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
    case 'send':
        sendMessage($conn, $response);
        break;
    
    case 'get':
        getMessages($conn, $response);
        break;
    
    case 'delete':
        deleteMessage($conn, $response);
        break;
    
    default:
        $response['message'] = 'Acción no válida.';
        break;
}

echo json_encode($response);
$conn->close();

// ==================== FUNCIONES ====================

function sendMessage($conn, &$response) {
    $data = json_decode(file_get_contents('php://input'), true);
    $sender_id = $data['sender_id'] ?? null;
    $recipient_id = $data['recipient_id'] ?? null;
    $group_id = $data['group_id'] ?? null;
    $content = $data['content'] ?? null;
    $is_encrypted = $data['is_encrypted'] ?? false;

    if (!$sender_id || !$content) {
        $response['message'] = 'Faltan datos obligatorios.';
        return;
    }

    if (($recipient_id && $group_id) || (!$recipient_id && !$group_id)) {
        $response['message'] = 'Debe especificar solo un destinatario (usuario o grupo).';
        return;
    }

    $stmt = $conn->prepare('INSERT INTO messages (sender_id, recipient_id, group_id, content, is_encrypted) VALUES (?, ?, ?, ?, ?)');
    $stmt->bind_param('iiisi', $sender_id, $recipient_id, $group_id, $content, $is_encrypted);

    if ($stmt->execute()) {
        $message_id = $stmt->insert_id;
        $response['success'] = true;
        $response['message'] = 'Mensaje enviado correctamente.';
        $response['data'] = ['message_id' => $message_id];
    } else {
        $response['message'] = 'Error al enviar el mensaje.';
    }
    $stmt->close();
}

function getMessages($conn, &$response) {
    $user_id = $_GET['user_id'] ?? null;
    $recipient_id = $_GET['recipient_id'] ?? null;
    $group_id = $_GET['group_id'] ?? null;
    $limit = $_GET['limit'] ?? 50;

    if (!$user_id) {
        $response['message'] = 'ID de usuario requerido.';
        return;
    }

    if ($recipient_id) {
        $stmt = $conn->prepare('
            SELECT m.id, m.sender_id, m.content, m.is_encrypted, m.created_at, u.username as sender_name
            FROM messages m
            JOIN users u ON m.sender_id = u.id
            WHERE (m.sender_id = ? AND m.recipient_id = ?) OR (m.sender_id = ? AND m.recipient_id = ?)
            ORDER BY m.created_at ASC
            LIMIT ?
        ');
        $stmt->bind_param('iiiii', $user_id, $recipient_id, $recipient_id, $user_id, $limit);
    } else if ($group_id) {
        $stmt = $conn->prepare('
            SELECT m.id, m.sender_id, m.content, m.is_encrypted, m.created_at, u.username as sender_name
            FROM messages m
            JOIN users u ON m.sender_id = u.id
            WHERE m.group_id = ?
            ORDER BY m.created_at ASC
            LIMIT ?
        ');
        $stmt->bind_param('ii', $group_id, $limit);
    } else {
        $response['message'] = 'Debe especificar recipient_id o group_id.';
        return;
    }

    $stmt->execute();
    $result = $stmt->get_result();
    $messages = [];

    while ($row = $result->fetch_assoc()) {
        $messages[] = $row;
    }

    $response['success'] = true;
    $response['data'] = $messages;
    $stmt->close();
}

function deleteMessage($conn, &$response) {
    $data = json_decode(file_get_contents('php://input'), true);
    $message_id = $data['message_id'] ?? null;

    if (!$message_id) {
        $response['message'] = 'ID de mensaje requerido.';
        return;
    }

    $stmt = $conn->prepare('DELETE FROM messages WHERE id = ?');
    $stmt->bind_param('i', $message_id);

    if ($stmt->execute()) {
        $response['success'] = true;
        $response['message'] = 'Mensaje eliminado correctamente.';
    } else {
        $response['message'] = 'Error al eliminar mensaje.';
    }
    $stmt->close();
}
?>
