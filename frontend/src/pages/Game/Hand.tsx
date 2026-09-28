import CardComponent from './Card.tsx';
import {useAppSelector} from '../../hooks/redux';
import {selectHandCards, selectSelectedCards} from './handSlice.ts';
import logger from '../../utils/logger.ts';

const Hand = () => {
  const hand = useAppSelector(selectHandCards);
  const selectedCards = useAppSelector(selectSelectedCards);

  logger.debug('[Hand] selectedCards: ', selectedCards);

  return (
    <div className="scrollbar-hidden flex max-h-60 min-h-40 flex-row overflow-x-auto overflow-y-hidden p-6 ease-in-out">
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
