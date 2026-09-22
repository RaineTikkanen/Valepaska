
export interface Play {
  user: string;
  statement: Statement
}

export interface Statement {
  value: number;
  amount: number;
}

export interface GameStateUpdate {
  winners: Array<string>;
  lastPlay: Play;
  amountOfCardsInPlay: number;
  sameCardsInPlay: number;
}