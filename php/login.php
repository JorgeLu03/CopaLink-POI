<?php
// Habilitar la visualización de errores para depuración
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json');
require_once '../../BD/Connection.php';

$response = ['success' => false, 'message' => '', 'user' => null];

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    $response['message'] = 'Método no permitido.';
    echo json_encode($response);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$email = $data['email'] ?? null;
$password = $data['password'] ?? null;

if (!$email || !$password) {
    $response['message'] = 'Por favor, completa todos los campos.';
    echo json_encode($response);
    exit;
}

$stmt = $conn->prepare('SELECT id, username, email, password, connection_status FROM users WHERE email = ?');
$stmt->bind_param('s', $email);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 1) {
    $user = $result->fetch_assoc();
    if (password_verify($password, $user['password'])) {
        // Actualizar el estado de conexión a 'online'
        $update = $conn->prepare('UPDATE users SET connection_status = \'online\', last_seen = NOW() WHERE id = ?');
        $update->bind_param('i', $user['id']);
        $update->execute();
        $update->close();
        unset($user['password']); // No enviar la contraseña al frontend
        $response['success'] = true;
        $response['message'] = 'Inicio de sesión exitoso.';
        $response['user'] = $user;
    } else {
        $response['message'] = 'Contraseña incorrecta.';
    }
} else {
    $response['message'] = 'Usuario no encontrado.';
}

$stmt->close();
$conn->close();
echo json_encode($response);
?>
