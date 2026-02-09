import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../../app/store';
import type { Card } from '../../types/Card';

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
    selectCard: (state, action: PayloadAction<Card>) => {
      state.selectedCards.push(action.payload);
    },
    deselectCard: (state, action: PayloadAction<Card>) => {
      state.selectedCards = state.selectedCards.filter(
        (card) => card.name !== action.payload.name,
      );
    },
    clearSelectedCards: (state) => {
      state.selectedCards = [];
    },
  },
});

export const {
  addCards,
  removeCards,
  selectCard: addChosenCard,
  deselectCard: removeChosenCard,
  clearSelectedCards: clearChosenCards,
} = handSlice.actions;

export const selectHandCards = (state: RootState) => state.hand.cards;
export const selectSelectedCards = (state: RootState) =>
  state.hand.selectedCards;

export default handSlice.reducer;
