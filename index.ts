import express from 'express';
import { Server, Socket } from 'socket.io';
import { createServer } from 'node:http';
import { PORT, REDIS_URL, WEBSOCKET_PORT } from './utils/config.js'
import gameService from './services/gameService.js';
import { gameStateUpdate } from './services/gameService.type.js'
import { v7 as uuidv7 } from 'uuid';
import cors from 'cors';
import { socketLogger } from './utils/middleware/socketLogger.js';
import redisController from './redis/controller.js'
import { Card } from './deck/deck.type.js';

export interface ServerToClientEvents {
  ping: () => void;
  userJoinedGame: (players: string[]) => void;
  gameStarts:() => void;
  gameStateUpdate: (gameState: gameStateUpdate) => void;
  handUpdate: (cards: Card[]) => void;
}

export interface ClientToServerEvents {
  ping: () => void;
  createGame: (userId:string, callback:(id: string) => void) => void;
  joinGame: (gameId: string, userId: string, callback: (result: string) => void) => void;
  startGame: (gameId: string, callback: (result: string) => void) => void;
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



app.use(express.static('dist'))
app.use(express.json());
app.use(cors());



const onConnect = (socket: Socket) => {
  gameService(io, socket)
}

io.listen(WEBSOCKET_PORT);
io.use(socketLogger);
io.on('connection', onConnect)

app.get('/health', (_req, res) => {
  res.send('OK');
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

app.get('/userId', (_req, res) => {
  const id = uuidv7();
  res.json({'id':id});
})


server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket port ${WEBSOCKET_PORT}`)
  console.log(`Redis running on port ${REDIS_URL}`)
});