import type { Middleware } from 'redux';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { AppDispatch, RootState } from '../store.js';
import { isAction } from '@reduxjs/toolkit';
import { socket } from '../services/socket.js';
import { isStatement, isString } from '../utils/typeGuards.js';
import type { Card, GameStateUpdate} from '../types/game.js';

import { 
  connect, 
  disconnect, 
  connected, 
  disconnected, 
  createRoom, 
  updateRoomId, 
  updateUsers,
  joinRoom,
  leaveRoom,
} from '../pages/Lobby/socketSlice.js';

import {
  gameStarted,
  startGame,
  setTurn,
  resetGame,
  setLastPlay,
  setAmountOfCardsInPlay,
  setSameCardsInPlay,
  setDoubter,
  clearDoubter,
  setDoubtResult,
  clearDoubtResult,
  setAboutToClear,
} from '../pages/Game/gameSlice.js';

import { playCards, setCards, doubt } from '../pages/Game/handSlice.js';

import { SocketEvents } from '../services/socket.js';


let storeRef: {dispatch: AppDispatch; getState: () => RootState} | null = null;


socket.on(SocketEvents.CONNECT, () => {
  if (storeRef) storeRef.dispatch(connected());
});

socket.on(SocketEvents.DISCONNECT, () => {
  if (storeRef) storeRef.dispatch(disconnected());
});

socket.on(SocketEvents.ROOM_UPDATE, (roomId: string, users: string[]) => {
  if (storeRef) {
    storeRef.dispatch(updateRoomId({roomId: roomId}));
    storeRef.dispatch(updateUsers({users: users}));
  }
});

socket.on(SocketEvents.GAME_STARTS, ()=>{
  if (storeRef) storeRef.dispatch(gameStarted());
});

socket.on(SocketEvents.HAND_UPDATE, (cards: Card[])=>{
  console.log('MIDDLEWARE: ', cards);
  if (storeRef) storeRef.dispatch(setCards(cards));
});

socket.on(SocketEvents.GAME_STATE_UPDATE, (gameState: GameStateUpdate)=>{
  if(storeRef){
    storeRef.dispatch(setLastPlay(gameState.lastPlay));
    storeRef.dispatch(setAmountOfCardsInPlay(gameState.amountOfCardsInPlay));
    storeRef.dispatch(setSameCardsInPlay(gameState.sameCardsInPlay));
  }
});

socket.on(SocketEvents.ABOUT_TO_CLEAR, ()=>{
  if(storeRef){
    storeRef.dispatch(setAboutToClear(true));
  }
});

socket.on(SocketEvents.TURN_UPDATE, (turn: string)=>{
  if(storeRef){
    storeRef.dispatch(setTurn(turn));

  }
});

socket.on(SocketEvents.DOUBTED, (doubter: string)=>{
  if(storeRef){
    storeRef.dispatch(setAboutToClear(false));
    storeRef.dispatch(setDoubter(doubter));
  }
});

socket.on(SocketEvents.DOUBT_RESULT, (cards: Card[])=>{
  const store = storeRef;
  if(store){
    store.dispatch(clearDoubter());
    store.dispatch(setDoubtResult(cards));

    setTimeout(()=>{
      store.dispatch(clearDoubtResult());
    },3000);
  }
});

socket.on(SocketEvents.ERROR, (error)=>{
  console.log('socketService - ERROR:', error);
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
          if(userId){
            socket.emit(SocketEvents.CREATE_ROOM, userId, (result) =>{
              if (result == 'ERR') {
                window.alert('Failed to create room');
              }
            });
          }else window.alert('Failed to create room. UserId not found in store');
          break;
        }

        case joinRoom.type: {
          const userId = localStorage.getItem('userId');
          if(!isString(payload)) {
            window.alert('Invalid roomId');
            break;
          }
          if (userId){
            socket.emit(SocketEvents.JOIN_ROOM, payload, userId, (result) => {
              if (result == 'ERR') {
                window.alert('Failed to join room. Please check the game ID and try again.');
              }
            });
          }else window.alert('Failed to join room. Could not find userId from localstorage.');
          break;
        }

        case leaveRoom.type: {

          const userId = localStorage.getItem('userId');
          const roomId = store.getState().socket.roomId;


          if (userId && roomId && isString(roomId)){
            socket.emit(SocketEvents.LEAVE_ROOM, roomId, userId, (result)=>{
              store.dispatch(resetGame());
              if (result === 'ERR') {
                window.alert('Failed to leave room');
              }
            });
          }else window.alert('Failed to leave room. No userId or roomId');
          break;
        }
        
        case startGame.type: {
          const roomId = store.getState().socket.roomId;
          if(roomId){
            socket.emit(SocketEvents.START_GAME, roomId, (result)=>{
              if (result === 'ERR') {
                window.alert('Failed to start game');
              }
            });
          }else window.alert('Failed to start game. Cannot find gameId from store');
          break;
        }

        case playCards.type: {
          const userId = localStorage.getItem('userId');
          const roomId = store.getState().socket.roomId;

          if (!isStatement(payload)) {
            window.alert('Invalid statement');
            break;
          }

          const statement = payload;

          const cards = store.getState().hand.selectedCards;
          console.log('Middleware: [PLAY CARDS], cards: ',cards, 'Statement: ', statement);
          if(userId){

            socket.emit(SocketEvents.PLAY, roomId, userId, cards, statement, (result)=>{
              console.log(result);
            });
          }
          break;  
        }

        case doubt.type: {
          const userId = localStorage.getItem('userId');
          const roomId = store.getState().socket.roomId;

          if(userId){
            socket.emit(SocketEvents.DOUBT, roomId, userId, (result)=>{
              if(result === 'ERR'){
                console.log('Failed to doubt');
              }
            });
          }
        }
      }
    }
    return next(action);
  };
};

export default socketService;

