import type { Server, Socket } from 'socket.io';
import { v7 as uuidv7 } from 'uuid';
import redisController from '../redis/controller.js';
import {getRandomInt, parseId} from '../utils/utils.js';
import {
  SocketEvents,
  type ClientToServerEvents,
  type ServerToClientEvents,
  type SocketData,
} from '../index.js';
import type {GameStateUpdate, Statement} from './gameService.type.js';
import { parseStatement } from './gameService.type.js';
import type {GameState, Play, User} from '../redis/controller.type.js';
import type { Card } from '../deck/deck.type.js';
import { parseCard } from '../deck/deck.type.js';
import { timeout } from '../utils/utils.js';
import helpers from './helpers.js';
import logger from '../utils/logger.js';


const gameService = (
  io: Server<
    ClientToServerEvents,
    ServerToClientEvents,
    Record<string, never>,
    SocketData
  >,
  socket: Socket<
    ClientToServerEvents,
    ServerToClientEvents,
    Record<string, never>,
    SocketData
  >,
) => {

  const joinRoomInternal = async (roomId: string, userId: string) => {
    const isActive = await redisController.getIsActive(roomId);

    if(isActive) throw new Error('game is already active');

    await redisController.addUserToRoom(roomId, userId);
    await socket.join(roomId);
    await socket.join(userId);

    socket.data.roomId = roomId;
    socket.data.userId = userId;

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
      const parsedRoomId = roomId;
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
    callback: (result: string) => void,
  ) => {
    try {
      const roomId = socket.data.roomId;

      const users = await redisController.getUsersInAGame(roomId);
      if (users.length === 1) throw new Error('Not enough players');



      for(let i = users.length - 1; i >= 0; i--) {
        const cards = await redisController.dealCardsFromDeck(roomId, 5);
        await redisController.setUserHand(roomId, cards, i);
      }

      const starterIndex = getRandomInt(users.length);
      const starterId = users[starterIndex].id;

      await redisController.setTurn(roomId, starterId);
      await redisController.setIsActive(roomId, true);

      io.to(roomId).emit(SocketEvents.GAME_STARTS);

      const updatedUsers = await redisController.getUsersInAGame(roomId);

      //send dealt cards to clients
      for (const user of updatedUsers) {
        const hand = user.hand;
        io.to(user.id).emit(SocketEvents.HAND_UPDATE, hand);
      }

      io.to(roomId).emit(SocketEvents.TURN_UPDATE, starterId);
    } catch (e) {
      console.error('ERROR: ', e);
      callback('ERR');
      return;
    }
    callback('OK');
  };

  const leaveRoom = async (
    callback: (result: string) => void,
  ) => {
    try {
      const roomId = socket.data.roomId;
      const userId = socket.data.userId;

      const users = await redisController.getUsersInAGame(roomId);
      const userIndex = helpers.getIndexInUsersArray(userId, users);

      await redisController.removeUserFromRoom(roomId, userIndex);
      await socket.leave(roomId);
      await socket.leave(userId);

      callback('OK');
      await roomUpdate(roomId);
    } catch (e) {
      console.error('ERROR: ', e);
      callback('ERR');
    }
  };


  const handleDoubt = async (
    callback: (result: string) => void,
  ) => {
    logger.debug('[gameService] doubt action triggered');
    const roomId = socket.data.roomId;
    const userId = socket.data.userId;
    try {
      const status = await redisController.getStatus(roomId);
      logger.child({status: status}).debug('[gameService] doubt');
      if(status !== 'IDLE' && status !== 'WAITING_DOUBT') throw new Error(`Cant doubt. Game status:  ${status}`);
      logger.debug('[gameService] doubt: setting status to \'RESOLVING_DOUBT\'');
      await redisController.setStatus(roomId, 'RESOLVING_DOUBT');


      const lastPlay = await redisController.getLastPlay(roomId);
      if (!lastPlay.user) throw new Error('No last play');

      //Send clients a notification that someone is doubting
      io.to(roomId).emit(SocketEvents.DOUBTED, userId);


      //Wait a while and send doubt results
      await timeout(2000);
      io.to(roomId).emit(SocketEvents.DOUBT_RESULT, lastPlay.cards);
      await timeout(5000);


      let loserId = '';
      let winnerId = '';

      //Check if last play matches the statement
      const lastStatementIsTrue = lastPlay.cards.every(card => card.value === lastPlay.statement.value);

      //set loserId and nextTurn based on doubt results
      if (lastStatementIsTrue) {
        loserId = userId;
        winnerId = lastPlay.user;
      } else {
        loserId = lastPlay.user;
        winnerId = userId;
      }

      //Doubt loser gets playDeck in hand
      const playDeck = await redisController.getPlayDeck(roomId);
      const users = await redisController.getUsersInAGame(roomId);
      const loserIndex = helpers.getIndexInUsersArray(loserId, users);
      await redisController.appendUserHand(roomId, loserIndex, playDeck);

      //clear playdeck, lastPlay and statementHistory
      await redisController.clearPlayDeck(roomId);
      await redisController.clearLastPlay(roomId);
      await redisController.clearStatementHistory(roomId);


      //After a while send handUpdate to loser and send playDeck update and turn update to everyone
      const updatedUsers = await redisController.getUsersInAGame(roomId);
      const loserHand = updatedUsers.find((u) => u.id === loserId)?.hand;
      if (!loserHand) throw new Error('Cant find loserId in users');
      io.to(loserId).emit(SocketEvents.HAND_UPDATE, loserHand);


      const winners = await redisController.getWinners(roomId);

      //Check if player who played last play wins the game
      const nextTurnIndex = helpers.getIndexInUsersArray(winnerId, users);
      if(lastStatementIsTrue || users[nextTurnIndex].hand.length === 0 ){
        winners.push(winnerId);
        await redisController.setWinners(roomId, winners);
        await advanceTurn(users, winnerId, winners, roomId);
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
      io.to(roomId).emit(SocketEvents.GAME_STATE_UPDATE, gameStateUpdate);

      await redisController.setTurn(roomId, winnerId);
      io.to(roomId).emit(SocketEvents.TURN_UPDATE, winnerId);

      callback('OK');
    }catch(e) {
      callback('ERROR: ');
      console.log(e);
      return;
    }finally {
      try{
        logger.debug('[gameService] doubt: setting status to \'IDLE\'');
        await redisController.setStatus(roomId, 'IDLE');
      }catch(e){
        logger.error(e);
      }
    }
  };

  const handlePlay = async (
    cards: Array<Card>,
    statement: Statement,
    callback: (result: string) => void,
  ) => {

    const userId=socket.data.userId;
    const roomId=socket.data.roomId;
    try {
      logger.debug('[gameService] play');

      const parsedCards = cards.map((c) => parseCard(c));
      const parsedStatement = parseStatement(statement);

      const gameState = await redisController.getGameState(roomId);

      logger.child({status: gameState.status}).debug('[gameService] play');
      if (gameState.status !== 'IDLE') throw new Error('Status not IDLE, cant resolve play action');
      logger.debug('[gameService] play: setting status to PLAYING');
      await redisController.setStatus(roomId, 'PLAYING');

      let newWinners = gameState.winners;
      let newDeck = gameState.deck;
      const newPlayDeck = gameState.playDeck.concat(parsedCards);
      let newUsers = gameState.users;
      const newLastPlay = { cards: parsedCards, user: userId, statement: parsedStatement };
      let newStatementHistory = gameState.statementHistory;

      //Check it is right player's turn
      const turn = gameState.turn;
      const users = gameState.users;
      const playerIndex = helpers.getIndexInUsersArray(userId, users);
      if (turn !== userId) throw new Error('Wrong turn');

      //Update user hand
      //Remove played cards from user hand array
      logger.child({oldHand: users[playerIndex].hand}).debug('[gameService] play: updating hand');
      let newHand = helpers.removeCardsFromCardsArray(parsedCards, users[playerIndex].hand);
      logger.child({newHand: newHand}).debug('[gameService] play: Played cards removed');
      if (gameState.deck.length !== 0) {
        //Get new cards from play deck
        const newCards = gameState.deck.slice(0, parsedCards.length);
        logger.child({newCards: newCards}).debug('[gameService] play: Cards got from deck');
        newDeck = gameState.deck.slice(parsedCards.length);
        //Add new cards to remaining hand
        newHand = newHand.concat(newCards);
      }

      logger.child({newHand: newHand}).debug('[gameService] play: New hand');
      io.to(userId).emit(SocketEvents.HAND_UPDATE, newHand);



      newUsers = newUsers.map(u => {
        if(u.id === userId){
          logger.debug(`userId: ${u.id}`);
          logger.debug(`hand: ${JSON.stringify(u.hand)}`);
          u.hand = newHand;
        }
        return u;
      });

      logger.child({users: newUsers}).debug('[gameService] play: Users after dealing cards');

      //If the deck is empty, check for any players with empty hand


      //Update statementHistory
      logger.child({statementValue:parsedStatement.value, statementHistoryvalue: gameState.statementHistory.value}).debug('[gameService] play');
      if (parsedStatement.value === gameState.statementHistory.value) {
        logger.debug('[gameService] play: Adding ');
        newStatementHistory = {...gameState.statementHistory, amount: gameState.statementHistory.amount+parsedStatement.amount};
      } else {
        newStatementHistory = {amount: parsedStatement.amount, value: parsedStatement.value};
      }

      logger.child({newStatementHistory: newStatementHistory});

      //Check winners if deck was empty when play started
      if(gameState.deck.length === 0) {
        newWinners = updateWinners(newWinners, newLastPlay, newUsers);
      }

      const newGameState: GameState = {
        winners: newWinners,
        status: 'PLAYING',
        isActive: true,
        turn: gameState.turn,
        deck: newDeck,
        users: newUsers,
        playDeck: newPlayDeck,
        lastPlay: newLastPlay,
        statementHistory: newStatementHistory,
      };



      //get game and send to clients
      const gameStateUpdate = helpers.createGameStateUpdateFromGameState(newGameState);
      logger.child({gameStateUpdate: gameStateUpdate}).debug('[gameService] handlePlay: gameStateUpdate sent to backend');
      io.to(roomId).emit(SocketEvents.GAME_STATE_UPDATE, gameStateUpdate);


      //If played card is stated to be ace or 10, or there are >=4 same cards on play, deck clearing is triggered. If card value is 2, the clearing is not triggered
      if (parsedStatement.value === 1 || parsedStatement.value === 10 || (newStatementHistory.amount >= 4 && newStatementHistory.value !== 2)) {
        callback('OK');
        await handleClearing(roomId, newGameState);
        return;
      }
      //If played card is not stated to be ace or 10 play goes on normally


      await redisController.setGameState(roomId, newGameState);

      //Advance turn
      logger.debug('[gameService] play: advancing turn');
      await advanceTurn(users, newGameState.turn, newGameState.winners, roomId);

      callback('OK');
    } catch (e) {
      callback('ERR');
      logger.error(e);
    }finally {
      //setting status back to IDLE
      try{
        logger.debug('[gameService] play: Setting status to IDLE');
        await redisController.setStatus(roomId, 'IDLE');
      }catch(e){
        logger.error(e);
      }
    }
  };

  /**
   * Advances turn in redis and sends turn update to clients
   * @param users
   * @param turnId
   * @param winners
   * @param roomId
   */
  const advanceTurn = async (users: Array<User>, turnId: string, winners: Array<string>, roomId: string ) =>{
    logger.child({users: users, winners: winners}).debug('[gameService] advanceTurn');
    if(users.length-1 === winners.length) {
      logger.debug('GAME ENDS');
      io.to(roomId).emit(SocketEvents.GAME_ENDS);
    }
    const nextTurn = helpers.getNextTurnId(users, turnId, winners);
    await redisController.setTurn(roomId, nextTurn);
    //Send turn update to clients
    io.to(roomId).emit(SocketEvents.TURN_UPDATE, nextTurn);
  };


  const handleClearing = async (roomId: string, gameState: GameState) =>{
    logger.debug('[gameService] deckAboutToClear');

    //Set status to 'WAITING_DOUBT'
    let newGameState: GameState = {...gameState, status: 'WAITING_DOUBT'};
    await redisController.setGameState(roomId, newGameState);

    //Send notification to clients that the deck is about to be cleared
    io.to(roomId).emit(SocketEvents.ABOUT_TO_CLEAR);

    //wait for 8 seconds for players to doubt
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
      const newLastPlay = {
        cards: [],
        user: '',
        statement: {
          value: 0,
          amount: 0,
        }
      };
      const newStatementHistory = {
        value: 0,
        amount: 0
      };

      //If player's hand is empty append to winners and advance turn
      let newWinners = newGameState.winners;
      if(newGameState.deck.length === 0) {
        newWinners = updateWinners(newWinners, newLastPlay, newGameState.users);
      }

      newGameState={...newGameState, winners: newWinners, lastPlay: newLastPlay, statementHistory: newStatementHistory, playDeck: []};

      //get game and send to clients
      await redisController.setGameState(roomId, newGameState);
      const gameStateUpdate = helpers.createGameStateUpdateFromGameState(newGameState);
      io.to(roomId).emit(SocketEvents.GAME_STATE_UPDATE, gameStateUpdate);

      if(newGameState.winners.includes(newGameState.turn)) await advanceTurn(newGameState.users, newGameState.turn, newGameState.winners, roomId);
    }
  };

  const updateWinners = (winners: Array<string>, lastPlay: Play, users: Array<User>): Array<string> => {
    const newWinners = winners;
    logger.debug('[gameService] updateWinners');
    //Check if any new user's hand is empty and someone has played after that user
    for(const user of users){
      logger.child({winnersIncludeUser: !winners.includes(user.id), userHandLength: user.hand.length, lastPlayer: lastPlay.user!==user.id}).debug('[gameService] updateWinners');
      if(!winners.includes(user.id) && user.hand.length === 0 && lastPlay.user !== user.id) {
        logger.debug(`[gameSevice] appending user ${user.id} to winners` );
        winners.push(user.id);
      }
    }
    return newWinners;
  };



  socket.on(SocketEvents.CREATE_ROOM, createRoom);
  socket.on(SocketEvents.JOIN_ROOM, joinRoom);
  socket.on(SocketEvents.START_GAME, startGame);
  socket.on(SocketEvents.LEAVE_ROOM, leaveRoom);
  socket.on(SocketEvents.PLAY, handlePlay);
  socket.on(SocketEvents.DOUBT, handleDoubt);
};

export default gameService;
