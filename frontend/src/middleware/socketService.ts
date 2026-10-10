import type { Middleware } from 'redux';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { AppDispatch, RootState } from '../store.js';
import { isAction } from '@reduxjs/toolkit';
import { socket } from '../socket.ts';
import { isStatement, isString } from '../utils/typeGuards.js';
import type {GameStateUpdate, GamePlayer} from '../types/game.type.ts';
import type {Card} from '../types/deck.type.ts';

import {
  connect,
  disconnect,
  connected,
  disconnected,
  createRoom,
  updateRoomId,
  updatePlayers,
  joinRoom,
  leaveRoom,
  clearRoom,
} from '../pages/Lobby/socketSlice.js';

import {
  startGame,
  setTurn,
  updateGameState,
  resetGame,
  setDoubter,
  clearDoubter,
  setDoubtResult,
  clearDoubtResult,
  updateClearTimer, stopClearTimer,
} from '../pages/Game/gameSlice.js';

import {playCards, setCards, doubt, removeCards} from '../pages/Game/components/handSlice.ts';

import { SocketEvents } from '../socket.ts';
import logger from '../utils/logger.ts';


let storeRef: {dispatch: AppDispatch; getState: () => RootState} | null = null;


socket.on(SocketEvents.CONNECT, () => {
  if (storeRef) {
    storeRef.dispatch(connected());
    const roomId = localStorage.getItem('roomId');
    if(roomId) {
      const userId = localStorage.getItem('userId');
      const userName = localStorage.getItem('userName');
      if(userId && userName) {
        socket.emit(SocketEvents.REQUEST_ROOM_UPDATE, roomId, {id: userId, name: userName}, (result: string) => {
          if(storeRef && result === 'Err') storeRef.dispatch(clearRoom());
        });
      }else{
        storeRef.dispatch(clearRoom());
      }
    }
  }
});

socket.on(SocketEvents.DISCONNECT, () => {
  if (storeRef) storeRef.dispatch(disconnected());
});


socket.on(SocketEvents.ROOM_UPDATE, (roomId: string, players: Array<GamePlayer>) => {
  if (storeRef) {
    logger.debug('roomUpdate');
    storeRef.dispatch(updateRoomId(roomId));
    storeRef.dispatch(updatePlayers(players));
  }
});

socket.on(SocketEvents.HAND_UPDATE, (cards: Array<Card>)=>{
  if (storeRef) storeRef.dispatch(setCards(cards));
});

socket.on(SocketEvents.GAME_STATE_UPDATE, (gameState: GameStateUpdate)=>{
  if(storeRef){
    storeRef.dispatch(updatePlayers(gameState.players));
    storeRef.dispatch(updateGameState(gameState));
  }
});

socket.on(SocketEvents.ABOUT_TO_CLEAR, (time: number)=>{
  if(storeRef){
    storeRef.dispatch(updateClearTimer(time));
  }
});

socket.on(SocketEvents.TURN_UPDATE, (turn: string)=>{
  if(storeRef){
    storeRef.dispatch(setTurn(turn));

  }
});

socket.on(SocketEvents.DOUBTED, (doubter: string)=>{
  if(storeRef){
    storeRef.dispatch(stopClearTimer());
    storeRef.dispatch(setDoubter(doubter));
  }
});

socket.on(SocketEvents.DOUBT_RESULT, (cards: Array<Card>)=>{
  const store = storeRef;
  if(store){
    store.dispatch(clearDoubter());
    store.dispatch(setDoubtResult(cards));

    setTimeout(()=>{
      store.dispatch(clearDoubtResult());
    },5000);
  }
});

socket.on(SocketEvents.ERROR, (error)=>{
  logger.error('socketService - ERROR:', error);
});

const socketService: Middleware = (store: {dispatch: AppDispatch; getState: () => RootState}) => {

  storeRef = store;

  return (next) => (action) => {
    if (isAction(action)) {

      const {type, payload} = action as PayloadAction<unknown>;

      switch (type) {

        case connect.type: {
          socket.connect();
          break;
        }

        case disconnect.type: {
          socket.disconnect();
          break;
        }

        case createRoom.type: {
          const userId = localStorage.getItem('userId');
          const userName = localStorage.getItem('userName');
          if(userId && userName){
            socket.emit(SocketEvents.CREATE_ROOM, {id: userId, name: userName}, (result) =>{
              if (result == 'ERR') {
                window.alert('Failed to create room');
              }
            });
          }else window.alert('Failed to create room. UserId not found in store');
          break;
        }

        case joinRoom.type: {
          const userId = localStorage.getItem('userId');
          const userName = localStorage.getItem('userName');
          if(!isString(payload)) {
            window.alert('Invalid roomId');
            break;
          }
          if (userId && userName){
            socket.emit(SocketEvents.JOIN_ROOM, payload, {id: userId, name: userName}, (result) => {
              if (result == 'ERR') {
                window.alert('Failed to join room. Please check the game ID and try again.');
              }
            });
          }else window.alert('Failed to join room. Could not find userId from localstorage.');
          break;
        }

        case leaveRoom.type: {
          socket.emit(SocketEvents.LEAVE_ROOM, (result)=> {
            store.dispatch(resetGame());
            store.dispatch(clearRoom());
            if (result === 'ERR') {
              window.alert('Failed to leave room');
            }
          });
          break;
        }
        
        case startGame.type: {
          socket.emit(SocketEvents.START_GAME, (result)=> {
            if (result === 'ERR') {
              window.alert('Failed to start game');
            }
          });
          break;
        }

        case playCards.type: {
          if (!isStatement(payload)) {
            window.alert('Invalid statement');
            break;
          }
          const statement = payload;
          const cards = store.getState().hand.selectedCards;

          socket.emit(SocketEvents.PLAY, cards, statement, (result)=> {
            if (result == 'OK') {
              store.dispatch(removeCards(cards));
            } else window.alert('Failed to play cards');

          });
          break;  
        }

        case doubt.type: {
          socket.emit(SocketEvents.DOUBT, (result)=> {
            if (result === 'ERR') {
              logger.error('Failed to doubt');
            }
          });
        }
      }
    }
    return next(action);
  };
};

export default socketService;

