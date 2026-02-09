import CardComponent from './Card.tsx';
import { useAppSelector } from '../../hooks/redux';

function Hand() {
  const hand = useAppSelector((state) => state.hand);
  return (
    <div className="flex flex-row overflow-scroll p-6 h-60">
      {hand.cards.map((card) => (
        <CardComponent key={card.name} card={card} />
      ))}
    </div>
  );
}

export default Hand;
