// js/auth.js

document.addEventListener('DOMContentLoaded', () => {
  // Instancias de Firebase
  const auth = firebase.auth();
  const db = firebase.firestore();

  // --- LÓGICA DE REGISTRO ---
  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const nameInput = document.getElementById('name');
      const emailInput = document.getElementById('email');
      const passInput = document.getElementById('pass');
      const pass2Input = document.getElementById('pass2');
      const submitButton = registerForm.querySelector('button[type="submit"]');

      const name = nameInput.value.trim();
      const email = emailInput.value.trim();
      const password = passInput.value;
      const password2 = pass2Input.value;

      // Validaciones básicas
      if (!name || !email || !password) {
        return alert('Por favor, completa todos los campos.');
      }
      if (password !== password2) {
        return alert('Las contraseñas no coinciden.');
      }
      if (password.length < 6) {
        return alert('La contraseña debe tener al menos 6 caracteres.');
      }

      submitButton.disabled = true;
      submitButton.textContent = 'Creando cuenta...';

      try {
        // 1. Crear el usuario en Firebase Authentication
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;

        // 2. Actualizar el perfil del usuario para guardar su nombre
        await user.updateProfile({
          displayName: name
        });

        // 3. (Opcional pero recomendado) Guardar info extra en Firestore
        // Esto es útil para buscar usuarios, ver sus gemas, etc.
        await db.collection('users').doc(user.uid).set({
          uid: user.uid,
          displayName: name,
          email: email,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          gems: 0 // Inician con 0 gemas
        });

        // 4. Redirigir a la página de chats
  window.location.href = 'chats.php';

      } catch (error) {
        console.error("Error en el registro:", error);
        // Traducir errores comunes de Firebase
        let message = 'Ocurrió un error al crear la cuenta.';
        if (error.code === 'auth/email-already-in-use') {
          message = 'Este correo electrónico ya está en uso.';
        } else if (error.code === 'auth/weak-password') {
          message = 'La contraseña es muy débil.';
        }
        alert(message);
        submitButton.disabled = false;
        submitButton.textContent = 'Crear cuenta';
      }
    });
  }

  // --- LÓGICA DE LOGIN ---
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const emailInput = document.getElementById('email');
      const passInput = document.getElementById('pass');
      const submitButton = loginForm.querySelector('button[type="submit"]');

      const email = emailInput.value.trim();
      const password = passInput.value;

      if (!email || !password) {
        return alert('Por favor, completa todos los campos.');
      }

      submitButton.disabled = true;
      submitButton.textContent = 'Entrando...';

      try {
        // 1. Iniciar sesión con Firebase Authentication
        await auth.signInWithEmailAndPassword(email, password);
        
        // 2. Redirigir a la página de chats
  window.location.href = 'chats.php';

      } catch (error) {
        console.error("Error en el inicio de sesión:", error);
        // Firebase v8 usa 'auth/wrong-password' y 'auth/user-not-found'. v9+ usa 'auth/invalid-credential'.
        alert('El correo o la contraseña son incorrectos.');
        submitButton.disabled = false;
        submitButton.textContent = 'Entrar';
      }
    });
  }
});