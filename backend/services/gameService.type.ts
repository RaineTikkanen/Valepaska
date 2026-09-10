
export interface Play {
  user: string;
  statement: Statement
}

export interface Statement {
  value: number;
  amount: number;
}

export interface GameStateUpdate {
  lastPlay: Play;
  amountOfCardsInPlay: number;
  sameCardsInPlay: number;
}