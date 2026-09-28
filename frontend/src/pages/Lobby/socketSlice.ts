import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../../store';
import type {User} from '../../types/game.ts';


export interface SocketState {
  isConnected: boolean;
  roomId: string;
  users: Array<User>;
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
      state.roomId = '';
      state.users = [];
    },
    createRoom: () => {
      return;
    },
    joinRoom: (_state, _action: PayloadAction<string>) => {
      return;
    },
    leaveRoom: (state) => {
      state.users = [];
      state.roomId = '';
    },
    updateRoomId: (state, action: PayloadAction<{roomId: string}>) => {
      state.roomId = action.payload.roomId;
    },
    updateUsers: (state, action: PayloadAction<{users: Array<User>}>) => {
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

export const selectSocketState = (state: RootState) => state.socket;
export const selectUsers = (state: RootState) => state.socket.users;

export default socketSlice.reducer;
