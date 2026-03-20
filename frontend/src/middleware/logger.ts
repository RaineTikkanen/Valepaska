import type { Middleware } from 'redux'
import { isAction } from '@reduxjs/toolkit';


const logger: Middleware = store => next => action => {
  if (isAction(action)) {
    console.info('dispatching', action);
  }
  return next(action);
};

export default logger;

