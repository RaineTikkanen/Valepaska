import type { Server, Socket } from 'socket.io';
import { v7 as uuidv7 } from 'uuid';
import redisController from '../redis/controller.js';
import { parseCard, parseId } from '../utils/utils.js';
import { SocketEvents } from '../index.js';
import type { GameStateUpdate, Statement } from './gameService.type.js';
import type { Play } from '../redis/controller.type.js';
import type { Card } from '../deck/deck.type.js';
import { timeout } from '../utils/utils.js';
import helpers from './helpers.js';


const gameService = (io: Server, socket: Socket) => {
  let stopPlayAction = false;


  const joinRoomInternal = async (roomId: string, userId: string) => {
    const isActive = await redisController.getIsActive(roomId);

    if(isActive) throw new Error('game is already active');

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
      console.error('ERROR: ', e);
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
      console.error('ERROR: ', e);
      callback('ERR');
    }
    callback('OK');
  };

  const roomUpdate = async (roomId: string) => {
    try{
      const parsedRoomId = parseId(roomId);
      const users = await redisController.getUsersInAGame(parsedRoomId);
      if (users === null) throw new Error('Users not found');

      if (users.length === 0) {
        await redisController.deleteRoom(parsedRoomId);
      }

      const userIds = users.map((user) => user.id);
      io.to(parsedRoomId).emit(SocketEvents.ROOM_UPDATE, parsedRoomId, userIds);
    }catch(e){
      console.error('ERROR: ', e);
    }
  };

  const startGame = async (
    roomId: string,
    callback: (result: string) => void,
  ) => {
    try {
      const parsedRoomId = parseId(roomId);

      //initiate game. function returns starting user's id
      const turn = await redisController.initiateGame(parsedRoomId);

      const users = await redisController.getUsersInAGame(parsedRoomId);
      if (!users) throw new Error('No users found');
      if (users.length === 1) throw new Error('Not enough players');

      io.to(parsedRoomId).emit(SocketEvents.GAME_STARTS);

      //send dealt cards to clients
      for (const user of users) {
        const hand = user.hand;
        console.log('HAND: ', hand);
        io.to(user.id).emit(SocketEvents.HAND_UPDATE, hand);
      }

      io.to(parsedRoomId).emit(SocketEvents.TURN_UPDATE, turn);
    } catch (e) {
      console.error('ERROR: ', e);
      callback('ERR');
    }
    callback('OK');
  };

  const leaveRoom = async (
    roomId: string,
    userId: string,
    callback: (result: string) => void,
  ) => {
    try {
      const parsedRoomId = parseId(roomId);
      const parsedUserId = parseId(userId);

      const users = await redisController.getUsersInAGame(parsedRoomId);
      const userIndex = helpers.getIndexInUsersArray(parsedUserId, users);

      await redisController.removeUserFromGame(parsedRoomId, userIndex);
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

    const parsedRoomId = parseId(roomId);
    const parsedUserId = parseId(userId);

    //Send clients notification that someone is doubting
    io.to(parsedRoomId).emit(SocketEvents.DOUBTED, parsedUserId);

    const lastPlay = await redisController.getLastPlay(parsedRoomId);

    //Wait a while and send doubt results
    setTimeout(() => {
      io.to(parsedRoomId).emit(SocketEvents.DOUBT_RESULT, lastPlay.cards);
    }, 2000);

    let loserId = '';
    let nextTurn = '';

    //set loserId and nextTurn based on doubt results
    const lastStatementIsTrue = lastPlay.cards.every(card => card.value === lastPlay.statement.value);

    if (lastStatementIsTrue) {
      loserId = parsedUserId;
      nextTurn = lastPlay.user;
    } else {
      loserId = lastPlay.user;
      nextTurn = parsedUserId;
    }

    //Doubt loser gets playdeck in hand
    await redisController.playDeckToUser(parsedRoomId, loserId);
    await redisController.clearPlayDeck(parsedRoomId);

    //After a while send handUpdate to loser and send playdeck update and turn update to everyone
    const updatedUsers = await redisController.getUsersInAGame(parsedRoomId);
    const loserHand = updatedUsers.find((u)=> u.id === loserId)?.hand;

    if(!loserHand) throw new Error('Cant find loserId in users');


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
      io.to(parsedRoomId).emit(SocketEvents.GAME_STATE_UPDATE, gameStateUpdate);


      redisController
        .setTurn(parsedRoomId, nextTurn)
        .then(() => {
          io.to(parsedRoomId).emit(SocketEvents.TURN_UPDATE, nextTurn);
        })
        .catch(()=>{
          console.error('ERROR');
        });

    }, 5000);

    await redisController.clearLastPlay(parsedRoomId);

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
      callback('ERR'); 
      return;
    }

    try {
      const parsedRoomId = parseId(roomId);
      const parsedUserId = parseId(userId);

      const parsedCards = cards.map((c) => parseCard(c));

      const play: Play = {
        cards: parsedCards,
        user: parsedUserId,
        statement: statement,
      };

    
      //Check it is right player's turn
      const turn = await redisController.getTurn(parsedRoomId);
      const users = await redisController.getUsersInAGame(parsedRoomId);
      const turnIndex = helpers.getIndexInUsersArray(turn, users);

      if(turn !== play.user) throw new Error('Wrong turn');

      ////Update user hand

      //Remove played cards from user hand array
      const remainingHand = helpers.removeCardsFromCardsArray(parsedCards, users[turnIndex].hand);

      //Get new cards from play deck
      const newCards: Array<Card>=[];
      for(let i=0; i < play.cards.length; i++){
        const card = await redisController.popCardFromDeck(parsedRoomId);
        if (!card) break;
        newCards.push(card);
      }

      //Add new cards to remaining hand
      const newHand = remainingHand.concat(newCards);
      await redisController.setUserHand(parsedRoomId, newHand, turnIndex);
      io.to(parsedUserId).emit(SocketEvents.HAND_UPDATE, newHand);

      await redisController.setLastPlay(parsedRoomId, play);
      await redisController.appendPlayDeck(parsedRoomId, parsedCards);
  

      //Check if there are enough same cards played to clear the deck
      const statementHistory= await redisController.getStatementHistory(parsedRoomId);

      let newStatementHistory: Statement;
      if(statement.value===statementHistory.value){
        newStatementHistory={amount: statement.amount+statementHistory.amount, value: statement.value};
      }else{
        newStatementHistory={amount: statement.amount, value: statement.value};
      }

      await redisController.setStatementHistory(parsedRoomId, newStatementHistory);
    

      //get game and send to clients
      const gameState = await redisController.getGameState(parsedRoomId);
      const gameStateUpdate = helpers.createGameStateUpdateFromGameState(gameState);

      io.to(parsedRoomId).emit(SocketEvents.GAME_STATE_UPDATE, gameStateUpdate);



      //If played card is stated to be ace or 10, or there are 4 same cards on play, play stops for a while to wait doubts and then the playDeck is cleared
      if (statement.value === 1 || statement.value === 10 || gameStateUpdate.sameCardsInPlay>=4) {
        await deckAboutToClear(parsedRoomId);
        callback('OK');
        return;  
      }
      
      //If played card is not stated to be ace or 10 play goes on normally
      
      //Advance turn
      const nextTurn = helpers.getNextTurnId(users, turnIndex);
      await redisController.setTurn(roomId, nextTurn);
      //Send turn update to clients
      io.to(parsedRoomId).emit(SocketEvents.TURN_UPDATE, nextTurn);
    
      callback('OK');
      stopPlayAction=false;
    }catch(e){
      callback('ERR');
      console.error('Error in play action: ',e);
    }
  };

  const deckAboutToClear = async (roomId: string) =>{
    io.to(roomId).emit(SocketEvents.ABOUT_TO_CLEAR);
    await timeout(8000);


    //If someone has doubted the play action is stopped
    if(stopPlayAction){
      stopPlayAction=false;
      return;
    }
      
    await redisController.clearPlayDeck(roomId);
    await redisController.clearLastPlay(roomId);
    const gameState = await redisController.getGameState(roomId);
    const gameStateUpdate = helpers.createGameStateUpdateFromGameState(gameState);
    io.to(roomId).emit(SocketEvents.GAME_STATE_UPDATE, gameStateUpdate);
    return;  
  };

  socket.on(SocketEvents.CREATE_ROOM, createRoom);
  socket.on(SocketEvents.JOIN_ROOM, joinRoom);
  socket.on(SocketEvents.START_GAME, startGame);
  socket.on(SocketEvents.LEAVE_ROOM, leaveRoom);
  socket.on(SocketEvents.PLAY, play);
  socket.on(SocketEvents.DOUBT, doubt);
};

export default gameService;
