import type { Card } from './deck.type.js';

const deck: Card[] = [
  { name: 'CA', value: 1, suit: 'C' },
  { name: 'C2', value: 2, suit: 'C' }, 
  { name: 'C3', value: 3, suit: 'C' },
  { name: 'C4', value: 4, suit: 'C' },
  { name: 'C5', value: 5, suit: 'C' },
  { name: 'C6', value: 6, suit: 'C' },
  { name: 'C7', value: 7, suit: 'C' },
  { name: 'C8', value: 8, suit: 'C' },
  { name: 'C9', value: 9, suit: 'C' },
  { name: 'C10', value: 10, suit: 'C' },
  { name: 'CJ', value: 11, suit: 'C' },
  { name: 'CQ', value: 12, suit: 'C' },
  { name: 'CK', value: 13, suit: 'C' },

  { name: 'DA', value: 1, suit: 'D' },
  { name: 'D2', value: 2, suit: 'D' }, 
  { name: 'D3', value: 3, suit: 'D' },
  { name: 'D4', value: 4, suit: 'D' },
  { name: 'D5', value: 5, suit: 'D' },
  { name: 'D6', value: 6, suit: 'D' },
  { name: 'D7', value: 7, suit: 'D' },
  { name: 'D8', value: 8, suit: 'D' },
  { name: 'D9', value: 9, suit: 'D' },
  { name: 'D10', value: 10, suit: 'D' },
  { name: 'DJ', value: 11, suit: 'D' },
  { name: 'DQ', value: 12, suit: 'D' },
  { name: 'DK', value: 13, suit: 'D' },

  { name: 'HA', value: 1, suit: 'H' },
  { name: 'H2', value: 2, suit: 'H' }, 
  { name: 'H3', value: 3, suit: 'H' },
  { name: 'H4', value: 4, suit: 'H' },
  { name: 'H5', value: 5, suit: 'H' },
  { name: 'H6', value: 6, suit: 'H' },
  { name: 'H7', value: 7, suit: 'H' },
  { name: 'H8', value: 8, suit: 'H' },
  { name: 'H9', value: 9, suit: 'H' },
  { name: 'H10', value: 10, suit: 'H' },
  { name: 'HJ', value: 11, suit: 'H' },
  { name: 'HQ', value: 12, suit: 'H' },
  { name: 'HK', value: 13, suit: 'H' },

  { name: 'SA', value: 1, suit: 'S' },
  { name: 'S2', value: 2, suit: 'S' }, 
  { name: 'S3', value: 3, suit: 'S' },
  { name: 'S4', value: 4, suit: 'S' },
  { name: 'S5', value: 5, suit: 'S' },
  { name: 'S6', value: 6, suit: 'S' },
  { name: 'S7', value: 7, suit: 'S' },
  { name: 'S8', value: 8, suit: 'S' },
  { name: 'S9', value: 9, suit: 'S' },
  { name: 'S10', value: 10, suit: 'S' },
  { name: 'SJ', value: 11, suit: 'S' },
  { name: 'SQ', value: 12, suit: 'S' },
  { name: 'SK', value: 13, suit: 'S' },
];

const getShuffledDeck = (): Card[] => {
  const newDeck = [...deck];

  for (let i = newDeck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
  }
  return newDeck;
}

export default getShuffledDeck;
