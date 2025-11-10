const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Almacenar usuarios conectados
const connectedUsers = new Map(); // userId -> socketId
const userSockets = new Map(); // socketId -> userData

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ 
    status: 'online', 
    message: 'Servidor WebSocket de CopaLink funcionando',
    connectedUsers: connectedUsers.size
  });
});

io.on('connection', (socket) => {
  console.log(`[CONEXIÓN] Nuevo cliente conectado: ${socket.id}`);

  // Evento: Usuario se registra en el WebSocket
  socket.on('user_connected', (userData) => {
    const userId = userData.id;
    
    connectedUsers.set(userId, socket.id);
    userSockets.set(socket.id, userData);
    
    console.log(`[USUARIO CONECTADO] ${userData.username} (ID: ${userId})`);
    
    // Notificar a todos que este usuario está online
    io.emit('user_status_change', {
      userId: userId,
      username: userData.username,
      status: 'online'
    });
  });

  // Evento: Enviar mensaje
  socket.on('send_message', (data) => {
    console.log(`[MENSAJE] De: ${data.sender_id}, Contenido: ${data.content.substring(0, 30)}...`);
    
    // Si es mensaje privado
    if (data.recipient_id) {
      const recipientSocketId = connectedUsers.get(data.recipient_id);
      
      if (recipientSocketId) {
        // Enviar solo al destinatario
        io.to(recipientSocketId).emit('new_message', data);
      }
      
      // También enviar de vuelta al remitente para confirmación
      socket.emit('message_sent', { success: true, messageId: data.message_id });
    }
    // Si es mensaje de grupo
    else if (data.group_id) {
      // Broadcast a todos los conectados (en producción filtrarías por miembros del grupo)
      io.emit('new_message', data);
      socket.emit('message_sent', { success: true, messageId: data.message_id });
    }
  });

  // Evento: Usuario está escribiendo
  socket.on('typing', (data) => {
    if (data.recipient_id) {
      const recipientSocketId = connectedUsers.get(data.recipient_id);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('user_typing', {
          userId: data.userId,
          username: data.username,
          isTyping: true
        });
      }
    } else if (data.group_id) {
      socket.broadcast.emit('user_typing', {
        userId: data.userId,
        username: data.username,
        groupId: data.group_id,
        isTyping: true
      });
    }
  });

  // Evento: Nueva tarea creada
  socket.on('task_created', (data) => {
    console.log(`[TAREA CREADA] En grupo: ${data.group_id}`);
    // Broadcast a todos los miembros del grupo
    io.emit('new_task', data);
  });

  // Evento: Tarea actualizada
  socket.on('task_updated', (data) => {
    console.log(`[TAREA ACTUALIZADA] ID: ${data.task_id}`);
    io.emit('task_update', data);
  });

  // Evento: Usuario se desconecta
  socket.on('disconnect', () => {
    const userData = userSockets.get(socket.id);
    
    if (userData) {
      const userId = userData.id;
      connectedUsers.delete(userId);
      userSockets.delete(socket.id);
      
      console.log(`[DESCONEXIÓN] ${userData.username} (ID: ${userId})`);
      
      // Notificar a todos que este usuario está offline
      io.emit('user_status_change', {
        userId: userId,
        username: userData.username,
        status: 'offline'
      });
    } else {
      console.log(`[DESCONEXIÓN] Cliente desconocido: ${socket.id}`);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`====================================`);
  console.log(`🚀 Servidor WebSocket iniciado`);
  console.log(`📡 Puerto: ${PORT}`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log(`====================================`);
});
