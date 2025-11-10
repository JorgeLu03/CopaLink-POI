// js/chats-db.js - Sistema de chat con PHP/MySQL y WebSocket
document.addEventListener('DOMContentLoaded', () => {
  let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
  let currentChatId = null;
  let currentChatType = 'private'; // 'private' o 'group'
  let messageInterval = null;
  let socket = null;
  let allUsers = []; // Almacenar todos los usuarios
  let allGroups = []; // Almacenar todos los grupos
  let currentFilter = 'all'; // 'all', 'chats', 'groups'
  let searchQuery = ''; // Término de búsqueda actual

  // Selectores
  const chatListContainer = document.getElementById('chatListContainer');
  const promo = document.getElementById('placeholderPromo');
  const convo = document.getElementById('conversation');
  const convName = document.getElementById('convName');
  const convAvatar = document.getElementById('convAvatar');
  const convBody = document.getElementById('convBody');
  const msgInput = document.getElementById('msgInput');
  const sendBtn = document.getElementById('sendBtn');
  const convBack = document.getElementById('convBack');
  const btnHome = document.getElementById('btnHome');
  const menuUserName = document.getElementById('menuUserName');
  const btnLogoutMenu = document.getElementById('btnLogoutMenu');
  const btnUserMenu = document.getElementById('btnUserMenu');
  const dropdown = document.getElementById('userDropdown');
  const btnMore = document.getElementById('btnMore');
  const chatMenu = document.getElementById('chatMenu');
  const mTasks = document.getElementById('mTasks');
  const sidePanel = document.getElementById('sidePanel');
  const spClose = document.getElementById('spClose');
  const spTitle = document.getElementById('spTitle');
  const spTasksBody = document.getElementById('spTasks');
  const taskCreateForm = document.getElementById('taskCreateForm');
  const taskInput = document.getElementById('taskInput');
  const taskList = document.getElementById('taskList');
  const taskConfirmBtn = document.getElementById('taskConfirmBtn');
  const sidebar = document.querySelector('.sidebar');
  const panel = document.querySelector('.panel');
  const filterTabs = document.querySelectorAll('.sidebar-tabs .tab');
  const searchInput = document.getElementById('searchInput');

  // Verificar autenticación
  if (!currentUser) {
    window.location.href = 'login.php';
    return;
  }

  // Mostrar nombre del usuario en el menú
  if (menuUserName) {
    menuUserName.textContent = currentUser.username || currentUser.email;
  }

  // Cargar lista de usuarios y grupos
  chatListContainer.innerHTML = '';
  loadUsersList();
  loadGroupsList();

  // Inicializar WebSocket
  initializeWebSocket();

  // Event listeners
  btnHome?.addEventListener('click', () => {
    closeConversation();
  });

  convBack?.addEventListener('click', () => {
    closeConversation();
  });

  sendBtn?.addEventListener('click', () => {
    sendMessage();
  });

  msgInput?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  });

  btnLogoutMenu?.addEventListener('click', async () => {
    await logout();
  });

  btnUserMenu?.addEventListener('click', () => {
    dropdown.hidden = !dropdown.hidden;
  });

  // Cerrar dropdown al hacer clic fuera
  document.addEventListener('click', (e) => {
    if (!btnUserMenu?.contains(e.target) && !dropdown?.contains(e.target)) {
      dropdown.hidden = true;
    }
    if (!btnMore?.contains(e.target) && !chatMenu?.contains(e.target)) {
      chatMenu.hidden = true;
    }
  });

  // Botón "Más acciones" en el chat
  btnMore?.addEventListener('click', () => {
    chatMenu.hidden = !chatMenu.hidden;
  });

  // Abrir panel de tareas
  mTasks?.addEventListener('click', () => {
    if (currentChatType === 'group') {
      openTasksPanel();
    } else {
      alert('Las tareas solo están disponibles en grupos');
    }
    chatMenu.hidden = true;
  });

  // Filtros de tabs
  filterTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Remover clase active de todos los tabs
      filterTabs.forEach(t => t.classList.remove('active'));
      // Agregar clase active al tab clickeado
      tab.classList.add('active');
      // Obtener el filtro y aplicarlo
      currentFilter = tab.dataset.filter;
      applyFilter();
    });
  });

  // Búsqueda en tiempo real
  searchInput?.addEventListener('input', (e) => {
    searchQuery = e.target.value.toLowerCase().trim();
    applyFilter();
  });

  // Cerrar panel lateral
  spClose?.addEventListener('click', () => {
    sidePanel.hidden = true;
  });

  // Crear tarea
  taskCreateForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = taskInput.value.trim();
    if (!title) return;
    
    await createTask(title);
    taskInput.value = '';
  });

  // Confirmar tareas realizadas
  taskConfirmBtn?.addEventListener('click', async () => {
    const checkboxes = taskList.querySelectorAll('input[type="checkbox"]:checked');
    for (const checkbox of checkboxes) {
      const taskId = parseInt(checkbox.dataset.taskId);
      await updateTask(taskId, true);
    }
    await loadTasks();
  });

  // Funciones
  async function loadUsersList() {
    try {
      const res = await fetch(`php/users.php?action=get_list&user_id=${currentUser.id}`);
      const data = await res.json();
      
      if (data.success) {
        allUsers = data.data;
        applyFilter();
      } else {
        console.error('Error al cargar usuarios:', data.message);
      }
    } catch (err) {
      console.error('Error de conexión:', err);
    }
  }

  async function loadGroupsList() {
    try {
      const res = await fetch(`php/groups.php?action=get_list&user_id=${currentUser.id}`);
      const data = await res.json();
      
      if (data.success) {
        allGroups = data.data;
        applyFilter();
      } else {
        console.error('Error al cargar grupos:', data.message);
      }
    } catch (err) {
      console.error('Error de conexión:', err);
    }
  }

  function applyFilter() {
    chatListContainer.innerHTML = '';
    
    // Filtrar usuarios por búsqueda (solo por nombre)
    const filteredUsers = allUsers.filter(user => {
      if (!searchQuery) return true;
      return user.username.toLowerCase().includes(searchQuery);
    });
    
    // Filtrar grupos por búsqueda (solo por nombre)
    const filteredGroups = allGroups.filter(group => {
      if (!searchQuery) return true;
      return group.name.toLowerCase().includes(searchQuery);
    });
    
    // Aplicar filtro de tabs
    if (currentFilter === 'all') {
      renderUsersList(filteredUsers);
      renderGroupsList(filteredGroups);
    } else if (currentFilter === 'chats') {
      renderUsersList(filteredUsers);
    } else if (currentFilter === 'groups') {
      renderGroupsList(filteredGroups);
    }
    
    // Mostrar mensaje si no hay resultados
    if (chatListContainer.children.length === 0) {
      chatListContainer.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--muted);">No se encontraron resultados</div>';
    }
  }

  function renderUsersList(users) {
    users.forEach(user => {
      const chatItem = document.createElement('a');
      chatItem.className = 'chatitem';
      chatItem.href = '#';
      chatItem.innerHTML = `
        <div class="avatar ${user.connection_status === 'online' ? 'online' : ''}" data-user-id="${user.id}">${user.username.charAt(0).toUpperCase()}</div>
        <div class="meta">
          <div class="row1">
            <span>${user.username}</span>
          </div>
          <div class="row2">
            <span class="preview">${user.connection_status === 'online' ? 'En línea' : 'Desconectado'}</span>
          </div>
        </div>
      `;
      
      chatItem.addEventListener('click', (e) => {
        e.preventDefault();
        openChat(user.id, user.username, 'private');
      });
      
      chatListContainer.appendChild(chatItem);
    });
  }

  function renderGroupsList(groups) {
    groups.forEach(group => {
      const chatItem = document.createElement('a');
      chatItem.className = 'chatitem';
      chatItem.href = '#';
      chatItem.innerHTML = `
        <div class="avatar grp">👥</div>
        <div class="meta">
          <div class="row1">
            <span>${group.name}</span>
          </div>
          <div class="row2">
            <span class="preview">${group.member_count} miembros</span>
          </div>
        </div>
      `;
      
      chatItem.addEventListener('click', (e) => {
        e.preventDefault();
        openChat(group.id, group.name, 'group');
      });
      
      chatListContainer.appendChild(chatItem);
    });
  }

  async function openChat(userId, userName, type = 'private') {
    currentChatId = userId;
    currentChatType = type;
    
    promo.hidden = true;
    convo.hidden = false;
    
    // En móvil: ocultar sidebar y mostrar panel
    if (sidebar) sidebar.classList.add('mobile-hidden');
    if (panel) panel.classList.add('mobile-visible');
    
    convName.textContent = userName;
    convAvatar.textContent = userName.charAt(0).toUpperCase();
    convBody.innerHTML = '';
    
    await loadMessages();
    
    // Actualizar mensajes cada 3 segundos
    if (messageInterval) clearInterval(messageInterval);
    messageInterval = setInterval(loadMessages, 3000);
  }

  async function loadMessages() {
    if (!currentChatId) return;
    
    try {
      let url;
      if (currentChatType === 'private') {
        url = `php/messages.php?action=get&user_id=${currentUser.id}&recipient_id=${currentChatId}&limit=50`;
      } else {
        url = `php/messages.php?action=get&user_id=${currentUser.id}&group_id=${currentChatId}&limit=50`;
      }
      
      const res = await fetch(url);
      const data = await res.json();
      
      if (data.success) {
        renderMessages(data.data);
      }
    } catch (err) {
      console.error('Error al cargar mensajes:', err);
    }
  }

  function renderMessages(messages) {
    const shouldScroll = convBody.scrollHeight - convBody.scrollTop <= convBody.clientHeight + 100;
    
    convBody.innerHTML = '';
    
    messages.forEach(msg => {
      const isMe = msg.sender_id === currentUser.id;
      const msgDiv = document.createElement('div');
      msgDiv.className = `msg ${isMe ? 'msg-me' : 'msg-peer'}`;
      
      let innerHTML = '';
      
      // Si es grupo y el mensaje NO es mío: mostrar nombre + gemas
      if (currentChatType === 'group' && !isMe) {
        innerHTML += `
          <div class="msg-head" style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
            <strong>${msg.sender_name || 'Usuario'}</strong>
            <span class="gems" style="display:inline-flex;align-items:center;gap:6px;font-weight:800;">
              <img src="assets/img/gema.png" alt="Gema" style="width:18px;height:18px;object-fit:contain;">
              0
            </span>
          </div>
        `;
      }
      
      innerHTML += `${escapeHtml(msg.content)}<span class="time">${formatTime(msg.created_at)}</span>`;
      msgDiv.innerHTML = innerHTML;
      
      convBody.appendChild(msgDiv);
    });
    
    if (shouldScroll) {
      convBody.scrollTop = convBody.scrollHeight;
    }
  }

  async function sendMessage() {
    const content = msgInput.value.trim();
    if (!content || !currentChatId) return;
    
    try {
      const messageData = {
        sender_id: currentUser.id,
        content: content,
        is_encrypted: false
      };
      
      if (currentChatType === 'private') {
        messageData.recipient_id = currentChatId;
      } else {
        messageData.group_id = currentChatId;
      }
      
      const res = await fetch('php/messages.php?action=send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messageData)
      });
      
      const data = await res.json();
      
      if (data.success) {
        msgInput.value = '';
        
        // Enviar por WebSocket para notificación en tiempo real
        if (socket && socket.connected) {
          socket.emit('send_message', {
            ...messageData,
            message_id: data.data.message_id,
            sender_name: currentUser.username,
            created_at: new Date().toISOString()
          });
        }
        
        await loadMessages();
      } else {
        alert('Error al enviar mensaje: ' + data.message);
      }
    } catch (err) {
      console.error('Error al enviar mensaje:', err);
      alert('Error de conexión al enviar mensaje');
    }
  }

  function closeConversation() {
    if (messageInterval) clearInterval(messageInterval);
    currentChatId = null;
    convo.hidden = true;
    promo.hidden = false;
    convBody.innerHTML = '';
    
    // En móvil: mostrar sidebar y ocultar panel
    if (sidebar) sidebar.classList.remove('mobile-hidden');
    if (panel) panel.classList.remove('mobile-visible');
  }

  async function logout() {
    try {
      await fetch('php/logout.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: currentUser.id })
      });
      
      localStorage.removeItem('currentUser');
      window.location.href = 'login.php';
    } catch (err) {
      console.error('Error al cerrar sesión:', err);
      localStorage.removeItem('currentUser');
      window.location.href = 'login.php';
    }
  }

  function formatTime(timestamp) {
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // ==================== WEBSOCKET ====================
  function initializeWebSocket() {
    socket = io('http://192.168.1.68:3000');
    
    socket.on('connect', () => {
      console.log('✅ Conectado al servidor WebSocket');
      // Registrar usuario en el WebSocket
      socket.emit('user_connected', currentUser);
    });

    socket.on('disconnect', () => {
      console.log('❌ Desconectado del servidor WebSocket');
    });

    // Escuchar nuevos mensajes
    socket.on('new_message', (data) => {
      console.log('📩 Nuevo mensaje recibido:', data);
      // Si el mensaje es para el chat actual, agregarlo
      if ((currentChatType === 'private' && data.recipient_id === currentUser.id && data.sender_id === currentChatId) ||
          (currentChatType === 'private' && data.sender_id === currentUser.id && data.recipient_id === currentChatId) ||
          (currentChatType === 'group' && data.group_id === currentChatId)) {
        addMessageToUI(data);
      }
    });

    // Escuchar cambios de estado de usuarios
    socket.on('user_status_change', (data) => {
      console.log(`👤 ${data.username} está ${data.status}`);
      updateUserStatus(data.userId, data.status);
    });

    // Escuchar nuevas tareas
    socket.on('new_task', (data) => {
      console.log('✓ Nueva tarea:', data);
      if (currentChatType === 'group' && data.group_id === currentChatId) {
        loadTasks();
      }
    });

    // Escuchar actualizaciones de tareas
    socket.on('task_update', (data) => {
      console.log('✓ Tarea actualizada:', data);
      if (currentChatType === 'group') {
        loadTasks();
      }
    });
  }

  function addMessageToUI(msg) {
    const isMe = msg.sender_id === currentUser.id;
    const msgDiv = document.createElement('div');
    msgDiv.className = `msg ${isMe ? 'msg-me' : 'msg-peer'}`;
    
    let innerHTML = '';
    
    if (currentChatType === 'group' && !isMe) {
      innerHTML += `
        <div class="msg-head" style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
          <strong>${msg.sender_name || 'Usuario'}</strong>
          <span class="gems" style="display:inline-flex;align-items:center;gap:6px;font-weight:800;">
            <img src="assets/img/gema.png" alt="Gema" style="width:18px;height:18px;object-fit:contain;">
            0
          </span>
        </div>
      `;
    }
    
    innerHTML += `${escapeHtml(msg.content)}<span class="time">${formatTime(msg.created_at || new Date().toISOString())}</span>`;
    msgDiv.innerHTML = innerHTML;
    
    convBody.appendChild(msgDiv);
    convBody.scrollTop = convBody.scrollHeight;
  }

  function updateUserStatus(userId, status) {
    // Actualizar el indicador de estado en la lista de chats
    const chatItems = document.querySelectorAll('.chatitem');
    chatItems.forEach(item => {
      const avatar = item.querySelector('.avatar');
      if (avatar && avatar.dataset.userId == userId) {
        if (status === 'online') {
          avatar.classList.add('online');
        } else {
          avatar.classList.remove('online');
        }
      }
    });
  }

  // ==================== FUNCIONES DE TAREAS ====================
  async function openTasksPanel() {
    sidePanel.hidden = false;
    spTitle.textContent = 'Administrador de tareas';
    spTasksBody.hidden = false;
    await loadTasks();
  }

  async function createTask(title) {
    try {
      const res = await fetch('php/tasks.php?action=create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          group_id: currentChatId,
          title: title,
          creator_id: currentUser.id
        })
      });
      
      const data = await res.json();
      if (data.success) {
        // Notificar por WebSocket
        if (socket && socket.connected) {
          socket.emit('task_created', {
            group_id: currentChatId,
            task_id: data.data.task_id,
            title: title,
            creator_name: currentUser.username
          });
        }
        await loadTasks();
      } else {
        alert('Error al crear tarea: ' + data.message);
      }
    } catch (err) {
      console.error('Error al crear tarea:', err);
    }
  }

  async function loadTasks() {
    if (!currentChatId || currentChatType !== 'group') return;
    
    try {
      const res = await fetch(`php/tasks.php?action=get_list&group_id=${currentChatId}`);
      const data = await res.json();
      
      if (data.success) {
        renderTasks(data.data);
      }
    } catch (err) {
      console.error('Error al cargar tareas:', err);
    }
  }

  function renderTasks(tasks) {
    taskList.innerHTML = '';
    
    if (tasks.length === 0) {
      taskList.innerHTML = '<p style="text-align:center;color:rgba(255,255,255,.5);padding:20px;">No hay tareas aún</p>';
      return;
    }
    
    tasks.forEach(task => {
      const taskItem = document.createElement('div');
      taskItem.className = 'task-item';
      taskItem.style.cssText = 'padding:10px;border-bottom:1px solid rgba(255,255,255,.08);display:flex;align-items:center;gap:10px;';
      
      taskItem.innerHTML = `
        <input type="checkbox" ${task.is_completed ? 'checked disabled' : ''} data-task-id="${task.id}" style="width:18px;height:18px;cursor:${task.is_completed ? 'not-allowed' : 'pointer'};">
        <div style="flex:1;">
          <div style="font-weight:600;${task.is_completed ? 'text-decoration:line-through;color:rgba(255,255,255,.5);' : ''}">${escapeHtml(task.title)}</div>
          <div style="font-size:.85rem;color:rgba(255,255,255,.6);">Creada por: ${escapeHtml(task.creator_name)}</div>
        </div>
        ${task.is_completed ? '<span style="color:#22c55e;font-weight:700;">✓ Completada</span>' : ''}
      `;
      
      taskList.appendChild(taskItem);
    });
  }

  async function updateTask(taskId, isCompleted) {
    try {
      const res = await fetch('php/tasks.php?action=update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_id: taskId,
          is_completed: isCompleted ? 1 : 0
        })
      });
      
      const data = await res.json();
      if (!data.success) {
        console.error('Error al actualizar tarea:', data.message);
      } else {
        // Notificar por WebSocket
        if (socket && socket.connected) {
          socket.emit('task_updated', {
            task_id: taskId,
            is_completed: isCompleted
          });
        }
      }
    } catch (err) {
      console.error('Error al actualizar tarea:', err);
    }
  }
});
