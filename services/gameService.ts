import { Server, Socket } from 'socket.io';
import { v7 as uuidv7 } from 'uuid';
import redisController from '../redis/controller.js';
import { parseId } from '../utils/typeGuards.js';
import { SocketEvents } from '../index.js';

const gameService = (io: Server, socket: Socket) => {

  const ping = () => {
    console.log('User ', socket.id, 'pinged')
  }

  const joinRoomInternal = async (roomId: string, userId: string) =>{
    await redisController.addUserToGame(roomId, userId)
    await socket.join(roomId);
    await socket.join(userId)
    roomUpdate(roomId);
  }


  const joinRoom = async (roomId: string, userId: string, callback: (result: string) => void) => {
    try{
      const parsedRoomId = parseId(roomId);
      const parsedUserId = parseId(userId);

      await joinRoomInternal(parsedRoomId, parsedUserId)

      callback('OK');
    }catch(e){
      console.log('ERROR: ', e);
      callback('ERR');
    }
  }   
  
  const createRoom = async (userId: string, callback: (result: string) => void) => {
    const gameId = uuidv7();
    try{
      const parsedUserId = parseId(userId);
      await redisController.createRoom(gameId)

      await joinRoomInternal(gameId, parsedUserId)

    }catch(e){
      console.log('ERROR: ', e);
      callback('ERR');
    }
    callback('OK');
  }

  const roomUpdate = async (roomId: string) => {
    const users = await redisController.getUsersInAGame(roomId);
    if(users === null) throw new Error('Users not found');

    if(users.length===0){
      redisController.deleteRoom(roomId)
    }

    const userIds = users.map((user)=>user.id);
    io.to(roomId).emit('roomUpdate', roomId, userIds);
  }

  const startGame = async (roomId: string, callback: (result:string) => void) => {
    try{
      const parsedRoomId=parseId(roomId)
      io.to(parsedRoomId).emit('gameUpdate');
      io.to(parsedRoomId).emit('gameStarts');
      
      await redisController.dealInitialCards(parsedRoomId);
      
      const users = await redisController.getUsersInAGame(parsedRoomId);
      if(!users) throw new Error('no users found');

      for(const user of users){ 
        const hand = user.hand[0];
        console.log(hand)
        io.to(user.id).emit('handUpdate', user.hand[0])
      }
    }catch(e){
      console.error('ERROR: ', e)
      callback('ERR')
    }
    callback('OK')
  }

  const leaveRoom = async (roomId: string, userId: string, callback:(result: string) => void ) => {
    try{
      const parsedRoomId=parseId(roomId);
      const parsedUserId=parseId(userId);
      await redisController.removeUserFromGame(parsedRoomId, parsedUserId);
      callback('OK');
      roomUpdate(parsedRoomId);
      socket.leave(parsedRoomId);
      socket.leave(parsedUserId)
    }catch(e) {
      console.error('ERROR: ', e) ;
      callback('ERR');
    }
    
  }

  const doubt = (callback: (result: string) => void) => {
    callback('OK')
  }

  const play = (callback: (result: string) => void) => {
    callback('OK')
  }

  socket.on(SocketEvents.PING, ping);
  socket.on(SocketEvents.CREATE_ROOM, createRoom);
  socket.on(SocketEvents.JOIN_ROOM, joinRoom);
  socket.on(SocketEvents.START_GAME, startGame);
  socket.on(SocketEvents.LEAVE_ROOM, leaveRoom);
  socket.on(SocketEvents.PLAY, play);
  socket.on(SocketEvents.DOUBT, doubt);
}

export default gameService