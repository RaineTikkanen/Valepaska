import {parseId} from '../utils/utils.js';

export type Play = {
  user: User;
  statement: Statement
};

export type Statement = {
  value: number;
  amount: number;
};

export type User = {
  name: string;
  id: string;
};

export type GameStateUpdate = {
  winners: Array<User>;
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
    || typeof statement.amount !== 'number')
    throw new Error('Invalid statement');

  return {value:statement.value, amount:statement.amount};
};

export const parseUser = (user: unknown) :User => {
  if(!user
    || typeof user !== 'object'
    || !('id' in user)
    || typeof user.id !== 'string'
    || !('name' in user)
    || typeof user.name !== 'string'
    || user.name.length > 20
    || user.name.length <4){
    throw new Error('Invalid user');
  };

  return {id:parseId(user.id), name: user.name };
};