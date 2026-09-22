const nodeEnv = import.meta.env.VITE_NODE_ENV as string;

console.log('NODE_ENV: ', nodeEnv);

const info = (message: string, object?: object): void => {
  if(nodeEnv==='development') {
    if(object) console.info(message, object);
    else console.info(message);
  }
};

const error = (message: string, e?: unknown): void => {
  if(nodeEnv==='development') {
    if(e) console.error(message, e);
    else console.error(message);
  }
};

const debug = (message: string, object?: object): void => {
  if(nodeEnv==='development') {
    if(object) console.debug(message, object);
    else console.debug(message);
  }
};

export default {info, error, debug};