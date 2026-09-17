import type { Card } from '../deck/deck.type.js';
import type { Statement } from '../services/gameService.type.js';

export interface User {
  id: string;
  hand: Card[];
}

export interface Play {
  cards: Card[];
  user: string;
  statement: Statement;
}

export interface GameState {
  isActive: boolean;
  turn: string;
  deck: Card[];
  playDeck: Card[];
  users: User[];
  lastPlay: Play;
  statementHistory: Statement
}