import express from 'express';
import { Server } from 'socket.io';
import { createServer } from 'node:http';
import { v7 as uuidv7 } from 'uuid';

interface ServerToClientEvents {
  deal: (cards: string) => void;
  doubtResult: (result: boolean) => void;
  gameState: (statement: string) => void;
  joinedGame: (id: string) => void;
}

interface ClientToServerEvents {
  play: (cards: string, statement: string) => void;
  doubt: () => void;
  createGame: () => void;
  joinGame: (id: string) => void;
}

interface SocketData {
  name: string;
}

const app = express()
const server = createServer(app)
const io = new Server<
  ClientToServerEvents,
  ServerToClientEvents,
  SocketData
>

({
  cors: {
    origin: '*'
  }
});

io.listen(4000);

app.use(express.json());

const PORT = 3001;  

io.on('connection', (socket) => {
  const count = io.engine.clientsCount
  console.log(count, ' clients connected')

  socket.on('disconnect', () => {
    console.log('user disconnected');
    const count = io.engine.clientsCount
    console.log(count, ' clients connected')
  });

  socket.on('play', (cards, statement)=>{
    console.log('Played cards: ',cards, ', statement: ', statement);

    socket.broadcast.emit('gameState', statement )
  })

  socket.on('createGame', () => {
    console.log('creating game')
    const id = uuidv7()
    console.log("id= ",id)
    socket.join(id)
    console.log(socket.rooms)
    socket.emit('joinedGame', id)
  })

  socket.on('joinGame', (id)=>{
    socket.join(id)
    console.log("user ", socket.id, " joined room ", id )
    console.log(socket.rooms)
    socket.emit('joinedGame', id)
  })
});


app.get('/health', (_req, res) => {
  res.send('OK');
});

app.use(express.static('dist'))

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});




  