import cardImages from '../../assets/cardImages';
import type { Card } from '../../types/game.js';
import {useAppSelector, useAppDispatch} from '../../hooks/redux';
import { toggleCardSelectState, selectSelectedCards } from './handSlice';

function CardComponent({ card }: { card: Card }) {
  const selectedCards = useAppSelector(selectSelectedCards);


  const dispatch=useAppDispatch();

  const cantSelect = (selectedCards.length>3 && !selectedCards.includes(card));


  const onClick = (card: Card) => {
    if(cantSelect) return;
    dispatch(toggleCardSelectState(card));
  };
  const cardName = card.name;

  return (
    <div
      key={cardName} 
      className={` max-w-35 min-w-35 transition-all ${cantSelect? 'cursor-not-allowed':'hover:cursor-pointer' } ${selectedCards.includes(card) ? '-mt-6' : ''}`}
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
