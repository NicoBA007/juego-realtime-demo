// 1. Requerir las librerías
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static(__dirname));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// 2. Variable para guardar a TODOS los jugadores
// Usaremos un objeto donde la 'key' será el ID del socket del jugador
let players = {};

// Función simple para generar un color aleatorio
function getRandomColor() {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

// 3. Lógica de Socket.IO
io.on('connection', (socket) => {
  console.log(`¡Un usuario se ha conectado! ID: ${socket.id}`);

  // 3a. Crear un nuevo jugador y guardarlo
  players[socket.id] = {
    x: Math.floor(Math.random() * 300) + 50, // Posición X aleatoria
    y: Math.floor(Math.random() * 300) + 50, // Posición Y aleatoria
    color: getRandomColor(),
    id: socket.id
  };

  // 3b. Enviar al NUEVO jugador la lista de TODOS los jugadores actuales
  socket.emit('currentPlayers', players);
  
  // 3c. Enviar a TODOS LOS DEMÁS la info del NUEVO jugador
  socket.broadcast.emit('newPlayer', players[socket.id]);

  // 4. Cuando un jugador se mueve
  socket.on('move', (newPosition) => {
    // Actualizamos la posición de ese jugador en el servidor
    if (players[socket.id]) {
      players[socket.id].x = newPosition.x;
      players[socket.id].y = newPosition.y;
      
      // Enviamos la nueva posición de ESE jugador a TODOS LOS DEMÁS
      socket.broadcast.emit('playerMoved', players[socket.id]);
    }
  });

  // 5. Cuando un jugador se desconecta
  socket.on('disconnect', () => {
    console.log(`Un usuario se ha desconectado: ${socket.id}`);
    
    // Eliminar al jugador de nuestra lista
    delete players[socket.id];
    
    // Enviar a TODOS los que quedan el ID del jugador que se fue
    io.emit('playerLeft', socket.id);
  });
});

// 6. Iniciar el servidor
// ASÍ DEBE ESTAR (CORRECTO)
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0'; // Escuchar en todas las interfaces

server.listen(PORT, HOST, () => {
  console.log(`¡Servidor escuchando en el puerto ${PORT}!`);
});