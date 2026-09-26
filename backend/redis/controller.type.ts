import type { Card } from '../deck/deck.type.js';
import type { Statement } from '../services/gameService.type.js';

export type User = {
  id: string;
  hand: Array<Card>;
};

export type Play = {
  cards: Array<Card>;
  user: string;
  statement: Statement;
};

export type Status = 'IDLE' | 'PLAYING' | 'WAITING_DOUBT' | 'RESOLVING_DOUBT' | 'CLEARING';

export type GameState = {
  winners: Array<string>;
  status: Status
  isActive: boolean;
  turn: string;
  deck: Array<Card>;
  playDeck: Array<Card>;
  users: Array<User>;
  lastPlay: Play;
  statementHistory: Statement
};

export const parseStatus = (status: unknown): Status =>{
  if(status !== 'PLAYING'
      && status !== 'WAITING_DOUBT'
      && status !== 'RESOLVING_DOUBT'
      && status !== 'CLEARING'
      && status !== 'IDLE'
  ) throw new Error('Invalid status');
  return status;
};