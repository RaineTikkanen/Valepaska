export interface Play {
  user: string;
  statement: Statement
}

export interface Statement {
  value: number | null;
  amount: number | null;
}

export interface GameStateUpdate {
  turn: string;
  lastPlay: Play;
  amountOfCardsInPlay: number | null;
}