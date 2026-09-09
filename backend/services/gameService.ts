import { Server, Socket } from 'socket.io';
import { v7 as uuidv7 } from 'uuid';
import redisController from '../redis/controller.js';
import { parseId } from '../utils/utils.js';
import { SocketEvents } from '../index.js';
import { GameStateUpdate, Statement } from './gameService.type.js';
import { Play } from '../redis/controller.type.js';
import { Card } from '../deck/deck.type.js';

const gameService = (io: Server, socket: Socket) => {
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
            value: null,
            amount: null,
          },
        },
        amountOfCardsInPlay: 0,
      };
      io.to(roomId).emit(SocketEvents.GAME_STATE_UPDATE, gameStateUpdate);

      redisController.setTurnIndexByUserId(roomId, nextTurn);
      io.to(roomId).emit(SocketEvents.TURN_UPDATE, nextTurn);
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
    console.group();
    console.log('PLAY');

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
    } catch (e) {
      console.error('Error while calling "play" redis function: ', e);
      callback('ERR');
    }

    //Update user hand
    try {
      const userHand = await redisController.getUserHand(roomId, userId);
      io.to(userId).emit(SocketEvents.HAND_UPDATE, userHand);
    } catch (e) {
      console.error('Error updating user hand: ', e);
      callback('ERR');
    }

    //get game and send to clients
    try {
      const gameStateUpdate = await redisController.getGameStateUpdate(roomId);
      io.to(parsedRoomId).emit(SocketEvents.GAME_STATE_UPDATE, gameStateUpdate);
    } catch (e) {
      console.error(
        'Error getting gameStateUpdate from redis and updating to clients: ',
        e,
      );
      callback('ERR');
    }

    //If played card is stated to be ace or 10 play stops for a while to wait doubts and then the playDeck is cleared
    if (statement.value === 1 || statement.value === 10) {
      setTimeout(async () => {
        redisController.clearPlaydeck(roomId);
        redisController.clearLastPlay(roomId);
        const gameStateUpdate =
          await redisController.getGameStateUpdate(roomId);
        io.to(parsedRoomId).emit(
          SocketEvents.GAME_STATE_UPDATE,
          gameStateUpdate,
        );
      }, 8000);

      //If played card is not stated to be ace or 10 play goes on normally
    } else {
      try {
        //Advance turn
        const turn = await redisController.advanceTurn(roomId);
        //Send turn update to clients
        io.to(parsedRoomId).emit(SocketEvents.TURN_UPDATE, turn);
      } catch (e) {
        console.error('Error updating turn: ', e);
        callback('ERR');
      }
    }
    callback('OK');
    console.groupEnd();
  };

  socket.on(SocketEvents.PING, ping);
  socket.on(SocketEvents.CREATE_ROOM, createRoom);
  socket.on(SocketEvents.JOIN_ROOM, joinRoom);
  socket.on(SocketEvents.START_GAME, startGame);
  socket.on(SocketEvents.LEAVE_ROOM, leaveRoom);
  socket.on(SocketEvents.PLAY, play);
  socket.on(SocketEvents.DOUBT, doubt);
};

export default gameService;
