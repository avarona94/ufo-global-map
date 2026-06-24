<?php
session_start();

if (!isset($_SESSION['admin'])) {
  header('Location: login.php');
  exit;
}

$host     = 'localhost';
$dbname   = 'ovni_db';
$user     = 'root';
$password = '';

$pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $user, $password);
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$mensaje = '';
$modoEdicion = false;
$avistamiento = [
  'id' => '', 'nombre' => '', 'lat' => '', 'lng' => '', 'año' => '',
  'pais' => '', 'ciudad' => '', 'descripcion' => '', 'video' => '',
  'imagenes' => '', 'tipo' => ''
];

// ── Cargar para editar ────────────────────────────────────────────────────────
if (isset($_GET['editar'])) {
  $id = (int)$_GET['editar'];
  $avistamiento = $pdo->query("SELECT * FROM avistamientos WHERE id = $id")->fetch(PDO::FETCH_ASSOC);
  $modoEdicion = true;
}

// ── Eliminar imagen individual ────────────────────────────────────────────────
if (isset($_GET['eliminar_imagen']) && isset($_GET['id_avistamiento'])) {
  $id  = (int)$_GET['id_avistamiento'];
  $img = $_GET['eliminar_imagen'];
  $row = $pdo->query("SELECT imagenes FROM avistamientos WHERE id = $id")->fetch(PDO::FETCH_ASSOC);
  $imgs = array_filter(array_map('trim', explode(',', $row['imagenes'])), fn($i) => $i !== $img);
  if (file_exists($img)) {
    unlink($img);
  }
  $nuevas = implode(',', $imgs);
  $pdo->prepare("UPDATE avistamientos SET imagenes = ? WHERE id = ?")->execute([$nuevas, $id]);
  header("Location: admin.php?editar=$id&ok=imagen_borrada");
  exit;
}

// ── Borrar avistamiento ───────────────────────────────────────────────────────
if (isset($_GET['borrar'])) {
  $id = (int)$_GET['borrar'];
  $pdo->prepare("DELETE FROM avistamientos WHERE id = ?")->execute([$id]);
  header('Location: admin.php?ok=borrado');
  exit;
}

// ── Guardar (nuevo o editar) ──────────────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  $imagenes = trim($_POST['imagenes'] ?? '');

  // ── SUBIDA MÚLTIPLE DE IMÁGENES ──────────────────────────────────────────
  // $_FILES['nuevas_imagenes'] es un array cuando el input tiene "multiple"
  if (!empty($_FILES['nuevas_imagenes']['name'][0])) {
    $rutasSubidas = [];
    $total = count($_FILES['nuevas_imagenes']['name']);
    for ($i = 0; $i < $total; $i++) {
      // Saltar si hubo error en este archivo
      if ($_FILES['nuevas_imagenes']['error'][$i] !== UPLOAD_ERR_OK) continue;
      $nombre_archivo = time() . '_' . $i . '_' . basename($_FILES['nuevas_imagenes']['name'][$i]);
      $ruta = 'uploads/' . $nombre_archivo;
      if (move_uploaded_file($_FILES['nuevas_imagenes']['tmp_name'][$i], $ruta)) {
        $rutasSubidas[] = $ruta;
      }
    }
    if ($rutasSubidas) {
      $nuevasRutas = implode(',', $rutasSubidas);
      $imagenes = $imagenes !== '' ? $imagenes . ',' . $nuevasRutas : $nuevasRutas;
    }
  }

  $campos = [
    $_POST['nombre'], $_POST['lat'], $_POST['lng'], $_POST['año'],
    $_POST['pais'], $_POST['ciudad'], $_POST['descripcion'],
    $_POST['video'], $imagenes, $_POST['tipo']
  ];

  if (!empty($_POST['id'])) {
    $stmt = $pdo->prepare("UPDATE avistamientos SET nombre=?, lat=?, lng=?, año=?, pais=?, ciudad=?, descripcion=?, video=?, imagenes=?, tipo=? WHERE id=?");
    $stmt->execute([...$campos, (int)$_POST['id']]);
    $mensaje = '✅ Avistamiento actualizado correctamente';
    $avistamiento = $pdo->query("SELECT * FROM avistamientos WHERE id = " . (int)$_POST['id'])->fetch(PDO::FETCH_ASSOC);
    $modoEdicion = true;
  } else {
    $stmt = $pdo->prepare("INSERT INTO avistamientos (nombre, lat, lng, año, pais, ciudad, descripcion, video, imagenes, tipo) VALUES (?,?,?,?,?,?,?,?,?,?)");
    $stmt->execute($campos);
    $mensaje = '✅ Avistamiento añadido correctamente';
    $avistamiento = ['id'=>'','nombre'=>'','lat'=>'','lng'=>'','año'=>'','pais'=>'','ciudad'=>'','descripcion'=>'','video'=>'','imagenes'=>'','tipo'=>''];
    $modoEdicion = false;
  }
}

