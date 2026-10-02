import express from 'express';
import type { Socket } from 'socket.io';
import { Server } from 'socket.io';
import { createServer } from 'node:http';
import { PORT, REDIS_URL} from './utils/config.js';
import gameService from './services/gameService.js';
import { v7 as uuidv7 } from 'uuid';
import logger from './utils/logger.js';
import type {ClientToServerEvents, ServerToClientEvents, SocketData} from './socket.js';



const app = express();
const server = createServer(app);
const io = new Server<
  ClientToServerEvents,
  ServerToClientEvents,
  Record<string, never>,
  SocketData
>(server, {
  connectionStateRecovery: {}
});

if(process.env.NODE_ENV !== 'development') {
  app.use(express.static('dist'));
}
app.use(express.json());


const onConnect = (
  socket: Socket<
    ClientToServerEvents,
    ServerToClientEvents,
    Record<string, never>,
    SocketData
  >,
) => {
  gameService(io, socket);
};

io.on('connection', onConnect);

app.get('/api/health', (_req, res) => {
  res.send({ health_status: 'OK' });
});

app.get('/api/userId', (_req, res) => {
  const id = uuidv7();
  res.json({'id':id});
});

if(process.env.NODE_ENV !== 'development') {
  app.get('/{*path}', (req, res) => {
    if (req.path === '/api' || req.path.startsWith('/api/')) {
      return;
    }
    res.sendFile('index.html', {root: 'dist'});
  });
}

server.listen(PORT, () => {
  logger.debug(`NODE.ENV ${process.env.NODE_ENV}`);
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Redis running on port ${REDIS_URL}`);
});