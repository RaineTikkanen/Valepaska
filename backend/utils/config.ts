
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379/';
const WORD_API='https://randomapi.dev/api/words?count=1&fields=word&unwrap=true';

export { REDIS_URL, PORT, WORD_API };
