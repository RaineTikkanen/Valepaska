
type CardName =
  | 'C2'
  | 'D2'
  | 'H2'
  | 'S2'
  | 'C3'
  | 'D3'
  | 'H3'
  | 'S3'
  | 'C4'
  | 'D4'
  | 'H4'
  | 'S4'
  | 'C5'
  | 'D5'
  | 'H5'
  | 'S5'
  | 'C6'
  | 'D6'
  | 'H6'
  | 'S6'
  | 'C7'
  | 'D7'
  | 'H7'
  | 'S7'
  | 'C8'
  | 'D8'
  | 'H8'
  | 'S8'
  | 'C9'
  | 'D9'
  | 'H9'
  | 'S9'
  | 'C10'
  | 'D10'
  | 'H10'
  | 'S10'
  | 'CJ'
  | 'DJ'
  | 'HJ'
  | 'SJ'
  | 'CQ'
  | 'DQ'
  | 'HQ'
  | 'SQ'
  | 'CK'
  | 'DK'
  | 'HK'
  | 'SK'
  | 'CA'
  | 'DA'
  | 'HA'
  | 'SA';

type CardSuit = 'C' | 'D' | 'H' | 'S';

type Card = {
  name: CardName;
  value: CardValue;
  suit: CardSuit;
};


type CardValue = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11| 12 | 13 ;


interface GameStateUpdate {
  turn: string | null;
  lastPlay: Play | null;
}

type Play = {
  player: string,
  statement: Statement
};

type Statement = {
  value: number,
  amount: number,
};

export type { Card, GameStateUpdate, Play, Statement };
