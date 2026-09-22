import type { Server, Socket } from 'socket.io';
import { v7 as uuidv7 } from 'uuid';
import redisController from '../redis/controller.js';
import {getRandomInt, parseId} from '../utils/utils.js';
import { SocketEvents } from '../index.js';
import type { GameStateUpdate, Statement } from './gameService.type.js';
import type {Play} from '../redis/controller.type.js';
import type { Card } from '../deck/deck.type.js';
import { parseCard } from '../deck/deck.type.js';
import { timeout } from '../utils/utils.js';
import helpers from './helpers.js';
import logger from '../utils/logger.js';


const gameService = (io: Server, socket: Socket) => {

  const joinRoomInternal = async (roomId: string, userId: string) => {
    const isActive = await redisController.getIsActive(roomId);

    if(isActive) throw new Error('game is already active');

    await redisController.addUserToRoom(roomId, userId);
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

      if (users.length === 0) {
        await redisController.deleteRoom(parsedRoomId);
        return;
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

      const users = await redisController.getUsersInAGame(parsedRoomId);
      if (users.length === 1) throw new Error('Not enough players');



      for(let i = users.length - 1; i >= 0; i--) {
        const cards = await redisController.dealCardsFromDeck(parsedRoomId, 5);
        await redisController.setUserHand(parsedRoomId, cards, i);
      }

      const starterIndex = getRandomInt(users.length);
      const starterId = users[starterIndex].id;

      await redisController.setTurn(parsedRoomId, starterId);
      await redisController.setIsActive(parsedRoomId, true);

      io.to(parsedRoomId).emit(SocketEvents.GAME_STARTS);

      const updatedUsers = await redisController.getUsersInAGame(parsedRoomId);

      //send dealt cards to clients
      for (const user of updatedUsers) {
        const hand = user.hand;
        io.to(user.id).emit(SocketEvents.HAND_UPDATE, hand);
      }

      io.to(parsedRoomId).emit(SocketEvents.TURN_UPDATE, starterId);
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

      await redisController.removeUserFromRoom(parsedRoomId, userIndex);
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
    logger.debug('[gameService] doubt action triggered');
    let parsedRoomId = '';
    let parsedUserId = '';
    try {
      parsedRoomId = parseId(roomId);
      parsedUserId = parseId(userId);
    }catch (e){
      logger.error(e);
      callback('ERR');
      return;
    }
    try{
      try{
        const status = await redisController.getStatus(parsedRoomId);
        logger.child({status: status}).debug('[gameService] doubt');
        if(status !== 'IDLE' && status !== 'WAITING_DOUBT') throw new Error(`Cant doubt. Game status:  ${status}`);
        logger.debug('[gameService] doubt: setting status to \'RESOLVING_DOUBT\'');
        await redisController.setStatus(parsedRoomId, 'RESOLVING_DOUBT');
      }catch(e){
        logger.error(e);
        callback('ERR');
        return;
      }

      const lastPlay = await redisController.getLastPlay(parsedRoomId);
      if (!lastPlay.user) throw new Error('No last play');

      //Send clients notification that someone is doubting
      io.to(parsedRoomId).emit(SocketEvents.DOUBTED, parsedUserId);


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

      //Doubt loser gets playDeck in hand
      const playDeck = await redisController.getPlayDeck(parsedRoomId);
      const users = await redisController.getUsersInAGame(parsedRoomId);
      const loserIndex = helpers.getIndexInUsersArray(loserId, users);
      await redisController.appendUserHand(parsedRoomId, loserIndex, playDeck);

      //clear playdeck, lastPlay and statementHistory
      await redisController.clearPlayDeck(parsedRoomId);
      await redisController.clearLastPlay(parsedRoomId);
      await redisController.clearStatementHistory(parsedRoomId);


      //After a while send handUpdate to loser and send playDeck update and turn update to everyone
      const updatedUsers = await redisController.getUsersInAGame(parsedRoomId);
      const loserHand = updatedUsers.find((u) => u.id === loserId)?.hand;

      if (!loserHand) throw new Error('Cant find loserId in users');


      setTimeout(() => {
        io.to(loserId).emit(SocketEvents.HAND_UPDATE, loserHand);

        const gameStateUpdate: GameStateUpdate = {
          winners: [],
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
          .catch(() => {
            console.error('ERROR');
          });
      }, 5000);

      callback('OK');
    }catch(e) {
      callback('ERROR: ');
      console.log(e);
      return;
    }
    try{
      logger.debug('[gameService] doubt: setting status to \'IDLE\'');
      await redisController.setStatus(parsedRoomId, 'IDLE');
    }catch(e){
      logger.error(e);
    }
  };


  const play = async (
    roomId: string,
    userId: string,
    cards: Array<Card>,
    statement: Statement,
    callback: (result: string) => void,
  ) => {
    let parsedRoomId = '';
    let parsedUserId = '';

    //try parsing
    try {
      logger.debug('[gameService] play');
      parsedRoomId = parseId(roomId);
      parsedUserId = parseId(userId);
    }catch(e) {
      logger.error(e);
      callback('ERR');
      return;
    }
    try{
      if (statement.value === null || statement.amount === null) throw new Error('Invalid statement');
      if (statement.amount !== cards.length) throw new Error('Play and statement don\'t match');

      //If play status is not IDLE, play action can not be resolved
      try {
        const status = await redisController.getStatus(parsedRoomId);
        logger.child({status: status}).debug('[gameService] play');
        if (status !== 'IDLE') throw new Error('Status not IDLE, cant resolve play action');
        logger.debug('[gameService] play: setting status to PLAYING');
        await redisController.setStatus(parsedRoomId, 'PLAYING');
      }catch(e){
        callback('ERR');
        logger.error(e);
        return;
      }

      const parsedCards = cards.map((c) => parseCard(c));

      const play: Play = {
        cards: parsedCards,
        user: parsedUserId,
        statement: statement,
      };

      const gameState = await redisController.getGameState(parsedRoomId);

      //Check it is right player's turn
      const turn = gameState.turn;
      const users = gameState.users;
      const playerIndex = helpers.getIndexInUsersArray(parsedUserId, users);

      if (turn !== parsedUserId) throw new Error('Wrong turn');


      ////Update user hand
      //Remove played cards from user hand array
      const remainingHand = helpers.removeCardsFromCardsArray(parsedCards, users[playerIndex].hand);

      if (gameState.deck.length !== 0) {
        //Get new cards from play deck
        const newCards = await redisController.dealCardsFromDeck(parsedRoomId, play.cards.length);

        //Add new cards to remaining hand
        const newHand = remainingHand.concat(newCards);
        await redisController.setUserHand(parsedRoomId, newHand, playerIndex);
        io.to(parsedUserId).emit(SocketEvents.HAND_UPDATE, newHand);
      } else {

        await redisController.setUserHand(parsedRoomId, remainingHand, playerIndex);
        if (remainingHand.length === 0) {
          await redisController.appendToWinners(parsedRoomId, parsedUserId);
        }
      }


      await redisController.setLastPlay(parsedRoomId, play);
      await redisController.appendPlayDeck(parsedRoomId, parsedCards);


      //Check if there are enough same cards played to clear the deck
      const statementHistory = await redisController.getStatementHistory(parsedRoomId);

      let newStatementHistory: Statement;
      if (statement.value === statementHistory.value) {
        newStatementHistory = {amount: statement.amount + statementHistory.amount, value: statement.value};
      } else {
        newStatementHistory = {amount: statement.amount, value: statement.value};
      }

      await redisController.setStatementHistory(parsedRoomId, newStatementHistory);


      //get game and send to clients
      const updatedGameState = await redisController.getGameState(parsedRoomId);
      const gameStateUpdate = helpers.createGameStateUpdateFromGameState(updatedGameState);

      io.to(parsedRoomId).emit(SocketEvents.GAME_STATE_UPDATE, gameStateUpdate);


      //If played card is stated to be ace or 10, or there are 4 same cards on play, play stops for a while to wait doubts and then the playDeck is cleared
      if (statement.value === 1 || statement.value === 10 || gameStateUpdate.sameCardsInPlay >= 4) {
        await handleClearing(parsedRoomId);
        callback('OK');
        logger.debug('[gameService] play: deck cleared, exiting play function');
        logger.debug('[gameService] play: setting status to IDLE');
        await redisController.setStatus(parsedRoomId, 'IDLE');
        return;
      }

      //If played card is not stated to be ace or 10 play goes on normally

      //Advance turn
      logger.debug('[gameService] play: advancing turn');
      const nextTurn = helpers.getNextTurnId(users, playerIndex, updatedGameState.winners);
      await redisController.setTurn(roomId, nextTurn);
      //Send turn update to clients
      io.to(parsedRoomId).emit(SocketEvents.TURN_UPDATE, nextTurn);
      callback('OK');
    } catch (e) {
      callback('ERR');
      logger.error(e);
    }

    //setting status back to IDLE
    try{
      logger.debug('[gameService] play: Setting status to IDLE');
      await redisController.setStatus(parsedRoomId, 'IDLE');
    }catch(e){
      logger.error(e);
    }
  };

  const handleClearing = async (roomId: string) =>{
    logger.debug('[gameService] deckAboutToClear');

    io.to(roomId).emit(SocketEvents.ABOUT_TO_CLEAR);

    logger.debug('[gameService] deckAboutToClear: setting status to WAITING_DOUBT');
    await redisController.setStatus(roomId, 'WAITING_DOUBT');
    logger.debug('[gameService] deckAboutToClear: starting timeout');
    await timeout(8000);
    logger.debug('[gameService] deckAboutToClear: timeout over');

    const status = await redisController.getStatus(roomId);
    logger.child({status: status}).debug('[gameService] deckAboutToClear');

    //If someone has doubted, the play action is stopped
    if(status === 'WAITING_DOUBT') {
      logger.debug('[gameService] deckAboutToClear: setting status to CLEARING');
      await redisController.setStatus(roomId, 'CLEARING');

      await redisController.clearPlayDeck(roomId);
      await redisController.clearLastPlay(roomId);
      await redisController.clearStatementHistory(roomId);
      const gameState = await redisController.getGameState(roomId);
      const gameStateUpdate = helpers.createGameStateUpdateFromGameState(gameState);
      io.to(roomId).emit(SocketEvents.GAME_STATE_UPDATE, gameStateUpdate);
      if (gameState.turn in gameState.winners) {
        const turnIndex = helpers.getIndexInUsersArray(gameState.turn, gameState.users);
        const nextTurn = helpers.getNextTurnId(gameState.users, turnIndex, gameState.winners);
        await redisController.setTurn(roomId, nextTurn);
        io.to(roomId).emit(SocketEvents.TURN_UPDATE, nextTurn);
      }
    }
  };

  socket.on(SocketEvents.CREATE_ROOM, createRoom);
  socket.on(SocketEvents.JOIN_ROOM, joinRoom);
  socket.on(SocketEvents.START_GAME, startGame);
  socket.on(SocketEvents.LEAVE_ROOM, leaveRoom);
  socket.on(SocketEvents.PLAY, play);
  socket.on(SocketEvents.DOUBT, doubt);
};

export default gameService;
