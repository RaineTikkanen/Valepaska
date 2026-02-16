import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../../store';
import type { Card } from '../../types/Card';
import { current } from '@reduxjs/toolkit'

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
    addCards: (state, action: PayloadAction<Array<Card>>) => {
      state.cards = state.cards.concat(action.payload);
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
    toggleCardSelectState: (state, action: PayloadAction<Card>) => {
      console.log(current(state.selectedCards))
      const selected = state.selectedCards.some(
        card => card.name === action.payload.name
      )
      if (selected){
        state.selectedCards = state.selectedCards.filter(
        (card) => card.name !== action.payload.name)
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
  addCards,
  removeCards,
  toggleCardSelectState,
  clearSelectedCards
} = handSlice.actions;

export const selectHandCards = (state: RootState) => state.hand.cards;
export const selectSelectedCards = (state: RootState) =>
  state.hand.selectedCards;

export default handSlice.reducer;
