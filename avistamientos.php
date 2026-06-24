<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$host     = 'localhost';
$dbname   = 'ovni_db';
$user     = 'root';
$password = '';

try {
  $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $user, $password);
  $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

  // Seleccionamos explícitamente todos los campos, incluido 'tipo'
  $stmt = $pdo->query("SELECT id, nombre, lat, lng, año, pais, ciudad, descripcion, imagenes, video, tipo FROM avistamientos");
  $avistamientos = $stmt->fetchAll(PDO::FETCH_ASSOC);

  echo json_encode($avistamientos);

} catch (PDOException $e) {
  echo json_encode(['error' => $e->getMessage()]);
}
?>