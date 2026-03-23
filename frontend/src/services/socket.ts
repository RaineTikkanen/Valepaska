import { io, Socket } from 'socket.io-client';
import { WEBSOCKET_PORT } from '../../utils/config.js';
import type { Card, GameStateUpdate } from '../types/game.js';

const URL = `http://localhost:${WEBSOCKET_PORT}`;


export const SocketEvents = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  PING: 'ping',

//ServerToClient
  ROOM_UPDATE: 'roomUpdate',
  GAME_STARTS: 'gameStarts',
  GAME_STATE_UPDATE: 'gameStateUpdate',
  HAND_UPDATE: 'handUpdate',

//ClientToServer
  CREATE_ROOM: 'createRoom',
  JOIN_ROOM: 'joinRoom',
  LEAVE_ROOM: 'leaveRoom',
  START_GAME: 'startGame',
  DOUBT: 'doubt',
  PLAY: 'play',
} as const;

export interface ClientToServerEvents {
  ping: () => void;
  createRoom: (userId: string, callback: (result: string) => void) => void;
  joinRoom: (roomId: string, userId: string, callback: (result: string) => void) => void;
  startGame: (roomId: string, callback: (result: string) => void) => void; 
  leaveRoom: (roomId: string, userId: string, callback: (result: string) => void) => void;
}


export interface ServerToClientEvents {
  ping: () => void;
  gameStarts: () => void; 
  roomUpdate: (roomId: string, players: string[]) => void;
  gameStateUpdate: (gameState: GameStateUpdate) => void;
  handUpdate: (cards: Card[]) => void;
}

export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(URL, {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  timeout: 2000,
  forceNew: false,
});