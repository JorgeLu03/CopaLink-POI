<?php // Puedes agregar lógica PHP aquí si lo necesitas en el futuro ?>
<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>CopaLink — Simulador</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
  <link rel="stylesheet" href="css/landing.css" />
  <link rel="stylesheet" href="css/chats.css" />
  <link rel="stylesheet" href="css/simulador.css" />
</head>
<body>
  <div class="hero__bg" aria-hidden="true"></div>
  <div class="hero__overlay" aria-hidden="true"></div>
  <header class="topbar">
    <a class="brand btn-reset" href="chats.php" title="Volver a chats">CopaLink</a>
    <div class="topbar-actions">
      <a href="simulador.php" class="btn-simulador">Simulador</a>
    </div>
  </header>
  <main class="sim-wrap">
    <section class="sim-hero card glass">
      <h1 class="sim-title">Simulador del torneo</h1>
      <p class="sim-sub">
        Genera la fase de grupos. Luego apuesta por un equipo y simulamos clasificación (top 2 por grupo).
      </p>
      <div class="d-flex gap-2 flex-wrap">
        <button id="btnGenerate" class="btn btn-success fw-bold px-4">Generar torneo</button>
        <button id="btnClear" class="btn btn-outline-light fw-bold px-4">Limpiar</button>
        <button id="btnToggleBet" class="btn btn-primary fw-bold px-4">Apuestas</button>
      </div>
    </section>
    <section id="groupsGrid" class="groups-grid"><!-- relleno por JS --></section>
    <section id="resultsCard" class="results card glass" hidden>
      <header class="results-head">
        <h3 class="results-title">Clasificados (Top 2 por grupo)</h3>
        <small id="resultsHint" class="muted"></small>
      </header>
      <div id="resultsBody" class="results-body"><!-- relleno por JS --></div>
    </section>
    <section id="bracketCard" class="bracket card glass" hidden>
      <header class="bracket-head">
        <h3 class="bracket-title">Fase eliminatoria</h3>
        <div class="d-flex gap-2 flex-wrap">
          <!-- Botones adicionales aquí si es necesario -->
        </div>
      </header>
      <div id="bracketBody" class="bracket-body"><!-- relleno por JS --></div>
    </section>
  </main>
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
  <script src="js/simulador.js"></script>
</body>
</html>
