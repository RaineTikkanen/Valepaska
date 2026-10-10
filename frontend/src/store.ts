import { configureStore, Tuple } from '@reduxjs/toolkit';
import handReducer from './pages/Game/components/handSlice.ts';
import socketSlice from './pages/Lobby/socketSlice';
import gameSlice from './pages/Game/gameSlice';
import loggerMiddleware from './middleware/reduxLogger.ts';
import socketMiddleware from './middleware/socketService';
import userSlice from './pages/Lobby/userSlice.ts';

export const store = configureStore({
  reducer: {
    hand: handReducer,
    socket: socketSlice,
    game: gameSlice,
    user: userSlice,
  },
  middleware: () => new Tuple(loggerMiddleware, socketMiddleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export type AppStore = typeof store;
