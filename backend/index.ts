import express from 'express';
import { Server, Socket } from 'socket.io';
import { createServer } from 'node:http';
import { PORT, REDIS_URL, WEBSOCKET_PORT } from './utils/config.js'
import gameService from './services/gameService.js';
import { GameStateUpdate } from './services/gameService.type.js'
import cors from 'cors';
import { Card } from './deck/deck.type.js';
import { v7 as uuidv7 } from 'uuid';

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

  //ClientToServer
  CREATE_ROOM: 'createRoom',
  JOIN_ROOM: 'joinRoom',
  LEAVE_ROOM: 'leaveRoom',
  START_GAME: 'startGame',
  DOUBT: 'doubt',
  PLAY: 'play',
} as const;

export interface ServerToClientEvents {
  roomUpdate: (roomId: string, players: string[]) => void;
  gameStarts:() => void;
  gameStateUpdate: (gameState: GameStateUpdate) => void;
  turnUpdate: (turn: string) => void;
  handUpdate: (cards: Card[]) => void;
  doubted: (doubter: string)=> void;
  aboutToClear: ()=>void;
}

export interface ClientToServerEvents {
  createRoom: (userId:string, callback:(result: string) => void) => void;
  joinRoom: (roomId: string, userId: string, callback: (result: string) => void) => void;
  leaveRoom: (roomId: string, userId: string, callback:(result: string) => void) => void;
  startGame: (roomId: string, callback: (result: string) => void) => void;
  doubt: (callback: (result: string) => void) => void;
  play: (callback: (result: string) => void) => void;
  getGameState: (roomId: string, userId: string) => void;
}

interface SocketData {
  userId: string;
  roomId: string;
}

const app = express()
const server = createServer(app)
const io = new Server<
  ClientToServerEvents,
  ServerToClientEvents,
  SocketData
>({
  cors: {
    origin: '*'
  }
});


app.use(express.static('dist'))
app.use(express.json());
app.use(cors());


const onConnect = (socket: Socket) => {
  gameService(io, socket)
}

io.listen(WEBSOCKET_PORT);
io.on('connection', onConnect)

app.get('/health', (_req, res) => {
  res.send({ health_status: 'OK' });
});

app.get('/userId', (_req, res) => {
  const id = uuidv7();
  console.log('GuestUserId created: ', id)
  res.json({'id':id});
})



server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket port ${WEBSOCKET_PORT}`)
  console.log(`Redis running on port ${REDIS_URL}`)
});