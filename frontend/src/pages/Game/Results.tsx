import {useAppSelector} from '../../hooks/redux.ts';
import {selectPlayers} from '../Lobby/socketSlice.ts';
import {selectStatus, selectWinners} from './gameSlice.ts';
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

  return(
    <div className="flex flex-col items-center justify-center py-20">
      <h2 className="py-5 font-mono text-2xl font-bold">Tulokset</h2>
      {winners.map((u) => (
        <div className="flex flex-row" key={u.id}>
          <p className="px-5 font-mono">{winners.indexOf(u) + 1}</p>
          <p className={`font-mono ${u.id===userId ? 'font-semibold' : ''}`}>{u.name}</p>
        </div>
      ))}
      <div className="flex flex-row">
        <p className="px-5 font-mono">{players.length}</p>
        <p className={`font-mono ${loser.user.id===userId ? 'font-semibold' : ''}`}>{loser.user.name}</p>
      </div>
    </div>
  );
};


export default Results;