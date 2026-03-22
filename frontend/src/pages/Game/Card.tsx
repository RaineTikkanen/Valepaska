import cardImages from '../../assets/cardImages';
import type { Card } from '../../types/game.js'
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


  const onClick = (card: Card) => {
    dispatch(toggleCardSelectState(card));
    setIsSelected(!isSelected);
  };


  return (
    <div
      key={card.name} 
      className={` max-w-35 min-w-35 transition-all ${isSelected ? '-mt-6' : ''}`}
      onClick={() => onClick(card)}
    >
      <img
        src={cardImages[card.name]}
        alt="Card Image"
        className="shadow-md"
      />
    </div>
  );
}

export default CardComponent;
