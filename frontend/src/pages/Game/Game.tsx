import Hand from './Hand';
import type { Card } from '../../types/Card';
import deck from '../../assets/deck';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { playCards, addCards, clearCards } from './handSlice';
import { useEffect, useState } from 'react';
import Button from '../../components/Button';
import { socket } from '../../socket';

function Game() {
  
  const hand = useAppSelector((state) => state.hand);
  const dispatch = useAppDispatch();
  const [isConnected, setIsConnected]=useState(socket.connected);

  console.log('Connected: ', isConnected);
  
  useEffect(()=>{
    const onHandUpdate =(cards: Card[]) => {
      dispatch(addCards(cards));
      console.log('hand Updated');
    };
    
    socket.on('handUpdate', onHandUpdate);

    return()=>{
      socket.off('handUpdate', onHandUpdate);
    };
  }, []);



  function playSelectedCards(){
    dispatch(playCards());
  }



  return (
    <div className="">
      <div className="absolute inset-x-0 bottom-0 flex flex-col">
        <div className="flex justify-center">
          <Hand />
        </div>
        <div className="flex flex-row justify-center " />
      </div>
    </div>
  );
}

export default Game;