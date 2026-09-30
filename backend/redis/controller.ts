import redis from 'redis';
import { REDIS_URL } from '../utils/config.js';
import getShuffledDeck from '../deck/deck.js';
import type { Card } from '../deck/deck.type.js';
import type {Play, Player, GameState, Status} from './controller.type.js';
import { parseStatus } from './controller.type.js';
import type {Statement, User} from '../services/gameService.type.js';
import { parseUser } from '../services/gameService.type.js';
import { parseCard } from '../deck/deck.type.js';
import logger from '../utils/logger.js';



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
      players:[],
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
    {path: '$.status'}
  );

  if(!Array.isArray(result) || result.length !== 1 || typeof result[0] !== 'string') {
    throw new Error('Cant get status');
  }

  return parseStatus(result[0]);
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
 * Removes a player from a room
 * @param {string} roomId Id of room
 * @param userIndex
 */
const removePlayerFromRoom = async (roomId: string, userIndex: number) => {
  await client.json.del(
    roomId,
    {path: `$.players[${userIndex}]`}
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
    {path: '$.isActive'}
  );
  if(!Array.isArray(result) || result.length !== 1 || typeof result[0] !== 'boolean') {
    throw new Error('Cant get isActive');
  }

  return result[0];
};

/**
 * Function to set isActive state of a game. Throws an error if setting the status fails.
 * @param {string} roomId Id of game to set status
 * @param {boolean} isActive value to set status to
 */
const setIsActive = async (roomId: string, isActive: boolean) => {
  const result = await client.json.set(
    roomId,
    '$.isActive',
    isActive
  );

  if(result !== 'OK') throw new Error('Cant set isActive');
};

/**
 * Function to add a user to a room.
 * @param {string} roomId Id of room
 * @param {User} user user to add
 */
const addUserToRoom = async (roomId: string, user: User ) => {

  await client.json.arrAppend(
    roomId,
    '$.players',
    {user:user, hand: []}
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
    {path: '$.turn'}
  );

  if(!Array.isArray(result) || result.length !== 1 || typeof result[0] !== 'string') {
    throw new Error('Cant get turn');
  }

  return result[0];
};


/**
 * Function to get the play deck. Throws an error if getting the deck fails
 * @param roomId
 */
const getPlayDeck = async (roomId: string): Promise<Array<Card>> => {
  const result = await client.json.get(
    roomId,
    {path: '$.playDeck'}
  );

  if(!Array.isArray(result)
    || result.length !== 1
    || !Array.isArray(result[0])
  ) {
    throw new Error('Cant get playDeck');
  }
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


const setPlayerHand = async (roomId: string, hand: Array<Card>, userIndex: number) => {
  const result = await client.json.set(
    roomId,
    `$.players[${userIndex}].hand`,
    hand
  );
  if(result !== 'OK') throw new Error('Failed to set user hand');
};



/**
 * Returns a players list in a game
 * @param roomId
 * @returns
 */
const getPlayersInAGame = async (roomId: string): Promise<Array<Player>> => {
  const result = await client.json.get(
    roomId,
    {path: '$.players'}
  ) as Array<Player> | null;

  if(!Array.isArray(result) || result.length !== 1 || !Array.isArray(result[0])) {
    throw new Error('Cant get players in a game');
  }

  return result[0];
};



/**
 * Adds number of cards to a player's hand
 * @param roomId
 * @param index user index in players array
 * @param cards cards to add to hand
 */
const appendPlayerHand = async (roomId: string, index: number, cards: Array<Card>) => {
  for (const card of cards) {
    await client.json.arrAppend(
      roomId,
      `$.players[${index}].hand`,
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
    {path: '$.deck'}
  );

  logger.child({result: result}).debug('[redisController] popCardFromDeck');

  if(!Array.isArray(result) || result.length !== 1 || typeof result[0] !== 'object') {
    throw new Error('Cant popCardFromDeck');
  }

  return parseCard(result[0]);
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
  const result = await client.json.get(
    roomId,
    { path: '.lastPlay' }
  );

  if(!Array.isArray(result) || result.length !== 1 || typeof result[0] !== 'object') {
    throw new Error('Cant get lastPlay');
  }

  return result[0] as Play;
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
    { path: '$.statementHistory' }
  );

  if(!Array.isArray(result) || result.length !== 1 || typeof result[0] !== 'object') {
    throw new Error('Cant get statementHistory');
  }

  return result[0] as Statement;
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

const setWinners = async (roomId: string, winners: Array<User>) => {
  await client.json.set(
    roomId,
    '$.winners',
    winners,
  );
};

const getWinners = async (roomId: string): Promise<Array<User>> => {
  const result = await client.json.get(
    roomId,
    {path: '$.winners'},
  );

  if(!Array.isArray(result) || result.length !== 1 || !Array.isArray(result[0])) {
    throw new Error('Cant get winners');
  }

  return result.map(u => parseUser(u));
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
  getPlayersInAGame,
  removePlayerFromRoom,
  getPlayDeck,
  clearPlayDeck,
  appendPlayDeck,
  getIsActive,
  setIsActive,
  setTurn,
  getTurn,
  setPlayerHand,
  appendPlayerHand,
  dealCardsFromDeck,
  setWinners,
  getWinners,
  getStatus,
  setStatus,
};