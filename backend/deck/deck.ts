import type { Card } from '../types/deck.type.js';

const suits = ['C', 'D', 'H', 'S'] as const;
const values = Array.from({ length: 13 }, (_, index) => index + 1);

const createDeck = (): Array<Card> =>
  suits.flatMap((suit) => values.map((value) => ({
    name: `${suit}${value}` as Card['name'],
    suit,
    value,
  } as Card)));


const getShuffledDeck = (): Array<Card> => {
  const newDeck = createDeck();

  for (let i = newDeck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
  }

  //for development purposes deal only 15 cards so game ends faster
  if(process.env.NODE_ENV === 'development') {
    return newDeck.splice(0,15);
  }

  return newDeck;
};

export default getShuffledDeck;
