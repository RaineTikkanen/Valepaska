import {parseId} from '../utils/utils.js';
import {CardValues} from './deck.type.js';
import type {ClientStatus} from './controller.type.js';

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

export type GamePlayer = {
  user: User;
  amountOfCards: number;
};

export type GameStateUpdate = {
  winners: Array<User>;
  lastPlay: Play | null;
  amountOfCardsInPlay: number;
  sameCardsInPlay: number;
  players: Array<GamePlayer>;
  cardsInDeck: number;
  clientStatus: ClientStatus,
};

export const parseStatement = (statement: unknown): Statement => {
  if(!statement
    || typeof statement !== 'object'
    || !('value' in statement)
    || typeof statement.value !== 'number'
    || !('amount' in statement)
    || typeof statement.amount !== 'number'
    || statement.amount < 1
    || statement.amount > 4
    || !CardValues.some(value => value === statement.value)
    || (statement.value === 1 && statement.amount !== 1)
    || (statement.value === 2 && statement.amount !== 1)
    || (statement.value === 10 && statement.amount !== 1)
  )
  {
    throw new Error('Invalid statement');
  }



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
  }

  return {id:parseId(user.id), name: user.name };
};