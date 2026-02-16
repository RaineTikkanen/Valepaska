import { configureStore } from '@reduxjs/toolkit';
import handReducer from './pages/Game/handSlice';

export const store = configureStore({
  reducer: {
    hand: handReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export type AppStore = typeof store;
