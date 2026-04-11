import { Socket } from 'socket.io';
import { SocketEvents } from '../../index.js';

export const socketLogger = (socket: Socket, next: (err?: Error) => void) => {

  const timeStamp= new Date().toISOString();
  console.log(`\n[${timeStamp}]:`);
  console.log(`New socket connected: ${socket.id}`);

  
  socket.onAny(() => {
    const timeStamp= new Date().toISOString();
    console.log(
      `\n[${timeStamp}]:`
    );
  });

  socket.on(SocketEvents.CREATE_ROOM, (userId) => {
    console.log('CREATE_ROOM event received');
    console.log(`userId: ${userId}\n`);
  });

  socket.on(SocketEvents.JOIN_ROOM, (roomId, userId) => {
    console.log('JOIN_ROOM event received');
    console.log(`roomId: ${roomId}\nuserId: ${userId}\n`);
  });

  socket.on(SocketEvents.START_GAME, (roomId) => {
    console.log('START_GAME event received');
    console.log(`roomId: ${roomId}\n`);
  });

  socket.on(SocketEvents.LEAVE_ROOM, (roomId, userId) => {
    console.log('LEAVE_ROOM event received');
    console.log(`roomId: ${roomId}\nuserId: ${userId}\n`);
  });

  socket.on(SocketEvents.DOUBT, (userId) => {
    console.log('DOUBT event received');
    console.log(`userId: ${userId}\n`);
  });

  socket.on(SocketEvents.PLAY, (userId) => {
    console.log('PLAY event received');
    console.log(`userId: ${userId}\n`);
  });


  socket.on('disconnect', () => {
    const timeStamp= new Date().toISOString();
    console.log(`\n[${timeStamp}]`);
    console.log(`Socket disconnected: ${socket.id}`);
  });

  next();
};