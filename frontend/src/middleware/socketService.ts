import type { Middleware } from 'redux'
import { socket } from '../services/webSocketService/socket';
import type { PayloadAction } from '@reduxjs/toolkit';
import { isAction } from '@reduxjs/toolkit';


const socketService: Middleware = store => next => action => {
  if (isAction(action)) {
    const { type, payload } = action as PayloadAction<unknown>;
    console.log('Socket Service Middleware - Action Dispatched:', type, payload);
}
  return next(action);
};

export default socketService;

