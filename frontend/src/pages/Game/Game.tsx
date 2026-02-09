import Hand from './Hand';
import type { Card } from '../../types/Card';
import deck from '../../assets/deck';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { useEffect, useState } from 'react';
import Button from '../../components/Button'

function Game() {
  
  const hand = useAppSelector((state) => state.hand);
  const dispatch = useAppDispatch();

  const [gameDeck, setGameDeck] = useState(deck);

  function dealCards(numCards: number){
    let deck = gameDeck;
    const cards: Card[] = [];
    for (let i = 0; i < numCards; i++) {
      const randomIndex = Math.floor(Math.random() * deck.length);
      const card = deck[randomIndex];
      cards.push(card);
      deck = deck.filter(
        c => c.name !== card.name
      );
    }
    setGameDeck(deck);
    dispatch({ type: 'hand/addCards', payload: cards });
  }

  function playCards(){
    dispatch({ type: 'hand/removeCards', payload: hand.selectedCards });
    dispatch({ type: 'hand/clearSelectedCards' });
    console.log("Selected: ", hand.selectedCards)
  }

  useEffect(() => {
    dealCards(10);
    return () => {
      dispatch({ type: 'hand/clearCards' });
      setGameDeck(deck);
    };
  }, [])
  ;

  return (
    <div className="">
      <div className="flex flex-grow  justify-center ">
        <Button text="Jaa 5" onClick={()=>dealCards(5)}/ >
        <Button text="Pelaa kortit" onClick={playCards}/ >
      </div>
      <div className="absolute inset-x-0 bottom-0 flex justify-center">
        <Hand />
      </div>
    </div>
  );
}

export default Game;