import cardImages from '../../assets/cardImages';
import type { Card } from '../../types/game.js';
import {useAppSelector, useAppDispatch} from '../../hooks/redux';
import { toggleCardSelectState, selectSelectedCards } from './handSlice';
import { useState, useEffect } from 'react';

function CardComponent({ card }: { card: Card }) {
  const [isSelected, setIsSelected] = useState(false);
  const selectedCards = useAppSelector(selectSelectedCards);


  useEffect(()=>{
    if (selectedCards.includes(card)){
      setIsSelected(true);
    }
  },[]);

  const dispatch=useAppDispatch();

  const cantSelect = (selectedCards.length>3 && !isSelected)


  const onClick = (card: Card) => {
    if(cantSelect) return;
    dispatch(toggleCardSelectState(card));
    setIsSelected(!isSelected);
  };
  const cardName = card.name;

  console.log(selectedCards)

  return (
    <div
      key={cardName} 
      className={` max-w-35 min-w-35 transition-all ${cantSelect? 'cursor-not-allowed':'hover:cursor-pointer' } ${isSelected ? '-mt-6' : ''}`}
      onClick={() => onClick(card)}
    >
      <img
        src={cardImages[cardName]}
        alt="Card Image"
        className="shadow-md"
      />
    </div>
  );
}

export default CardComponent;
