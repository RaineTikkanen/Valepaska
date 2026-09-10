import { Server, Socket } from 'socket.io';
import { v7 as uuidv7 } from 'uuid';
import redisController from '../redis/controller.js';
import { parseId } from '../utils/utils.js';
import { SocketEvents } from '../index.js';
import { GameStateUpdate, Statement } from './gameService.type.js';
import { Play } from '../redis/controller.type.js';
import { Card } from '../deck/deck.type.js';
import { timeout } from '../utils/utils.js';


const gameService = (io: Server, socket: Socket) => {
  let stopPlayAction = false;

  const ping = () => {
    console.log('User ', socket.id, 'pinged');
  };

  const joinRoomInternal = async (roomId: string, userId: string) => {
    await redisController.addUserToGame(roomId, userId);
    await socket.join(roomId);
    await socket.join(userId);
    await roomUpdate(roomId);
  };

  const joinRoom = async (
    roomId: string,
    userId: string,
    callback: (result: string) => void,
  ) => {
    try {
      const parsedRoomId = parseId(roomId);
      const parsedUserId = parseId(userId);

      await joinRoomInternal(parsedRoomId, parsedUserId);

      callback('OK');
    } catch (e) {
      console.log('ERROR: ', e);
      callback('ERR');
    }
  };

  const createRoom = async (
    userId: string,
    callback: (result: string) => void,
  ) => {
    const gameId = uuidv7();
    try {
      const parsedUserId = parseId(userId);
      await redisController.createRoom(gameId);

      await joinRoomInternal(gameId, parsedUserId);
    } catch (e) {
      console.log('ERROR: ', e);
      callback('ERR');
    }
    callback('OK');
  };

  const roomUpdate = async (roomId: string) => {
    const users = await redisController.getUsersInAGame(roomId);
    if (users === null) throw new Error('Users not found');

    if (users.length === 0) {
      await redisController.deleteRoom(roomId);
    }

    const userIds = users.map((user) => user.id);
    io.to(roomId).emit(SocketEvents.ROOM_UPDATE, roomId, userIds);
  };

  const startGame = async (
    roomId: string,
    callback: (result: string) => void,
  ) => {
    console.group();
    console.log('START GAME');
    try {
      const parsedRoomId = parseId(roomId);

      //initiate game. function returns starting user's id
      const turn = await redisController.initiateGame(parsedRoomId);

      const users = await redisController.getUsersInAGame(parsedRoomId);
      if (!users) throw new Error('No users found');
      if (users.length === 1) throw new Error('Not enough players');

      io.to(parsedRoomId).emit(SocketEvents.GAME_STARTS);

      //send delt cards to clients
      for (const user of users) {
        const hand = user.hand;
        console.log(hand)
        io.to(user.id).emit(SocketEvents.HAND_UPDATE, hand);
      }

      io.to(parsedRoomId).emit(SocketEvents.TURN_UPDATE, turn);
    } catch (e) {
      console.error('ERROR: ', e);
      callback('ERR');
    }
    callback('OK');
    console.groupEnd();
  };

  const leaveRoom = async (
    roomId: string,
    userId: string,
    callback: (result: string) => void,
  ) => {
    try {
      const parsedRoomId = parseId(roomId);
      const parsedUserId = parseId(userId);

      await redisController.removeUserFromGame(parsedRoomId, parsedUserId);
      await socket.leave(parsedRoomId);
      await socket.leave(parsedUserId);

      callback('OK');
      await roomUpdate(parsedRoomId);
    } catch (e) {
      console.error('ERROR: ', e);
      callback('ERR');
    }
  };

  const doubt = async (
    roomId: string,
    userId: string,
    callback: (result: string) => void,
  ) => {
    //Cancel possible play action

    stopPlayAction=true;


    //Send clients notification that someone is doubting
    io.to(roomId).emit(SocketEvents.DOUBTED, userId);

    const lastPlay = await redisController.getLastPlay(roomId);

    //Wait a while and send doubt results
    setTimeout(() => {
      io.to(roomId).emit(SocketEvents.DOUBT_RESULT, lastPlay.cards);
    }, 2000);

    let loserId = '';
    let nextTurn = '';

    //set loserId and nextTurn based on doubt results
    const lastStatementIsTrue =
      await redisController.lastStatementIsTrue(roomId);
    if (lastStatementIsTrue) {
      loserId = userId;
      nextTurn = lastPlay.user;
    } else {
      loserId = lastPlay.user;
      nextTurn = userId;
    }

    //Doubt loser gets playdeck in hand
    await redisController.playDeckToUser(roomId, loserId);
    await redisController.clearPlaydeck(roomId);

    //After a while send handUpdate to loser and send playdeck update and turn update to everyone
    const loserHand = await redisController.getUserHand(roomId, loserId);
    setTimeout(() => {
      io.to(loserId).emit(SocketEvents.HAND_UPDATE, loserHand);

      const gameStateUpdate: GameStateUpdate = {
        lastPlay: {
          user: '',
          statement: {
            value: 0,
            amount: 0,
          },
        },
        amountOfCardsInPlay: 0,
        sameCardsInPlay: 0
      };
      io.to(roomId).emit(SocketEvents.GAME_STATE_UPDATE, gameStateUpdate);

      redisController
        .setTurnIndexByUserId(roomId, nextTurn)
        .then(() => {
          io.to(roomId).emit(SocketEvents.TURN_UPDATE, nextTurn);
        })
        .catch(()=>{
          console.log('ERROR')
        });

    }, 5000);

    await redisController.clearLastPlay(roomId);

    callback('OK');
  };

  const play = async (
    roomId: string,
    userId: string,
    cards: Card[],
    statement: Statement,
    callback: (result: string) => void,
  ) => {
    
    if(statement.value===null || statement.amount===null) {
      callback('ERR') 
      return
    }

    const parsedRoomId = parseId(roomId);
    const parsedUserId = parseId(userId);

    const play: Play = {
      cards: cards,
      user: parsedUserId,
      statement: statement,
    };

    try {
      //Call play action in redis
      await redisController.play(parsedRoomId, play);
    

      //Update user hand
   
      const userHand = await redisController.getUserHand(roomId, userId);
      io.to(userId).emit(SocketEvents.HAND_UPDATE, userHand);
  


      //Check if there are enough same cards played to clear the deck
      const statementHistory= await redisController.getStatementHistory(roomId);
      console.log('Statementhistory: ', statementHistory);

      if(statement.value===statementHistory.value){
        await redisController.setStatementHistory(roomId,{amount: statement.amount+statementHistory.amount, value: statement.value})
      }else{
        await redisController.setStatementHistory(roomId,{amount: statement.amount, value: statement.value})
      }
    

      //get game and send to clients
    
      const gameStateUpdate = await redisController.getGameStateUpdate(roomId);
      io.to(parsedRoomId).emit(SocketEvents.GAME_STATE_UPDATE, gameStateUpdate);



      //If played card is stated to be ace or 10, or there are 4 same cards on play, play stops for a while to wait doubts and then the playDeck is cleared
      if (statement.value === 1 || statement.value === 10 || gameStateUpdate.sameCardsInPlay>=4) {
        await deckAboutToClear(roomId)
        callback('OK');
        return;  
      }
      
      //If played card is not stated to be ace or 10 play goes on normally
  
      //Advance turn
      const turn = await redisController.advanceTurn(roomId);
      //Send turn update to clients
      io.to(parsedRoomId).emit(SocketEvents.TURN_UPDATE, turn);
    
  
      callback('OK');
      stopPlayAction=false;
    }catch(e){
      callback('ERR')
      console.log('Error in play action: ',e)
    }
  };

  const deckAboutToClear = async (roomId: string) =>{
    io.to(roomId).emit(SocketEvents.ABOUT_TO_CLEAR);
    await timeout(8000);


    //If someone has doubted the play action is stopped
    if(stopPlayAction){
      console.log('STOPPING PLAY ACTION')
      stopPlayAction=false
      return
    }
      
    console.log('gameDeck clearing activated')
    await redisController.clearPlaydeck(roomId);
    await redisController.clearLastPlay(roomId);
    const gameStateUpdate = await redisController.getGameStateUpdate(roomId);
    console.log(gameStateUpdate)
    io.to(roomId).emit(SocketEvents.GAME_STATE_UPDATE, gameStateUpdate);
    return;  
  }

  socket.on(SocketEvents.PING, ping);
  socket.on(SocketEvents.CREATE_ROOM, createRoom);
  socket.on(SocketEvents.JOIN_ROOM, joinRoom);
  socket.on(SocketEvents.START_GAME, startGame);
  socket.on(SocketEvents.LEAVE_ROOM, leaveRoom);
  socket.on(SocketEvents.PLAY, play);
  socket.on(SocketEvents.DOUBT, doubt);
};

export default gameService;
