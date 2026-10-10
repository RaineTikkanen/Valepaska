import {type Card, CardSuits, CardValues} from '../types/deck.type.js';




const createDeck = (): Array<Card> =>
  CardSuits.flatMap((suit) => CardValues.map((value) => ({
    name: `${suit}${value}`,
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
