import CardComponent from './Card.tsx';
import { useAppSelector } from '../../hooks/redux';

function Hand() {
  const hand = useAppSelector((state) => state.hand);
  return (
    <div className="flex h-60 flex-row overflow-scroll p-6 ease-in-out">
      {hand.cards.map((card) => (
        <CardComponent key={card.name} card={card} />
      ))}
    </div>
  );
}

export default Hand;
