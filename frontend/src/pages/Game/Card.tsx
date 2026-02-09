import cardImages from '../../assets/cardImages';
import type { Card } from '../../types/Card';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { useState, useEffect } from 'react';

function CardComponent({ card }: { card: Card }) {
  const [isSelected, setIsSelected] = useState(false);

  const hand = useAppSelector((state) => state.hand);

  const dispatch = useAppDispatch();

  const toggleCardSelection = (card: Card) => {
    const isChosen = hand.selectedCards.some((c) => c.name === card.name);
    if (isChosen) {
      dispatch({ type: 'hand/deselectCard', payload: card });
      setIsSelected(false);
    } else {
      dispatch({ type: 'hand/selectCard', payload: card });
      setIsSelected(true);
    }
  };

  useEffect(() => {
    const isChosen = hand.selectedCards.some((c) => c.name === card.name);
    setIsSelected(isChosen);
  }, [hand.selectedCards, card]);

  return (
    <div
      key={card.name} 
      className={` max-w-35 min-w-35 transition-all ${isSelected ? '-mt-6' : ''}`}
      onClick={() => toggleCardSelection(card)}
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
