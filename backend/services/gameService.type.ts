export interface Play {
  user: string;
  statement: Statement
}

export interface Statement {
  value: number;
  amount: number;
}

export interface GameStateUpdate {
  turn: string | null;
  lastPlay: Play | null;
}