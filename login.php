<?php
session_start();
require 'config.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  $usuario = $_POST['usuario'];
  $password = $_POST['password'];

  if ($usuario === ADMIN_USER && $password === ADMIN_PASS) {
    $_SESSION['admin'] = true;
    header('Location: admin.php');
    exit;
  } else {
    $error = 'Usuario o contraseña incorrectos';
  }
}
?>

<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Login Admin</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      background-color: #0a0a0f;
      font-family: 'Segoe UI', sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      color: #ffffff;
    }

    .caja {
      background-color: #0d0d1a;
      border: 1px solid #39ff14;
      border-radius: 12px;
      padding: 40px;
      width: 340px;
      box-shadow: 0 0 30px rgba(57, 255, 20, 0.2);
    }

    h1 {
      color: #39ff14;
      margin-bottom: 24px;
      font-size: 22px;
      text-align: center;
    }

    label {
      display: block;
      margin-bottom: 6px;
      color: #aaaaaa;
      font-size: 13px;
    }

    input {
      width: 100%;
      padding: 10px;
      margin-bottom: 16px;
      background-color: #1a1a2e;
      border: 1px solid #2a2a4a;
      border-radius: 6px;
      color: #ffffff;
      font-size: 14px;
    }

    button {
      width: 100%;
      padding: 12px;
      background-color: #39ff14;
      border: none;
      border-radius: 6px;
      color: #0a0a0f;
      font-weight: bold;
      font-size: 15px;
      cursor: pointer;
    }

    button:hover {
      background-color: #2ecc0f;
    }

    .error {
      color: #ff4444;
      font-size: 13px;
      margin-bottom: 16px;
      text-align: center;
    }
  </style>
</head>
<body>

  <div class="caja">
    <h1>🛸 Admin OVNI</h1>

    <?php if (isset($error)): ?>
      <p class="error"><?= $error ?></p>
    <?php endif; ?>

    <form method="POST">
      <label>Usuario</label>
      <input type="text" name="usuario" required>

      <label>Contraseña</label>
      <input type="password" name="password" required>

      <button type="submit">Entrar</button>
    </form>
  </div>

</body>
</html>