import {isString} from '../utils/utils.js';
type CardName = `${CardSuit}${CardValue}`;


const CardSuits = ['C', 'D', 'H', 'S'] as const;
type CardSuit = typeof CardSuits[number];

type Card = {
  name: CardName;
  value: CardValue;
  suit: CardSuit;
};


const CardValues = [ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13] as const;
type CardValue = typeof CardValues[number];

export { CardValues, CardSuits };
export type { Card, CardSuit, CardName, CardValue };



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
