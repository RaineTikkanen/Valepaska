import { io, Socket } from 'socket.io-client';
import { WEBSOCKET_PORT } from '../utils/config.js';
import type { Card } from './types/Card.js';

const URL = `http://localhost:${WEBSOCKET_PORT}`;

interface ClientToServerEvents {
  ping: () => void;
  createGame: (userId: string, callback: (id: string) => void) => void;
  joinGame: (gameId: string, userId: string, callback: (result: string) => void) => void;
  startGame: (callback: (result: string) => void) => void; 
  leaveGame: (gameId: string, userId: string) => void;
}


interface ServerToClientEvents {
  ping: () => void;
  gameStarts: () => void; 
  userJoinedGame: (players: string[]) => void;
  handUpdate: (cards: Card[]) => void;
}

export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(URL, {
  autoConnect: false
});