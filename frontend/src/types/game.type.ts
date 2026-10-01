
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
  lastPlay: Play;
  amountOfCardsInPlay: number;
  sameCardsInPlay: number;
  players: Array<GamePlayer>;
  cardsInDeck: number;
};