
type CardName = `${CardSuit}${CardValue}`;

type CardSuit = 'C' | 'D' | 'H' | 'S';

type Card = {
  name: CardName;
  value: CardValue;
  suit: CardSuit;
};


type CardValue = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11| 12 | 13 ;


interface GameStateUpdate {
  turn: string;
  lastPlay: Play;
  amountOfCardsInPlay: number;
}

type Play = {
  player: string,
  statement: Statement,
};

type Statement = {
  value: number | null,
  amount: number | null,
};


export type { Card, GameStateUpdate, Play, Statement};
