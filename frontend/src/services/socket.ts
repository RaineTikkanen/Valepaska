import { io, Socket } from 'socket.io-client';
import { WEBSOCKET_PORT } from '../../utils/config.js';
import type { Card } from '../types/game.js';

const URL = `http://localhost:${WEBSOCKET_PORT}`;


export const SocketEvents = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  GAME_STARTS: 'gameStarts',
  ROOM_UPDATE: 'roomUpdate',
  HAND_UPDATE: 'handUpdate',
  CREATE_ROOM: 'createRoom',
  JOIN_ROOM: 'joinRoom',
  START_GAME: 'startGame',
  LEAVE_ROOM: 'leaveRoom',
  PING: 'ping',
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