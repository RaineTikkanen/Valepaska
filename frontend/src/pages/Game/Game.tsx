import Hand from './Hand';
import type { Card } from '../../types/Card';
import deck from '../../assets/deck';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { playCards, addCards, clearCards } from './handSlice';
import { useEffect, useState } from 'react';
import Button from '../../components/Button';

function Game() {
  
  const hand = useAppSelector((state) => state.hand);
  const dispatch = useAppDispatch();

  const [gameDeck, setGameDeck] = useState(deck);

  function dealCards(numCards: number){
    
    if (numCards>gameDeck.length){
      numCards=gameDeck.length;
    }

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
    dispatch(addCards(cards));
  }

  function playSelectedCards(){
    dispatch(playCards());
  }

  useEffect(() => {
    dealCards(5);
    return () => {
      dispatch(clearCards());
      setGameDeck(deck);
    };
  }, [])
  ;

  const cardsSelected = hand.selectedCards.length == 0;

  return (
    <div className="">
      <div className="absolute inset-x-0 bottom-0 flex flex-col">
        <div className="flex justify-center">
          <Hand />
        </div>
        <div className="flex flex-row justify-center ">
          <Button text="Jaa 5" onClick={()=>dealCards(5)} disabled={gameDeck.length===0} />
          <Button text="Pelaa kortit" onClick={playSelectedCards} disabled={cardsSelected} />
        </div>
      </div>
    </div>
  );
}

export default Game;