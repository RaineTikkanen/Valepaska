import { useState, useEffect } from 'react';
import Button from '../../components/Button';
import { useNavigate } from 'react-router';
import useField from '../../hooks/useField';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { connect, createRoom, joinRoom, leaveRoom, selectSocketState } from './socketSlice.js';
import { startGame, selectStatus } from '../Game/gameSlice.js';
import { isString } from '../../utils/typeGuards.js';
import { BACKEND_URL } from '../../utils/config.js';
import { ClipboardDocumentListIcon } from '@heroicons/react/24/outline';
import logger from '../../utils/logger';



const parseUserId = (result: unknown) => {
  if (result instanceof Object && 'id' in result && isString(result.id)) {
    return result.id;
  } else throw new Error('Invalid userId');

};

const Lobby = () => {
  const [userId, setUserId] = useState('');
  const [copied, setCopied] = useState(false);
  const inputGameId = useField('text', 'Game ID');
  const navigate = useNavigate();

  const socket = useAppSelector(selectSocketState);
  const gameStatus = useAppSelector(selectStatus);
  const dispatch = useAppDispatch();



  const getGuestUserId = async () => {
    try {
      const response = await fetch(BACKEND_URL + '/userId');

      //TODO: Handle response
      const result: unknown = await response.json();
      const userId = parseUserId(result);
      setUserId(userId);
      localStorage.setItem('userId', userId);
    } catch (e) {
      if(e && typeof e === 'object') logger.error('ERROR: ', e);
      else logger.error('UNKNOWN ERROR');
    }
  };

  const init = async () => {
    const userIdFromStorage = localStorage.getItem('userId');

    if (userIdFromStorage) {
      setUserId(userIdFromStorage);
    } else {
      await getGuestUserId();
    }
  };

  useEffect(() => {
    init().catch((e) => console.log(e));
    dispatch(connect());
  }, []);

  useEffect(() => {
    if (gameStatus==='ACTIVE') {
      void navigate('/game');
    }
  }, [gameStatus]);



  const createGame = () => {
    dispatch(createRoom());
  };

  const joinGame = () => {
    dispatch(joinRoom(inputGameId.value));
  };

  const leaveGame = () => {
    dispatch(leaveRoom());
  };

  if (!socket.isConnected || !userId) {
    return (
      <h2 className="animate-pulse">Connecting...</h2>
    );
  }

  const UserList = socket.users.map((user) => (
    <li key={user}>{user}</li>
  ));

  const copyToClipBoard = async () =>{
    await navigator.clipboard.writeText(socket.roomId);
    setCopied(true);
    setTimeout(()=>setCopied(false), 1500);
  };



  return (
    <div className="flex flex-col p-3">
      <h1 className="py-5 text-2xl">Lobby</h1>
      {userId && <h2>Vieras ID: {userId}</h2>}
      {socket.roomId && (
        <div className="flex">
          <h2>Olet pelissä: {socket.roomId}</h2>
          <ClipboardDocumentListIcon 
            onClick={() => { void copyToClipBoard(); }}
            className="mx-2 size-5 hover:cursor-pointer"
          />
          {copied&& <p>Kopioitu!</p>}
        </div>
      )}
      <ul>
        <h2> Pelaajat: </h2>
        {UserList}
      </ul>
      <Button
        text="Luo peli"
        onClick={createGame}
        disabled={socket.roomId !== ''}
      />
      <label>Give Game ID</label>
      <input
        className="mb-4 rounded bg-emerald-50 px-8 pt-6 pb-8 shadow-md"
        {...inputGameId}
      />
      <div className="flex">
        <Button
          text="Poistu pelistä"
          onClick={() => leaveGame()}
          disabled={socket.roomId === ''}
        />
        <Button
          text="Liity peliin"
          onClick={() => joinGame()}
          disabled={inputGameId.value === '' || socket.roomId !== ''}
        />
      </div>
      <Button
        text="Aloita peli"
        onClick={() => dispatch(startGame())}
        disabled={socket.users.length < 2}
      />
    </div>
  );
};

export default Lobby;