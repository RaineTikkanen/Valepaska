import Hand from './Hand';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { useEffect, useState } from 'react';
import Button from '../../components/Button';
import {leaveRoom, selectUsers} from '../Lobby/socketSlice.js';
import { useNavigate } from 'react-router';
import PlayCardsModal from './PlayCardsModal';
import LastPlayView from './LastPlayView.js';
import { doubt } from './handSlice.js';
import logger from '../../utils/logger.ts';
import { selectSelectedCards } from './handSlice.js';
import {resetGame, selectGameState} from './gameSlice.ts';


const User = ({user, isActive, position}:{user:string, isActive:boolean, position?: number}) => {
  const positionColor =
    position === 1 ? 'bg-yellow-500' :
      position === 2 ? 'bg-gray-400' :
        position === 3 ? 'bg-orange-700' :
          '';

  return(
    <div className={'flex flex-row items-center justify-center'}>
      {(position == 1 || position == 2 || position == 3) &&
          <div className={`mx-2 flex flex-col items-center justify-center rounded-4xl px-6 py-4 ${positionColor}`}>
            <p>{position}</p>
          </div>
      }
      <div className={`flex justify-center rounded-4xl px-2 py-6 ${isActive ? 'bg-emerald-400' : 'bg-emerald-400/50'}`}>
        <p>{user}</p>
      </div>
    </div>
  );
};


const UserList = ({ turn, winners }: { turn: string, winners: Array<string> }) => {
  const allUsers = useAppSelector(selectUsers);
  const user = localStorage.getItem('userId');

  const users=allUsers.filter(u => u !== user);


  return (
    <div className="flex flex-row justify-center gap-5">
      {users.map((user) => (
        <User
          key={user}
          user={user}
          isActive={turn === user}
          position={winners.findIndex(u => u === user)+1}
        />
      ))}
    </div>
  );
};




const Game = () => {
  const game = useAppSelector(selectGameState);
  const selectedCards = useAppSelector(selectSelectedCards);

  logger.debug('[Game] game: ', game);


  const turn = game.turn;
  const user = localStorage.getItem('userId');


  const isMyTurn = turn === user;

  const lastPlayIsAOr10 = game.lastPlay.statement.value === 1 || game.lastPlay.statement.value === 10;

  const dispatch = useAppDispatch();
  const navigate = useNavigate();


  const position = game.winners.findIndex(u => u === user);
  console.log(position);


  const [modalOn, setModalOn] = useState(false);

  const toggleModal = () => {
    setModalOn(!modalOn);
  };


  useEffect(() => {
    if (game.status === 'LOBBY') void navigate('/lobby');
    if (game.status === 'FINISHED') {
      setTimeout(() => void navigate('/results'), 3000);
    }
  }, [game.status]);


  const onLeaveGame = () => {
    if (window.confirm('Haluatko varmasti poistua pelistä?')) {
      dispatch(leaveRoom());
      dispatch(resetGame());
      void navigate('/lobby');
    }
  };

  return (
    <div className="">
      <PlayCardsModal
        modalOn={modalOn}
        toggleModal={toggleModal}
        selectedCards={selectedCards}
        lastPlay={game.lastPlay}
      />
      <Button
        text="Poistu pelistä"
        onClick={onLeaveGame}
      />
      <UserList turn={turn} winners={game.winners} />
      <LastPlayView />
      <div className="absolute inset-x-0 bottom-0 flex flex-col">
        <div className="flex justify-center">
          {position !== -1 ?
            <div className="flex h-40 flex-col items-center justify-center">
              <p>Sijoituksesi: {position + 1}</p>
            </div>
            :
            <Hand />}
        </div>
        <div className="flex flex-row justify-center ">
          <Button
            text="Epäile"
            disabled={game.lastPlay.user === user || !game.lastPlay.user}
            onClick={() => {
              dispatch(doubt());
            }}
          />
          <Button
            text="Pelaa"
            disabled={selectedCards.length === 0 || !isMyTurn || lastPlayIsAOr10 || game.aboutToClear}
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