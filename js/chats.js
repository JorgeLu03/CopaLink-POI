// js/chats.js — Parte 1/5
document.addEventListener('DOMContentLoaded', () => {
  let currentUser = null; // Guardaremos el usuario autenticado aquí
  const auth = firebase.auth();
  const db = firebase.firestore();

  // Selectores para el menú de usuario (datos dinámicos)
  const menuUserName = document.getElementById('menuUserName');
  const menuUserGems = document.getElementById('menuUserGems');
  /* =========================
     Datos de ejemplo
  ========================== */
  const conversations = { // Estos son chats de demo, los grupos usarán Firestore para mensajes
    ana: [
      { me:false, text:"¿Listos para mañana?", time:"10:10 p.m." },
      { me:true,  text:"¡Sí! Paso por ti a las 7", time:"10:11 p.m." },
      { me:false, text:"Perfecto ✌️", time:"10:12 p.m." },
    ],
    // grupo: [ // Este grupo de ejemplo se eliminará o se convertirá en un chat de Firestore
    //   { me:false, user:"Alex",  gems: 123, text:"Nos juntamos hoy o qué?", time:"9:40 p.m." },
    //   { me:true,                       text:"Yo llego tipo 8:30",       time:"9:41 p.m." },
    //   { me:false, user:"Diego", gems: 345, text:"Va, llevo snacks 🥤",    time:"9:42 p.m." },
    // ],
    diego: [
      { me:false, text:"Bro, el parley está listo", time:"9:10 p.m." },
      { me:true,  text:"Buenísimo. Pásalo al grupo", time:"9:11 p.m." },
    ],
  };

  /* =========================
     Selectores comunes
  ========================== */
  const chatListContainer = document.getElementById('chatListContainer');
  const promo       = document.getElementById('placeholderPromo');
  const convo       = document.getElementById('conversation');
  const convName    = document.getElementById('convName');
  const convAvatar  = document.getElementById('convAvatar');
  const convBody    = document.getElementById('convBody');
  const msgInput    = document.getElementById('msgInput');
  const sendBtn     = document.getElementById('sendBtn');
  const convBack    = document.getElementById('convBack');
  const btnHome     = document.getElementById('btnHome');

  // Acciones de cabecera conversación
  const btnVideo    = document.getElementById('btnVideo');
  const btnMore     = document.getElementById('btnMore');
  const chatMenu    = document.getElementById('chatMenu');
  const mEncrypt    = document.getElementById('mEncrypt');
  const mTasks      = document.getElementById('mTasks');
  const mAdd        = document.getElementById('mAdd');
  const mEmail      = document.getElementById('mEmail');

  // Menú usuario
  const btnUserMenu   = document.getElementById('btnUserMenu');
  const dropdown      = document.getElementById('userDropdown');
  const btnEncrypt    = document.getElementById('btnEncrypt');
  const btnLogoutMenu = document.getElementById('btnLogoutMenu');

  // Modal de confirmación (Bootstrap)
  const confirmModalEl = document.getElementById('confirmModal');
  const bsConfirmModal = new bootstrap.Modal(confirmModalEl);
  const confirmMsgEl   = document.getElementById('confirmMessage');
  const confirmOkBtn   = document.getElementById('confirmOk');

  // Adjuntos (+)
  const btnAttach   = document.getElementById('btnAttach');
  const attachMenu  = document.getElementById('attachMenu');
  const attachImage = document.getElementById('attachImage');
  const attachFile  = document.getElementById('attachFile');
  const attachLocation = document.getElementById('attachLocation');
  const fileImage   = document.getElementById('fileImage');
  const fileAny     = document.getElementById('fileAny');

  // Sidepanel (drawer derecho)
  const sidePanel   = document.getElementById('sidePanel');
  const spTitle     = document.getElementById('spTitle');
  const spClose     = document.getElementById('spClose');
  const spTasksBody = document.getElementById('spTasks');
  const spAddBody   = document.getElementById('spAdd');
  const spEmailBody = document.getElementById('spEmail');

  // Tareas
  const taskCreateForm = document.getElementById('taskCreateForm');
  const taskInput      = document.getElementById('taskInput');
  const taskList       = document.getElementById('taskList');
  const taskConfirmBtn = document.getElementById('taskConfirmBtn');

  // Agregar miembro
  const addForm   = document.getElementById('addForm');
  const addInput  = document.getElementById('addInput');
  const addedList = document.getElementById('addedList');

  // Email
  const emailForm   = document.getElementById('emailForm');
  const emailDesc   = document.getElementById('emailDesc');
  const sendEmailBtn = document.getElementById('sendEmailBtn');

  // Estado
  let currentChatId   = null;
  let currentChatType = 'private';
  let unsubscribeMessages = null; // Para desuscribirse de los mensajes del chat actual

  // Estado demo por chat (tareas por grupo)
  const tasksByChat = {
    // grupo: [ // Este grupo de ejemplo se eliminará o se convertirá en un chat de Firestore
    //   { id: 1, text: "Definir ranking de poder (48 equipos)", done:false },
    //   { id: 2, text: "Diseñar pantallas en Figma", done:false },
    //   { id: 3, text: "Documentar reglas del simulador", done:false },
    //   { id: 4, text: "Subir maquetado al repositorio", done:false },
    // ]
  };

  /* =========================
     Cargar grupos creados (localStorage)
  ========================== */

  /* ==================================================
     CONTROL DE AUTENTICACIÓN Y CARGA DE DATOS
  =================================================== */
  auth.onAuthStateChanged(async (user) => {
    if (user) {
      // --- El usuario SÍ está autenticado ---
      currentUser = user; // Guardamos el usuario actual
      console.log('Usuario autenticado:', user.displayName);
      
      // 1. Mostrar su nombre de perfil
      if (menuUserName) {
        menuUserName.textContent = user.displayName || 'Usuario';
      }

      // 2. Obtener y mostrar sus gemas desde Firestore
      try {
        const userDoc = await db.collection('users').doc(user.uid).get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          if (menuUserGems) {
            menuUserGems.textContent = userData.gems || 0;
          }
        } else {
          console.warn('El documento del usuario no existe en Firestore.');
          if (menuUserGems) menuUserGems.textContent = 0;
        }
      } catch (error) {
        console.error("Error al obtener datos del usuario:", error);
        if (menuUserGems) menuUserGems.textContent = 'Error';
      }

      // 3. Activar el botón de cerrar sesión
      btnLogoutMenu?.addEventListener('click', () => {
        closeUserMenu();
        openConfirm('¿Deseas cerrar sesión?', async () => {
          await auth.signOut();
          // La redirección se hará automáticamente por el listener de abajo
        });
      });

      // 4. Empezar a escuchar los chats del usuario
      listenForUserChats(user);

    } else {
      // --- El usuario NO está autenticado ---
      console.log('Usuario no autenticado, redirigiendo a login...');
  window.location.href = 'login.php';
    }
  });

  /* ==================================================
     CARGA DE CHATS DESDE FIRESTORE
  =================================================== */
  function listenForUserChats(user) {
    // Escuchamos en tiempo real los chats donde el usuario es miembro
    db.collection('chats')
      .where('Members', 'array-contains', user.uid)
      .onSnapshot(snapshot => {
        const chats = [];
        snapshot.forEach(doc => {
          chats.push({ id: doc.id, ...doc.data() });
        });
        renderChatList(chats);
      }, error => {
        console.error("Error al cargar los chats:", error);
        chatListContainer.innerHTML = '<div class="p-3 text-danger">Error al cargar chats.</div>';
      });
  }

  function renderChatList(chats) {
    if (!chatListContainer) return;
    if (chats.length === 0) {
      chatListContainer.innerHTML = '<div class="p-3 text-muted">No tienes chats aún. ¡Crea un grupo para empezar!</div>';
      return;
    }

    chatListContainer.innerHTML = ''; // Limpiamos la lista
    chats.forEach(chat => {
      const a = document.createElement('a');
      a.className = 'chatitem';
      a.href = '#';
      a.dataset.chat = chat.id;
      a.dataset.name = chat.name;
      a.dataset.type = chat.type;

      const avatarContent = chat.type === 'group' ? '👥' : (chat.name || 'C').charAt(0).toUpperCase();
      const avatarClass = chat.type === 'group' ? 'avatar grp' : 'avatar';

      a.innerHTML = `
        <div class="${avatarClass}">${avatarContent}</div>
        <div class="meta">
          <div class="row1"><span class="name">${chat.name}</span><time>${chat.lastMessage?.time || ''}</time></div>
          <div class="row2"><span class="preview">${chat.lastMessage?.text || 'Chat iniciado'}</span></div>
        </div>`;
      
      a.addEventListener('click', (e) => handleChatItemClick(e, a));
      chatListContainer.appendChild(a);
    });
  }

    /* =========================
     Helpers de UI
  ========================== */
  function openConfirm(message, onConfirm){
    confirmMsgEl.textContent = message;
    const handler = () => {
      try { onConfirm && onConfirm(); }
      finally {
        confirmOkBtn.removeEventListener('click', handler);
        bsConfirmModal.hide();
      }
    };
    confirmOkBtn.addEventListener('click', handler);
    bsConfirmModal.show();
  }

  // Render con soporte de "cabecera" en grupos (nombre + gemas)
  function renderMessages(arr){
    const last = (arr || []).slice(-30);
    convBody.innerHTML = '';

    last.forEach(m => {
      const wrap = document.createElement('div');
      wrap.className = 'msg ' + (m.senderId === currentUser.uid ? 'msg-me' : 'msg-peer'); // Usar senderId para 'me'

      let inner = '';

      // Si es grupo y el mensaje NO es mío: mostrar nombre + gemas
      if (currentChatType === 'group' && m.senderId !== currentUser.uid) {
        const gems = (typeof m.gems === 'number') ? m.gems : 0; // Asumiendo que 'gems' viene con el mensaje o se busca
        const name = m.senderName || 'Miembro'; // Asumiendo 'senderName' viene con el mensaje
        inner += `
          <div class="msg-head" style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
            <strong>${name}</strong>
            <span class="gems" style="display:inline-flex;align-items:center;gap:6px;font-weight:800;">
              <img src="assets/img/gema.png" alt="Gema" style="width:18px;height:18px;object-fit:contain;">
              ${gems}
            </span>
          </div>
        `;
      }

      inner += `${m.text}<span class="time">${m.time || ''}</span>`; // 'time' debería venir del timestamp de Firestore
      wrap.innerHTML = inner;
      convBody.appendChild(wrap);
    });

    convBody.scrollTop = convBody.scrollHeight;
  }

  // Sidepanel helpers
  function openSidePanel(mode){
    // mode: "tasks" | "add" | "email"
    document.querySelector('.panel')?.classList.add('narrow');
    sidePanel.hidden = false;

    spTasksBody.hidden = true;
    spAddBody.hidden = true;
    spEmailBody.hidden = true;

    if (mode === 'tasks'){
      spTitle.textContent = 'Administrador de tareas';
      spTasksBody.hidden = false;
      renderTasks();
      taskInput?.focus();
    } else if (mode === 'add'){
      spTitle.textContent = 'Agregar integrante';
      spAddBody.hidden = false;
    } else if (mode === 'email'){
      spTitle.textContent = 'Enviar Correo';
      spEmailBody.hidden = false;
      emailDesc?.focus();
    }
  }

  function closeSidePanel(){
    sidePanel.hidden = true;
    document.querySelector('.panel')?.classList.remove('narrow');
  }

  // Render tareas del chat actual (si es grupo)
  function renderTasks(){
    const items = tasksByChat[currentChatId] || [];
    taskList.innerHTML = '';
    items.forEach(t => {
      const row = document.createElement('label');
      row.className = 'sp-task';
      row.innerHTML = `
        <input type="checkbox" ${t.done ? 'checked' : ''} data-id="${t.id}">
        <div>${t.text}</div>
      `;
      taskList.appendChild(row);
    });
  }

  function openConversation(chatId, name, type){
    if (unsubscribeMessages) {
      unsubscribeMessages(); // Desuscribirse del chat anterior
    }

    currentChatId   = chatId;
    currentChatType = type || 'private';

    convName.textContent   = name || 'Chat';
    convAvatar.textContent = (name || 'C').charAt(0).toUpperCase();

    // Subtítulo debajo del nombre
    const convSub = document.querySelector('.conv-sub');
    if (currentChatType === 'private') {
      convSub.textContent = 'en línea';
    } else {
      // Demo: muestra “Diego está activo”
      convSub.textContent = 'Diego está activo';
    }

    // Mostrar/ocultar acciones según tipo
    btnVideo.hidden = currentChatType !== 'private';
    mAdd.hidden     = currentChatType !== 'group';
    mEmail.hidden   = currentChatType !== 'private';


    // Cerrar menú de acciones si estaba abierto
    if (!chatMenu.hasAttribute('hidden')) {
      chatMenu.setAttribute('hidden', '');
      btnMore.setAttribute('aria-expanded', 'false');
    }

    promo.hidden = true;
    convo.hidden = false;

    // si el panel está abierto y era de tareas, refrescar/cerrar según tipo
    if (!sidePanel.hidden){
      if (currentChatType === 'group' && !spTasksBody.hidden) {
        renderTasks();
      } else if (currentChatType !== 'group' && !spTasksBody.hidden) {
        closeSidePanel();
      }
    }

    // Cargar mensajes del chat
    // Si es un chat de demo (ej. 'ana', 'diego'), usa los datos locales
    if (conversations[chatId]) {
      renderMessages(conversations[chatId]);
    } else {
      // Si es un chat de Firestore (ej. un grupo creado), escucha los mensajes de Firestore
      unsubscribeMessages = db.collection('chats').doc(chatId).collection('messages')
        .orderBy('timestamp')
        .onSnapshot(snapshot => {
          const messages = [];
          snapshot.forEach(doc => {
            const data = doc.data();
            messages.push({
              id: doc.id,
              senderId: data.senderId,
              senderName: data.senderName,
              text: data.text,
              timestamp: data.timestamp,
              time: data.timestamp ? new Date(data.timestamp.toDate()).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' }) : ''
            });
          });
          renderMessages(messages);
        }, error => {
          console.error("Error al cargar mensajes del chat:", error);
          convBody.innerHTML = '<div class="p-3 text-danger">Error al cargar mensajes.</div>';
        });
    }
    msgInput.focus();
  }

  function closeConversationToPromo(){
    convo.hidden = true;
    promo.hidden = false;
    document.querySelectorAll('.chatitem.active').forEach(el => el.classList.remove('active'));
    currentChatId = null;
    if (unsubscribeMessages) {
      unsubscribeMessages(); // Desuscribirse de los mensajes al cerrar el chat
      unsubscribeMessages = null;
    }
  }

    /* =========================
     Listeners: lista de chats
  ========================== */  
  function handleChatItemClick(event, itemElement) {
    event.preventDefault();
    document.querySelectorAll('.chatitem.active').forEach(el => el.classList.remove('active'));
    itemElement.classList.add('active');

    const id   = itemElement.dataset.chat;
    const name = itemElement.dataset.name || 'Chat';
    const type = itemElement.dataset.type || 'private';
    openConversation(id, name, type);

    if (isMobileView()) {
      sidebar.style.display = 'none';
      panel.style.display = 'block';
    }
  }

  /* =========================
     Composer
  ========================== */
  async function sendMessage(){
    const text = msgInput.value.trim();
    if (!text || !currentChatId || !currentUser) return;

    // Si es un chat de demo, usa la lógica local
    if (conversations[currentChatId]) {
      const time = new Date().toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' });
      conversations[currentChatId].push({ me:true, text, time });
      renderMessages(conversations[currentChatId]);
    } else {
      // Si es un chat de Firestore, envía el mensaje a Firestore
      try {
        await db.collection('chats').doc(currentChatId).collection('messages').add({
          senderId: currentUser.uid,
          senderName: currentUser.displayName || 'Usuario',
          text: text,
          timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Actualizar el lastMessage del chat principal
        await db.collection('chats').doc(currentChatId).update({
          lastMessage: {
            text: text,
            time: new Date().toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' }),
            senderId: currentUser.uid
          }
        });

      } catch (error) {
        console.error("Error al enviar mensaje:", error);
        alert('No se pudo enviar el mensaje.');
      }
    }

    msgInput.value = '';
    msgInput.focus();
  }

  sendBtn?.addEventListener('click', sendMessage);
  msgInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') sendMessage();
  });
  convBack?.addEventListener('click', closeConversationToPromo);

  /* =========================
     Header actions
  ========================== */
  btnHome?.addEventListener('click', () => location.reload());

  btnVideo?.addEventListener('click', () => {
    if (currentChatType !== 'private') return;
    openConfirm('¿Iniciar videollamada?', () => {
      console.log('Iniciando videollamada (demo)…');
    });
  });

  /* =========================
     Menú de acciones del chat (tres líneas)
     -> listeners globales
  ========================== */
  btnMore?.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = !chatMenu.hasAttribute('hidden');
    if (isOpen) {
      chatMenu.setAttribute('hidden', '');
      btnMore.setAttribute('aria-expanded', 'false');
    } else {
      chatMenu.removeAttribute('hidden');
      btnMore.setAttribute('aria-expanded', 'true');
    }
  });

  // Cerrar al hacer click fuera
  document.addEventListener('click', (e) => {
    if (!chatMenu) return;
    if (!chatMenu.hasAttribute('hidden')) {
      const inside = chatMenu.contains(e.target) || btnMore?.contains(e.target);
      if (!inside) {
        chatMenu.setAttribute('hidden', '');
        btnMore?.setAttribute('aria-expanded', 'false');
      }
    }
  });

  // Cerrar con Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && chatMenu && !chatMenu.hasAttribute('hidden')) {
      chatMenu.setAttribute('hidden', '');
      btnMore?.setAttribute('aria-expanded', 'false');
    }
  });

  // Acciones del menú → abrir sidepanel sin que el click global lo cierre
  mEncrypt?.addEventListener('click', (e) => {
    e.stopPropagation();
    chatMenu.setAttribute('hidden','');
    btnMore?.setAttribute('aria-expanded','false');
    openConfirm('¿Cifrar este chat?', () => console.log('🔒 Chat cifrado (demo)'));
  });

  mTasks?.addEventListener('click', (e) => {
    e.stopPropagation();                         // evita cierre inmediato
    chatMenu.setAttribute('hidden','');
    btnMore?.setAttribute('aria-expanded','false');
    setTimeout(() => openSidePanel('tasks'), 0); // abre en el siguiente tick
  });

  mAdd?.addEventListener('click', (e) => {
    e.stopPropagation();                         // evita cierre inmediato
    chatMenu.setAttribute('hidden','');
    btnMore?.setAttribute('aria-expanded','false');
    setTimeout(() => openSidePanel('add'), 0);   // abre en el siguiente tick
  });

  mEmail?.addEventListener('click', (e) => {
    e.stopPropagation();                         // evita cierre inmediato
    chatMenu.setAttribute('hidden','');
    btnMore?.setAttribute('aria-expanded','false');
    setTimeout(() => openSidePanel('email'), 0);   // abre en el siguiente tick
  });

    /* =========================
     Menú usuario (avatar)
  ========================== */
  function closeUserMenu(){
    if (!dropdown) return;
    if (!dropdown.hasAttribute('hidden')) {
      dropdown.setAttribute('hidden', '');
      btnUserMenu?.setAttribute('aria-expanded', 'false');
    }
  }
  function toggleUserMenu(e){
    e?.stopPropagation();
    if (!dropdown) return;
    const open = !dropdown.hasAttribute('hidden');
    if (open) closeUserMenu();
    else {
      dropdown.removeAttribute('hidden');
      btnUserMenu?.setAttribute('aria-expanded', 'true');
    }
  }

  btnUserMenu?.addEventListener('click', toggleUserMenu);

  document.addEventListener('click', (e) => {
    if (!dropdown) return;
    const inside = dropdown.contains(e.target) || btnUserMenu?.contains(e.target);
    if (!inside) closeUserMenu();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeUserMenu();
  });

  btnEncrypt?.addEventListener('click', () => {
    closeUserMenu();
    openConfirm('¿Seguro que quieres cifrar los chats? Ocultará todos los mensajes.', () => {
      console.log('✅ Chats cifrados (demo)');
    });
  });

  /* =========================
     Adjuntos (+): menú Documento / Foto
  ========================== */
  btnAttach?.addEventListener('click', (e) => {
    e.stopPropagation();
    const open = !attachMenu.hasAttribute('hidden');
    if (open) attachMenu.setAttribute('hidden','');
    else attachMenu.removeAttribute('hidden');
  });

  // Cerrar menú de adjuntos al hacer click fuera
  document.addEventListener('click', (e) => {
    if (!attachMenu) return;
    if (!attachMenu.hasAttribute('hidden')) {
      const inside = attachMenu.contains(e.target) || btnAttach?.contains(e.target);
      if (!inside) attachMenu.setAttribute('hidden','');
    }
  });

  // Opciones del menú
  attachImage?.addEventListener('click', () => {
    attachMenu.setAttribute('hidden','');
    fileImage?.click();
  });
  attachFile?.addEventListener('click', () => {
    attachMenu.setAttribute('hidden','');
    fileAny?.click();
  });

  // Nueva opción: Ubicación
  attachLocation?.addEventListener('click', async () => { // Make async
    attachMenu.setAttribute('hidden','');
    if (!currentChatId || !currentUser) return;

    const locationUrl = 'https://www.google.com/maps/place/Apodaca,+N.L./@25.7959952,-100.2709194,12z';
    const messageText = `📍 Ubicación: [Apodaca, N.L.](${locationUrl})`;

    // If it's a demo chat, use local logic
    if (conversations[currentChatId]) {
      const time = new Date().toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' });
      conversations[currentChatId].push({ me:true, text: messageText, time });
      renderMessages(conversations[currentChatId]);
    } else {
      // If it's a Firestore chat, send to Firestore
      try {
        await db.collection('chats').doc(currentChatId).collection('messages').add({
          senderId: currentUser.uid,
          senderName: currentUser.displayName || 'Usuario',
          text: messageText,
          timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        await db.collection('chats').doc(currentChatId).update({
          lastMessage: {
            text: messageText,
            time: new Date().toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' }),
            senderId: currentUser.uid
          }
        });
      } catch (error) {
        console.error("Error al enviar ubicación:", error);
        alert('No se pudo enviar la ubicación.');
      }
    }
  });


  // Al seleccionar archivo/imagen, simula un mensaje en el chat
  fileImage?.addEventListener('change', async (e) => { // Make async
    if (!e.target.files?.length || !currentChatId || !currentUser) return;
    const f = e.target.files[0];
    const messageText = `📷 Imagen: ${f.name}`;

    if (conversations[currentChatId]) {
      const time = new Date().toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' });
      conversations[currentChatId].push({ me:true, text: messageText, time });
      renderMessages(conversations[currentChatId]);
    } else {
      try {
        await db.collection('chats').doc(currentChatId).collection('messages').add({
          senderId: currentUser.uid,
          senderName: currentUser.displayName || 'Usuario',
          text: messageText,
          timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        await db.collection('chats').doc(currentChatId).update({
          lastMessage: {
            text: messageText,
            time: new Date().toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' }),
            senderId: currentUser.uid
          }
        });
      } catch (error) {
        console.error("Error al enviar imagen:", error);
        alert('No se pudo enviar la imagen.');
      }
    }
    e.target.value = '';
  });

  fileAny?.addEventListener('change', async (e) => { // Make async
    if (!e.target.files?.length || !currentChatId || !currentUser) return;
    const f = e.target.files[0];
    const messageText = `📎 Archivo: ${f.name}`;

    if (conversations[currentChatId]) {
      const time = new Date().toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' });
      conversations[currentChatId].push({ me:true, text: messageText, time });
      renderMessages(conversations[currentChatId]);
    } else {
      try {
        await db.collection('chats').doc(currentChatId).collection('messages').add({
          senderId: currentUser.uid,
          senderName: currentUser.displayName || 'Usuario',
          text: messageText,
          timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        await db.collection('chats').doc(currentChatId).update({
          lastMessage: {
            text: messageText,
            time: new Date().toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' }),
            senderId: currentUser.uid
          }
        });
      } catch (error) {
        console.error("Error al enviar archivo:", error);
        alert('No se pudo enviar el archivo.');
      }
    }
    e.target.value = '';
  });

  // Tooltip demo (si lo usas)
  const btnCreateGroup = document.getElementById('btnCreateGroup');
  if (btnCreateGroup && typeof bootstrap?.Tooltip === 'function') {
    try { new bootstrap.Tooltip(btnCreateGroup, { placement:'right' }); } catch {}
  }

    /* =========================
     Sidepanel: cerrar, click-fuera, Escape
  ========================== */
  spClose?.addEventListener('click', closeSidePanel);

  document.addEventListener('click', (e) => {
    if (sidePanel.hidden) return;
    // si el click fue en el menú del chat, no cierres el panel
    if (chatMenu && chatMenu.contains(e.target)) return;
    const inside = sidePanel.contains(e.target) || btnMore?.contains(e.target);
    if (!inside) closeSidePanel();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !sidePanel.hidden) closeSidePanel();
  });

  /* =========================
     Lógica de tareas (crear, marcar, confirmar)
  ========================== */
  taskCreateForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const txt = taskInput.value.trim();
    if (!txt) return;
    const arr = tasksByChat[currentChatId] || (tasksByChat[currentChatId] = []);
    const nextId = (arr.at(-1)?.id || 0) + 1;
    arr.push({ id: nextId, text: txt, done:false });
    taskInput.value = '';
    renderTasks();
  });

  taskList?.addEventListener('change', (e) => {
    const id = Number(e.target.getAttribute('data-id'));
    if (!id) return;
    const arr = tasksByChat[currentChatId] || [];
    const item = arr.find(x => x.id === id);
    if (item) item.done = e.target.checked;
  });

  taskConfirmBtn?.addEventListener('click', () => {
    const arr = tasksByChat[currentChatId] || [];
    const doneCount = arr.filter(x => x.done).length;
    // Borra las realizadas (demo)
    tasksByChat[currentChatId] = arr.filter(x => !x.done);
    renderTasks();
    openConfirm(`Se confirmaron ${doneCount} tareas realizadas.`, () => {});
  });

  /* =========================
     Lógica “Agregar a alguien”
  ========================== */
  addForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = addInput.value.trim().toLowerCase();
    if (!email || !currentChatId || currentChatType !== 'group') return;

    const addButton = addForm.querySelector('button[type="submit"]');
    addButton.disabled = true;
    addButton.textContent = '...';

    try {
      // 1. Buscar al usuario por su correo en la colección 'users'
      const userQuery = await db.collection('users').where('email', '==', email).limit(1).get();

      if (userQuery.empty) {
        alert(`No se encontró ningún usuario con el correo: ${email}`);
        return;
      }

      const userToAdd = userQuery.docs[0].data();
      const uidToAdd = userToAdd.uid;

      // 2. Actualizar el documento del chat para añadir el UID al array 'Members'
      const chatRef = db.collection('chats').doc(currentChatId);
      await chatRef.update({
        Members: firebase.firestore.FieldValue.arrayUnion(uidToAdd)
      });

      // 3. (Opcional) Añadir un mensaje del sistema al chat
      await chatRef.collection('messages').add({
        senderId: 'system',
        senderName: 'Sistema',
        text: `${currentUser.displayName} agregó a ${userToAdd.displayName} al grupo.`,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });

      addInput.value = '';
      openConfirm(`${userToAdd.displayName} fue agregado al grupo.`, () => {});

    } catch (error) {
      console.error("Error al agregar miembro:", error);
      alert('Ocurrió un error al intentar agregar al miembro.');
    } finally {
      addButton.disabled = false;
      addButton.textContent = 'Agregar';
    }
  });

  /* =========================
     Lógica de "Enviar Correo"
  ========================== */
  emailForm?.addEventListener('submit', async (e) => { // Make async
    e.preventDefault();
    const email = document.getElementById('emailInput').value;
    const desc = emailDesc.value.trim();

    if (!desc) {
      alert('Por favor, escribe una descripción.');
      return;
    }
    if (!currentChatId || !currentUser) return;

    // Simular envío
    const message = `📧 Correo enviado a ${email}: "${desc}"`;

    if (conversations[currentChatId]) {
      const time = new Date().toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' });
      conversations[currentChatId].push({ me:true, text: message, time });
      renderMessages(conversations[currentChatId]);
    } else {
      try {
        await db.collection('chats').doc(currentChatId).collection('messages').add({
          senderId: currentUser.uid,
          senderName: currentUser.displayName || 'Usuario',
          text: message,
          timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        await db.collection('chats').doc(currentChatId).update({
          lastMessage: {
            text: message,
            time: new Date().toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' }),
            senderId: currentUser.uid
          }
        });
      } catch (error) {
        console.error("Error al enviar correo:", error);
        alert('No se pudo enviar el correo.');
      }
    }
    // Limpiar y cerrar
    emailDesc.value = '';
    closeSidePanel();
    openConfirm(`Correo enviado a ${email}`, () => {});
  });

});