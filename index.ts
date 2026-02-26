import express from 'express';
import { Server, Socket } from 'socket.io';
import { createServer } from 'node:http';
import { PORT, REDIS_URL, WEBSOCKET_PORT } from './utils/config.js'
import gameHandlers from './socketHandlers/gameHandlers.js';
import { gameStateUpdate } from './socketHandlers/gameHandlers.type.js'
import { v7 as uuidv7 } from 'uuid';
import cors from 'cors';


import redisController from './redis/controller.js'
import { Card } from './deck/deck.type.js';

interface ServerToClientEvents {
  ping: () => void;
  userJoinedGame: (players: string[]) => void;
  gameStarts:() => void;
  gameStateUpdate: (gameState: gameStateUpdate) => void;
  handUpdate: (cards: Card[]) => void;
}

interface ClientToServerEvents {
  ping: () => void;
  createGame: (userId:string, callback:(id: string) => void) => void;
  joinGame: (gameId: string, userId: string, callback: (result: string) => void) => void;
  startGame: (callback: (result: string) => void) => void;
  doubt: (callback: (result: string) => void) => void;
  play: (callback: (result: string) => void) => void;
  getGameState: (gameId: string, playerId: string) => void;
  leaveGame: (gameId: string, playerId: string) => void;
}

interface SocketData {
  userId: string;
  gameId: string;
}

const app = express()
const server = createServer(app)
const io = new Server<
  ClientToServerEvents,
  ServerToClientEvents,
  SocketData
>({
  cors: {
    origin: '*'
  }
});

io.listen(WEBSOCKET_PORT);

app.use(express.json());
app.use(cors());

const onDisconnect = () => {
  console.log('user disconnected');
  const count = io.engine.clientsCount
  console.log(count, ' clients connected')
}

const onConnect = (socket: Socket) => {
  console.log('User ', socket.id, 'connected')
  const count = io.engine.clientsCount
  console.log(count, ' clients connected')

  socket.on('disconnect', onDisconnect)

  gameHandlers(io, socket)
}

io.on('connection', onConnect)

app.get('/health', (_req, res) => {
  res.send('OK');
});

app.post('/game/:id/play', async (req, res) => {
  const id = req.params.id
  const play = req.body.play
  const result = await redisController.play(id, play);
  res.send(result)
});

app.get('/game/:id', async (req, res) => {
  const id = req.params.id
  const result = await redisController.getGameState(id);
  res.send(result);
});

app.delete('/game/:id', async (req, res)=>{
  const id = req.params.id
  const result = await redisController.deleteGame(id)
  res.send(result)
})

app.get('/userId', async (_req, res) => {
  const id = uuidv7();
  console.log('GuestUserId created: ', id)
  res.json({'id':id});
})

app.use(express.static('dist'))

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket port ${WEBSOCKET_PORT}`)
  console.log(`Redis running on port ${REDIS_URL}`)
});