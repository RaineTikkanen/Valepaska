import Modal from '../../components/Modal';
import type { Card, Play } from '../../types/game.js';
import Button from '../../components/Button';
import { useState } from 'react';


interface ButtonProps {
  value: string,
  onClick: ()=> void;
  selectedValue: string | null;
  disabled?: boolean;
}

const CardSelectButton = (props: ButtonProps) => {
  const baseClass ='m-3 flex-1 rounded-xl p-3 duration-300 ';
  const selectedClass = baseClass.concat('bg-green-500 hover:bg-green-400 hover:cursor-pointer');
  const defaultClass = baseClass.concat('bg-emerald-400 hover:bg-green-400 hover:cursor-pointer');
  const disabledClassName=baseClass.concat('bg-emerald-400/50 cursor-not-allowed');

  

  const selected = props.selectedValue === props.value;

  return (
    <button 
      className={props.disabled ? disabledClassName : selected ? selectedClass : defaultClass}
      onClick={()=>props.onClick()}
      disabled={props.disabled}
    >
      {props.value}
    </button>
  );
};

interface PlayCardsModalProps {
  modalOn: boolean, 
  toggleModal: () => void, 
  selectedCards: Card[], 
  lastPlay: Play | null}

const PlayCardsModal = (props: PlayCardsModalProps) => {
  const selectedCardsCount= props.selectedCards.length;
  const lastPlay = props.lastPlay;

  const [selectedValue, setSelectedValue] = useState<string | null>(null);

  const labelText = selectedCardsCount > 1 ? `Valitse minä kortteina haluat pelata ${selectedCardsCount} korttia` : 'Valitse minä korttina haluat pelata yhden kortin';

  //TODO: Implement the logic for disabling buttons of cards that are not playable based on the selected cards and the last play.

  // Disabled conditions:
  const lastPlayUnder7 = lastPlay === null || lastPlay.statement.value < 7;
  const lastPlayNotCourt = lastPlay !== null && lastPlay.statement.value <11;

  

  const onClose = () => {
    setSelectedValue(null);
    props.toggleModal();
  };


  return (
    <Modal show={props.modalOn} onClose={onClose} header="Pelaa kortit">
      <div className="flex flex-col">
        <label>{labelText}</label>
        <div className="flex flex-row justify-center gap-2">
          {['3', '4', '5', '6', '7'].map((value) => (
            <CardSelectButton
              key={value}
              value={value}
              selectedValue={selectedValue}
              onClick={() => {
                setSelectedValue(value);
              }}
            />
          ))}
        </div>
        <div className="flex flex-row justify-center gap-2">
          {['8', '9'].map((value) => (
            <CardSelectButton
              key={value}
              value={value}
              selectedValue={selectedValue}
              onClick={() => {
                setSelectedValue(value);
              }}
            />
          ))}

          {['J', 'Q', 'K'].map((value) => (
            <CardSelectButton
              key={value}
              value={value}
              selectedValue={selectedValue}
              disabled={lastPlayUnder7}
              onClick={() => {
                setSelectedValue(value);
              }}
            />
          ))}
        </div>
        <div className="flex flex-row justify-center gap-2">
          <CardSelectButton
            value={'10'}
            disabled={selectedCardsCount > 1}
            selectedValue={selectedValue}
            onClick={() => {
              setSelectedValue('10');
            }}
          />
          <CardSelectButton
            value={'A'}
            disabled={selectedCardsCount > 1 || lastPlayNotCourt}
            selectedValue={selectedValue}
            onClick={() => {
              setSelectedValue('A');
            }}
          />
          <CardSelectButton
            value={'2'}
            disabled={selectedCardsCount > 1}
            selectedValue={selectedValue}
            onClick={() => {
              setSelectedValue('2');
            }}
          />
        </div>
        <Button text="Pelaa" 
          disabled={selectedValue===null}
          onClick={() => {
            console.log('Pelaa kortit');
            onClose();
          }}
        />
      </div>
    </Modal>
  );
};

export default PlayCardsModal;
            