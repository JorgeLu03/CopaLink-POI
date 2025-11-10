# Servidor WebSocket de CopaLink

Este servidor maneja la comunicación en tiempo real entre usuarios mediante WebSockets usando Socket.IO.

## Instalación

1. Asegúrate de tener Node.js instalado (v14 o superior)
2. Abre una terminal en esta carpeta (`websocket/`)
3. Ejecuta: `npm install`

## Ejecución

### Modo normal:
```bash
npm start
```

### Modo desarrollo (con auto-reload):
```bash
npm run dev
```

El servidor se iniciará en `http://localhost:3000`

## Eventos disponibles

### Cliente -> Servidor:
- `user_connected` - Usuario se conecta al WebSocket
- `send_message` - Enviar un mensaje
- `typing` - Usuario está escribiendo
- `task_created` - Nueva tarea creada
- `task_updated` - Tarea actualizada

### Servidor -> Cliente:
- `user_status_change` - Cambio de estado de usuario (online/offline)
- `new_message` - Nuevo mensaje recibido
- `message_sent` - Confirmación de mensaje enviado
- `user_typing` - Usuario está escribiendo
- `new_task` - Nueva tarea en grupo
- `task_update` - Actualización de tarea

## Notas
- El servidor debe estar corriendo para que funcione la comunicación en tiempo real
- Los mensajes se siguen guardando en la base de datos MySQL a través de PHP
- El WebSocket solo maneja la notificación en tiempo real
