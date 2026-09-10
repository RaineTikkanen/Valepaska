import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { Play, Card} from '../../types/game.js';

export interface GameState {
  isActive: boolean;
  turn: string;
  lastPlay: Play;
  amountOfCardsInPlay: number;
  sameCardsInPlay: number;
  doubter: string;
  doubtResult: Card[] | null;
  aboutToClear: boolean,
}

const initialState: GameState = {
  isActive: false,
  turn: '',
  lastPlay: {
    player: '',
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
    setLastPlay: (state, action: PayloadAction<Play>) =>{
      state.lastPlay = action.payload;
    },
    setAmountOfCardsInPlay: (state, action: PayloadAction<number>)=>{
      state.amountOfCardsInPlay = action.payload;
    },
    setSameCardsInPlay: (state, action: PayloadAction<number>)=>{
      state.sameCardsInPlay = action.payload;
    },
    setDoubter: (state, action: PayloadAction<string>) =>{
      state.doubter = action.payload;
    },
    clearDoubter: (state)=>{
      state.doubter = '';
    },
    setDoubtResult: (state, action: PayloadAction<Card[]>) =>{
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
  setTurn,
  setLastPlay,
  setAmountOfCardsInPlay,
  setSameCardsInPlay,
  setDoubter,
  clearDoubter,
  setDoubtResult,
  clearDoubtResult,
  setAboutToClear,
} = gameSlice.actions;

export default gameSlice.reducer;