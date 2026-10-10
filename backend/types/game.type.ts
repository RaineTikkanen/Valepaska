import {parseId} from '../utils/utils.js';
import {CardValues} from './deck.type.js';
import type {Card} from './deck.type.js';
import {getRandomInt} from '../utils/utils.js';
import getShuffledDeck from '../deck/deck.js';

export type ClientPlay = {
  user: User;
  statement: Statement
};

export type Statement = {
  value: number;
  amount: number;
};

export type User = {
  name: string;
  id: string;
};

export type GamePlayer = {
  user: User;
  amountOfCards: number;
};

export type GameStateUpdate = {
  winners: Array<User>;
  lastPlay: ClientPlay | null;
  amountOfCardsInPlay: number;
  sameCardsInPlay: number;
  players: Array<GamePlayer>;
  cardsInDeck: number;
  clientStatus: ClientStatus,
};


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
  winners: Array<string>;
  gameStatus: GameStatus;
  clientStatus: ClientStatus;
  turn: string;
  deck: Array<Card>;
  playDeck: Array<Card>;
  players: Array<RedisPlayer>;
  lastPlay: Play | null;
  statementHistory: Statement | null;

  constructor(
    winners: Array<string> = [],
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

  toGameStateUpdate(): GameStateUpdate {
    const players = this.players.map(p => ({user: p.user, amountOfCards: p.hand.length}));

    const lastPlay = this.lastPlay ? {
      statement: this.lastPlay.statement,
      user: this.lastPlay.user,
    } : null;

    const sameCardsInPlay = this.statementHistory ? this.statementHistory.amount : 0;
    const winners: Array<User> = this.winners.map(w => {
      const player = this.getPlayer(w);
      if(!player) throw new Error(`Player ${w} not found`);
      return player.user;
    });

    return {
      players,
      winners: winners,
      lastPlay,
      amountOfCardsInPlay: this.playDeck.length,
      sameCardsInPlay,
      cardsInDeck: this.deck.length,
      clientStatus: this.clientStatus,
    };
  }

  cardsFromHandToPlayDeck(userId: string, cards: Array<Card>) {
    const player = this.players.find(p => p.user.id === userId);
    if (!player) {
      throw new Error(`Player not found: ${userId}`);
    }

    const remainingHand = [...player.hand];
    for (const cardToPlay of cards) {
      const cardIndex = remainingHand.findIndex(card => card.name === cardToPlay.name);
      if (cardIndex === -1) {
        throw new Error(`Card not found in player hand: ${cardToPlay.name}`);
      }
      remainingHand.splice(cardIndex, 1);
    }

    player.hand = remainingHand;
    this.playDeck = this.playDeck.concat(cards);
  }

  dealCardsToUser(userId: string, amount: number) {
    if (!Number.isInteger(amount) || amount < 0) {
      throw new RangeError('Card amount must be a non-negative integer');
    }

    const player = this.players.find(p => p.user.id === userId);
    if (!player) {
      throw new Error(`Player not found: ${userId}`);
    }

    player.hand = player.hand.concat(this.deck.splice(0, amount));
  }

  updateStatementHistory(statement: Statement) {
    if (this.statementHistory && statement.value === this.statementHistory.value) {
      this.statementHistory = {...this.statementHistory, amount: this.statementHistory.amount+statement.amount};
    } else {
      this.statementHistory = {amount: statement.amount, value: statement.value};
    }
  }

  advanceTurn() {
    let index = this.players.findIndex(p => p.user.id === this.turn);
    let userId = this.turn;
    do {
      if (this.players.length - 1 === index) {
        index = 0;
      } else {
        index++;
      }
      userId = this.players[index].user.id;
    }while (this.winners.some(w => w === userId));
    this.turn = userId;
  }
  getPlayerHand(id: string){
    const player = this.getPlayer(id);
    if (!player) {
      throw new Error(`Player not found: ${id}`);
    }
    return player.hand;
  }

  startGame(){
    this.players.forEach(p => {
      this.dealCardsToUser(p.user.id, 5);
    });
    const starterIndex = getRandomInt(this.players.length);
    this.turn = this.players[starterIndex].user.id;
    this.clientStatus='GAME';
  }

  statementIsTrue() {
    if (!this.lastPlay) throw new Error('No last play');
    return this.lastPlay.cards.every(card => card.value === this.lastPlay!.statement.value);
  }
  getPlayer(id: string){
    return this.players.find(p => p.user.id === id);
  }

  dealPlayDeckToPlayer(id: string){
    const player = this.getPlayer(id);
    if (!player) {
      throw new Error(`Player not found: ${id}`);
    }
    player.hand.push(...this.playDeck);
    this.playDeck = [];
  }

  updateWinners(){
    if(this.deck.length !== 0) return;
    for(const player of this.players){
      if(!this.winners.includes(player.user.id) && player.hand.length === 0 && (!this.lastPlay || this.lastPlay.user.id !== player.user.id)) {
        this.winners.push(player.user.id);
      }
    }
    this.checkGameEnding();
  }

  clearPlay(){
    this.lastPlay = null;
    this.statementHistory = null;
    this.playDeck = [];
  }

  checkGameEnding(){
    if(this.winners.length===this.players.length-1){
      this.clientStatus='RESULTS';
    }
  }

  getGamePlayers():Array<GamePlayer> {
    return this.players.map(p=>({user:p.user, amountOfCards:5}));
  }

  /**
   * Handles doubt action in gameState. Returns an id of a player who loses doubt action
   * @param {string } doubter an id of a player who doubts the play
   */
  resolveDoubt(doubter: string):string {
    if (!this.lastPlay) throw new Error('No last play');
    let loserId = '';
    let winnerId = '';
    const statementIsTrue = this.statementIsTrue();
    //Check if last play matches the statement
    //set loserId and nextTurn based on doubt results
    if (statementIsTrue) {
      loserId = doubter;
      winnerId = this.lastPlay.user.id;
    } else {
      loserId = this.lastPlay.user.id;
      winnerId = doubter;
    }
    this.dealPlayDeckToPlayer(loserId);
    this.turn = winnerId;
    this.clearPlay();
    if(statementIsTrue) {
      this.updateWinners();
    }
    return loserId;
  }

  resolvePlay(userId: string, cards: Array<Card>, statement: Statement){
    this.setLastPlay(userId, cards, statement);
    this.cardsFromHandToPlayDeck(userId, cards);
    this.dealCardsToUser(userId, cards.length);
    this.updateStatementHistory(statement);
    this.updateWinners();
  }

  setLastPlay(userId: string, cards: Array<Card>, statement: Statement){
    const player = this.getPlayer(userId);
    if (!player) throw new Error(`Player not found: ${userId}`);
    this.lastPlay = { cards: cards, user: player.user, statement: statement };
  }
}


