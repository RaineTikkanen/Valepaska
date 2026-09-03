
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL as string; // || 'http://localhost:3000';

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const WEBSOCKET_URL = import.meta.env.VITE_WEBSOCKET_URL as string; // || 'ws://localhost:4000';

export { BACKEND_URL, WEBSOCKET_URL };
