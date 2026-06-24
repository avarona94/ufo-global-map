<?php
session_start();

if (!isset($_SESSION['admin'])) {
  header('Location: login.php');
  exit;
}

$host = 'localhost';
$dbname = 'ovni_db';
$user = 'root';
$password = '';

$pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $user, $password);
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$id = $_GET['id'];

$stmt = $pdo->prepare("DELETE FROM avistamientos WHERE id = ?");
$stmt->execute([$id]);

header('Location: admin.php');
exit;
?>