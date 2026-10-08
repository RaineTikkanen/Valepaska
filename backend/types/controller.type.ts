import type {Card} from './deck.type.js';
import type {GamePlayer, GameStateUpdate, Statement, User} from './game.type.js';
import {getRandomInt} from '../utils/utils.js';
import getShuffledDeck from '../deck/deck.js';
import logger from '../utils/logger.js';

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

  updatePlayerHand(userId:string, newHand: Array<Card>) {
    this.players.map(p => {
      if(p.user.id === userId){
        p.hand = newHand;
      }
      return p;
    });
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
      logger.debug('[gameService] play: Adding ');
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
    logger.child({deckLength: this.deck.length}).debug('[gameService] updateWinners');
    if(this.deck.length !== 0) return;
    logger.debug('[gameService] updateWinners after deck check');
    for(const player of this.players){
      if(!this.winners.includes(player.user.id) && player.hand.length === 0 && (!this.lastPlay || this.lastPlay.user.id !== player.user.id)) {
        logger.debug(`[gameSevice] appending user ${player.user.id} to winners` );
        this.winners.push(player.user.id);
      }
    }
    this.checkGameEnding();
  }

  checkGameEnding(){
    logger.child({winnersLength: this.winners.length, playersLength: this.players.length}).debug('checkGameEnding');
    if(this.winners.length===this.players.length-1){
      logger.debug('GAME ENDS!!!');
      this.clientStatus='RESULTS';
    }
  }

  getGamePlayers():Array<GamePlayer> {
    return this.players.map(p=>({user:p.user, amountOfCards:5}));
  }

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
    this.lastPlay=null;
    this.playDeck = [];
    this.statementHistory=null;

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