import Modal from '../../components/Modal';
import type { Card, Play, Statement } from '../../types/game.js';
import Button from '../../components/Button';
import { useState } from 'react';
import { playCards } from './handSlice.js';
import { useAppDispatch } from '../../hooks/redux.js';
import { cardValueToString } from '../../utils/utils.js';

interface ButtonProps {
  value: number,
  onClick: ()=> void;
  selectedValue: number | null;
  disabled?: boolean;
  lastPlayValue: number | null;
}

const CardSelectButton = (props: ButtonProps) => {
  const baseClass ='m-3 flex-1 rounded-xl p-3 duration-300 ';
  const selectedClass = baseClass.concat('bg-green-500 hover:bg-green-400 hover:cursor-pointer');
  const defaultClass = baseClass.concat('bg-emerald-400 hover:bg-green-400 hover:cursor-pointer');
  const disabledClassName=baseClass.concat('bg-emerald-400/50 cursor-not-allowed');

  const valueSmallerThanLastPlay = props.lastPlayValue !== null && props.lastPlayValue > props.value && !(props.value in [10, 1, 2]);

  const disabled = props.disabled || valueSmallerThanLastPlay;

  const selected = props.selectedValue === props.value;

  return (
    <button 
      className={disabled ? disabledClassName : selected ? selectedClass : defaultClass}
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
  selectedCards: Card[], 
  lastPlay: Play,
}

const PlayCardsModal = (props: PlayCardsModalProps) => {
  const selectedCardsCount= props.selectedCards.length;
  const lastPlay = props.lastPlay;

  const [selectedValue, setSelectedValue] = useState<number| null>(null);

  const labelText = selectedCardsCount > 1 ? `Valitse minä kortteina haluat pelata ${selectedCardsCount} korttia` : 'Valitse minä korttina haluat pelata yhden kortin';

  //TODO: Implement the logic for disabling buttons of cards that are not playable based on the selected cards and the last play.

  // Disabled conditions:
  const cantPlayCourt = lastPlay.statement.value !== null && lastPlay.statement.value < 7;
  const cantPlayAce = lastPlay.statement.value !== null && lastPlay.statement.value < 11;
  const cantPlay10 = lastPlay.statement.value !== null && lastPlay.statement.value >10;
  const cantPlayNonCourt = lastPlay.statement.value !== null && lastPlay.statement.value >10;
  const lastPlayIs2 = lastPlay.statement.value !== null && lastPlay.statement.value === 2;

  const dispatch = useAppDispatch();

  const onPlay = () => {
    if (selectedValue){
      const statement: Statement = {
        amount: selectedCardsCount,
        value: selectedValue,
      };
      dispatch(playCards(statement));
      props.toggleModal();
      setSelectedValue(null);
    }
  };

  const onClose = () => {
    setSelectedValue(null);
    props.toggleModal();
  };


  return (
    <Modal show={props.modalOn} onClose={onClose} header="Pelaa kortit">
      <div className="flex flex-col">
        <label>{labelText}</label>
        <div className="flex flex-row justify-center gap-2">
          {[3, 4, 5, 6, 7].map((value) => (
            <CardSelectButton
              key={value}
              value={value}
              disabled={cantPlayNonCourt || lastPlayIs2}
              selectedValue={selectedValue}
              lastPlayValue={lastPlay.statement.value}
              onClick={() => {
                setSelectedValue(value);
              }}
            />
          ))}
        </div>
        <div className="flex flex-row justify-center gap-2">
          {[8, 9 ].map((value) => (
            <CardSelectButton
              key={value}
              value={value}
              disabled={cantPlayNonCourt || lastPlayIs2}
              selectedValue={selectedValue}
              lastPlayValue={lastPlay.statement.value}
              onClick={() => {
                setSelectedValue(value);
              }}
            />
          ))}

          {[11, 12, 13].map((value) => (
            <CardSelectButton
              key={value}
              value={value}
              selectedValue={selectedValue}
              lastPlayValue={lastPlay.statement.value}
              onClick={() => {
                setSelectedValue(value);
              }}
              disabled={cantPlayCourt || lastPlayIs2}
            />
          ))}

        </div>
        <div className="flex flex-row justify-center gap-2">
          <CardSelectButton
            value={10}
            disabled={selectedCardsCount > 1 || cantPlay10 || lastPlayIs2}
            selectedValue={selectedValue}
            lastPlayValue={lastPlay.statement.value}
            onClick={() => {
              setSelectedValue(10);
            }}
          />
          <CardSelectButton
            value={1}
            disabled={selectedCardsCount > 1 || cantPlayAce || lastPlayIs2}
            selectedValue={selectedValue}
            lastPlayValue={lastPlay.statement.value}
            onClick={() => {
              setSelectedValue(1);
            }}
          />
          <CardSelectButton
            value={2}
            disabled={selectedCardsCount > 1}
            selectedValue={selectedValue}
            lastPlayValue={lastPlay.statement.value}
            onClick={() => {
              setSelectedValue(2);
            }}
          />
        </div>
        <Button
          text="Pelaa"
          disabled={selectedValue === null}
          onClick={() => {
            onPlay();
          }}
        />
      </div>
    </Modal>
  );
};

export default PlayCardsModal;
            