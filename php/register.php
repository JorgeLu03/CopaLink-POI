<?php
// Habilitar la visualización de errores para depuración
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Establecer la cabecera para la respuesta JSON
header('Content-Type: application/json');

// Incluir el archivo de conexión a la base de datos
require_once '../../BD/Connection.php';

// Definir un array para la respuesta
$response = ['success' => false, 'message' => ''];

// Validar el método de la solicitud
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    $response['message'] = 'Método no permitido.';
    echo json_encode($response);
    exit;
}

// Obtener y decodificar los datos JSON del cuerpo de la solicitud
$data = json_decode(file_get_contents('php://input'), true);

// Validar que los datos necesarios están presentes
$username = $data['username'] ?? null;
$email = $data['email'] ?? null;
$password = $data['password'] ?? null;

if (!$username || !$email || !$password) {
    $response['message'] = 'Por favor, completa todos los campos.';
    echo json_encode($response);
    exit;
}

// Validar el formato del correo electrónico
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $response['message'] = 'El formato del correo electrónico no es válido.';
    echo json_encode($response);
    exit;
}

// Validar la longitud de la contraseña
if (strlen($password) < 6) {
    $response['message'] = 'La contraseña debe tener al menos 6 caracteres.';
    echo json_encode($response);
    exit;
}

// Hashear la contraseña para almacenamiento seguro
$hashed_password = password_hash($password, PASSWORD_BCRYPT);

// Preparar la consulta para evitar inyecciones SQL
$stmt_check = $conn->prepare("SELECT id FROM users WHERE username = ? OR email = ?");
$stmt_check->bind_param("ss", $username, $email);
$stmt_check->execute();
$result_check = $stmt_check->get_result();

if ($result_check->num_rows > 0) {
    // El usuario o el email ya existen
    $response['message'] = 'El nombre de usuario o el correo ya están en uso.';
} else {
    // Insertar el nuevo usuario en la base de datos
    $stmt_insert = $conn->prepare("INSERT INTO users (username, email, password) VALUES (?, ?, ?)");
    $stmt_insert->bind_param("sss", $username, $email, $hashed_password);

    if ($stmt_insert->execute()) {
        $response['success'] = true;
        $response['message'] = '¡Registro exitoso! Ahora puedes iniciar sesión.';
    } else {
        $response['message'] = 'Error al crear la cuenta. Inténtalo de nuevo.';
        // Para depuración: $response['error'] = $stmt_insert->error;
    }
    $stmt_insert->close();
}

$stmt_check->close();
$conn->close();

echo json_encode($response);
?>
