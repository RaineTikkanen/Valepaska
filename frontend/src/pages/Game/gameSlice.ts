import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type {Play, GameStateUpdate, User} from '../../types/game.type.ts';
import type {Card} from '../../types/deck.type.ts';
import type {RootState} from '../../store.ts';

export interface GameState {
  winners: Array<User>;
  status: 'LOBBY' | 'GAME' | 'RESULTS';
  turn: string;
  lastPlay: Play | null;
  amountOfCardsInPlay: number;
  sameCardsInPlay: number;
  doubter: string;
  doubtResult: Array<Card> | null;
  clearTimer: number;
  cardsInDeck: number;
}

const initialState: GameState = {
  winners: [],
  status: 'LOBBY',
  turn: '',
  lastPlay: null,
  doubter: '',
  amountOfCardsInPlay: 0,
  sameCardsInPlay: 0,
  doubtResult: null,
  clearTimer: -1,
  cardsInDeck: 0,
};

export const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    startGame: () => {
    },
    resetGame: () => initialState,
    setTurn: (state, action: PayloadAction<string>) => {
      state.turn = action.payload;
    },
    updateGameState: (state, action: PayloadAction<GameStateUpdate>) => {
      state.lastPlay = action.payload.lastPlay;
      state.winners = action.payload.winners;
      state.sameCardsInPlay = action.payload.sameCardsInPlay;
      state.amountOfCardsInPlay = action.payload.amountOfCardsInPlay;
      state.cardsInDeck = action.payload.cardsInDeck;
      state.status=action.payload.clientStatus;
    },
    setDoubter: (state, action: PayloadAction<string>) =>{
      state.doubter = action.payload;
    },
    clearDoubter: (state)=>{
      state.doubter = '';
    },
    setDoubtResult: (state, action: PayloadAction<Array<Card>>) =>{
      state.doubtResult = action.payload;
    },
    clearDoubtResult: (state) =>{
      state.doubtResult=null;
    },
    updateClearTimer: (state, action: PayloadAction<number>) =>{
      state.clearTimer=action.payload;
    },
    stopClearTimer: (state) =>{
      state.clearTimer=-1;
    }
  }
});

export const {
  startGame,
  resetGame,
  updateGameState,
  setTurn,
  setDoubter,
  clearDoubter,
  setDoubtResult,
  clearDoubtResult,
  updateClearTimer,
  stopClearTimer,
} = gameSlice.actions;

export const selectGameState = (state: RootState) => state.game;
export const selectStatus = (state: RootState) => state.game.status;
export const selectWinners = (state: RootState) => state.game.winners;
export const selectClearTimer = (state: RootState) => state.game.clearTimer;


export default gameSlice.reducer;