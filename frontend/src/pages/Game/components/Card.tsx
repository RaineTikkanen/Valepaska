import cardImages from '../../../assets/cardImages.ts';
import type { Card } from '../../../types/deck.type.ts';
import {useAppDispatch} from '../../../hooks/redux.ts';
import { toggleCardSelectState } from './handSlice.ts';

interface Props {
  card: Card;
  zIndex: number;
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
      className={`shrink-0 transition-all ${props.disabled ? 'cursor-not-allowed':'hover:cursor-pointer' } ${props.selected ? '-translate-y-6' : ''}`}
      style={{ zIndex: props.zIndex }}
      onClick={() => onClick()}
    >
      <img
        src={cardImages[cardName]}
        alt="Card Image"
        className="max-w-30 shadow-md md:max-w-35 xl:max-w-40"
      />
    </div>
  );
}

export default CardComponent;
