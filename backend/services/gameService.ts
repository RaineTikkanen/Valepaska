import type { Server, Socket } from 'socket.io';
import { v7 as uuidv7 } from 'uuid';
import redisController from '../redis/controller.js';
import {isString} from '../utils/utils.js';
import {
  SocketEvents,
  type ClientToServerEvents,
  type ServerToClientEvents,
  type SocketData,
} from '../socket.js';
import type {Statement, User, GamePlayer} from '../types/game.type.js';
import { parseStatement, parseUser} from '../types/game.type.js';
import type { GameState } from '../types/game.type.js';
import type { Card } from '../types/deck.type.js';
import { parseCard } from '../types/deck.type.js';
import { timeout } from '../utils/utils.js';
import logger from '../utils/logger.js';
import {WORD_API} from '../utils/config.js';


const parseWordApiResponse = (response: unknown): string => {
  if (
    !response ||
    typeof response !== 'object' ||
    !Array.isArray(response) ||
    response.length === 0
  ) {
    throw new Error('Not valid word API response');
  }

  const first: unknown = response[0];
  if (
    !first ||
    typeof first !== 'object' ||
    !('word' in first) ||
    typeof first.word !== 'string'
  ) {
    throw new Error('Not valid word API response');
  }

  return first.word;
};

const fetchWord = async (type: 'noun' | 'adjective'): Promise<string | null> =>{
  try {
    const response = await fetch(`${WORD_API}&type=${type}`);
    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }

    const result: unknown = await response.json();
    return parseWordApiResponse(result);


  } catch (error) {
    console.error(error);
    return null;
  }
};

