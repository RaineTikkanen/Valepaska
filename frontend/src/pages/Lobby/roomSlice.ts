import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../../store';

export interface RoomState {
  roomId: string;
  users: string[];
}

const initialState: RoomState = {
  roomId: '',
  users: [],
};

export const roomSlice = createSlice({
  name: 'room',
  initialState,
  reducers: {
    setRoomId: (state, action: PayloadAction<string>) => {
      state.roomId = action.payload;
    },
    setUsers: (state, action: PayloadAction<string[]>) => {
      state.users = action.payload;
    },
    clearRoom: (state) => {
      state.roomId = '';
      state.users = [];
    },
  },
});

export const { setRoomId, setUsers, clearRoom } = roomSlice.actions;

export const selectRoomId = (state: RootState) => state.room.roomId;
export const selectUsers = (state: RootState) => state.room.users;

export default roomSlice.reducer;