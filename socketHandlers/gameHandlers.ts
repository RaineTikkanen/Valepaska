import { Server, Socket } from 'socket.io';
import { v7 as uuidv7 } from 'uuid';
import redisController from '../redis/controller.js';
import { gameStateUpdate } from './gameHandlers.type.js';

const gameHandlers = (io: Server, socket: Socket) => {

  const ping = () => {
    console.log('User ', socket.id, 'pinged')
  }


  const joinGame = async (gameId: string, userId: string, callback: (result: string) => void) => {
    try{
      await redisController.addUserToGame(gameId, userId)

      socket.join(gameId);
      console.log(socket.rooms);

      const users = await redisController.getUsersInAGame(gameId)
      console.log('users on game ', gameId,':', users);
      if(users === null) throw 'error';

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
    socket.join(gameId);
    await redisController.createGame(gameId, userId)
    callback(gameId)
  }

  const startGame = async (callback: (result:string) => void) => {
    const [_a, room, ..._c] = socket.rooms
    io.to(room).emit('gameUpdate')
    io.to(room).emit('gameStarts')
    try{
      await redisController.dealInitialCards(room);
      
      const users = await redisController.getUsersInAGame(room);
      if(!users) throw('no users found')

      for(const user of users){ 
        io.to(user.id).emit('handUpdate', user.hand[0])
        console.log(user.hand)
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

  socket.on('ping', ping)
  socket.on('createGame', createGame)
  socket.on('joinGame', joinGame)
  socket.on('startGame', startGame)
  socket.on('leaveGame', leaveGame)
}

export default gameHandlers