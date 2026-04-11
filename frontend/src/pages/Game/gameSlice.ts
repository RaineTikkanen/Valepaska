import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { Card, Play } from '../../types/game.js';

export interface GameState {
  isActive: boolean;
  isMyTurn: boolean
  turn: string;
  deck: Card[];
  lastPlay: Play | null;
}

const initialState: GameState = {
  isActive: false,
  isMyTurn: false,
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
    leaveGame: () => initialState,
    setIsMyTurn: (state, action: PayloadAction<boolean>) => {
      state.isMyTurn = action.payload;
    }
  }
});


export const {
  startGame,
  gameStarted,
  leaveGame,
  setIsMyTurn
} = gameSlice.actions;

export default gameSlice.reducer;