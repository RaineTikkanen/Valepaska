
export interface Play {
  user: string;
  statement: Statement
}

export interface Statement {
  value: number | null;
  amount: number | null;
}

export interface GameStateUpdate {
  lastPlay: Play;
  amountOfCardsInPlay: number;
}