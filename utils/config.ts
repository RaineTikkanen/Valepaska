
const PORT = process.env.PORT || 3000
const WEBSOCKET_PORT = process.env.WEBSOCKET_PORT ? parseInt(process.env.WEBSOCKET_PORT) : 4000

const REDIS_PORT = process.env.REDIS_URL || 6379

const REDIS_URL = `redis://localhost:${REDIS_PORT}/`

export { REDIS_URL, WEBSOCKET_PORT, PORT }
