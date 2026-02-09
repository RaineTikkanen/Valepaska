import Hand from './Hand';
import type { Card } from '../../types/Card';
import deck from '../../assets/deck';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { useEffect, useState } from 'react';

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
    dispatch({ type: 'hand/clearChosenCards' });
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
      <div className="flex justify-center flex-grow ">
        <button 
          className="transition-all m-3 w-sm md:w-xl sm:md rounded-xl bg-emerald-400 p-3 hover:bg-emerald-500 hover:cursor-pointer"
          onClick={()=>dealCards(5)}>
          Deal 5
        </button>
        <button 
        className="m-3 w-sm md:w-xl sm:md rounded-xl bg-emerald-400 p-3 hover:bg-emerald-500"
        onClick={playCards}>
          Play
        </button>
      </div>
      <div className="flex justify-center inset-x-0 bottom-0 absolute">
        <Hand />
      </div>
    </div>
  );
}

export default Game;