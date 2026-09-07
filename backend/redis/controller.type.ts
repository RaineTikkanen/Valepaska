import { Card } from '../deck/deck.type.js';

export interface User {
  id: string;
  hand: Card[];
}

export interface Play {
  cards: Card[];
  user: string;
  statement: Statement
}

export interface Statement {
  value: number;
  amount: number;
}

export interface GameState {
  isActive: boolean;
  turnIndex: number | null;
  deck: Card[];
  playDeck: Card[];
  users: User[];
  lastPlay: Play | null;
}