import { io, Socket } from 'socket.io-client';
import { WEBSOCKET_URL } from '../utils/config.js';
import type { Card, GameStateUpdate, Statement } from '../types/game.js';



export const SocketEvents = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  ERROR: 'connect_error',

  //ServerToClient
  ROOM_UPDATE: 'roomUpdate',
  GAME_STARTS: 'gameStarts',
  GAME_STATE_UPDATE: 'gameStateUpdate',
  HAND_UPDATE: 'handUpdate',
  TURN_UPDATE: 'turnUpdate',
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

export interface ClientToServerEvents {
  createRoom: (userId: string, callback: (result: string) => void) => void;
  joinRoom: (roomId: string, userId: string, callback: (result: string) => void) => void;
  startGame: (callback: (result: string) => void) => void;
  leaveRoom: (callback: (result: string) => void) => void;
  play: (cards: Array<Card>, statement: Statement, callback: (result: string)=> void)=>void;
  doubt: (callback: (result: string)=>void)=>void;
}


export interface ServerToClientEvents {
  gameStarts: () => void;
  roomUpdate: (roomId: string, players: Array<string>) => void;
  gameStateUpdate: (gameState: GameStateUpdate) => void;
  turnUpdate:(turn: string)=>void;
  handUpdate: (cards: Array<Card>) => void;
  doubted: (userId: string) => void;
  doubtResult: (cards: Array<Card>) => void;
  aboutToClear: ()=>void;
  gameEnds: () => void;
}

export interface SocketData {
  userId: string;
  roomId: string;
}


export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(WEBSOCKET_URL, {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  timeout: 2000,
  forceNew: false,
  path: '/ws/socket.io',
});