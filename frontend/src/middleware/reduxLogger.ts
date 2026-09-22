import type { Middleware } from 'redux';
import { isAction } from '@reduxjs/toolkit';
import logger from '../utils/logger';


const reduxLogger: Middleware = _store => next => action => {
  if (isAction(action)) {
    logger.info('[loggerMiddleware]: ', action);
  }
  return next(action);
};

export default reduxLogger;

