import { configureStore, Tuple } from '@reduxjs/toolkit';
import handReducer from './pages/Game/handSlice';
import socketSlice from './pages/Lobby/socketSlice';
import gameSlice from './pages/Game/gameSlice';
import loggerMiddleware from './middleware/logger';
import socketMiddleware from './middleware/socketService';

export const store = configureStore({

  reducer: {
    hand: handReducer,
    socket: socketSlice,
    game: gameSlice,
  },
  middleware: () => new Tuple(loggerMiddleware, socketMiddleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export type AppStore = typeof store;
