<?php // Puedes agregar lógica PHP aquí si lo necesitas en el futuro ?>
<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>CopaLink — Crear grupo</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
  <link rel="stylesheet" href="css/landing.css" />
  <link rel="stylesheet" href="css/chats.css" />
  <style>
    body { min-height: 100vh; }
    .cg-wrap{ max-width: 720px; margin: 48px auto; }
    .cg-card{
      border-radius: 16px; background: rgba(12,16,26,.92); color:#fff;
      border:1px solid rgba(255,255,255,.12); backdrop-filter: blur(12px) saturate(120%);
    }
    .chip{
      display:inline-flex; align-items:center; gap:8px; margin:4px;
      padding:6px 10px; border-radius:999px;
      background: rgba(255,255,255,.08); border:1px solid rgba(255,255,255,.12);
      font-weight:600;
    }
    .chip button{ border:0; background:transparent; color:#fff; line-height:1; font-size:18px; }
    .cg-muted{ color: rgba(255,255,255,.7); }
    .autocomplete-suggestions{
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      z-index: 1000;
      background: rgba(12,16,26,.95);
      border: 1px solid rgba(255,255,255,.12);
      border-radius: 12px;
      margin-top: 4px;
      max-height: 200px;
      overflow-y: auto;
      backdrop-filter: blur(12px);
    }
    .autocomplete-item{
      padding: 10px 12px;
      cursor: pointer;
      transition: background .15s;
      border-bottom: 1px solid rgba(255,255,255,.06);
    }
    .autocomplete-item:last-child{ border-bottom: none; }
    .autocomplete-item:hover{
      background: rgba(255,255,255,.08);
    }
    .autocomplete-item-name{
      font-weight: 600;
    }
    .autocomplete-item-email{
      font-size: 0.85rem;
      color: rgba(255,255,255,.6);
    }
    .member-input-wrap{
      position: relative;
    }
  </style>
</head>
<body>
  <div class="hero__bg" aria-hidden="true"></div>
  <div class="hero__overlay" aria-hidden="true"></div>
  <header class="topbar">
    <a class="brand btn-reset" href="chats.php" title="Volver a chats">CopaLink</a>
  </header>
  <main class="cg-wrap">
    <div class="cg-card p-4 shadow-lg">
      <h2 class="fw-bold mb-2">Crear grupo</h2>
      <p class="mb-4 cg-muted">Ponle un nombre al grupo y agrega miembros por correo o nombre.</p>
      <form id="groupForm" class="d-grid gap-3" novalidate>
        <div>
          <label class="form-label fw-semibold" for="groupName">Nombre del grupo</label>
          <input id="groupName" class="form-control" placeholder=" Ingresa nombre del grupo" required>
        </div>
        <div>
          <label class="form-label fw-semibold" for="memberInput">Agregar miembro</label>
          <div class="member-input-wrap">
            <div class="input-group">
              <input id="memberInput" class="form-control" placeholder="Buscar por correo o nombre" autocomplete="off">
              <button id="addMemberBtn" class="btn btn-success" type="button">Agregar</button>
            </div>
            <div id="autocompleteSuggestions" class="autocomplete-suggestions" style="display:none;"></div>
          </div>
          <div id="membersChips" class="mt-2" aria-live="polite"></div>
        </div>
        <button class="btn btn-success fw-bold" type="submit">Crear grupo</button>
        <a href="chats.php" class="btn btn-outline-light">Cancelar</a>
      </form>
    </div>
  </main>
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
  <script src="js/crear-grupo.js"></script>
</body>
</html>
