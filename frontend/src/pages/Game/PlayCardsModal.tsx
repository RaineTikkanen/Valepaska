import Modal from '../../components/Modal';
import type { Play, Statement } from '../../types/game.type.ts';
import type {Card} from '../../types/deck.type.ts';
import { playCards } from './handSlice.js';
import { useAppDispatch } from '../../hooks/redux.js';
import { cardValueToString } from '../../utils/utils.js';

interface ButtonProps {
  value: number,
  onClick: ()=> void;
  disabled?: boolean;
  lastPlayValue: number | null;
}

const CardSelectButton = (props: ButtonProps) => {
  const baseClass ='xl:m-3 m-1 flex-1 rounded-xl p-3 duration-300 ';
  const defaultClass = baseClass.concat('bg-emerald-400 hover:bg-green-400 hover:cursor-pointer');
  const disabledClassName=baseClass.concat('bg-emerald-400/50 cursor-not-allowed');

  const valueSmallerThanLastPlay = props.lastPlayValue !== null && props.lastPlayValue > props.value && !(props.value in [10, 1, 2]);

  const disabled = props.disabled || valueSmallerThanLastPlay;

  return (
    <button 
      className={disabled ? disabledClassName : defaultClass}
      onClick={()=>props.onClick()}
      disabled={disabled}
    >
      {cardValueToString(props.value)}
    </button>
  );
};

interface PlayCardsModalProps {
  modalOn: boolean, 
  toggleModal: () => void, 
  selectedCards: Array<Card>, 
  lastPlay: Play | null,
}

const PlayCardsModal = (props: PlayCardsModalProps) => {
  const selectedCardsCount= props.selectedCards.length;
  const lastPlay = props.lastPlay;

  const labelText = selectedCardsCount > 1 ? `Valitse minä kortteina haluat pelata ${selectedCardsCount} korttia` : 'Valitse minä korttina haluat pelata yhden kortin';

  // Disabled conditions:
  const cantPlayCourt = lastPlay !== null && lastPlay.statement.value !== 0 && lastPlay.statement.value < 7;
  const cantPlayAce = lastPlay !== null && lastPlay.statement.value !== 0 && lastPlay.statement.value < 11;
  const cantPlay10 = lastPlay !== null && lastPlay.statement.value !== 0 && lastPlay.statement.value >10;
  const cantPlayNonCourt = lastPlay !== null && lastPlay.statement.value !== 0 && lastPlay.statement.value >10;
  const lastPlayIs2 = lastPlay !== null && lastPlay.statement.value === 2;


  const dispatch = useAppDispatch();

  const play = (value: number) => {
    const statement: Statement = {
      amount: selectedCardsCount,
      value: value,
    };
    dispatch(playCards(statement));
    props.toggleModal();
  };

  const onClose = () => {
    props.toggleModal();
  };


  return (
    <Modal show={props.modalOn} onClose={onClose} header="Pelaa kortit">
      <div className="flex flex-col">
        <label>{labelText}</label>
        <div className="flex flex-row justify-center">
          {[3, 4, 5, 6, 7].map((value) => (
            <CardSelectButton
              key={value}
              value={value}
              disabled={cantPlayNonCourt || lastPlayIs2}
              lastPlayValue={lastPlay ? lastPlay.statement.value : null}
              onClick={() => {
                play(value);
              }}
            />
          ))}
        </div>
        <div className="flex flex-row justify-center">
          {[8, 9 ].map((value) => (
            <CardSelectButton
              key={value}
              value={value}
              disabled={cantPlayNonCourt || lastPlayIs2}
              lastPlayValue={lastPlay ? lastPlay.statement.value : null}
              onClick={() => {
                play(value);
              }}
            />
          ))}

          {[11, 12, 13].map((value) => (
            <CardSelectButton
              key={value}
              value={value}
              lastPlayValue={lastPlay ? lastPlay.statement.value : null}
              onClick={() => {
                play(value);
              }}
              disabled={cantPlayCourt || lastPlayIs2}
            />
          ))}

        </div>
        <div className="flex flex-row justify-center">
          <CardSelectButton
            value={10}
            disabled={selectedCardsCount > 1 || cantPlay10 || lastPlayIs2}
            lastPlayValue={lastPlay ? lastPlay.statement.value : null}
            onClick={() => {
              play(10);
            }}
          />
          <CardSelectButton
            value={1}
            disabled={selectedCardsCount > 1 || cantPlayAce || lastPlayIs2}
            lastPlayValue={lastPlay ? lastPlay.statement.value : null}
            onClick={() => {
              play(1);
            }}
          />
          <CardSelectButton
            value={2}
            disabled={selectedCardsCount > 1}
            lastPlayValue={lastPlay ? lastPlay.statement.value : null}
            onClick={() => {
              play(2);
            }}
          />
        </div>

      </div>
    </Modal>
  );
};

export default PlayCardsModal;
            