import type { Card } from './deck.type.js';

const suits = ['C', 'D', 'H', 'S'] as const;
const values = Array.from({ length: 13 }, (_, index) => index + 1);

const createDeck = (): Card[] =>
  suits.flatMap((suit) => values.map((value) => ({
    name: `${suit}${value}` as Card['name'],
    suit,
    value,
  } as Card)));


const deck: Card[] = createDeck();

const getShuffledDeck = (): Card[] => {
  const newDeck = [...deck];

  for (let i = newDeck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
  }

  return newDeck;
};

export default getShuffledDeck;
