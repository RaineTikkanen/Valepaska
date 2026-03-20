import { Socket } from 'socket.io';
import { ClientToServerEvents } from '../../index.js';

export const socketLogger = (socket: Socket, next: (err?: Error) => void) => {

  const timeStamp= new Date().toISOString();
  console.log(`\n[${timeStamp}] Socket connected: ${socket.id}`);

  
  socket.onAny((event: ClientToServerEvents) => {
    const timeStamp= new Date().toISOString();
    console.log(
      `\n[${timeStamp}] event: ${event}\nSocket: ${socket.id}`
    );
  });

  socket.on('createGame', (userId) => {
    console.log(`userId: ${userId}\n`);
  });

  socket.on('joinGame', (gameId, userId) => {
    console.log(`gameId: ${gameId}\nuserId: ${userId}\n`);
  });

  socket.on('startGame', (gameId) => {
    console.log(`gameId: ${gameId}\n`);
  });

  socket.on('leaveGame', (gameId, userId) => {
    console.log(`gameId: ${gameId}\nuserId: ${userId}\n`);
  });

  socket.on('doubt', (userId) => {
    console.log(`userId: ${userId}\n`);
  });

  socket.on('play', (userId) => {
    console.log(`userId: ${userId}\n`);
  });


  socket.on('disconnect', () => {
    const timeStamp= new Date().toISOString();
    console.log(`\n[${timeStamp}] Socket disconnected: ${socket.id}`);
  });

  socket.on('connect_error', (err) => {
    const timeStamp= new Date().toISOString();
    console.log(`\n[${timeStamp}] Connection error on socket ${socket.id}: ${err.message}`);
  });
  

  next();
};