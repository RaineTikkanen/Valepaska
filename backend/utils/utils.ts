import { validate as uuidValidate } from 'uuid';
import type { Card, CardName, CardSuit, CardValue } from '../deck/deck.type.js';
import { CardSuits, CardValues } from '../deck/deck.type.js';

export const parseId = (id: unknown): string => {
  if (!id || !isString(id)) {
    throw new Error('Id is not a string');
  }
  if (!uuidValidate(id)) {
    throw new Error('Invalid id format');
  }
  return id;
};

export const parseCardValue = (valueToCheck: unknown): CardValue => {
  const value = CardValues.find((v)=> v===valueToCheck);
  if(!value) throw new Error('Card value parsing failed');
  return value;
};

export const parseCardSuit = (suitToCheck: unknown): CardSuit => {
  const suit = CardSuits.find((s) => s===suitToCheck);
  if(!suit) throw new Error('Card suit parsing failed');
  return suit;
};

export const parseCardName = (nameToCheck: unknown): CardName => {
  if(!isString(nameToCheck)) throw new Error('Card name is not a string');
  const suitString = nameToCheck.substring(0,1);
  const valueString = nameToCheck.substring(1);
  
  const suit = parseCardSuit(suitString);
  const value = parseCardValue(parseInt(valueString));
  return `${suit}${value}`;
};

export const parseCard = (card: unknown): Card => {
  if(!card || typeof card !== 'object' || !('name' in card) 
    || !('value' in card) || !('suit' in card)) {
    throw new Error('Error parsing card');
  }

  const value = parseCardValue(card.value);
  const suit = parseCardSuit(card.suit);
  const name = parseCardName(card.name);

  const constructedName = `${suit}${value}`;
  if(name!==constructedName) throw new Error('Name not matching suit and value');

  return {value:value, suit:suit, name:name};
};

export const isString = (text: unknown): text is string => {
  return typeof text === 'string' || text instanceof String;
};


export const getRandomInt = (max:number): number => {
  return Math.floor(Math.random() * max);
};

export const timeout = async (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};
