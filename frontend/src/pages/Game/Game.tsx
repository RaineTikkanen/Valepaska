import Hand from './Hand';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { useEffect, useState } from 'react';
import Button from '../../components/Button';
import {leaveRoom, selectPlayers} from '../Lobby/socketSlice.js';
import { useNavigate } from 'react-router';
import PlayCardsModal from './PlayCardsModal';
import LastPlayView from './LastPlayView.js';
import { doubt } from './handSlice.js';
import logger from '../../utils/logger.ts';
import { selectSelectedCards } from './handSlice.js';
import {resetGame, selectGameState} from './gameSlice.ts';
import type {User} from '../../../../backend/types/game.type.ts';


interface UserElementProps {
  user: string;
  isActive: boolean;
  position?: number;
  amountOfCards: number;
}

const UserElement = ({user, isActive, position, amountOfCards}:UserElementProps) => {
  const positionColor =
    position === 1 ? 'bg-yellow-500' :
      position === 2 ? 'bg-gray-400' :
        position === 3 ? 'bg-orange-700' :
          '';



  return(
    <div className="flex flex-row items-center justify-center">
      {(position == 1 || position == 2 || position == 3) &&
          <div className={`mx-2 flex flex-col items-center justify-center rounded-4xl px-6 py-4 ${positionColor}`}>
            <p>{position}</p>
          </div>
      }
      <div className={`flex min-w-30 flex-col items-center justify-center rounded-4xl px-2 py-6  ${isActive ? 'bg-emerald-400' : 'bg-emerald-400/50'}`}>
        <p>{user}</p>
        <p>kortit: {amountOfCards}</p>
      </div>
    </div>
  );
};



const UserList = ({ turn, winners }: { turn: string, winners: Array<User> }) => {
  const players = useAppSelector(selectPlayers);

  const userId = localStorage.getItem('userId');

  return (
    <div className="flex flex-row justify-center gap-5">
      {players.map((player) => (
        <UserElement
          key={player.user.id}
          user={player.user.id === userId ? 'Sinä' : player.user.name}
          isActive={turn === player.user.id}
          amountOfCards={player.amountOfCards}
          position={winners.findIndex(u => u.id === player.user.id)+1}
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
  const userId = localStorage.getItem('userId');


  const isMyTurn = turn === userId;

  const lastPlayIsAOr10 = game.lastPlay.statement.value === 1 || game.lastPlay.statement.value === 10;

  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const position = game.winners.findIndex(u => u.id === userId);

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
    <div className="flex min-h-dvh flex-col justify-between">
      <PlayCardsModal
        modalOn={modalOn}
        toggleModal={toggleModal}
        selectedCards={selectedCards}
        lastPlay={game.lastPlay}
      />
      <div className="flex items-center justify-center p-5">
        <p>Pakka: {game.cardsInDeck}</p>

      </div>
      <div className="absolute">
        <Button
          text="Poistu pelistä"
          onClick={onLeaveGame}
        />
      </div>
      <UserList turn={turn} winners={game.winners} />
      <LastPlayView />
      <div className="mt-auto flex flex-col">
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
            disabled={game.lastPlay.user.id === userId || !game.lastPlay.user.id}
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