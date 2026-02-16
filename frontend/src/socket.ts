import { io, Socket } from 'socket.io-client';

const URL = 'http://localhost:4000';

interface ClientToServerEvents {
  deal: (cards: string) => void;
  doubtResult: (result: boolean) => void;
  gameState: (statement: string) => void;
}

interface ServerToClientEvents {
  play: (cards: string, statement: string) => void;
  doubt: () => void;
}


export const socket: Socket<ClientToServerEvents, ServerToClientEvents> = io(URL, {
  autoConnect: false
});