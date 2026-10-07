import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../../store';
import type {GamePlayer} from '../../types/game.type.ts';


export interface SocketState {
  status: 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED'
  roomId: string;
  players: Array<GamePlayer>;
}

const initialState: SocketState = {
  status: 'DISCONNECTED',
  roomId: localStorage.getItem('roomId') || '',
  players: [],
};

export const socketSlice = createSlice({
  name: 'socket',
  initialState,
  reducers: {
    connect: (state) => {
      state.status = 'CONNECTING';
    },
    disconnect () {
    },
    connected: (state) => {
      state.status = 'CONNECTED';
    },
    disconnected: (state) => {
      state.status = 'DISCONNECTED';
    },
    createRoom: () => {
    },
    joinRoom: (_state, _action: PayloadAction<string>) => {
    },
    leaveRoom: () => {
    },
    clearRoom: (state) => {
      state.players = [];
      state.roomId = '';
      localStorage.removeItem('roomId');
    },
    updateRoomId: (state, action: PayloadAction<string>) => {
      state.roomId = action.payload;
      localStorage.setItem('roomId', action.payload);
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
  clearRoom,
  updateRoomId,
  updatePlayers,
} = socketSlice.actions;

export const selectSocketState = (state: RootState) => state.socket;
export const selectPlayers = (state: RootState) => state.socket.players;

export default socketSlice.reducer;
