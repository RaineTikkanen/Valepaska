import { Socket } from 'socket.io';
import { ClientToServerEvents } from '../../index.js';
import { SocketEvents } from '../../index.js';

export const socketLogger = (socket: Socket, next: (err?: Error) => void) => {

  const timeStamp= new Date().toISOString();
  console.log(`\n[${timeStamp}] Socket connected: ${socket.id}`);

  
  socket.onAny((event: ClientToServerEvents) => {
    const timeStamp= new Date().toISOString();
    console.log(
      `\n[${timeStamp}] event: ${event}\nSocket: ${socket.id}`
    );
  });

  socket.on(SocketEvents.CREATE_ROOM, (userId) => {
    console.log(`userId: ${userId}\n`);
  });

  socket.on(SocketEvents.JOIN_ROOM, (roomId, userId) => {
    console.log(`roomId: ${roomId}\nuserId: ${userId}\n`);
  });

  socket.on(SocketEvents.START_GAME, (roomId) => {
    console.log(`roomId: ${roomId}\n`);
  });

  socket.on(SocketEvents.LEAVE_ROOM, (roomId, userId) => {
    console.log(`roomId: ${roomId}\nuserId: ${userId}\n`);
  });

  socket.on(SocketEvents.DOUBT, (userId) => {
    console.log(`userId: ${userId}\n`);
  });

  socket.on(SocketEvents.PLAY, (userId) => {
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