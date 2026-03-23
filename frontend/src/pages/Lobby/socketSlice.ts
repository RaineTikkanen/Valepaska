import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../../store';


export interface SocketState {
  isConnected: boolean;
  roomId: string;
  users: string[];
}

const initialState: SocketState = {
  isConnected: false,
  roomId: '',
  users: [],
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
    },
    createRoom: () => {
      return;
    },
    joinRoom: (state, action: PayloadAction<string>) => {
      return;
    },
    leaveRoom: (state) => {
      state.users = [];
      state.roomId = '';
    },
    updateRoomId: (state, action: PayloadAction<{roomId: string}>) => {
      state.roomId = action.payload.roomId;
    },
    updateUsers: (state, action: PayloadAction<{users: string[]}>) => {
      state.users = action.payload.users;
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
  updateUsers,
} = socketSlice.actions;

export const selectIsConnected = (state: RootState) => state.socket.isConnected;

export default socketSlice.reducer;