export const parseStatus = (status: unknown): GameStatus =>{
  if(status !== 'PLAYING'
    && status !== 'WAITING_DOUBT'
    && status !== 'RESOLVING_DOUBT'
    && status !== 'CLEARING'
    && status !== 'IDLE'
  ) throw new Error('Invalid status');
  return status;
};

export const parseStatement = (statement: unknown): Statement => {
  if(!statement
    || typeof statement !== 'object'
    || !('value' in statement)
    || typeof statement.value !== 'number'
    || !('amount' in statement)
    || typeof statement.amount !== 'number'
    || statement.amount < 1
    || statement.amount > 4
    || !CardValues.some(value => value === statement.value)
    || (statement.value === 1 && statement.amount !== 1)
    || (statement.value === 2 && statement.amount !== 1)
    || (statement.value === 10 && statement.amount !== 1)
  )
  {
    throw new Error('Invalid statement');
  }



  return {value:statement.value, amount:statement.amount};
};

export const parseUser = (user: unknown) :User => {
  if(!user
    || typeof user !== 'object'
    || !('id' in user)
    || typeof user.id !== 'string'
    || !('name' in user)
    || typeof user.name !== 'string'
    || user.name.length > 20
    || user.name.length <4){
    throw new Error('Invalid user');
  }

  return {id:parseId(user.id), name: user.name };
};