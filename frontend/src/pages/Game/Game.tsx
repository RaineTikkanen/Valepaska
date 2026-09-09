import Hand from './Hand';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { useEffect, useState } from 'react';
import Button from '../../components/Button';
import { leaveRoom } from '../Lobby/socketSlice.js';
import { useNavigate } from 'react-router';
import PlayCardsModal from './PlayCardsModal';
import type { Card, Play } from '../../types/game.js';
import cardNumbers from '../../assets/cardNumbers.js';
import cardImages from '../../assets/cardImages.js';
import cardBack from '../../assets/cardBack.svg';
import { doubt } from './handSlice.js';

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



const LastPlayView = ({ lastPlay, amountOfCardsInPlay, doubter, doubtResult }: { lastPlay: Play, amountOfCardsInPlay: number, doubter: string, doubtResult: Card[] | null }) => {
  if (lastPlay.statement.value === null || lastPlay.statement.amount === null) return;
  const value = lastPlay.statement.value;
  const numberImage = `N${value}` as keyof typeof cardNumbers;

  const amount = lastPlay.statement.amount;
  const doubtWasCorrect = doubtResult !== null && !doubtResult.every((card) => card.value === value);
  const aceOrTenWasPlayed = value === 1 || value === 10;

  return (
    <div className="relative">
      {doubter !== '' && (
        <div className="absolute inset-x-0 top-0 z-10 flex justify-center">
          <div className="rounded-xl bg-red-600 px-6 py-4 text-center text-xl font-bold text-white shadow-lg">
            {doubter} epäilee!!
          </div>
        </div>
      )}
      {doubtResult !== null && (
        <div className="absolute inset-x-0 top-0 z-10 flex justify-center">
          <div className="rounded-xl bg-amber-500 px-6 py-4 text-center text-xl font-bold text-white shadow-lg">
            <p>{doubtWasCorrect ? 'Epäily oli oikein!' : 'Epäily oli väärä!'}</p>
            <div className="mt-3 flex max-w-[90vw] flex-wrap justify-center gap-2">
              {doubtResult.map((card) => (
                <img
                  key={card.name}
                  src={cardImages[card.name]}
                  alt={`${card.suit}${card.value}`}
                  className="h-24 w-auto shadow-md"
                />
              ))}
            </div>
          </div>
        </div>
      )}
      {aceOrTenWasPlayed && (
        <div className="absolute inset-x-0 top-0 z-10 flex justify-center">
          <div className="rounded-xl bg-blue-600 px-6 py-4 text-center text-xl font-bold text-white shadow-lg">
            Ässä tai kymppi pelattu!
          </div>
        </div>
      )}
      
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

  console.log(game.lastPlay.statement.value)
  const lastPlayIsAOr10 = game.lastPlay.statement.value === 1 || game.lastPlay.statement.value === 10

  console.log('lastPlayIsAOr10: ', lastPlayIsAOr10)
  
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


  console.log('hand.selectedCards.length: ', hand.selectedCards.length)
  console.log('isMyTurn: ', isMyTurn);

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
        doubter={game.doubter}
        doubtResult={game.doubtResult}
      />
      <div className="absolute inset-x-0 bottom-0 flex flex-col">
        <div className="flex justify-center">
          <Hand />
        </div>
        <div className="flex flex-row justify-center ">
          <Button
            text="Epäile"
            onClick={() => {
              dispatch(doubt());
            }}
          />
          <Button
            text="Pelaa"
            disabled={hand.selectedCards.length === 0 || isMyTurn === false || lastPlayIsAOr10}
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