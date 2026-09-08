import { Server, Socket } from 'socket.io';
import { v7 as uuidv7 } from 'uuid';
import redisController from '../redis/controller.js';
import { parseId } from '../utils/utils.js';
import { SocketEvents } from '../index.js';
import { Statement } from './gameService.type.js';
import { Play } from '../redis/controller.type.js';
import { Card } from '../deck/deck.type.js';

const gameService = (io: Server, socket: Socket) => {

  const ping = () => {
    console.log('User ', socket.id, 'pinged')
  }

  const joinRoomInternal = async (roomId: string, userId: string) =>{
    await redisController.addUserToGame(roomId, userId)
    await socket.join(roomId);
    await socket.join(userId)
    await roomUpdate(roomId);
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
      await redisController.deleteRoom(roomId)
    }

    const userIds = users.map((user)=>user.id);
    io.to(roomId).emit(SocketEvents.ROOM_UPDATE, roomId, userIds);
  }

  const startGame = async (roomId: string, callback: (result:string) => void) => {
    console.group()
    console.log('START GAME')
    try{
      const parsedRoomId=parseId(roomId)
      
      await redisController.initiateGame(parsedRoomId);
      
      const users = await redisController.getUsersInAGame(parsedRoomId);
      if(!users) throw new Error('No users found');
      if(users.length===1) throw new Error('Not enough players')
      
      io.to(parsedRoomId).emit(SocketEvents.GAME_STARTS);

      for(const user of users){ 
        const hand = user.hand;
        io.to(user.id).emit(SocketEvents.HAND_UPDATE, hand)
      }

      const gameStateUpdate = await redisController.getGameStateUpdate(parsedRoomId);
      if(!gameStateUpdate)throw new Error('Cant get game state')
      io.to(parsedRoomId).emit(SocketEvents.GAME_STATE_UPDATE, gameStateUpdate);

    }catch(e){
      console.error('ERROR: ', e)
      callback('ERR')
    }
    callback('OK')
    console.groupEnd()
  }


  const leaveRoom = async (roomId: string, userId: string, callback:(result: string) => void ) => {
    try{
      const parsedRoomId = parseId(roomId);
      const parsedUserId = parseId(userId);

      await redisController.removeUserFromGame(parsedRoomId, parsedUserId);
      await socket.leave(parsedRoomId);
      await socket.leave(parsedUserId);

      callback('OK');
      await roomUpdate(parsedRoomId);
    }catch(e) {
      console.error('ERROR: ', e);
      callback('ERR');
    }
  }

  const doubt = (callback: (result: string) => void) => {
    callback('OK')
  }

  const play = async (roomId: string, userId: string, cards: Card[], statement: Statement, callback: (result: string) => void) => {
    console.group()
    console.log('PLAY')

    try{
      const parsedRoomId = parseId(roomId);
      const parsedUserId = parseId(userId);

      const play: Play = {
        cards: cards,
        user: parsedUserId,
        statement: statement,
      };

      await redisController.play(parsedRoomId, play);

      const userHand = await redisController.getUserHand(roomId, userId);
      io.to(userId).emit(SocketEvents.HAND_UPDATE, userHand)

      const gameStateUpdate = await redisController.getGameStateUpdate(roomId);

      if(!gameStateUpdate)throw new Error('Error updating game state')
      io.to(parsedRoomId).emit(SocketEvents.GAME_STATE_UPDATE, gameStateUpdate);
      callback('OK')
    }catch(e){
      console.log('ERROR: ', e)
    }
    console.groupEnd()
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