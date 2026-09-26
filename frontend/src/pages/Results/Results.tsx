import {useAppSelector} from '../../hooks/redux.ts';
import {selectUsers} from '../Lobby/socketSlice.ts';
import {selectStatus, selectWinners} from '../Game/gameSlice.ts';
import {useNavigate} from 'react-router';
import {useEffect} from 'react';

const Results = () => {
  const status = useAppSelector(selectStatus);
  const navigate = useNavigate();
  console.log(status);

  useEffect(() => {
    if (status !== 'FINISHED') void navigate('/lobby');
  }, []);

  const users = useAppSelector(selectUsers);
  const winners = useAppSelector(selectWinners);
  const user = localStorage.getItem('userId');
  const loser = users.find(u => !winners.some(w => w===u));

  return(
    <div className="flex flex-col items-center justify-center py-20">
      <h2 className="py-5 font-mono text-2xl font-bold">Tulokset</h2>
      {winners.map((u) => (
        <div className="flex flex-row" key={u}>
          <p className="px-5 font-mono">{winners.indexOf(u) + 1}</p>
          <p className={`font-mono ${u===user ? 'font-semibold' : ''}`}>{u}</p>
        </div>
      ))}
      <div className="flex flex-row">
        <p className="px-5 font-mono">{users.length}</p>
        <p className={`font-mono ${loser===user ? 'font-semibold' : ''}`}>{loser}</p>
      </div>
    </div>
  );
};


export default Results;