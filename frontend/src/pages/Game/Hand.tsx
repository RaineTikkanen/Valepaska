import type { WheelEvent } from 'react';
import CardComponent from './Card.tsx';
import {useAppSelector} from '../../hooks/redux';
import {selectHandCards, selectSelectedCards} from './handSlice.ts';
import logger from '../../utils/logger.ts';

const Hand = () => {
  const hand = useAppSelector(selectHandCards);
  const selectedCards = useAppSelector(selectSelectedCards);

  logger.debug('[Hand] selectedCards: ', selectedCards);

  const handleWheel = (event: WheelEvent<HTMLDivElement>) => {
    const handElement = event.currentTarget;
    if (handElement.scrollWidth <= handElement.clientWidth) return;

    const scrollAmount = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
    if (scrollAmount === 0) return;

    handElement.scrollLeft += scrollAmount;
  };

  return (
    <div
      className="scrollbar-hidden flex max-h-60 min-h-40 flex-row overflow-x-auto overflow-y-hidden p-6 ease-in-out"
      onWheel={handleWheel}
    >
      {hand.map((card) => (
        <CardComponent
          key={card.name}
          card={card}
          selected={selectedCards.some((selectedCard) => selectedCard.name === card.name)}
          disabled={(selectedCards.length>3 && !selectedCards.includes(card))}
        />
      ))}
    </div>
  );
};

export default Hand;
