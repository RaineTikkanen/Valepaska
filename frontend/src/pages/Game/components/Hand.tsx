import type { WheelEvent } from 'react';
import CardComponent from './Card.tsx';
import {useAppSelector} from '../../../hooks/redux.ts';
import {selectHandCards, selectSelectedCards} from './handSlice.ts';
import logger from '../../../utils/logger.ts';

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
      className="scrollbar-hidden flex flex-row items-center -space-x-16 overflow-x-auto overflow-y-hidden pt-6 md:-space-x-20 xl:-space-x-24"
      onWheel={handleWheel}
    >
      {hand.map((card, index) => (
        <CardComponent
          key={card.name}
          card={card}
          zIndex={index}
          selected={selectedCards.some((selectedCard) => selectedCard.name === card.name)}
          disabled={(selectedCards.length>3 && !selectedCards.includes(card))}
        />
      ))}
    </div>
  );
};

export default Hand;
