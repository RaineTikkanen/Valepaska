import cardImages from '../../assets/cardImages';
import type { Card } from '../../types/game.js';
import {useAppDispatch} from '../../hooks/redux';
import { toggleCardSelectState } from './handSlice';

interface Props {
  card: Card;
  selected: boolean;
  disabled: boolean;
}

function CardComponent(props: Props) {
  const card = props.card;

  const dispatch=useAppDispatch();

  const onClick = () => {
    if(props.disabled) return;
    dispatch(toggleCardSelectState(card));
  };
  const cardName = card.name;

  return (
    <div
      key={cardName} 
      className={` max-w-35 min-w-35 transition-all ${props.disabled ? 'cursor-not-allowed':'hover:cursor-pointer' } ${props.selected ? '-mt-6' : ''}`}
      onClick={() => onClick()}
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
