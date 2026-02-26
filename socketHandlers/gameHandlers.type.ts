import { Card } from '../deck/deck.type.js';

export interface Play {
  player: string;
  statement: Statement
}

export interface Statement {
  value: number;
  amount: number;
}

export interface gameStateUpdate {
  turn: string | null;
  lastPlay: Play | null;
}