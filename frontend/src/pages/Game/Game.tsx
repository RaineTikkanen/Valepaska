import Hand from './Hand';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { useEffect, useState } from 'react';
import Button from '../../components/Button';
import { leaveGame } from './gameSlice.js';
import { useNavigate } from 'react-router';
import PlayCardsModal from './PlayCardsModal';

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
  console.log('hand:', hand);

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
      dispatch(leaveGame());
      void navigate('/lobby');
    }
  };

  console.log('Game state:', game);

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
      <div className="absolute inset-x-0 bottom-0 flex flex-col">
        <div className="flex justify-center">
          <Hand />
        </div>
        <div className="flex flex-row justify-center " />
        <Button
          text="Pelaa kortit"
          disabled={hand.selectedCards.length === 0 || isMyTurn === false}
          onClick={() => {
            toggleModal();
          }}
        />
      </div>
    </div>
  );
};

export default Game;