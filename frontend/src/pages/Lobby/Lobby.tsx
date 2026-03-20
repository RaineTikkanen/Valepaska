import { useState, useEffect } from 'react';
import {socket} from '../../services/webSocketService/socket.js'
import Button from '../../components/Button';
import { useNavigate } from 'react-router';
import useField from '../../hooks/useField';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { setRoomId, setUsers, clearRoom } from './roomSlice.js';

function Lobby (){
  const [isConnected, setIsConnected]=useState(socket.connected);
  const [userId, setUserId] = useState('');
  const inputGameId = useField('text', 'Game ID');
  const navigate = useNavigate();

  const room = useAppSelector((state) => state.room);
  const dispatch = useAppDispatch();
  

  const getGuestUserId = async () => {
    const response = await fetch('http://localhost:3000/userId');
    const result = await response.json();
    setUserId(result.id);
    localStorage.setItem('userId', result.id);
  };

  const onConnect = () => {
    setIsConnected(true);
  };

  const onDisconnect = () => {
    setIsConnected(false);
  };  

  const init=async()=>{
    const userIdFromStorage=localStorage.getItem('userId');

    if(userIdFromStorage){
      setUserId(userIdFromStorage);
    }else{
      await getGuestUserId();
    }
  };

  useEffect(()=>{
    init().catch((e)=>console.log(e));


    socket.connect();
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    return()=>{
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  },[]);

  useEffect(()=>{
    const onGameStart = () =>{
      navigate('/game');
    };

    const onJoinedGame = (users: string[]) => {
      dispatch(setUsers(users));
    };

    socket.on('gameStarts', onGameStart);
    socket.on('userJoinedGame', onJoinedGame);

    return()=>{
      socket.off('gameStarts', onGameStart);
    };
  }, []);

  const createGame = () => {
    socket.emit('createGame', userId, (gameId: string) => {
      dispatch(setRoomId(gameId));
    });
    

  };

  const joinGame = () => {
    socket.emit('joinGame', inputGameId.value, userId, (result: string) => {
      if (result==='ERR'){
        window.alert('Error joining game. Please check the Game ID and try again.');
        return;
      }
      dispatch(setRoomId(inputGameId.value));
      localStorage.setItem('gameId', inputGameId.value);
    });
  };

  const leaveGame = () => {
    localStorage.clear();
    dispatch(clearRoom());
    socket.emit('leaveGame', room.roomId, userId);
  };

  const startGame = () => {
    socket.emit('startGame', room.roomId, (result:string)=>{
      if(result==='ERR'){
        console.log('error starting game');
        window.alert('Error starting game. Please try again.');
      }
    });
  };

  if (!isConnected || !userId){
    return(
      <h2 className="animate-pulse">Connecting...</h2>
    );
  }

  const userList = room.users.map((user, index) => (
    <p key={index}>{user}</p>
  ));

  return(
    <div className="flex flex-col p-3">
      <h1 className="py-5 text-2xl">Lobby</h1>
      {userId && <h2>Vieras ID: {userId}</h2>}
      {room.roomId && <h2>Pelin ID: {room.roomId}</h2>}
      
      {room.users.length !== 0 ?
        <div className="py-2 transition-all">
          <h2 className="font-bold">Pelaajat:</h2>
          {userList}
        </div> 
        :
        <div />
      }

      <Button text="Luo peli" onClick={createGame} disabled={room.roomId!==''} />
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
          disabled={room.roomId===''} 
        />
        <Button 
          text="Liity peliin" 
          onClick={()=>joinGame()} 
          disabled={inputGameId.value==='' || room.roomId!==''} 
        />
      </div>
      <Button 
        text="Aloita peli" 
        onClick={()=>startGame()} 
        disabled={room.roomId==''} 
      />
    </div>
  );
}

export default Lobby;