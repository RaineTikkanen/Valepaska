
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
const WEBSOCKET_PORT = process.env.WEBSOCKET_PORT ? parseInt(process.env.WEBSOCKET_PORT) : 4000;

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379/';
const WORD_API='https://randomapi.dev/api/words?count=1&fields=word&unwrap=true';

export { REDIS_URL, WEBSOCKET_PORT, PORT, WORD_API };
