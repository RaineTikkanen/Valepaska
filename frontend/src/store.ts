import { configureStore, Tuple } from '@reduxjs/toolkit';
import handReducer from './pages/Game/handSlice';
import roomReducer from './pages/Lobby/roomSlice';
import loggerMiddleware from './middleware/logger';
import socketService from './middleware/socketService';

export const store = configureStore({

  reducer: {
    hand: handReducer,
    room: roomReducer,
  },
  middleware: () => new Tuple(loggerMiddleware, socketService),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export type AppStore = typeof store;
