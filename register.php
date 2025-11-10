<?php // Puedes agregar lógica PHP aquí si lo necesitas en el futuro ?>
<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>CopaLink — Registro</title>
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
    <section class="auth">
      <div class="auth__card glass-card">
        <h1 class="auth__title">Crea tu cuenta</h1>
        <p class="auth__subtitle">Únete a la comunidad y vive el Mundial 2026</p>
        <form id="registerForm" novalidate>
          <div class="mb-3">
            <label for="name" class="form-label fw-bold">Nombre</label>
            <input type="text" class="form-control" id="name" placeholder="¿Como quieres aparecer?" required>
          </div>
          <div class="mb-3">
            <label for="email" class="form-label fw-bold">Correo</label>
            <input type="email" class="form-control" id="email" placeholder="tu@correo.com" required>
          </div>
          <div class="mb-3">
            <label for="pass" class="form-label fw-bold">Contraseña</label>
            <input type="password" class="form-control" id="pass" placeholder="••••••••" required>
          </div>
          <div class="mb-3">
            <label for="pass2" class="form-label fw-bold">Confirmar contraseña</label>
            <input type="password" class="form-control" id="pass2" placeholder="••••••••" required>
          </div>
          <button type="submit" class="btn btn-success auth__submit fw-bold">Crear cuenta</button>
        </form>
        <p class="auth__hint mt-3">
          ¿Ya tienes cuenta?
          <a class="link fw-bold" href="login.php">Inicia sesión</a>
        </p>
      </div>
    </section>
  </main>
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
  <script>
    document.getElementById('registerForm').addEventListener('submit', async function(e) {
      e.preventDefault();
      const username = document.getElementById('name').value.trim();
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('pass').value;
      const password2 = document.getElementById('pass2').value;
      const btn = this.querySelector('button[type="submit"]');
      if (password !== password2) {
        alert('Las contraseñas no coinciden.');
        return;
      }
      btn.disabled = true;
      btn.textContent = 'Creando...';
      try {
        const res = await fetch('php/register.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, email, password })
        });
        const data = await res.json();
        if (data.success) {
          alert('¡Registro exitoso! Ahora puedes iniciar sesión.');
          window.location.href = 'login.php';
        } else {
          alert(data.message || 'Error al registrar');
        }
      } catch (err) {
        alert('Error de conexión con el servidor.');
      }
      btn.disabled = false;
      btn.textContent = 'Crear cuenta';
    });
  </script>
</body>
</html>
