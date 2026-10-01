import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../../store';
import type {GamePlayer} from '../../types/game.type.ts';


export interface SocketState {
  isConnected: boolean;
  roomId: string;
  players: Array<GamePlayer>;
}

const initialState: SocketState = {
  isConnected: false,
  roomId: '',
  players: [],
};

export const socketSlice = createSlice({
  name: 'socket',
  initialState,
  reducers: {
    connect: () => {
      return;
    },
    disconnect () {
      return;
    },
    connected: (state) => {
      state.isConnected = true;
    },
    disconnected: (state) => {
      state.isConnected = false;
      state.roomId = '';
      state.players = [];
    },
    createRoom: () => {
      return;
    },
    joinRoom: (_state, _action: PayloadAction<string>) => {
      return;
    },
    leaveRoom: (state) => {
      state.players = [];
      state.roomId = '';
    },
    updateRoomId: (state, action: PayloadAction<string>) => {
      state.roomId = action.payload;
    },
    updatePlayers: (state, action: PayloadAction<Array<GamePlayer>>) => {
      state.players = action.payload;
    },
  }
});


export const { 
  connect, 
  disconnect,
  connected, 
  disconnected,
  createRoom,
  joinRoom,
  leaveRoom,
  updateRoomId,
  updatePlayers,
} = socketSlice.actions;

export const selectSocketState = (state: RootState) => state.socket;
export const selectPlayers = (state: RootState) => state.socket.players;

export default socketSlice.reducer;