const getRoomId = async () => {
  const noun = await fetchWord('noun');
  const adjective = await fetchWord('adjective');
  if(noun && adjective) {
    return `${adjective}-${noun}`;
  } else{
    return uuidv7();
  }
};


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
    const clientStatus = await redisController.getClientStatus(roomId);
    const players = await redisController.getPlayersInAGame(roomId);

    if(clientStatus !== 'LOBBY') throw new Error('game is already active');
    if(players.length>3) throw new Error('Room full');

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
      if(!isString(roomId)) throw new Error('Room ID is invalid');
      roomId = roomId.toLowerCase();
      const parsedUser=parseUser(user);
      await joinRoomInternal(roomId, parsedUser);
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

    let gameId = await getRoomId();
    let roomExists = await redisController.roomExists(gameId);
    logger.child({gameId: gameId}).debug('[createRoom] gameId created');
    while (roomExists) {
      logger.debug('[createRoom] gameId exists. creating new');
      gameId = await getRoomId();
      roomExists = await redisController.roomExists(gameId);
      logger.child({gameId: gameId}).debug('[createRoom] new game id');
    }
    logger.child({gameId: gameId}).debug('[crateRoom]');

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
      const players = await redisController.getPlayersInAGame(roomId);

      if (players.length === 0) {
        await redisController.deleteRoom(roomId);
        return;
      }

      const usersToSend: Array<GamePlayer> = players.map(p => ({user: p.user, amountOfCards: 5}));

      io.to(roomId).emit(SocketEvents.ROOM_UPDATE, roomId, usersToSend);
    }catch(e){
      console.error('ERROR: ', e);
    }
  };

  const requestRoomUpdate = async (roomId: string, user: User, callback: (result: string) => void) => {
    try{
      const parsedUser = parseUser(user);
      logger.debug(`[gameService] requestRoomUpdate: user: ${parsedUser.id} requesting room update`);
      if(!isString(roomId)) throw new Error('Room ID is invalid');
      const gameState = await redisController.getGameState(roomId);
      socket.data.userId = parsedUser.id;
      socket.data.userName = parsedUser.name;
      socket.data.roomId = roomId;
      await socket.join(roomId);
      await socket.join(parsedUser.id);
      const usersToSend: Array<GamePlayer> = gameState.getGamePlayers();
      io.to(parsedUser.id).emit(SocketEvents.ROOM_UPDATE, roomId, usersToSend);
      io.to(parsedUser.id).emit(SocketEvents.GAME_STATE_UPDATE, gameState.toGameStateUpdate());
      io.to(parsedUser.id).emit(SocketEvents.TURN_UPDATE, gameState.turn);
      io.to(parsedUser.id).emit(SocketEvents.HAND_UPDATE, gameState.getPlayerHand(parsedUser.id));

      callback('OK');
    }catch(e) {
      console.error('Error in requestRoomUpdate:', e);
      callback('Err');
    }
  };

  const startGame = async (
    callback: (result: string) => void,
  ) => {
    try {
      const roomId = socket.data.roomId;

      const gameState = await redisController.getGameState(roomId);
      if (gameState.players.length === 1) throw new Error('Not enough players');

      gameState.startGame();

      await redisController.setGameState(roomId, gameState);
      io.to(roomId).emit(SocketEvents.GAME_STATE_UPDATE, gameState.toGameStateUpdate());

      //send dealt cards to clients
      for (const player of gameState.players) {
        io.to(player.user.id).emit(SocketEvents.HAND_UPDATE, player.hand);
      }

      io.to(roomId).emit(SocketEvents.TURN_UPDATE, gameState.turn);
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

      const players = await redisController.getPlayersInAGame(roomId);
      const clientStatus = await redisController.getClientStatus(roomId);

      if(players.length===1){
        await redisController.deleteRoom(roomId);
      }else {
        const playerIndex = players.findIndex(p=> p.user.id === userId);
        await redisController.removePlayerFromRoom(roomId, playerIndex);
      }
      await socket.leave(roomId);
      await socket.leave(userId);

      callback('OK');
      if(clientStatus !== 'RESULTS' && players.length!==1) {
        await roomUpdate(roomId);
      }
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
      if(!gameState.lastPlay) throw new Error('No last play. Can\'t doubt');
      if(gameState.lastPlay.user.id === userId) throw new Error('Can\'t doubt own play');
      if(gameState.gameStatus !== 'IDLE' && gameState.gameStatus !== 'WAITING_DOUBT') throw new Error(`Cant doubt. Game status:  ${gameState.gameStatus}`);

      logger.child({status: gameState.gameStatus}).debug('[gameService] doubt');
      logger.debug('[gameService] doubt: setting status to \'RESOLVING_DOUBT\'');
      await redisController.setStatus(roomId, 'RESOLVING_DOUBT');

      if (!gameState.lastPlay.user) throw new Error('No last play');

      //Send clients a notification that someone is doubting
      io.to(roomId).emit(SocketEvents.DOUBTED, userName);

      //Wait a while and send doubt results
      await timeout(2000);
      io.to(roomId).emit(SocketEvents.DOUBT_RESULT, gameState.lastPlay.cards);
      await timeout(5000);

      const loser=gameState.resolveDoubt(userId);

      await redisController.setGameState(roomId, gameState);
      io.to(roomId).emit(SocketEvents.GAME_STATE_UPDATE, gameState.toGameStateUpdate());
      io.to(loser).emit(SocketEvents.HAND_UPDATE, gameState.getPlayerHand(loser));
      io.to(roomId).emit(SocketEvents.TURN_UPDATE, gameState.turn);


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

      logger.child({status: gameState.gameStatus}).debug('[gameService] play');
      if (gameState.gameStatus !== 'IDLE') throw new Error('Status not IDLE, can\'t resolve play action');
      if (gameState.lastPlay && gameState.lastPlay.statement.value > parsedStatement.value) throw new Error('Invalid play');
      logger.debug('[gameService] play: setting status to PLAYING');
      await redisController.setStatus(roomId, 'PLAYING');

      //Check it is right player's turn
      const turn = gameState.turn;
      if (turn !== userId) throw new Error('Wrong turn');

      gameState.resolvePlay(userId, parsedCards, parsedStatement);

      io.to(roomId).emit(SocketEvents.GAME_STATE_UPDATE, gameState.toGameStateUpdate());
      io.to(userId).emit(SocketEvents.HAND_UPDATE, gameState.getPlayerHand(userId));


      //If played card is stated to be ace or 10, or there are >=4 same cards on play, deck clearing is triggered. If card value is 2, the clearing is not triggered
      if (parsedStatement.value === 1 || parsedStatement.value === 10 || (gameState.statementHistory && gameState.statementHistory.amount >= 4 && gameState.statementHistory.value !== 2)) {
        callback('OK');
        await handleClearing(roomId, gameState);
        return;
      }

      //If played card is not stated to be ace or 10 play goes on normally
      await redisController.setGameState(roomId, gameState);

      //Advance turn
      logger.debug('[gameService] play: advancing turn');
      gameState.advanceTurn();
      io.to(roomId).emit(SocketEvents.TURN_UPDATE, gameState.turn);
      await redisController.setTurn(roomId, gameState.turn);


      callback('OK');
    } catch (e) {
      callback('ERR');
      logger.error(e);
    }finally {
      //setting status back to IDLE
      try{
        logger.child({room: roomId}).debug('[gameService] play: Setting status to IDLE');
        await redisController.setStatus(roomId, 'IDLE');
      }catch(e){
        logger.error(e);
      }
    }
  };



  const handleClearing = async (roomId: string, gameState: GameState) =>{
    logger.debug('[gameService] deckAboutToClear');

    //Set status to 'WAITING_DOUBT'
    gameState.gameStatus = 'WAITING_DOUBT';
    await redisController.setGameState(roomId, gameState);

    //Send notification to clients that the deck is about to be cleared
    logger.debug('[gameService] deckAboutToClear before for loop');
    for(let i=5; i>-1; i-- ) {
      logger.debug(`TIMER: ${i}`);
      io.to(roomId).emit(SocketEvents.ABOUT_TO_CLEAR, i);
      await timeout(1000);
      const status = await redisController.getStatus(roomId);
      if(status !== 'WAITING_DOUBT') break;
    }
    io.to(roomId).emit(SocketEvents.ABOUT_TO_CLEAR, -1);
    //Check if anyone has doubted while waiting
    const status = await redisController.getStatus(roomId);
    logger.child({status: status}).debug('[gameService] deckAboutToClear');

    //If no one doubted clearing goes on normally.
    if(status === 'WAITING_DOUBT') {
      logger.debug('[gameService] deckAboutToClear: setting status to CLEARING');
      await redisController.setStatus(roomId, 'CLEARING');
      gameState.gameStatus = 'CLEARING';

      gameState.clearPlay();
      gameState.updateWinners();

      //get game and send to clients
      await redisController.setGameState(roomId, gameState);
      io.to(roomId).emit(SocketEvents.GAME_STATE_UPDATE, gameState.toGameStateUpdate());

      if(gameState.winners.some(w=>w === gameState.turn)) {
        gameState.advanceTurn();
        io.to(roomId).emit(SocketEvents.TURN_UPDATE, gameState.turn);
      }

    }
  };

  socket.on(SocketEvents.CREATE_ROOM, createRoom);
  socket.on(SocketEvents.JOIN_ROOM, joinRoom);
  socket.on(SocketEvents.START_GAME, startGame);
  socket.on(SocketEvents.LEAVE_ROOM, leaveRoom);
  socket.on(SocketEvents.PLAY, handlePlay);
  socket.on(SocketEvents.DOUBT, handleDoubt);
  socket.on(SocketEvents.REQUEST_ROOM_UPDATE, requestRoomUpdate);
};

export default gameService;
