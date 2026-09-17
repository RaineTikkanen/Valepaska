
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
