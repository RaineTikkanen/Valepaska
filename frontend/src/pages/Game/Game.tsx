import Hand from './Hand';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { useEffect } from 'react';
import Button from '../../components/Button';
import { leaveGame } from './gameSlice.js';
import { useNavigate } from 'react-router';
import User from './User';


const Game = () => {
  
  const dispatch = useAppDispatch();
  const navigate = useNavigate();


  const game = useAppSelector((state)=> state.game);

  useEffect(()=>{
    if (!game.isActive) void navigate('/lobby');
  }, []);


  const onLeaveGame = () => {
    if(window.confirm('Haluatko varmasti poistua pelistä?')){
      dispatch(leaveGame());
      void navigate('/lobby');
    }
  };

  

  return (
    <div className="">

      <Button 
        text="Poistu pelistä" 
        onClick={onLeaveGame}
      />
      <div className="flex flex-row justify-center gap-5">
        <User user="Käyttäjä 1" />
        <User user="Käyttäjä 2" />
      </div>
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