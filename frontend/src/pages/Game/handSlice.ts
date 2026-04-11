import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../../store';
import type { Card } from '../../types/game.js';

export interface HandState {
  cards: Array<Card>;
  selectedCards: Array<Card>;
}

const initialState: HandState = {
  cards: [],
  selectedCards: [],
};

export const handSlice = createSlice({
  name: 'hand',
  initialState,
  reducers: {
    setCards: (state, action: PayloadAction<Array<Card>>) => {
      state.cards = action.payload;
      state.cards.sort((a, b) => a.value - b.value);
    },
    removeCards: (state, action: PayloadAction<Array<Card>>) => {
      state.cards = state.cards.filter(
        (card) => !action.payload.some((c) => c.name === card.name),
      );
    },
    clearCards: (state) => {
      state.cards = [];
    },
    playCards: (state) => {
      state.cards = state.cards.filter(
        (card) => !state.selectedCards.some((c) => c.name === card.name),
      );
      state.selectedCards=[];
    },
    toggleCardSelectState: (state, action: PayloadAction<Card>) => {
      const selected = state.selectedCards.some(
        card => card.name === action.payload.name
      );
      if (selected){
        state.selectedCards = state.selectedCards.filter(
          (card) => card.name !== action.payload.name);
      } else {
        state.selectedCards.push(action.payload);
      }
    },
    clearSelectedCards: (state) => {
      state.selectedCards = [];
    },
  },
});

export const {
  setCards,
  removeCards,
  clearCards,
  playCards,
  toggleCardSelectState,
  clearSelectedCards
} = handSlice.actions;

export const selectHandCards = (state: RootState) => state.hand.cards;
export const selectSelectedCards = (state: RootState) =>
  state.hand.selectedCards;

export default handSlice.reducer;
