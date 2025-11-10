<?php
// Controlador de Grupos - Maneja todas las operaciones relacionadas con grupos
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
        createGroup($conn, $response);
        break;
    
    case 'get_list':
        getGroupsList($conn, $response);
        break;
    
    case 'get_members':
        getGroupMembers($conn, $response);
        break;
    
    case 'add_member':
        addGroupMember($conn, $response);
        break;
    
    default:
        $response['message'] = 'Acción no válida.';
        break;
}

echo json_encode($response);
$conn->close();

// ==================== FUNCIONES ====================

function createGroup($conn, &$response) {
    $data = json_decode(file_get_contents('php://input'), true);
    $group_name = $data['name'] ?? null;
    $creator_id = $data['creator_id'] ?? null;
    $members = $data['members'] ?? [];

    if (!$group_name || !$creator_id) {
        $response['message'] = 'Faltan datos obligatorios (nombre y creador).';
        return;
    }

    $conn->begin_transaction();

    try {
        // Crear el grupo
        $stmt = $conn->prepare('INSERT INTO groups (name, creator_id) VALUES (?, ?)');
        $stmt->bind_param('si', $group_name, $creator_id);
        
        if (!$stmt->execute()) {
            throw new Exception('Error al crear el grupo.');
        }
        
        $group_id = $stmt->insert_id;
        $stmt->close();
        
        // Agregar al creador como miembro
        $stmt_member = $conn->prepare('INSERT INTO group_members (group_id, user_id) VALUES (?, ?)');
        $stmt_member->bind_param('ii', $group_id, $creator_id);
        $stmt_member->execute();
        $stmt_member->close();
        
        // Agregar otros miembros
        if (!empty($members)) {
            $stmt_member = $conn->prepare('INSERT INTO group_members (group_id, user_id) VALUES (?, ?)');
            foreach ($members as $member_id) {
                if ($member_id != $creator_id) {
                    $stmt_member->bind_param('ii', $group_id, $member_id);
                    $stmt_member->execute();
                }
            }
            $stmt_member->close();
        }
        
        $conn->commit();
        
        $response['success'] = true;
        $response['message'] = 'Grupo creado correctamente.';
        $response['data'] = ['group_id' => $group_id, 'group_name' => $group_name];
        
    } catch (Exception $e) {
        $conn->rollback();
        $response['message'] = $e->getMessage();
    }
}

function getGroupsList($conn, &$response) {
    $user_id = $_GET['user_id'] ?? null;

    if (!$user_id) {
        $response['message'] = 'ID de usuario requerido.';
        return;
    }

    $stmt = $conn->prepare('
        SELECT g.id, g.name, g.creator_id, g.created_at,
               (SELECT COUNT(*) FROM group_members gm WHERE gm.group_id = g.id) as member_count
        FROM groups g
        INNER JOIN group_members gm ON g.id = gm.group_id
        WHERE gm.user_id = ?
        ORDER BY g.created_at DESC
    ');
    $stmt->bind_param('i', $user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $groups = [];

    while ($row = $result->fetch_assoc()) {
        $groups[] = $row;
    }

    $response['success'] = true;
    $response['data'] = $groups;
    $stmt->close();
}

function getGroupMembers($conn, &$response) {
    $group_id = $_GET['group_id'] ?? null;

    if (!$group_id) {
        $response['message'] = 'ID de grupo requerido.';
        return;
    }

    $stmt = $conn->prepare('
        SELECT u.id, u.username, u.email, u.connection_status, gm.joined_at
        FROM users u
        INNER JOIN group_members gm ON u.id = gm.user_id
        WHERE gm.group_id = ?
        ORDER BY gm.joined_at ASC
    ');
    $stmt->bind_param('i', $group_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $members = [];

    while ($row = $result->fetch_assoc()) {
        $members[] = $row;
    }

    $response['success'] = true;
    $response['data'] = $members;
    $stmt->close();
}

function addGroupMember($conn, &$response) {
    $data = json_decode(file_get_contents('php://input'), true);
    $group_id = $data['group_id'] ?? null;
    $user_id = $data['user_id'] ?? null;

    if (!$group_id || !$user_id) {
        $response['message'] = 'Faltan datos obligatorios.';
        return;
    }

    $stmt = $conn->prepare('INSERT INTO group_members (group_id, user_id) VALUES (?, ?)');
    $stmt->bind_param('ii', $group_id, $user_id);

    if ($stmt->execute()) {
        $response['success'] = true;
        $response['message'] = 'Miembro agregado correctamente.';
    } else {
        $response['message'] = 'Error al agregar miembro (puede que ya esté en el grupo).';
    }
    $stmt->close();
}
?>
