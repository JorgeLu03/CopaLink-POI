// js/crear-grupo.js
document.addEventListener('DOMContentLoaded', () => {
  const currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
  
  if (!currentUser) {
    window.location.href = 'login.php';
    return;
  }

  const groupForm = document.getElementById('groupForm');
  const groupNameInput = document.getElementById('groupName');
  const memberInput = document.getElementById('memberInput');
  const addMemberBtn = document.getElementById('addMemberBtn');
  const membersChips = document.getElementById('membersChips');
  const autocompleteSuggestions = document.getElementById('autocompleteSuggestions');
  
  let selectedMembers = []; // Array de objetos {id, name}
  let allUsers = [];
  let filteredUsers = [];

  // Cargar lista de usuarios disponibles
  loadUsers();

  async function loadUsers() {
    try {
      const res = await fetch(`php/users.php?action=get_list&user_id=${currentUser.id}`);
      const data = await res.json();
      if (data.success) {
        allUsers = data.data;
      }
    } catch (err) {
      console.error('Error al cargar usuarios:', err);
    }
  }

  // Autocompletado mientras escribe
  memberInput?.addEventListener('input', () => {
    const searchTerm = memberInput.value.trim().toLowerCase();
    
    if (!searchTerm) {
      autocompleteSuggestions.style.display = 'none';
      return;
    }

    // Filtrar usuarios que coincidan con la búsqueda
    filteredUsers = allUsers.filter(u => 
      (u.username.toLowerCase().includes(searchTerm) || 
       u.email.toLowerCase().includes(searchTerm)) &&
      !selectedMembers.find(m => m.id === u.id)
    );

    if (filteredUsers.length > 0) {
      renderSuggestions(filteredUsers);
      autocompleteSuggestions.style.display = 'block';
    } else {
      autocompleteSuggestions.style.display = 'none';
    }
  });

  // Cerrar sugerencias al hacer clic fuera
  document.addEventListener('click', (e) => {
    if (!memberInput?.contains(e.target) && !autocompleteSuggestions?.contains(e.target)) {
      autocompleteSuggestions.style.display = 'none';
    }
  });

  // Renderizar sugerencias
  function renderSuggestions(users) {
    autocompleteSuggestions.innerHTML = '';
    
    users.slice(0, 5).forEach(user => {
      const item = document.createElement('div');
      item.className = 'autocomplete-item';
      item.innerHTML = `
        <div class="autocomplete-item-name">${user.username}</div>
        <div class="autocomplete-item-email">${user.email}</div>
      `;
      
      item.addEventListener('click', () => {
        addMember(user);
        memberInput.value = '';
        autocompleteSuggestions.style.display = 'none';
      });
      
      autocompleteSuggestions.appendChild(item);
    });
  }

  // Agregar miembro desde el botón
  addMemberBtn?.addEventListener('click', () => {
    if (filteredUsers.length > 0) {
      addMember(filteredUsers[0]);
      memberInput.value = '';
      autocompleteSuggestions.style.display = 'none';
    }
  });

  // Agregar con Enter
  memberInput?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredUsers.length > 0) {
        addMember(filteredUsers[0]);
        memberInput.value = '';
        autocompleteSuggestions.style.display = 'none';
      }
    }
  });

  // Función para agregar miembro
  function addMember(user) {
    if (!selectedMembers.find(m => m.id === user.id)) {
      selectedMembers.push({ id: user.id, name: user.username });
      renderMembers();
    }
  }

  // Render chips de miembros
  function renderMembers() {
    membersChips.innerHTML = '';
    selectedMembers.forEach((member, index) => {
      const chip = document.createElement('span');
      chip.className = 'chip';
      chip.innerHTML = `
        ${member.name}
        <button type="button" onclick="removeMember(${index})">×</button>
      `;
      membersChips.appendChild(chip);
    });
  }

  // Función global para eliminar miembro
  window.removeMember = function(index) {
    selectedMembers.splice(index, 1);
    renderMembers();
  };

  // Enviar formulario
  groupForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const groupName = groupNameInput.value.trim();
    if (!groupName) {
      alert('Por favor, ingresa un nombre para el grupo');
      return;
    }

    if (selectedMembers.length < 2) {
      alert('Debes agregar al menos 2 miembros para crear un grupo');
      return;
    }

    const memberIds = selectedMembers.map(m => m.id);
    
    try {
      const res = await fetch('php/groups.php?action=create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: groupName,
          creator_id: currentUser.id,
          members: memberIds
        })
      });

      const data = await res.json();
      
      if (data.success) {
        alert('¡Grupo creado exitosamente!');
        window.location.href = 'chats.php';
      } else {
        alert('Error al crear grupo: ' + data.message);
      }
    } catch (err) {
      console.error('Error:', err);
      alert('Error de conexión al crear grupo');
    }
  });
});