// Mensajes de redirección
if (isset($_GET['ok'])) {
  if ($_GET['ok'] === 'borrado')        $mensaje = '🗑️ Avistamiento eliminado';
  if ($_GET['ok'] === 'imagen_borrada') $mensaje = '🖼️ Imagen eliminada';
}

// ── Cargar lista con filtros ──────────────────────────────────────────────────
$filtroPais = $_GET['filtro_pais'] ?? '';
$filtroAño  = $_GET['filtro_año']  ?? '';
$filtroTipo = $_GET['filtro_tipo'] ?? '';
$filtroBusq = $_GET['busqueda']    ?? '';

$where  = [];
$params = [];
if ($filtroPais) { $where[] = 'pais = ?';      $params[] = $filtroPais; }
if ($filtroAño)  { $where[] = 'año = ?';       $params[] = $filtroAño; }
if ($filtroTipo) { $where[] = 'tipo = ?';      $params[] = $filtroTipo; }
if ($filtroBusq) { $where[] = 'nombre LIKE ?'; $params[] = "%$filtroBusq%"; }

$sql  = "SELECT * FROM avistamientos";
if ($where) $sql .= " WHERE " . implode(" AND ", $where);
$sql .= " ORDER BY id ASC";

$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$avistamientos = $stmt->fetchAll(PDO::FETCH_ASSOC);

