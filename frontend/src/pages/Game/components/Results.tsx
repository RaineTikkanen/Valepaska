import {useAppSelector} from '../../../hooks/redux.ts';
import {selectPlayers} from '../../Lobby/socketSlice.ts';
import {selectStatus, selectWinners} from '../gameSlice.ts';
import {useNavigate} from 'react-router';
import {useEffect} from 'react';


const Results = () => {
  const status = useAppSelector(selectStatus);
  const navigate = useNavigate();

  useEffect(() => {
    if (status === 'LOBBY') void navigate('/lobby');
    else if(status ==='GAME') void navigate('/game');
  }, []);

  const players = useAppSelector(selectPlayers);
  const winners = useAppSelector(selectWinners);
  const userId = localStorage.getItem('userId');
  const loser = players.find(p => !winners.some(w => w.id===p.user.id));
  if(!loser)return;
  const winnersList = winners.concat(loser.user);

  return(
    <div className="flex flex-row py-10">
      <div>
        {winnersList.map((u) => (
          <div className="flex w-5 flex-row" key={u.id}>
            <p className="font-mono">{winnersList.indexOf(u) + 1}</p>
          </div>
        ))}
      </div>
      <div className="flex w-full flex-col items-center justify-center pr-5">
        {winnersList.map((u) => (
          <div className="flex flex-row" key={u.id}>
            <p className={`font-mono ${u.id===userId ? 'font-semibold' : ''}`}>{u.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Results;