import express from 'express';
import type { Socket } from 'socket.io';
import { Server } from 'socket.io';
import { createServer } from 'node:http';
import { PORT, REDIS_URL} from './utils/config.js';
import gameService from './services/gameService.js';
import type {GameStateUpdate, Statement, User} from './services/gameService.type.js';
import type { Card } from './deck/deck.type.js';
import { v7 as uuidv7 } from 'uuid';
import logger from './utils/logger.js';
// import path from 'node:path';

export const SocketEvents = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',

  //ServerToClient
  ROOM_UPDATE: 'roomUpdate',
  GAME_STARTS: 'gameStarts',
  GAME_STATE_UPDATE: 'gameStateUpdate',
  TURN_UPDATE: 'turnUpdate',
  HAND_UPDATE: 'handUpdate',
  DOUBTED: 'doubted',
  DOUBT_RESULT: 'doubtResult',
  ABOUT_TO_CLEAR: 'aboutToClear',
  GAME_ENDS: 'gameEnds',

  //ClientToServer
  CREATE_ROOM: 'createRoom',
  JOIN_ROOM: 'joinRoom',
  LEAVE_ROOM: 'leaveRoom',
  START_GAME: 'startGame',
  DOUBT: 'doubt',
  PLAY: 'play',
} as const;

export interface ServerToClientEvents {
  roomUpdate: (roomId: string, players: Array<User>) => void;
  gameStarts:() => void;
  gameStateUpdate: (gameState: GameStateUpdate) => void;
  turnUpdate: (turn: string) => void;
  handUpdate: (cards: Array<Card>) => void;
  doubted: (doubter: string)=> void;
  doubtResult: (cards: Array<Card>) => void;
  aboutToClear: ()=>void;
  gameEnds:() => void;
}

export interface ClientToServerEvents {
  createRoom: (user: User, callback:(result: string) => void) => void;
  joinRoom: (roomId: string, user: User, callback: (result: string) => void) => void;
  leaveRoom: (callback:(result: string) => void) => void;
  startGame: (callback: (result: string) => void) => void;
  doubt: (callback: (result: string) => void,) => void;
  play: (cards: Array<Card>, statement: Statement, callback: (result: string) => void,) => void;
  getGameState: () => void;
}

export interface SocketData {
  userId: string;
  roomId: string;
  userName: string;
}

const app = express();
const server = createServer(app);
const io = new Server<
  ClientToServerEvents,
  ServerToClientEvents,
  Record<string, never>,
  SocketData
>(server);

if(process.env.NODE_ENV !== 'development') {
  app.use(express.static('dist'));
}
app.use(express.json());


const onConnect = (
  socket: Socket<
    ClientToServerEvents,
    ServerToClientEvents,
    Record<string, never>,
    SocketData
  >,
) => {
  gameService(io, socket);
};

io.on('connection', onConnect);

app.get('/api/health', (_req, res) => {
  res.send({ health_status: 'OK' });
});

app.get('/api/userId', (_req, res) => {
  const id = uuidv7();
  res.json({'id':id});
});

if(process.env.NODE_ENV !== 'development') {
  app.get('/{*path}', (req, res, next) => {
    if (req.path === '/api' || req.path.startsWith('/api/')) {
      next();
      return;
    }
    res.sendFile('index.html', {root: 'dist'}, (error) => {
      if (error) next(error);
    });
  });
}

server.listen(PORT, () => {
  logger.debug(`NODE.ENV ${process.env.NODE_ENV}`);
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Redis running on port ${REDIS_URL}`);
});