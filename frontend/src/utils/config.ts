import logger from './logger.ts';


const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ? import.meta.env.VITE_BACKEND_URL as string : '';

logger.debug('VITE_BACKEND_URL', {BACKEND_URL});
export { BACKEND_URL};
