import type { Server, Socket } from 'socket.io';
import { v7 as uuidv7 } from 'uuid';
import redisController from '../redis/controller.js';
import {getRandomInt, parseId} from '../utils/utils.js';
import { SocketEvents } from '../index.js';
import type {GameStateUpdate, Statement} from './gameService.type.js';
import {  parseStatement } from './gameService.type.js';
import type {Play, User} from '../redis/controller.type.js';
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
      return;
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
      return;
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


  const handleDoubt = async (
    roomId: string,
    userId: string,
    callback: (result: string) => void,
  ) => {
    logger.debug('[gameService] doubt action triggered');
    let parsedRoomId = '';
    let parsedUserId = '';
    try {
      //Parse IDs and check if status is IDLE or WAITING_DOUBT
      parsedRoomId = parseId(roomId);
      parsedUserId = parseId(userId);
      const status = await redisController.getStatus(parsedRoomId);
      logger.child({status: status}).debug('[gameService] doubt');
      if(status !== 'IDLE' && status !== 'WAITING_DOUBT') throw new Error(`Cant doubt. Game status:  ${status}`);
      logger.debug('[gameService] doubt: setting status to \'RESOLVING_DOUBT\'');
      await redisController.setStatus(parsedRoomId, 'RESOLVING_DOUBT');


      const lastPlay = await redisController.getLastPlay(parsedRoomId);
      if (!lastPlay.user) throw new Error('No last play');

      //Send clients a notification that someone is doubting
      io.to(parsedRoomId).emit(SocketEvents.DOUBTED, parsedUserId);


      //Wait a while and send doubt results
      await timeout(2000);
      io.to(parsedRoomId).emit(SocketEvents.DOUBT_RESULT, lastPlay.cards);

      let loserId = '';
      let winnerId = '';

      //Check if last play matches the statement
      const lastStatementIsTrue = lastPlay.cards.every(card => card.value === lastPlay.statement.value);

      //set loserId and nextTurn based on doubt results
      if (lastStatementIsTrue) {
        loserId = parsedUserId;
        winnerId = lastPlay.user;
      } else {
        loserId = lastPlay.user;
        winnerId = parsedUserId;
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
      await timeout(5000);
      io.to(loserId).emit(SocketEvents.HAND_UPDATE, loserHand);


      const winners = await redisController.getWinners(parsedRoomId);

      //Check if player who played last play wins the game
      const nextTurnIndex = helpers.getIndexInUsersArray(winnerId, users);
      if(lastStatementIsTrue || users[nextTurnIndex].hand.length === 0 ){
        await redisController.appendToWinners(parsedRoomId, winnerId);
        winners.push(winnerId);
        await advanceTurn(users, winnerId, winners, parsedRoomId);
      }

      const gameStateUpdate: GameStateUpdate = {
        winners: winners,
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

      await redisController.setTurn(parsedRoomId, winnerId);
      io.to(parsedRoomId).emit(SocketEvents.TURN_UPDATE, winnerId);

      callback('OK');
    }catch(e) {
      callback('ERROR: ');
      console.log(e);
      return;
    }finally {
      try{
        logger.debug('[gameService] doubt: setting status to \'IDLE\'');
        await redisController.setStatus(parsedRoomId, 'IDLE');
      }catch(e){
        logger.error(e);
      }
    }
  };

  const handlePlay = async (
    roomId: string,
    userId: string,
    cards: Array<Card>,
    statement: Statement,
    callback: (result: string) => void,
  ) => {
    let parsedRoomId = '';
    let parsedUserId = '';

    //try parsing roomId and userId and check if the game status is IDLE
    try {
      logger.debug('[gameService] play');
      parsedRoomId = parseId(roomId);
      parsedUserId = parseId(userId);
      const status = await redisController.getStatus(parsedRoomId);
      logger.child({status: status}).debug('[gameService] play');
      if (status !== 'IDLE') throw new Error('Status not IDLE, cant resolve play action');
      logger.debug('[gameService] play: setting status to PLAYING');
      await redisController.setStatus(parsedRoomId, 'PLAYING');

      const parsedCards = cards.map((c) => parseCard(c));
      const parsedStatement = parseStatement(statement);

      const play: Play = {
        cards: parsedCards,
        user: parsedUserId,
        statement: parsedStatement,
      };

      const gameState = await redisController.getGameState(parsedRoomId);

      //Check it is right player's turn
      const turn = gameState.turn;
      const users = gameState.users;
      const playerIndex = helpers.getIndexInUsersArray(parsedUserId, users);

      if (turn !== parsedUserId) throw new Error('Wrong turn');


      //Update user hand
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
        //If the deck is empty, check for any players with empty hand
        await updateWinners(parsedRoomId, play, gameState.winners, users);
        await redisController.setUserHand(parsedRoomId, remainingHand, playerIndex);
      }

      await redisController.setLastPlay(parsedRoomId, play);
      await redisController.appendPlayDeck(parsedRoomId, parsedCards);


      //Update statementHistory
      const statementHistory = await redisController.getStatementHistory(parsedRoomId);
      let newStatementHistory: Statement;
      if (parsedStatement.value === statementHistory.value) {
        newStatementHistory = {amount: parsedStatement.amount + statementHistory.amount, value: parsedStatement.value};
      } else {
        newStatementHistory = {amount: parsedStatement.amount, value: parsedStatement.value};
      }
      await redisController.setStatementHistory(parsedRoomId, newStatementHistory);


      //get game and send to clients
      const updatedGameState = await redisController.getGameState(parsedRoomId);
      const gameStateUpdate = helpers.createGameStateUpdateFromGameState(updatedGameState);
      io.to(parsedRoomId).emit(SocketEvents.GAME_STATE_UPDATE, gameStateUpdate);


      //If played card is stated to be ace or 10, or there are >=4 same cards on play, deck clearing is triggered. If card value is 2, the clearing is not triggered
      if (parsedStatement.value === 1 || parsedStatement.value === 10 || (gameStateUpdate.sameCardsInPlay >= 4 && newStatementHistory.value !== 2)) {
        callback('OK');
        await handleClearing(parsedRoomId);
        return;
        return;
      }
      //If played card is not stated to be ace or 10 play goes on normally

      //Advance turn
      logger.debug('[gameService] play: advancing turn');
      await advanceTurn(users, updatedGameState.turn, updatedGameState.winners, parsedRoomId);

      callback('OK');
    } catch (e) {
      callback('ERR');
      logger.error(e);
    }finally {
      //setting status back to IDLE
      try{
        logger.debug('[gameService] play: Setting status to IDLE');
        await redisController.setStatus(parsedRoomId, 'IDLE');
      }catch(e){
        logger.error(e);
      }
    }
  };

  /**
   * Advances turn in redis and sends turn update to clients
   * @param users
   * @param playerId
   * @param winners
   * @param roomId
   */
  const advanceTurn = async (users: Array<User>, playerId: string, winners: Array<string>, roomId: string ) =>{
    if(users.length-1 === winners.length) {
      logger.debug('GAME ENDS');
    }
    const nextTurn = helpers.getNextTurnId(users, playerId, winners);
    await redisController.setTurn(roomId, nextTurn);
    //Send turn update to clients
    io.to(roomId).emit(SocketEvents.TURN_UPDATE, nextTurn);
  };


  const handleClearing = async (roomId: string) =>{
    logger.debug('[gameService] deckAboutToClear');

    //Send notification to clients that the deck is about to be cleared
    io.to(roomId).emit(SocketEvents.ABOUT_TO_CLEAR);

    //Set game status to 'WAITING_DOUBT' and wait for 8 seconds for players to doubt
    logger.debug('[gameService] deckAboutToClear: setting status to WAITING_DOUBT');
    await redisController.setStatus(roomId, 'WAITING_DOUBT');
    logger.debug('[gameService] deckAboutToClear: starting timeout');
    await timeout(8000);
    logger.debug('[gameService] deckAboutToClear: timeout over');

    //Check if anyone has doubted while waiting
    const status = await redisController.getStatus(roomId);
    logger.child({status: status}).debug('[gameService] deckAboutToClear');

    //If no one doubted clearing goes on normally.
    if(status === 'WAITING_DOUBT') {
      logger.debug('[gameService] deckAboutToClear: setting status to CLEARING');
      await redisController.setStatus(roomId, 'CLEARING');
      await redisController.clearPlayDeck(roomId);
      await redisController.clearLastPlay(roomId);
      await redisController.clearStatementHistory(roomId);

      //get game and send to clients
      const updatedGameState = await redisController.getGameState(roomId);
      const gameStateUpdate = helpers.createGameStateUpdateFromGameState(updatedGameState);
      io.to(roomId).emit(SocketEvents.GAME_STATE_UPDATE, gameStateUpdate);
    }
  };

  const updateWinners = async (roomId: string, lastPlay: Play, winners: Array<string>, users: Array<User> ) => {
    logger.debug('[gameService] updateWinners');
    //Check if any new user's hand is empy and someone has played after that user
    for(const user of users){
      logger.child({winnersIncludeUser: !winners.includes(user.id), userHandLength: user.hand.length, lastPlayer: lastPlay.user!==user.id}).debug('[gameService] updateWinners');
      if(!winners.includes(user.id) && user.hand.length === 0 && lastPlay.user !== user.id) {
        logger.debug(`[gameSevice] appending user ${user.id} to winners` );
        await redisController.appendToWinners(roomId, user.id);
      }
    }
  };



  socket.on(SocketEvents.CREATE_ROOM, createRoom);
  socket.on(SocketEvents.JOIN_ROOM, joinRoom);
  socket.on(SocketEvents.START_GAME, startGame);
  socket.on(SocketEvents.LEAVE_ROOM, leaveRoom);
  socket.on(SocketEvents.PLAY, handlePlay);
  socket.on(SocketEvents.DOUBT, handleDoubt);
};

export default gameService;
