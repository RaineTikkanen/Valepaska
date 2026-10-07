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
  aboutToClear: boolean,
  cardsInDeck: number,
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
  aboutToClear: false,
  cardsInDeck: 0,
};

export const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    startGame: () => {
    },
    gameStarted: (state) => {
      state.status = 'GAME';
    },
    gameFinished: (state) => {
      state.status = 'RESULTS';
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
    setAboutToClear: (state, action: PayloadAction<boolean>) =>{
      state.aboutToClear=action.payload; 
    }
  }
});

export const {
  startGame,
  gameStarted,
  gameFinished,
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
export const selectStatus = (state: RootState) => state.game.status;
export const selectWinners = (state: RootState) => state.game.winners;

export default gameSlice.reducer;