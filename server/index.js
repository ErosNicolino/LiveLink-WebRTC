// LiveLink/server/index.js
const express = require('express');
const http = require('http'); 
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app); 

const io = new Server(server, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST"]
  }
});

const PORT = 4000;
const ROOM_NAME = 'live-link-room';

app.get('/', (req, res) => {
  res.send('Servidor de Sinalização (HTTP) está rodando!');
});

io.on('connection', (socket) => {
  console.log(`Usuário conectado: ${socket.id}`);

  socket.join(ROOM_NAME);
  console.log(`Usuário ${socket.id} entrou na sala ${ROOM_NAME}`);

  socket.on('disconnect', () => {
    console.log(`Usuário desconectado: ${socket.id}`);
    socket.to(ROOM_NAME).emit('user-disconnected');
  });

  socket.on('offer', (offer) => {
    console.log('Recebi uma oferta, repassando...');
    socket.to(ROOM_NAME).emit('offer-received', offer);
  });

  socket.on('answer', (answer) => {
    console.log('Recebi uma resposta, repassando...');
    socket.to(ROOM_NAME).emit('answer-received', answer);
  });

  socket.on('ice-candidate', (candidate) => {
    console.log('Recebi um candidato ICE, repassando...');
    socket.to(ROOM_NAME).emit('ice-candidate-received', candidate);
  });

  socket.on('trocar-camera-remoto', () => {
    console.log('Recebi comando de troca de câmera, repassando...');
    socket.to(ROOM_NAME).emit('trocar-camera-remoto');
  });
});

server.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});