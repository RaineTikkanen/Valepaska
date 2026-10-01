import type { Card } from './deck.type.js';
import type {Statement, User} from './game.type.js';

export type RedisPlayer = {
  user: User;
  hand: Array<Card>;
};

export type Play = {
  cards: Array<Card>;
  user: User;
  statement: Statement;
};

export type Status = 'IDLE' | 'PLAYING' | 'WAITING_DOUBT' | 'RESOLVING_DOUBT' | 'CLEARING';

export type GameState = {
  winners: Array<User>;
  status: Status
  isActive: boolean;
  turn: string;
  deck: Array<Card>;
  playDeck: Array<Card>;
  players: Array<RedisPlayer>;
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