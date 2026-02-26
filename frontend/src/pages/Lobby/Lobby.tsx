import { useState, useEffect } from 'react';
import { socket } from '../../socket';
import Button from '../../components/Button';
import { useNavigate } from 'react-router';
import useField from '../../hooks/useField';
import type { Card } from '../../types/Card';
import { useAppDispatch } from '../../hooks/redux';
import { addCards } from '../Game/handSlice';

function Lobby (){
  const [isConnected, setIsConnected]=useState(socket.connected);
  const [userId, setUserId] = useState('');
  const [gameId, setGameId] = useState('');
  const inputGameId = useField('text', 'Game ID');
  const [users, setUsers] = useState<string[]>([]);
  const navigate = useNavigate();
  
  useEffect(()=>{

    const onConnect = () => {
      setIsConnected(true);
    };

    const getGuestUserId = async () => {
      console.log('getting id');
      const response = await fetch('http://localhost:3000/userId');
      const result = await response.json();
      setUserId(result.id);
      console.log(result.id);
      localStorage.setItem('userId', result.id);
    };

    const userIdFromStorage=localStorage.getItem('userId');
    const gameIdFromStorage=localStorage.getItem('gameId');
    
    console.log('gameIdFromStorage: ', gameIdFromStorage);
    console.log('userIdFromStorage: ', userIdFromStorage);


    userIdFromStorage ? setUserId(userIdFromStorage) : getGuestUserId();
    if(gameIdFromStorage) setGameId(gameIdFromStorage);


    socket.connect();
    socket.on('connect', onConnect);
    socket.on('disconnect', ()=>setIsConnected(false));

    return()=>{
      socket.off('disconnect', ()=>console.log('disconnected'));
      socket.off('connect', ()=>console.log('connected'));
    };
  },[]);

  useEffect(()=>{
    const onGameStart = () =>{
      console.log('Game Starts');
      navigate('/game');
    };

    const onJoinedGame = (users: string[]) => {
      setUsers(users);
    };

    socket.on('gameStarts', onGameStart);
    socket.on('userJoinedGame', onJoinedGame);

    return()=>{
      socket.off('gameStarts', onGameStart);
    };
  }, []);

  const createGame = () => {
    socket.emit('createGame', userId, (gameId: string) => {
      setGameId(gameId);
      localStorage.setItem('gameId', gameId);
    });
    

  };

  const joinGame = () => {
    socket.emit('joinGame', inputGameId.value, userId, (result: string) => {
      if (result==='ERR'){
        console.log('error joining game');
      }
      setGameId(inputGameId.value);
      localStorage.setItem('gameId', inputGameId.value);
    });
  };

  const leaveGame = () => {
    console.log('leaving game');
    localStorage.clear();
    setGameId('');
    setUsers([]);
    socket.emit('leaveGame', gameId, userId);
  };

  const startGame = () => {
    socket.emit('startGame', (result:string)=>{
      console.log(result);
    });
  };

  if (!isConnected || !userId){
    return(
      <h2 className="animate-pulse">Connecting...</h2>
    );
  }

  console.log('userId: ', userId);
  console.log('gameId: ', gameId);

  const userList = users.map(user => <p key={user}>{user}</p>);

  return(
    <div className="flex flex-col p-3">
      <h1 className="py-5 text-2xl">Lobby</h1>
      {userId && <h2>Vieras ID: {userId}</h2>}
      {gameId && <h2>Pelin ID: {gameId}</h2>}
      
      {users.length !== 0 ?
        <div className="py-2 transition-all">
          <h2 className="font-bold">Pelaajat:</h2>
          {userList}
        </div> 
        :
        <div />
      }

      <Button text="Luo peli" onClick={createGame} disabled={gameId!==''} />
      <label>
        Give Game ID
      </label>
      <input 
        className="mb-4 rounded bg-emerald-50 px-8 pt-6 pb-8 shadow-md"
        {...inputGameId}
      />
      <div className="flex">
        <Button 
          text="Poistu pelistä" 
          onClick={()=>leaveGame()} 
          disabled={gameId===''} 
        />
        <Button 
          text="Liity peliin" 
          onClick={()=>joinGame()} 
          disabled={inputGameId.value==='' || gameId!==''} 
        />
      </div>
      <Button 
        text="Aloita peli" 
        onClick={()=>startGame()} 
        disabled={gameId==''} 
      />
    </div>
  );
}

export default Lobby;