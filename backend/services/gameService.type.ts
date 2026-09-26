
export type Play = {
  user: string;
  statement: Statement
};

export type Statement = {
  value: number;
  amount: number;
};

export type GameStateUpdate = {
  winners: Array<string>;
  lastPlay: Play;
  amountOfCardsInPlay: number;
  sameCardsInPlay: number;
};

export const parseStatement = (statement: unknown): Statement => {
  if(!statement
    || typeof statement !== 'object'
    || !('value' in statement)
    || typeof statement.value !== 'number'
    || !('amount' in statement)
    || typeof statement.amount !== 'number'){
    throw new Error('Invalid statement');
  }
  return {value:statement.value, amount:statement.amount};
};