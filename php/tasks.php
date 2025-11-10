<?php
// Controlador de Tareas - Maneja todas las operaciones relacionadas con tareas
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
    case 'create':
        createTask($conn, $response);
        break;
    
    case 'get_list':
        getTasksList($conn, $response);
        break;
    
    case 'update':
        updateTask($conn, $response);
        break;
    
    case 'delete':
        deleteTask($conn, $response);
        break;
    
    default:
        $response['message'] = 'Acción no válida.';
        break;
}

echo json_encode($response);
$conn->close();

// ==================== FUNCIONES ====================

function createTask($conn, &$response) {
    $data = json_decode(file_get_contents('php://input'), true);
    $group_id = $data['group_id'] ?? null;
    $title = $data['title'] ?? null;
    $creator_id = $data['creator_id'] ?? null;

    if (!$group_id || !$title || !$creator_id) {
        $response['message'] = 'Faltan datos obligatorios.';
        return;
    }

    $stmt = $conn->prepare('INSERT INTO tasks (group_id, title, creator_id) VALUES (?, ?, ?)');
    $stmt->bind_param('isi', $group_id, $title, $creator_id);

    if ($stmt->execute()) {
        $task_id = $stmt->insert_id;
        $response['success'] = true;
        $response['message'] = 'Tarea creada correctamente.';
        $response['data'] = ['task_id' => $task_id, 'title' => $title];
    } else {
        $response['message'] = 'Error al crear la tarea.';
    }
    $stmt->close();
}

function getTasksList($conn, &$response) {
    $group_id = $_GET['group_id'] ?? null;

    if (!$group_id) {
        $response['message'] = 'ID de grupo requerido.';
        return;
    }

    $stmt = $conn->prepare('
        SELECT t.id, t.title, t.is_completed, t.created_at, u.username as creator_name
        FROM tasks t
        JOIN users u ON t.creator_id = u.id
        WHERE t.group_id = ?
        ORDER BY t.is_completed ASC, t.created_at DESC
    ');
    $stmt->bind_param('i', $group_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $tasks = [];

    while ($row = $result->fetch_assoc()) {
        $tasks[] = $row;
    }

    $response['success'] = true;
    $response['data'] = $tasks;
    $stmt->close();
}

function updateTask($conn, &$response) {
    $data = json_decode(file_get_contents('php://input'), true);
    $task_id = $data['task_id'] ?? null;
    $is_completed = $data['is_completed'] ?? false;

    if (!$task_id) {
        $response['message'] = 'ID de tarea requerido.';
        return;
    }

    $stmt = $conn->prepare('UPDATE tasks SET is_completed = ? WHERE id = ?');
    $stmt->bind_param('ii', $is_completed, $task_id);

    if ($stmt->execute()) {
        $response['success'] = true;
        $response['message'] = 'Estado de tarea actualizado.';
    } else {
        $response['message'] = 'Error al actualizar tarea.';
    }
    $stmt->close();
}

function deleteTask($conn, &$response) {
    $data = json_decode(file_get_contents('php://input'), true);
    $task_id = $data['task_id'] ?? null;

    if (!$task_id) {
        $response['message'] = 'ID de tarea requerido.';
        return;
    }

    $stmt = $conn->prepare('DELETE FROM tasks WHERE id = ?');
    $stmt->bind_param('i', $task_id);

    if ($stmt->execute()) {
        $response['success'] = true;
        $response['message'] = 'Tarea eliminada correctamente.';
    } else {
        $response['message'] = 'Error al eliminar tarea.';
    }
    $stmt->close();
}
?>
