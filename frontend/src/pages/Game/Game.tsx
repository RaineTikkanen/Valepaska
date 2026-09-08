import Hand from './Hand';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { useEffect, useState } from 'react';
import Button from '../../components/Button';
import { leaveRoom } from '../Lobby/socketSlice.js';
import { useNavigate } from 'react-router';
import PlayCardsModal from './PlayCardsModal';
import type { Play } from '../../types/game.js';
import cardNumbers from '../../assets/cardNumbers.js';
import cardBack from '../../assets/cardBack.svg';

const User = ({user, isActive}:{user:string, isActive:boolean}) => {
  return(
    <div className={`flex justify-center rounded-4xl px-2 py-6 ${isActive ? 'bg-emerald-400' : 'bg-emerald-400/50'}`}>
      <p>{user}</p>
    </div>
  );
};


const UserList = ({ turn }: { turn: string }) => {
  const socket = useAppSelector((state) => state.socket);
  const user = localStorage.getItem('userId');

  const users =socket.users.reduce((acc: string[], curr: string) => {
    if (curr !== user) {
      acc.push(curr);
    }
    return acc;
  }, []
  );

  return (
    <div className="flex flex-row justify-center gap-5">
      {users.map((user) => (
        <User key={user} user={user} isActive={turn === user} />
      ))}
    </div>
  );
};


const LastPlayView = ({ lastPlay, amountOfCardsInPlay }: { lastPlay: Play, amountOfCardsInPlay: number }) => {
  if (lastPlay.statement.value === null || lastPlay.statement.amount === null) return;
  const value = lastPlay.statement.value;
  const numberImage = `N${value}` as keyof typeof cardNumbers;

  const amount = lastPlay.statement.amount;

  return (
    <div>
      
      <div className="flex flex-col h-100 items-center justify-center my-3"> 
        <p>Kortteja pöydässä: {amountOfCardsInPlay}</p>
        <img
          src={cardBack}
          alt="Card back"
          className="w-24 sm:w-36  max-w-full h-auto object-contain shadow-md"
        />
        <div className="flex items-center my-5">
          {amount >1 && <p className="text-5xl">{amount} x</p>}
          <img
            src={cardNumbers[numberImage]}
            alt="Card number"
            className="size-9 ml-2"
          />
        </div>
      </div>
    </div>
  );
};


const Game = () => {
  const game = useAppSelector((state)=> state.game);
  const hand = useAppSelector((state) => state.hand);

  const turn = game.turn;

  const isMyTurn = turn === localStorage.getItem('userId');
  
  const dispatch = useAppDispatch();
  const navigate = useNavigate();


  const [modalOn, setModalOn] = useState(false);

  const toggleModal = () => {
    setModalOn(!modalOn);
  };
  

  useEffect(()=>{
    if (!game.isActive) void navigate('/lobby');
  }, []);


  const onLeaveGame = () => {
    if(window.confirm('Haluatko varmasti poistua pelistä?')){
      dispatch(leaveRoom());
      void navigate('/lobby');
    }
  };


  return (
    <div className="">
      <PlayCardsModal 
        modalOn={modalOn} 
        toggleModal={toggleModal} 
        selectedCards={hand.selectedCards} 
        lastPlay={game.lastPlay}
      />
      <Button 
        text="Poistu pelistä" 
        onClick={onLeaveGame}
      />
      <UserList turn={turn} />
      <LastPlayView 
        lastPlay={game.lastPlay}
        amountOfCardsInPlay={game.amountOfCardsInPlay} 
      />
      <div className="absolute inset-x-0 bottom-0 flex flex-col">
        <div className="flex justify-center">
          <Hand />
        </div>
        <div className="flex flex-row justify-center ">
          <Button
            text="Epäile"
            onClick={() => {
              console.log('DOUBT!');
            }}
          />
          <Button
            text="Pelaa kortit"
            disabled={hand.selectedCards.length === 0 || isMyTurn === false}
            onClick={() => {
              toggleModal();
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default Game;