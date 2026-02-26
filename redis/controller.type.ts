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
  value: number | null;
  amount: number | null;
  isTrue: boolean | null;
}

export interface GameState {
  turn: string | null;
  deck: Card[];
  playDeck: Card[];
  users: User[];
  lastPlay: Play | null;
}