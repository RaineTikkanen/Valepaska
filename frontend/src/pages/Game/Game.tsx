import Hand from './Hand';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { useEffect, useState } from 'react';
import Button from '../../components/Button';
import { leaveRoom } from '../Lobby/socketSlice.js';
import { useNavigate } from 'react-router';
import PlayCardsModal from './PlayCardsModal';
import LastPlayView from './LastPlayView.js';
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




const Game = () => {
  const game = useAppSelector((state)=> state.game);
  const hand = useAppSelector((state) => state.hand);

  const turn = game.turn;
  const user =localStorage.getItem('userId');

  const isMyTurn = turn === user;

  console.log(game.lastPlay.statement.value);
  const lastPlayIsAOr10 = game.lastPlay.statement.value === 1 || game.lastPlay.statement.value === 10;

  console.log('lastPlayIsAOr10: ', lastPlayIsAOr10);
  
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
        sameCardsInPlay={game.sameCardsInPlay}
        aboutToClear={game.aboutToClear}
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
            disabled={game.lastPlay.player === user}
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