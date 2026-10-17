import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../../store';


export interface UserState {
  userId: string;
  userName: string;
  showLogin: boolean;
}

const initialState: UserState = {
  userId: localStorage.getItem('userId') || '',
  userName: localStorage.getItem('userName') || '',
  showLogin: false,
};

export const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    updateUserId: (state, action: PayloadAction<string>) => {
      state.userId = action.payload;
      localStorage.setItem('userId', action.payload);
    },
    updateUserName: (state, action: PayloadAction<string>) => {
      state.userName = action.payload;
      localStorage.setItem('userName', action.payload);
    },
    clearUser: (state) => {
      state.userName = '';
      state.userId = '';
      localStorage.removeItem('userId');
      localStorage.removeItem('userName');
      console.log('Clearing user');
    },
    openLogin: (state) => {
      state.showLogin = true;
    },
    closeLogin: (state) => {
      state.showLogin = false;
    },
  }
});


export const {
  updateUserId,
  updateUserName,
  clearUser,
  openLogin,
  closeLogin,
} = userSlice.actions;

export const selectUserState = (state: RootState) => state.user;

export default userSlice.reducer;
