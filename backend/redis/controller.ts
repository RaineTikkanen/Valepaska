import redis from 'redis';
import { REDIS_URL } from '../utils/config.js';
import getShuffledDeck from '../deck/deck.js';
import type { Card } from '../deck/deck.type.js';
import type {Play, User, GameState, Status} from './controller.type.js';
import { parseStatus } from './controller.type.js';
import type {Statement} from '../services/gameService.type.js';
import { parseCard } from '../deck/deck.type.js';
import logger from '../utils/logger.js';
import {isString} from '../utils/utils.js';



const client = redis.createClient({
  url: REDIS_URL
});

client.on('error', err => console.error('Redis Client Error', err));

await client.connect();

/**
 * Creates a room with empty GameState
 * @param {string} roomId Id for room to create
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

/**
 * Function to get a status of a game. If status is not found or status is not valid status, throws an error
 * @param {string} roomId Id of a room to get status from
 * @returns {Status} status of a game
 */
const getStatus = async (roomId: string): Promise<Status> => {
  const result = await client.json.get(
    roomId,
    {path: '.status'}
  );
  return parseStatus(result);
};

/**
 * Set status of a game. Throws an error if setting the status fails
 * @param {string} roomId Id of a room to get status from
 * @param {Status} status to set
 */
const setStatus = async (roomId: string, status: Status) => {
  const result = await client.json.set(
    roomId,
    '$.status',
    status,
  );
  if(result!=='OK') throw new Error('Error setting status');
};

/**
 * Removes a user from a room
 * @param {string} roomId Id of room
 * @param userIndex
 */
const removeUserFromRoom = async (roomId: string, userIndex: number) => {
  await client.json.del(
    roomId,
    {path: `$.users[${userIndex}]`}
  );
};

/**
 * Function to get isActive status from a game. Throws error if getting the status fails
 * @param {string} roomId Id of room to get status from
 * @returns {Promise<boolean>} isActive state
 */
const getIsActive = async (roomId: string): Promise<boolean> => {
  const result = await client.json.get(
    roomId,
    {path: '.isActive'}
  );
  if(typeof result !== 'boolean') throw new Error('Cant get isActive');

  return result;
};

/**
 * Function to set isActive state of a game. Throws an error if setting the status fails.
 * @param {string} roomId Id of game to set status
 * @param {boolean} isActive value to set status to
 */
const setIsActive = async (roomId: string, isActive: boolean) => {
  const result = await client.json.set(
    roomId,
    'isActive',
    isActive
  );

  if(result !== 'OK') throw new Error('Cant set isActive');
};

/**
 * Function to add a user to a room.
 * @param {string} roomId Id of room
 * @param {string} userId Id of user to add
 */
const addUserToRoom = async (roomId: string, userId: string) => {
  await client.json.arrAppend(
    roomId,
    '$.users',
    {
      id: userId,
      hand: []
    }
  );
};

/**
 * Function to set turn in a game. Throws an error if setting the turn fails
 * @param {string} roomId Id of room
 * @param {sring} turn Id of user whose turn it is
 */
const setTurn = async (roomId: string, turn: string) => {
  const result = await client.json.set(
    roomId,
    '$.turn',
    turn
  );
  if(result !== 'OK') throw new Error('Cant set turn');
};


/**
 * Function to get the id of a player whose turn it is. Throws an error if turn is not found
 * @param {string} roomId Id of room
 * @returns {string} Id of user whose turn it is
 */
const getTurn = async(roomId: string): Promise<string> => {
  const result = await client.json.get(
    roomId, 
    {path: '.turn'}
  );

  if (typeof result !== 'string') throw new Error('Error getting turn');

  return result;
};


/**
 * Function to get the play deck. Throws an error if getting the deck fails
 * @param roomId
 */
const getPlayDeck = async (roomId: string): Promise<Array<Card>> => {
  const result = await client.json.get(
    roomId,
    {path: '.playDeck'}
  );
  if(!Array.isArray(result)) throw new Error('Error getting play deck');
  return result.map(c => parseCard(c));
};

/**
 * Function to add cards to the play deck
 * @param {string} roomId Id of room
 * @param {Cards}cards
 */
const appendPlayDeck = async (roomId: string, cards: Array<Card>) => {
  for (const card of cards) {
    await client.json.arrAppend(
      roomId,
      '$.playDeck',
      card
    );
  }
};


/**
 * Function to clear the play deck. Throws an error if clearing fails.
 * @param {}roomId
 */
const clearPlayDeck = async (roomId: string) => {

  const result = await client.json.set(
    roomId,
    '$.playDeck',
    []
  );
  
  if(!result) throw new Error('Error clearing play deck');
};


const setUserHand = async (roomId: string, hand: Array<Card>, userIndex: number) => {
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
const getUsersInAGame = async (roomId: string): Promise<Array<User>> => {
  const users = await client.json.get(
    roomId, 
    {path: '.users'}
  ) as Array<User> | null;

  if(users===null) throw new Error('Users not found');

  return users;
};



/**
 * Adds number of cards to a users hand
 * @param roomId
 * @param index user index in users array
 * @param cards cards to add to hand
 */
const appendUserHand = async (roomId: string, index: number, cards: Array<Card>) => {
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
const dealCardsFromDeck = async (roomId: string, amount: number): Promise<Array<Card>> => {
  let cards: Array<Card>=[];

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

const setGameState = async (roomId: string, gameState: GameState) => {
  const result = await client.json.set(
    roomId,
    '$',
    gameState
  );
  if(result !== 'OK') throw new Error('Cant set game state');
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
      user: '',
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
  logger.debug('[redisController] getStatementHistory');
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
  logger.debug('[redisController] clearStatementHistory');
};

const setWinners = async (roomId: string, winners: Array<string>) => {
  await client.json.set(
    roomId,
    '$.winners',
    winners,
  );
};

const getWinners = async (roomId: string) => {
  const result = await client.json.get(
    roomId,
    {path: '.winners'},
  );

  if(!result || !Array.isArray(result)) throw new Error('Error getWinners');

  return result.map(u => {
    if(!isString(u)) throw new Error('Error getWinners');
    return u;
  });
};



export default{
  getGameState,
  setGameState,
  getLastPlay,
  setLastPlay,
  clearLastPlay,
  getStatementHistory,
  setStatementHistory,
  clearStatementHistory,
  createRoom,
  deleteRoom,
  addUserToRoom,
  getUsersInAGame,
  removeUserFromRoom,
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
  setWinners,
  getWinners,
  getStatus,
  setStatus,
};