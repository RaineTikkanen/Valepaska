import Hand from './Hand';
import type { Card } from '../../types/game.js';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { playCards} from './handSlice';
import { useEffect, useState } from 'react';
import Button from '../../components/Button';
import { leaveRoom } from '../Lobby/socketSlice.js';
import { leaveGame } from './gameSlice.js';
import { useNavigate } from 'react-router';


const Game = () => {
  
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const playSelectedCards= () =>{
    dispatch(playCards());
  };

  const game = useAppSelector((state)=> state.game);

  useEffect(()=>{
    if (!game.isActive) navigate('/lobby');
  }, []);


  const onLeaveGame = () => {
    if(window.confirm('Haluatko varmasti poistua pelistä?')){
      dispatch(leaveGame());
      navigate('/lobby');
    }
  };

  

  return (
    <div className="">

      <Button 
        text="Poistu pelistä" 
        onClick={onLeaveGame}
      />

      <div className="absolute inset-x-0 bottom-0 flex flex-col">
        <div className="flex justify-center">
          <Hand />
        </div>
        <div className="flex flex-row justify-center " />
      </div>
    </div>
  );
};

export default Game;