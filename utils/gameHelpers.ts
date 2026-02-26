import { Card } from '../deck/deck.type.js';

const getRandomNumber = (min: number, max: number): number => {
  return Math.floor(Math.random() * ((max+1) - min)) + min;
}

const dealFromDeck = (number: number, deck: Card[]) => {
  const dealtCards: Card[] = [];
  let newDeck: Card[] = [];
  for(let i=0; i<number; i++ ){
    const index = getRandomNumber(0 , deck.length)
    const dealtCard = deck[index]
    dealtCards.push(dealtCard)
    newDeck=deck.filter((x) => x !== dealtCard)
  }
  return {newDeck, dealtCards}
}

export default dealFromDeck