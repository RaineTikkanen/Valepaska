import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type {Play, Card, GameStateUpdate} from '../../types/game.js';
import type {RootState} from '../../store.ts';

export interface GameState {
  winners: Array<string>;
  isActive: boolean;
  turn: string;
  lastPlay: Play;
  amountOfCardsInPlay: number;
  sameCardsInPlay: number;
  doubter: string;
  doubtResult: Array<Card> | null;
  aboutToClear: boolean,
}

const initialState: GameState = {
  winners: [],
  isActive: false,
  turn: '',
  lastPlay: {
    user: '',
    statement:{
      value: 0,
      amount: 0,
    }
  },
  doubter: '',
  amountOfCardsInPlay: 0,
  sameCardsInPlay: 0,
  doubtResult: null,
  aboutToClear: false,
};

export const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    startGame: () => {
      return;
    },
    gameStarted: (state) => {
      state.isActive = true;
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
    setAboutToClear: (state, action: PayloadAction<boolean>) =>{
      state.aboutToClear=action.payload; 
    }
  }
});

export const {
  startGame,
  gameStarted,
  resetGame,
  updateGameState,
  setTurn,
  setDoubter,
  clearDoubter,
  setDoubtResult,
  clearDoubtResult,
  setAboutToClear,
} = gameSlice.actions;

export const selectGameState = (state: RootState) => state.game;
export const selectIsActive = (state: RootState) => state.game.isActive;

export default gameSlice.reducer;