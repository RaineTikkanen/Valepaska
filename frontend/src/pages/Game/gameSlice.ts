import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { Play } from '../../types/game.js';

export interface GameState {
  isActive: boolean;
  turn: string;
  lastPlay: Play;
  amountOfCardsInPlay: number;
}

const initialState: GameState = {
  isActive: false,
  turn: '',
  lastPlay: {
    player: '',
    statement:{
      value: null,
      amount: null,
    }
  },
  amountOfCardsInPlay: 0,
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
} = gameSlice.actions;

export default gameSlice.reducer;