$todosPaises = $pdo->query("SELECT DISTINCT pais FROM avistamientos ORDER BY pais")->fetchAll(PDO::FETCH_COLUMN);
$todosAños   = $pdo->query("SELECT DISTINCT año  FROM avistamientos ORDER BY año DESC")->fetchAll(PDO::FETCH_COLUMN);
$todosTipos  = ['platillo','orbe','triangulo','cigarro','luces'];
$tipoLabels  = ['platillo'=>'🛸 Platillo','orbe'=>'🔵 Orbe','triangulo'=>'🔺 Triángulo','cigarro'=>'🚬 Cigarro','luces'=>'💡 Luces'];
?>
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Admin OVNI</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }

    body {
      background-color: #0a0a0f;
      font-family: 'Segoe UI', sans-serif;
      color: #fff;
      height: 100vh;
      display: flex;
      flex-direction: column;
    }

    /* ── Cabecera ── */
    #cabecera {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 24px;
      border-bottom: 1px solid #1f1f3a;
      background: #0d0d1a;
      flex-shrink: 0;
    }
    #cabecera h1 { color: #39ff14; font-size: 26px; letter-spacing: 1px; }

    .btn-logout {
      background: none;
      border: 1px solid #ff4444;
      color: #ff4444;
      padding: 7px 16px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 13px;
      text-decoration: none;
    }
    .btn-logout:hover { background: #ff4444; color: #fff; }

    /* ── Mensaje ── */
    #mensaje {
      background: #0d1a0d;
      border-left: 3px solid #39ff14;
      color: #39ff14;
      padding: 10px 24px;
      font-size: 14px;
      flex-shrink: 0;
    }

    /* ── Layout principal ── */
    #layout {
      display: flex;
      flex: 1;
      overflow: hidden;
    }

    /* ── Panel izquierdo ── */
    #panel-lista {
      width: 340px;
      min-width: 280px;
      background: #0d0d1a;
      border-right: 1px solid #1f1f3a;
      display: flex;
      flex-direction: column;
      flex-shrink: 0;
    }

    #filtros-admin {
      padding: 14px;
      border-bottom: 1px solid #1f1f3a;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    #filtros-admin input,
    #filtros-admin select {
      width: 100%;
      padding: 8px 10px;
      background: #1a1a2e;
      border: 1px solid #2a2a4a;
      border-radius: 6px;
      color: #fff;
      font-size: 13px;
    }
    #filtros-admin input:focus,
    #filtros-admin select:focus { outline: none; border-color: #39ff14; }

    #filtros-admin .fila-filtros {
      display: flex;
      gap: 6px;
    }
    #filtros-admin .fila-filtros select { flex: 1; }

    #btn-nuevo {
      margin: 12px 14px 0;
      padding: 9px;
      background: #39ff14;
      border: none;
      border-radius: 6px;
      color: #0a0a0f;
      font-weight: bold;
      font-size: 13px;
      cursor: pointer;
      text-align: center;
      display: block;
      text-decoration: none;
    }
    #btn-nuevo:hover { background: #2ecc0f; }

    #contador-lista {
      padding: 8px 14px 4px;
      font-size: 12px;
      color: #555;
    }

    #lista-scroll {
      flex: 1;
      overflow-y: auto;
      padding: 8px 14px 14px;
    }

    .item-lista {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 12px;
      margin-bottom: 8px;
      background: #1a1a2e;
      border-radius: 8px;
      border: 1px solid #2a2a4a;
      cursor: pointer;
      transition: background 0.15s;
      border-left: 3px solid transparent;
    }
    .item-lista:hover { background: #222240; }
    .item-lista.activo { border-color: #39ff14; background: #0d1f0d; }

    .item-info { flex: 1; min-width: 0; }
    .item-nombre {
      font-size: 13px;
      font-weight: bold;
      color: #fff;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .item-meta { font-size: 11px; color: #666; margin-top: 2px; }

    .item-acciones { display: flex; gap: 4px; flex-shrink: 0; }
    .btn-mini {
      padding: 4px 8px;
      border-radius: 4px;
      border: none;
      font-size: 11px;
      cursor: pointer;
      text-decoration: none;
      display: inline-block;
    }
    .btn-editar { background: #1a3a1a; color: #39ff14; border: 1px solid #39ff14; }
    .btn-editar:hover { background: #39ff14; color: #000; }
    .btn-borrar { background: #3a1a1a; color: #ff4444; border: 1px solid #ff4444; }
    .btn-borrar:hover { background: #ff4444; color: #fff; }

    /* ── Panel derecho ── */
    #panel-form {
      flex: 1;
      overflow-y: auto;
      padding: 24px 28px;
    }

    #panel-form h2 {
      color: #39ff14;
      font-size: 18px;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 1px solid #1f1f3a;
    }

    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0 20px;
    }
    .form-grid .span2 { grid-column: span 2; }

    label {
      display: block;
      margin-bottom: 5px;
      color: #aaa;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    input[type=text], input[type=number], textarea, select.form-select {
      width: 100%;
      padding: 9px 12px;
      margin-bottom: 14px;
      background: #1a1a2e;
      border: 1px solid #2a2a4a;
      border-radius: 6px;
      color: #fff;
      font-size: 14px;
      transition: border-color 0.2s;
    }
    input[type=text]:focus, input[type=number]:focus,
    textarea:focus, select.form-select:focus {
      outline: none;
      border-color: #39ff14;
    }

    textarea { height: 90px; resize: vertical; }

    /* ── Zona de subida de imágenes mejorada ── */
    .upload-zone {
      border: 2px dashed #2a2a4a;
      border-radius: 8px;
      padding: 18px;
      text-align: center;
      cursor: pointer;
      transition: border-color 0.2s, background 0.2s;
      margin-bottom: 14px;
      position: relative;
    }
    .upload-zone:hover, .upload-zone.drag-over {
      border-color: #39ff14;
      background: rgba(57,255,20,0.04);
    }
    .upload-zone input[type=file] {
      position: absolute;
      inset: 0;
      opacity: 0;
      cursor: pointer;
      width: 100%;
      height: 100%;
    }
    .upload-zone-texto {
      pointer-events: none;
      color: #555;
      font-size: 13px;
      line-height: 1.6;
    }
    .upload-zone-texto span {
      color: #39ff14;
      font-weight: bold;
    }
    /* Preview de imágenes seleccionadas antes de subir */
    #preview-nuevas {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 10px;
    }
    .preview-item {
      position: relative;
      width: 90px;
    }
    .preview-item img {
      width: 90px;
      height: 62px;
      object-fit: cover;
      border-radius: 5px;
      border: 1px solid #39ff1466;
      display: block;
    }
    .preview-item .preview-nombre {
      font-size: 9px;
      color: #666;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin-top: 2px;
    }
    #upload-count {
      font-size: 12px;
      color: #39ff14;
      margin-bottom: 8px;
      min-height: 18px;
    }

    .btn-guardar {
      padding: 11px 28px;
      background: #39ff14;
      border: none;
      border-radius: 6px;
      color: #0a0a0f;
      font-weight: bold;
      font-size: 15px;
      cursor: pointer;
    }
    .btn-guardar:hover { background: #2ecc0f; }

    /* ── Gestión de imágenes actuales ── */
    .seccion-imagenes {
      margin-bottom: 16px;
    }
    .seccion-imagenes h3 {
      color: #aaa;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 10px;
    }
    .grid-imagenes {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-bottom: 10px;
    }
    .img-item {
      position: relative;
      width: 110px;
    }
    .img-item img {
      width: 110px;
      height: 75px;
      object-fit: cover;
      border-radius: 6px;
      border: 1px solid #2a2a4a;
      display: block;
    }
    .img-item .btn-eliminar-img {
      position: absolute;
      top: 4px;
      right: 4px;
      background: rgba(255,68,68,0.85);
      border: none;
      color: #fff;
      border-radius: 50%;
      width: 22px;
      height: 22px;
      font-size: 12px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      text-decoration: none;
      line-height: 1;
    }
    .img-item .btn-eliminar-img:hover { background: #ff4444; }

    .separador { border: none; border-top: 1px solid #1f1f3a; margin: 20px 0; }
  </style>
</head>
<body>

<div id="cabecera">
  <h1>🛸 Panel de Administración</h1>
  <a href="logout.php" class="btn-logout">Cerrar sesión</a>
</div>

<?php if ($mensaje): ?>
  <div id="mensaje"><?= $mensaje ?></div>
<?php endif; ?>

<div id="layout">

  <!-- ── Panel izquierdo: listado ── -->
  <div id="panel-lista">
    <div id="filtros-admin">
      <form method="GET" id="form-filtros">
        <input type="text" name="busqueda" placeholder="🔍 Buscar por nombre..."
               value="<?= htmlspecialchars($filtroBusq) ?>">
        <div class="fila-filtros">
          <select name="filtro_pais" onchange="this.form.submit()">
            <option value="">🌍 País</option>
            <?php foreach ($todosPaises as $p): ?>
              <option value="<?= $p ?>" <?= $filtroPais===$p?'selected':'' ?>><?= $p ?></option>
            <?php endforeach; ?>
          </select>
          <select name="filtro_año" onchange="this.form.submit()">
            <option value="">📅 Año</option>
            <?php foreach ($todosAños as $y): ?>
              <option value="<?= $y ?>" <?= $filtroAño==$y?'selected':'' ?>><?= $y ?></option>
            <?php endforeach; ?>
          </select>
        </div>
        <select name="filtro_tipo" onchange="this.form.submit()">
          <option value="">🔍 Tipo</option>
          <?php foreach ($todosTipos as $t): ?>
            <option value="<?= $t ?>" <?= $filtroTipo===$t?'selected':'' ?>><?= $tipoLabels[$t] ?></option>
          <?php endforeach; ?>
        </select>
        <button type="submit" style="display:none"></button>
      </form>
    </div>

    <a href="admin.php" id="btn-nuevo">+ Nuevo avistamiento</a>
    <div id="contador-lista"><?= count($avistamientos) ?> avistamiento<?= count($avistamientos)!=1?'s':'' ?></div>

    <div id="lista-scroll">
      <?php foreach ($avistamientos as $a):
        $tipoColor = ['platillo'=>'#39ff14','orbe'=>'#00cfff','triangulo'=>'#ff6600','cigarro'=>'#ff2266','luces'=>'#ffe600'];
        $color = $tipoColor[$a['tipo']] ?? '#444';
        $esActivo = $modoEdicion && (int)$avistamiento['id'] === (int)$a['id'];
      ?>
      <div class="item-lista <?= $esActivo ? 'activo' : '' ?>"
           style="border-left-color: <?= $color ?>"
           onclick="location.href='admin.php?editar=<?= $a['id'] ?>&<?= http_build_query(array_filter(['filtro_pais'=>$filtroPais,'filtro_año'=>$filtroAño,'filtro_tipo'=>$filtroTipo,'busqueda'=>$filtroBusq])) ?>'">
        <div class="item-info">
          <div class="item-nombre">
            <span style="color:#444;font-size:10px;margin-right:5px;">#<?= $a['id'] ?></span>
            <?= htmlspecialchars($a['nombre']) ?>
          </div>
          <div class="item-meta">
            <?= htmlspecialchars($a['pais']) ?> · <?= $a['año'] ?> ·
            <span style="color:<?= $color ?>"><?= $tipoLabels[$a['tipo']] ?? $a['tipo'] ?></span>
          </div>
        </div>
        <div class="item-acciones" onclick="event.stopPropagation()">
          <a href="admin.php?editar=<?= $a['id'] ?>" class="btn-mini btn-editar">✏️</a>
          <a href="admin.php?borrar=<?= $a['id'] ?>"
             class="btn-mini btn-borrar"
             onclick="return confirm('¿Eliminar <?= addslashes($a['nombre']) ?>?')">🗑️</a>
        </div>
      </div>
      <?php endforeach; ?>
    </div>
  </div>

  <!-- ── Panel derecho: formulario ── -->
  <div id="panel-form">
    <h2><?= $modoEdicion ? '✏️ Editar: ' . htmlspecialchars($avistamiento['nombre']) : '➕ Nuevo avistamiento' ?></h2>

    <form method="POST" enctype="multipart/form-data" id="form-avistamiento">
      <?php if ($modoEdicion): ?>
        <input type="hidden" name="id" value="<?= $avistamiento['id'] ?>">
      <?php endif; ?>

      <div class="form-grid">
        <div class="span2">
          <label>Nombre</label>
          <input type="text" name="nombre" value="<?= htmlspecialchars($avistamiento['nombre']) ?>" required>
        </div>

        <div>
          <label>Latitud</label>
          <input type="text" name="lat" value="<?= $avistamiento['lat'] ?>" required>
        </div>
        <div>
          <label>Longitud</label>
          <input type="text" name="lng" value="<?= $avistamiento['lng'] ?>" required>
        </div>

        <div>
          <label>Año</label>
          <input type="number" name="año" value="<?= $avistamiento['año'] ?>" required>
        </div>
        <div>
          <label>Tipo</label>
          <select name="tipo" class="form-select" required>
            <option value="">— Selecciona —</option>
            <?php foreach ($todosTipos as $t): ?>
              <option value="<?= $t ?>" <?= $avistamiento['tipo']===$t?'selected':'' ?>><?= $tipoLabels[$t] ?></option>
            <?php endforeach; ?>
          </select>
        </div>

        <div>
          <label>País</label>
          <input type="text" name="pais" value="<?= htmlspecialchars($avistamiento['pais']) ?>" required>
        </div>
        <div>
          <label>Ciudad</label>
          <input type="text" name="ciudad" value="<?= htmlspecialchars($avistamiento['ciudad'] ?? '') ?>">
        </div>

        <div class="span2">
          <label>Descripción</label>
          <textarea name="descripcion" required><?= htmlspecialchars($avistamiento['descripcion']) ?></textarea>
        </div>

        <div class="span2">
          <label>URL Vídeo (YouTube embed)</label>
          <input type="text" name="video" value="<?= htmlspecialchars($avistamiento['video'] ?? '') ?>">
        </div>
      </div>

      <hr class="separador">

      <!-- ── Gestión de imágenes ── -->
      <div class="seccion-imagenes">
        <h3>Imágenes actuales</h3>
        <?php
          $imgs = array_filter(array_map('trim', explode(',', $avistamiento['imagenes'] ?? '')));
          if ($imgs):
        ?>
        <div class="grid-imagenes">
          <?php foreach ($imgs as $img): ?>
          <div class="img-item">
            <img src="<?= htmlspecialchars($img) ?>" alt="imagen" onerror="this.style.opacity='0.3'">
            <?php if ($modoEdicion): ?>
            <a href="admin.php?eliminar_imagen=<?= urlencode($img) ?>&id_avistamiento=<?= $avistamiento['id'] ?>"
               class="btn-eliminar-img"
               onclick="return confirm('¿Eliminar esta imagen?')"
               title="Eliminar imagen">✕</a>
            <?php endif; ?>
          </div>
          <?php endforeach; ?>
        </div>
        <?php else: ?>
          <p style="color:#555; font-size:13px; margin-bottom:12px;">Sin imágenes</p>
        <?php endif; ?>

        <label>URLs de imágenes (separadas por comas)</label>
        <input type="text" name="imagenes" value="<?= htmlspecialchars($avistamiento['imagenes'] ?? '') ?>"
               placeholder="https://... , https://...">

        <hr class="separador">

        <!-- Zona de subida múltiple con preview -->
        <h3>Subir imágenes desde tu ordenador</h3>
        <div id="upload-count"></div>
        <div id="preview-nuevas"></div>
        <div class="upload-zone" id="upload-zone">
          <!-- multiple permite seleccionar varias a la vez -->
          <input type="file" name="nuevas_imagenes[]" id="input-imagenes"
                 accept="image/*" multiple>
          <div class="upload-zone-texto">
            <span>Haz clic aquí</span> o arrastra imágenes<br>
            <small style="color:#444">Puedes seleccionar varias a la vez (JPG, PNG, GIF, WEBP)</small>
          </div>
        </div>
      </div>

      <button type="submit" class="btn-guardar">
        <?= $modoEdicion ? '💾 Guardar cambios' : '➕ Añadir avistamiento' ?>
      </button>
    </form>
  </div>

</div>

<script>
// ── Búsqueda con debounce ──────────────────────────────────────────────────
const inputBusq = document.querySelector('input[name="busqueda"]');
let timer;
inputBusq.addEventListener('input', () => {
  clearTimeout(timer);
  timer = setTimeout(() => document.getElementById('form-filtros').submit(), 400);
});

// ── Preview de imágenes seleccionadas ────────────────────────────────────────
const inputImg   = document.getElementById('input-imagenes');
const previewDiv = document.getElementById('preview-nuevas');
const countDiv   = document.getElementById('upload-count');
const uploadZone = document.getElementById('upload-zone');

inputImg.addEventListener('change', mostrarPreview);

function mostrarPreview() {
  previewDiv.innerHTML = '';
  const files = Array.from(inputImg.files);
  if (!files.length) {
    countDiv.textContent = '';
    return;
  }
  countDiv.textContent = `${files.length} imagen${files.length !== 1 ? 'es' : ''} seleccionada${files.length !== 1 ? 's' : ''}`;
  files.forEach(file => {
    const reader = new FileReader();
    reader.onload = e => {
      const item = document.createElement('div');
      item.className = 'preview-item';
      item.innerHTML = `
        <img src="${e.target.result}" alt="${file.name}">
        <div class="preview-nombre">${file.name}</div>
      `;
      previewDiv.appendChild(item);
    };
    reader.readAsDataURL(file);
  });
}

// Drag & drop visual
uploadZone.addEventListener('dragover',  e => { e.preventDefault(); uploadZone.classList.add('drag-over'); });
uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('drag-over'));
uploadZone.addEventListener('drop',      e => {
  e.preventDefault();
  uploadZone.classList.remove('drag-over');
  // Transferir los archivos al input real para que el form los envíe
  const dt = new DataTransfer();
  Array.from(e.dataTransfer.files)
    .filter(f => f.type.startsWith('image/'))
    .forEach(f => dt.items.add(f));
  inputImg.files = dt.files;
  mostrarPreview();
});
</script>

</body>
</html>