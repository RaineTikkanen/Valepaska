import { useState, useEffect } from 'react';
import Button from '../../components/Button';
import { useNavigate } from 'react-router';
import useField from '../../hooks/useField';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { connect, createRoom, joinRoom, leaveRoom, selectSocketState } from './socketSlice.js';
import {startGame, selectStatus} from '../Game/gameSlice.js';
import { ClipboardDocumentListIcon } from '@heroicons/react/24/outline';
import TextInput from '../../components/TextInput';
import {selectUserState} from './userSlice.ts';


const Lobby = () => {
  const [copied, setCopied] = useState(false);
  const [creating, setCreating] = useState(false);
  const inputGameId = useField('text', 'Peli ID');
  const navigate = useNavigate();
  const [connected, setConnected] = useState(false);

  const socket = useAppSelector(selectSocketState);
  const gameStatus = useAppSelector(selectStatus);
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUserState);

  useEffect(() => {
    if(socket.status === 'DISCONNECTED') {
      dispatch(connect());
    }
    if(socket.status === 'CONNECTED') {
      setConnected(true);
    }
  }, [socket.status]);

  useEffect(() => {
    if(socket.roomId){
      setCreating(false);
    }
  }, [socket.roomId]);

  useEffect(() => {
    if (gameStatus==='GAME') {
      void navigate('/game');
    }
  }, [gameStatus]);

  useEffect(() => {
    if(!user.userId){
      void navigate('/');
    }
  }, [user.userId]);


  const createGame = () => {
    setCreating(true);
    dispatch(createRoom());
  };

  const joinGame = () => {
    dispatch(joinRoom(inputGameId.value));
  };

  const leaveGame = () => {
    dispatch(leaveRoom());
  };

  if (!connected) {
    return (
      <h2 className="animate-pulse">Yhdistetään...</h2>
    );
  }

  const UserList = socket.players.map(player => (
    <li key={player.user.id}>{player.user.name}</li>
  ));

  const copyToClipBoard = async () =>{
    await navigator.clipboard.writeText(socket.roomId);
    setCopied(true);
    setTimeout(()=>setCopied(false), 1500);
  };


  return (
    <div className="flex flex-col items-center justify-center p-3 ">
      <div className="flex w-full flex-col sm:w-[calc(100vw/1.5)] xl:w-[calc(100vw/2)] " >
        {socket.roomId ? (
          <div>
            <div className="flex">
              <div className="flex flex-row">
                <p>Olet pelissä:</p>
                <p className="pl-1 capitalize">{socket.roomId}</p>
              </div>
              <ClipboardDocumentListIcon
                onClick={() => { void copyToClipBoard(); }}
                className="mx-2 size-5 hover:cursor-pointer"
              />
              {copied&& <p>Kopioitu!</p>}
            </div>
            <div>
              <ul>
                <h2> Pelaajat: </h2>
                {UserList}
              </ul>
            </div>
          </div>
        ) : <div className="h-18" />}
        <div className={`flex ${creating ? 'animate-pulse' : ''}`}>
          <Button
            text={creating ? 'Luodaan...' : 'Luo peli'}
            onClick={createGame}
            disabled={socket.roomId !== ''}
          />
        </div>
        <div className="mx-2 flex flex-col ">
          <label>Anna peli ID</label>
          <TextInput
            {...inputGameId}
          />
        </div>
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
          disabled={socket.players.length < 2}
        />
      </div>
    </div>
  );
};

export default Lobby;