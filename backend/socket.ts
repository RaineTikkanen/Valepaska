import type {GameStateUpdate, Statement, User, GamePlayer} from './types/gameService.type.js';
import type {Card} from './types/deck.type.js';


export const SocketEvents = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  ERROR: 'connect_error',


  //ServerToClient
  ROOM_UPDATE: 'roomUpdate',
  GAME_STARTS: 'gameStarts',
  GAME_STATE_UPDATE: 'gameStateUpdate',
  TURN_UPDATE: 'turnUpdate',
  HAND_UPDATE: 'handUpdate',
  DOUBTED: 'doubted',
  DOUBT_RESULT: 'doubtResult',
  ABOUT_TO_CLEAR: 'aboutToClear',
  GAME_ENDS: 'gameEnds',

  //ClientToServer
  CREATE_ROOM: 'createRoom',
  JOIN_ROOM: 'joinRoom',
  LEAVE_ROOM: 'leaveRoom',
  START_GAME: 'startGame',
  DOUBT: 'doubt',
  PLAY: 'play',
} as const;

export interface ServerToClientEvents {
  roomUpdate: (roomId: string, players: Array<GamePlayer>) => void;
  gameStarts:() => void;
  gameStateUpdate: (gameState: GameStateUpdate) => void;
  turnUpdate: (turn: string) => void;
  handUpdate: (cards: Array<Card>) => void;
  doubted: (doubter: string)=> void;
  doubtResult: (cards: Array<Card>) => void;
  aboutToClear: ()=>void;
  gameEnds:() => void;
}

export interface ClientToServerEvents {
  createRoom: (user: User, callback:(result: string) => void) => void;
  joinRoom: (roomId: string, user: User, callback: (result: string) => void) => void;
  leaveRoom: (callback:(result: string) => void) => void;
  startGame: (callback: (result: string) => void) => void;
  doubt: (callback: (result: string) => void,) => void;
  play: (cards: Array<Card>, statement: Statement, callback: (result: string) => void,) => void;
  getGameState: () => void;
}

export interface SocketData {
  userId: string;
  roomId: string;
  userName: string;
}