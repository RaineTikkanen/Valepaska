import type { Card } from './deck.type.js';
import type {Statement, User} from './game.type.js';
import getShuffledDeck from '../deck/deck.js';

export type RedisPlayer = {
  user: User;
  hand: Array<Card>;
};

export type Play = {
  cards: Array<Card>;
  user: User;
  statement: Statement;
};

export type GameStatus = 'IDLE' | 'PLAYING' | 'WAITING_DOUBT' | 'RESOLVING_DOUBT' | 'CLEARING';
export type ClientStatus = 'LOBBY' | 'GAME' | 'RESULTS';

export class GameState {
  winners: Array<User>;
  gameStatus: GameStatus;
  clientStatus: ClientStatus;
  turn: string;
  deck: Array<Card>;
  playDeck: Array<Card>;
  players: Array<RedisPlayer>;
  lastPlay: Play | null;
  statementHistory: Statement | null;
  constructor(
    winners: Array<User> = [],
    gameStatus: GameStatus = 'IDLE',
    clientStatus: ClientStatus = 'LOBBY',
    turn: string = '',
    deck: Array<Card> = getShuffledDeck(),
    playDeck: Array<Card> = [],
    players: Array<RedisPlayer> = [],
    lastPlay: Play | null = null,
    statementHistory: Statement | null = null,
  ) {
    this.winners = winners;
    this.gameStatus=gameStatus;
    this.clientStatus = clientStatus;
    this.turn = turn;
    this.deck = deck;
    this.playDeck = playDeck;
    this.players = players;
    this.lastPlay = lastPlay;
    this.statementHistory = statementHistory;
  }
};



export const parseStatus = (status: unknown): GameStatus =>{
  if(status !== 'PLAYING'
      && status !== 'WAITING_DOUBT'
      && status !== 'RESOLVING_DOUBT'
      && status !== 'CLEARING'
      && status !== 'IDLE'
  ) throw new Error('Invalid status');
  return status;
};