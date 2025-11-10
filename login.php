<?php // Puedes agregar lógica PHP aquí si lo necesitas en el futuro ?>
<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>CopaLink — Iniciar Sesión</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
  <link rel="stylesheet" href="css/landing.css" />
  <link rel="stylesheet" href="css/register.css" />
</head>
<body>
  <header class="hero__header">
    <div class="container fw-bold fs-4 text-white">CopaLink</div>
  </header>
  <main class="hero">
    <div class="hero__bg" aria-hidden="true"></div>
    <div class="hero__overlay" aria-hidden="true"></div>
    <section class="auth auth--narrow">
      <div class="auth__card glass-card">
        <h1 class="auth__title">Inicia sesión</h1>
        <p class="auth__subtitle">Bienvenido de nuevo a la comunidad</p>
        <form id="loginForm" novalidate>
          <div class="mb-3">
            <label for="email" class="form-label fw-bold">Correo</label>
            <input type="email" class="form-control" id="email" placeholder="tu@correo.com" required>
          </div>
          <div class="mb-4">
            <label for="pass" class="form-label fw-bold">Contraseña</label>
            <input type="password" class="form-control" id="pass" placeholder="••••••••" required>
          </div>
          <button type="submit" class="btn btn-success auth__submit fw-bold">Entrar</button>
        </form>
        <p class="auth__hint mt-3">
          ¿Todavía no tienes cuenta?
          <a class="link fw-bold" href="register.php">Regístrate</a>
        </p>
      </div>
    </section>
  </main>
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
  <script>
    document.getElementById('loginForm').addEventListener('submit', async function(e) {
      e.preventDefault();
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('pass').value;
      const btn = this.querySelector('button[type="submit"]');
      btn.disabled = true;
      btn.textContent = 'Entrando...';
      try {
        const res = await fetch('php/login.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (data.success) {
          localStorage.setItem('currentUser', JSON.stringify(data.user));
          window.location.href = 'chats.php';
        } else {
          alert(data.message || 'Error al iniciar sesión');
        }
      } catch (err) {
        alert('Error de conexión con el servidor.');
      }
      btn.disabled = false;
      btn.textContent = 'Entrar';
    });
  </script>
</body>
</html>
