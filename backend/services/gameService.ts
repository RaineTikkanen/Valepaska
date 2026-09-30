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
import type {Statement, User} from './gameService.type.js';
import { parseStatement, parseUser, } from './gameService.type.js';
import type {GameState, Play, Player} from '../redis/controller.type.js';
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

  const joinRoomInternal = async (roomId: string, user: User) => {
    const isActive = await redisController.getIsActive(roomId);

    if(isActive) throw new Error('game is already active');

    await redisController.addUserToRoom(roomId, user);
    await socket.join(roomId);
    await socket.join(user.id);

    socket.data.roomId = roomId;
    socket.data.userId = user.id;
    socket.data.userName = user.name;

    await roomUpdate(roomId);
  };
 

  const joinRoom = async (
    roomId: string,
    user: User,
    callback: (result: string) => void,
  ) => {
    try {
      const parsedRoomId = parseId(roomId);
      const parsedUser=parseUser(user);
      await joinRoomInternal(parsedRoomId, parsedUser);
      callback('OK');
    } catch (e) {
      console.error('ERROR: ', e);
      callback('ERR');
    }
  };

  const createRoom = async (
    user: User,
    callback: (result: string) => void,
  ) => {
    const gameId = uuidv7();
    try {
      const parsedUser = parseUser(user);
      await redisController.createRoom(gameId);

      await joinRoomInternal(gameId, parsedUser);
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
      const users = await redisController.getPlayersInAGame(parsedRoomId);

      if (users.length === 0) {
        await redisController.deleteRoom(parsedRoomId);
        return;
      }
      logger.child({users: users}).debug('[roomupdate]');

      const usersToSend = users.map((p ) => p.user);

      io.to(parsedRoomId).emit(SocketEvents.ROOM_UPDATE, parsedRoomId, usersToSend);
    }catch(e){
      console.error('ERROR: ', e);
    }
  };

  const startGame = async (
    callback: (result: string) => void,
  ) => {
    try {
      const roomId = socket.data.roomId;

      const players = await redisController.getPlayersInAGame(roomId);
      if (players.length === 1) throw new Error('Not enough players');



      for(let i = players.length - 1; i >= 0; i--) {
        const cards = await redisController.dealCardsFromDeck(roomId, 5);
        await redisController.setPlayerHand(roomId, cards, i);
      }

      const starterIndex = getRandomInt(players.length);
      const starterId = players[starterIndex].user.id;

      await redisController.setTurn(roomId, starterId);
      await redisController.setIsActive(roomId, true);

      io.to(roomId).emit(SocketEvents.GAME_STARTS);

      const updatedPlayers = await redisController.getPlayersInAGame(roomId);

      //send dealt cards to clients
      for (const player of updatedPlayers) {
        const hand = player.hand;
        io.to(player.user.id).emit(SocketEvents.HAND_UPDATE, hand);
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

      const users = await redisController.getPlayersInAGame(roomId);
      if(users.length===1){
        await redisController.deleteRoom(roomId);
      }else {
        const userIndex = helpers.getIndexInUsersArray(userId, users);
        await redisController.removePlayerFromRoom(roomId, userIndex);
      }
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
    const userName= socket.data.userName;
    try {
      const gameState = await redisController.getGameState(roomId);
      if(gameState.lastPlay.user.id === userId) throw new Error('Can\'t doubt own play');
      logger.child({status: gameState.status}).debug('[gameService] doubt');
      if(gameState.status !== 'IDLE' && gameState.status !== 'WAITING_DOUBT') throw new Error(`Cant doubt. Game status:  ${gameState.status}`);
      logger.debug('[gameService] doubt: setting status to \'RESOLVING_DOUBT\'');
      await redisController.setStatus(roomId, 'RESOLVING_DOUBT');

      if (!gameState.lastPlay.user) throw new Error('No last play');

      //Send clients a notification that someone is doubting
      io.to(roomId).emit(SocketEvents.DOUBTED, userName);


      //Wait a while and send doubt results
      await timeout(2000);
      io.to(roomId).emit(SocketEvents.DOUBT_RESULT, gameState.lastPlay.cards);
      await timeout(5000);


      let loserId = '';
      let winnerId = '';

      //Check if last play matches the statement
      const lastStatementIsTrue = gameState.lastPlay.cards.every(card => card.value === gameState.lastPlay.statement.value);

      //set loserId and nextTurn based on doubt results
      if (lastStatementIsTrue) {
        loserId = userId;
        winnerId = gameState.lastPlay.user.id;
      } else {
        loserId = gameState.lastPlay.user.id;
        winnerId = userId;
      }

      logger.child({loserId: loserId, winnerId: winnerId}).debug('[gameService] doubt');

      let nextTurnId = winnerId;

      //Doubt loser gets playDeck in hand

      const loserIndex = helpers.getIndexInUsersArray(loserId, gameState.players);
      const winnerIndex = helpers.getIndexInUsersArray(winnerId, gameState.players);
      const newLoserHand = gameState.players[loserIndex].hand.concat(gameState.playDeck);
      const newPlayers = helpers.updatePlayerHand(gameState.players, loserId, newLoserHand);


      //clear playdeck, lastPlay and statementHistory
      await redisController.clearPlayDeck(roomId);
      await redisController.clearLastPlay(roomId);
      await redisController.clearStatementHistory(roomId);


      //After a while send handUpdate to loser and send playDeck update and turn update to everyone
      io.to(loserId).emit(SocketEvents.HAND_UPDATE, newLoserHand);

      //Check if player who played last play wins the game
      const newWinners: Array<User> = [];
      const nextTurnIndex = helpers.getIndexInUsersArray(winnerId, gameState.players);
      if(lastStatementIsTrue && gameState.players[nextTurnIndex].hand.length === 0 ){
        logger.child({lastStatementIsTrue: lastStatementIsTrue, nextTurnHandLength: gameState.players[nextTurnIndex].hand.length}).debug('[gameService] doubt checking winners');
        const winner = gameState.players[winnerIndex].user;
        newWinners.push(winner);
        await redisController.setWinners(roomId, newWinners);
        nextTurnId = helpers.getNextTurnId(gameState.players, nextTurnId, newWinners);
      }
      io.to(roomId).emit(SocketEvents.TURN_UPDATE, nextTurnId);


      const newGameState: GameState = {
        ...gameState,
        winners: newWinners,
        players: newPlayers,
        turn: nextTurnId,
        playDeck: [],
        lastPlay: {
          user: {
            id: '',
            name: ''
          },
          cards: [],
          statement: {
            amount: 0,
            value: 0
          }
        },
        statementHistory: {
          amount: 0,
          value: 0,
        }
      };

      await redisController.setGameState(roomId, newGameState);
      const gameStateUpdate = helpers.createGameStateUpdateFromGameState(newGameState);
      io.to(roomId).emit(SocketEvents.GAME_STATE_UPDATE, gameStateUpdate);

      //Check if game ends
      if(newGameState.players.length-1 === newGameState.winners.length){
        io.to(roomId).emit(SocketEvents.GAME_ENDS);
      }

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
      logger.child({userId: userId, roomId: roomId}).debug('[gameService] play');

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
      let newStatementHistory = gameState.statementHistory;

      //Check it is right player's turn
      const turn = gameState.turn;
      const players = gameState.players;
      const playerIndex = helpers.getIndexInUsersArray(userId, players);
      const newLastPlay: Play = { cards: parsedCards, user: players[playerIndex].user, statement: parsedStatement };
      if (turn !== userId) throw new Error('Wrong turn');

      //Update user hand
      //Remove played cards from user hand array
      logger.child({oldHand: players[playerIndex].hand}).debug('[gameService] play: updating hand');
      let newHand = helpers.removeCardsFromCardsArray(parsedCards, players[playerIndex].hand);
      logger.child({newHand: newHand}).debug('[gameService] play: Played cards removed');
      if (gameState.deck.length !== 0 && newHand.length < 5) {
        //Get new cards from play deck
        const newCards = gameState.deck.slice(0, parsedCards.length);
        logger.child({newCards: newCards}).debug('[gameService] play: Cards got from deck');
        newDeck = gameState.deck.slice(parsedCards.length);
        //Add new cards to remaining hand
        newHand = newHand.concat(newCards);
      }

      logger.child({newHand: newHand}).debug('[gameService] play: New hand');
      io.to(userId).emit(SocketEvents.HAND_UPDATE, newHand);


      const newPlayers = helpers.updatePlayerHand(gameState.players, userId, newHand);

      logger.child({users: newPlayers}).debug('[gameService] play: Users after dealing cards');

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
        newWinners = updateWinners(newWinners, newLastPlay, newPlayers);
      }

      const newGameState: GameState = {
        winners: newWinners,
        status: 'PLAYING',
        isActive: true,
        turn: gameState.turn,
        deck: newDeck,
        players: newPlayers,
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

      //check if game ends
      if(newGameState.players.length-1 === newGameState.winners.length){
        io.to(roomId).emit(SocketEvents.GAME_ENDS);
      }

      //Advance turn
      logger.debug('[gameService] play: advancing turn');
      await advanceTurn(players, newGameState.turn, newGameState.winners, roomId);


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
  const advanceTurn = async (users: Array<Player>, turnId: string, winners: Array<User>, roomId: string ) =>{
    logger.child({users: users, winners: winners}).debug('[gameService] advanceTurn');

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
        user: {
          id: '',
          name: '',
        },
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
        newWinners = updateWinners(newWinners, newLastPlay, newGameState.players);
      }

      newGameState={...newGameState, winners: newWinners, lastPlay: newLastPlay, statementHistory: newStatementHistory, playDeck: []};

      //get game and send to clients
      await redisController.setGameState(roomId, newGameState);
      const gameStateUpdate = helpers.createGameStateUpdateFromGameState(newGameState);
      io.to(roomId).emit(SocketEvents.GAME_STATE_UPDATE, gameStateUpdate);

      //check if game ends
      if(newGameState.players.length-1 === newGameState.winners.length){
        io.to(roomId).emit(SocketEvents.GAME_ENDS);
        return;
      }

      if(newGameState.winners.some(w=>w.id === newGameState.turn)) await advanceTurn(newGameState.players, newGameState.turn, newGameState.winners, roomId);
    }
  };

  const updateWinners = (winners: Array<User>, lastPlay: Play, players: Array<Player>): Array<User> => {
    const newWinners = winners;
    logger.debug('[gameService] updateWinners');
    //Check if any new user's hand is empty and someone has played after that user
    for(const player of players){
      if(!winners.includes(player.user) && player.hand.length === 0 && lastPlay.user.id !== player.user.id) {
        logger.debug(`[gameSevice] appending user ${player.user.id} to winners` );
        winners.push(player.user);
      }
    }
    return newWinners;
  };

  const disconnect = async ()=>{
    const userId = socket.data.userId;
    const roomId = socket.data.roomId;
    if(userId && roomId) {
      try {
        logger.child({userId: userId, roomId: roomId}).debug('[gameService] disconnecting');
        const players = await redisController.getPlayersInAGame(roomId);
        if(players.length===1){
          await redisController.deleteRoom(roomId);
          logger.debug(`[gameService] last user left room ${roomId}, room deleted` );
        }else {
          const index = helpers.getIndexInUsersArray(userId, players);
          await redisController.removePlayerFromRoom(roomId, index);
          logger.debug(`[gameService] user ${userId} removed from room ${roomId}` );
        }
      } catch (err) {
        logger.error(err);
      }
    }
  };



  socket.on(SocketEvents.CREATE_ROOM, createRoom);
  socket.on(SocketEvents.JOIN_ROOM, joinRoom);
  socket.on(SocketEvents.START_GAME, startGame);
  socket.on(SocketEvents.LEAVE_ROOM, leaveRoom);
  socket.on(SocketEvents.PLAY, handlePlay);
  socket.on(SocketEvents.DOUBT, handleDoubt);
  socket.on('disconnect', disconnect);
};

export default gameService;
