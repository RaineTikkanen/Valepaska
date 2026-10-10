import { io, Socket } from 'socket.io-client';
import { BACKEND_URL } from './utils/config.ts';
import type {GamePlayer, GameStateUpdate, Statement, User} from './types/game.type.ts';
import type {Card} from './types/deck.type.ts';


export interface ServerToClientEvents {
  roomUpdate: (roomId: string, players: Array<GamePlayer>) => void;
  gameStateUpdate: (gameState: GameStateUpdate) => void;
  turnUpdate: (turn: string) => void;
  handUpdate: (cards: Array<Card>) => void;
  doubted: (doubter: string)=> void;
  doubtResult: (cards: Array<Card>) => void;
  aboutToClear: (time: number)=>void;
}

export interface ClientToServerEvents {
  createRoom: (user: User, callback:(result: string) => void) => void;
  joinRoom: (roomId: string, user: User, callback: (result: string) => void) => void;
  leaveRoom: (callback:(result: string) => void) => void;
  startGame: (callback: (result: string) => void) => void;
  doubt: (callback: (result: string) => void,) => void;
  play: (cards: Array<Card>, statement: Statement, callback: (result: string) => void,) => void;
  requestRoomUpdate: (roomId: string, user: User, callback: (result: string) => void) => void;
}

export const SocketEvents = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  ERROR: 'connect_error',

  //ServerToClient
  ROOM_UPDATE: 'roomUpdate',
  GAME_STATE_UPDATE: 'gameStateUpdate',
  HAND_UPDATE: 'handUpdate',
  TURN_UPDATE: 'turnUpdate',
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
  REQUEST_ROOM_UPDATE: 'requestRoomUpdate',
} as const;




export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(BACKEND_URL, {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  timeout: 2000,
  forceNew: false,
  path: '/socket.io',
});