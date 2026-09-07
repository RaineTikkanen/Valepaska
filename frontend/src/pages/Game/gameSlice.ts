import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { Play } from '../../types/game.js';

export interface GameState {
  isActive: boolean;
  turn: string;
  lastPlay: Play | null;
}

const initialState: GameState = {
  isActive: false,
  turn: '',
  lastPlay: null,
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
  }
});


export const {
  startGame,
  gameStarted,
  resetGame,
  setTurn,
} = gameSlice.actions;

export default gameSlice.reducer;