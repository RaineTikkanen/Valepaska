
const PORT = process.env.PORT || 3000
const WEBSOCKET_PORT = process.env.WEBSOCKET_PORT ? parseInt(process.env.WEBSOCKET_PORT) : 4000

const REDIS_URL = process.env.REDIS_URL || `redis://localhost:6379/`

export { REDIS_URL, WEBSOCKET_PORT, PORT }
