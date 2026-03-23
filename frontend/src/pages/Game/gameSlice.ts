import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../../store';
import type { Card, Play, Statement } from '../../types/game.js';

export interface GameState {
  isActive: boolean;
  turn: string;
  deck: Card[];
  lastPlay: Play | null;
}

const initialState: GameState = {
  isActive: false,
  turn: '',
  deck: [],
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
    leaveGame: (state) => initialState
  }
});


export const {
  startGame,
  gameStarted,
  leaveGame
} = gameSlice.actions;

export default gameSlice.reducer;