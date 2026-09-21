import redis from 'redis';
import { REDIS_URL } from '../utils/config.js';
import getShuffledDeck from '../deck/deck.js';
import type { Card } from '../deck/deck.type.js';
import {Play, User, GameState, Status, parseStatus} from './controller.type.js';
import type {Statement} from '../services/gameService.type.js';
import { parseCard } from '../utils/utils.js';



const client = redis.createClient({
  url: REDIS_URL
});

client.on('error', err => console.error('Redis Client Error', err));

await client.connect();

/**
 * 
 * @param roomId Creates a game
 *
 */
const createRoom = async (roomId: string ) => {
  const deck = getShuffledDeck();
  const result = await client.json.set(
    roomId, 
    '$',
    {
      winners: [],
      isActive: false,
      status: 'IDLE',
      turn: null,
      deck: deck,
      playDeck: [],
      users:[],
      statementHistory: {
        value: 0,
        amount: 0,
      },
      lastPlay: {
        cards: [],
        user: '',
        statement: {
          value: 0,
          amount: 0,
        },
      },
    });

  if(!result) throw new Error('Error creating room');
};

const getStatus = async (roomId: string): Promise<Status> => {
  const result = await client.json.get(
    roomId,
    {path: '.status'}
  );
  const parsedStatus = parseStatus(result);
  return parsedStatus;
};

const setStatus = async (roomId: string, status: Status) => {
  const result = await client.json.set(
    roomId,
    '$.status',
    status,
  );
  if(result!=='OK') throw new Error('Error setting status');
};

const removeUserFromGame = async (roomId: string, userIndex: number) => {
  await client.json.del(
    roomId,
    {path: `$.users[${userIndex}]`}
  );
};


const getIsActive = async (roomId: string): Promise<boolean> => {
  const result = await client.json.get(
    roomId,
    {path: '.isActive'}
  );
  if(typeof result !== 'boolean') throw new Error('Cant get isActive');

  return result;
};

const setIsActive = async (roomId: string, isActive: boolean) => {
  const result = await client.json.set(
    roomId,
    '$isActive',
    isActive
  );

  if(result !== 'OK') throw new Error('Cant set isActive');
};

const addUserToGame = async (roomId: string, userId: string) => {  
  await client.json.arrAppend(
    roomId,
    '$.users',
    {
      id: userId,
      hand: []
    }
  );
};

const setTurn = async (roomId: string, turn: string) => {
  await client.json.set(
    roomId,
    '$.turn',
    turn
  );
};


//OK
const getTurn = async(roomId: string): Promise<string> => {
  const result = await client.json.get(
    roomId, 
    {path: '.turn'}
  );

  if (typeof result !== 'string') throw new Error('Error getting turn');

  return result;
};

//OK
const getPlayDeck = async (roomId: string): Promise<Card[]> => {
  return await client.json.get(
    roomId,
    {path: '.playDeck'}
  ) as Card[];
};

const appendPlayDeck = async (roomId: string, cards: Card[]) => {
  for (const card of cards) {
    await client.json.arrAppend(
      roomId,
      '$.playDeck',
      card
    );
  }
};


//OK
const clearPlayDeck = async (roomId: string) => {

  const result = await client.json.set(
    roomId,
    '$.playDeck',
    []
  );
  
  if(!result) throw new Error('Error clearing play deck');
};


const setUserHand = async (roomId: string, hand: Card[], userIndex: number) => {
  const result = await client.json.set(
    roomId,
    `$.users[${userIndex}].hand`,
    hand
  );
  if(result !== 'OK') throw new Error('Failed to set user hand');
};



/**
 * Returns a users list in a game
 * @param roomId 
 * @returns 
 */
const getUsersInAGame = async (roomId: string): Promise<User[]> => {
  const users = await client.json.get(
    roomId, 
    {path: '.users'}
  ) as User[] | null;

  if(users===null) throw new Error('Users not found');

  return users;
};



/**
 * Adds number of cards to a users hand
 * @param roomId 
 * @param index user index in users array
 * @param cards cards to add to hand
 */
const appendUserHand = async (roomId: string, index: number, cards: Card[]) => {
  for (const card of cards) {
    await client.json.arrAppend(
      roomId,
      `$.users[${index}].hand`,
      card
    );
  }
};

/**
 * Pops cards from deck and returns them
 * @param roomId
 * @param amount number of cards to deal
 */
const dealCardsFromDeck = async (roomId: string, amount: number): Promise<Card[]> => {
  let cards: Card[]=[];

  for(let i=0; i < amount; i++){
    const card = await popCardFromDeck(roomId);

    if (!card) break;

    cards= cards.concat(card);
  }

  return cards;
};


const popCardFromDeck = async (roomId: string): Promise<Card | null> => {
  const result = await client.json.arrPop(
    roomId,
    {path: '.deck'}
  );

  if(result === null) return null;

  return parseCard(result);
};


const deleteRoom = async (roomId: string) => {
  await client.del(roomId);
};


const getGameState = async (roomId: string): Promise<GameState>=> {
  const result = await client.json.get(roomId) as GameState | null;
  if(!result) throw new Error('Error getting game state');
  return result;
};


const getLastPlay = async (roomId: string): Promise<Play> => {
  const lastPlay = await client.json.get(
    roomId,
    { path: '.lastPlay' }
  ) as Play | null;

  if(!lastPlay) throw new Error('LastPlay not found');

  return lastPlay;
};

const setLastPlay = async (roomId: string, play: Play) => {
  const result = await client.json.set( 
    roomId, 
    '$.lastPlay', 
    {
      cards: play.cards, 
      user: play.user,
      statement: {
        value: play.statement.value,
        amount: play.statement.amount
      }
    }
  );

  if(result !== 'OK') throw new Error('cant set lastPlay');
};


const clearLastPlay = async (roomId: string) => {
  const result = await client.json.set(
    roomId,
    '$.lastPlay',
    {
      cards: [],
      user: 0,
      statement: {
        value: 0,
        amount: 0,
      },
    },
  );

  if(!result) throw new Error('Error clearing last play');
};


const getStatementHistory = async (roomId: string): Promise<Statement> => {
  const result = await client.json.get(
    roomId,
    { path: '.statementHistory' }
  ) as Statement | null;

  if(!result) throw new Error('statementHistory not found');
  return result;
};


const setStatementHistory = async (
  roomId: string,
  statement: Statement
) => {
  const result = await client.json.set(
    roomId,
    '$.statementHistory',
    {
      value: statement.value,
      amount: statement.amount
    }
  );

  if(!result) throw new Error('error setting statement history');
};

const clearStatementHistory = async (
  roomId: string,
) => {
  const result = await client.json.set(
    roomId,
    '$.statementHistory',
    {
      value: 0,
      amount: 0
    }
  );

  if(!result) throw new Error('error setting statement history');
};

const appendToWinners = async (roomId: string, userId: string) => {
  await client.json.arrAppend(
    roomId,
    '$.winners',
    userId,
  );
};



export default{
  getGameState, 
  getLastPlay,
  setLastPlay,
  clearLastPlay,
  getStatementHistory,
  setStatementHistory,
  clearStatementHistory,
  createRoom,
  deleteRoom,
  addUserToGame,
  getUsersInAGame,
  removeUserFromGame,
  getPlayDeck,
  clearPlayDeck,
  appendPlayDeck,
  getIsActive,
  setIsActive,
  setTurn,
  getTurn,
  setUserHand,
  appendUserHand,
  dealCardsFromDeck,
  appendToWinners,
  getStatus,
  setStatus,
};