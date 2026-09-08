import { Card } from '../deck/deck.type.js';

export interface User {
  id: string;
  hand: Card[];
}

export interface Play {
  cards: Card[];
  user: string;
  statement: Statement;
}

export interface Statement {
  value: number | null;
  amount: number | null;
}

export interface GameState {
  isActive: boolean;
  turnIndex: number;
  deck: Card[];
  playDeck: Card[];
  users: User[];
  lastPlay: Play;
}