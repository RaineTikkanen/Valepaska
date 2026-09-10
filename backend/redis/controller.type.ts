import { Card } from '../deck/deck.type.js';
import { Statement } from '../services/gameService.type.js';

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
  turnIndex: number;
  deck: Card[];
  playDeck: Card[];
  users: User[];
  lastPlay: Play;
  statementHistory: Statement
}