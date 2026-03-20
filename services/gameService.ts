import { Server, Socket } from 'socket.io';
import { v7 as uuidv7 } from 'uuid';
import redisController from '../redis/controller.js';
import { parseId } from '../utils/typeGuards.js';

//import { gameStateUpdate } from './gameHandlers.type.js';

const gameService = (io: Server, socket: Socket) => {

  const ping = () => {
    console.log('User ', socket.id, 'pinged')
  }


  const joinGame = async (gameId: string, userId: string, callback: (result: string) => void) => {
    try{
      const parsedGameId = parseId(gameId);
      const parsedUserId = parseId(userId);

      await redisController.addUserToGame(parsedGameId, parsedUserId)

      await socket.join(parsedGameId);
      console.log(socket.rooms);  

      const users = await redisController.getUsersInAGame(parsedGameId);
      
      if(users === null) throw new Error('Users not found');

      const userIds = users.map((user)=>user.id);
      callback('OK');

      io.to(gameId).emit('userJoinedGame', userIds)

    }catch(e){
      console.log('ERROR: ', e);
      callback('ERR');
    }
  }   
  
  const createGame = async (userId: string, callback: (id: string) => void) => {
    const gameId = uuidv7();
    await socket.join(gameId);
    await redisController.createGame(gameId, userId)
    callback(gameId)
  }

  const startGame = async (gameId: string, callback: (result:string) => void) => {
    io.to(gameId).emit('gameUpdate');
    io.to(gameId).emit('gameStarts');
    try{
      await redisController.dealInitialCards(gameId);
      
      const users = await redisController.getUsersInAGame(gameId);
      if(!users) throw new Error('no users found');

      for(const user of users){ 
        io.to(user.id).emit('handUpdate', user.hand[0])
      }
    }catch(e){
      console.log('ERROR: ', e)
    }
    callback('OK')
  }

  const leaveGame = async (gameId: string, userId: string ) => {
    await redisController.removeUserFromGame(gameId, userId);
  }

  const doubt = (callback: (result: string) => void) => {
    callback('OK')
  }

  const play = (callback: (result: string) => void) => {
    callback('OK')
  }

  socket.on('ping', ping);
  socket.on('createGame', createGame);
  socket.on('joinGame', joinGame);
  socket.on('startGame', startGame);
  socket.on('leaveGame', leaveGame);
  socket.on('play', play);
  socket.on('doubt', doubt);
}

export default gameService