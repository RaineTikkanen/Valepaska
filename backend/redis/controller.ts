import redis from 'redis';
import { REDIS_URL } from '../utils/config.js';
import type {Play, RedisPlayer, GameStatus} from '../types/controller.type.js';
import { GameState } from '../types/controller.type.js';
import { parseStatus } from '../types/controller.type.js';
import type {User} from '../types/game.type.js';

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
  const initialState = new GameState();
  const result = await client.json.set(
    roomId,
    '$',
    {...initialState}
  );

  if(!result) throw new Error('Error creating room' );

  //Set game to expire in 6 hours
  await client.expire(roomId, 21600);
};

/**
 * Function to get a status of a game. If status is not found or status is not valid status, throws an error
 * @param {string} roomId Id of a room to get status from
 * @returns {GameStatus} status of a game
 */
const getStatus = async (roomId: string): Promise<GameStatus> => {
  const result = await client.json.get(
    roomId,
    {path: '$.gameStatus'}
  );

  if(!Array.isArray(result) || result.length !== 1 || typeof result[0] !== 'string') {
    throw new Error('Cant get status');
  }

  return parseStatus(result[0]);
};

/**
 * Set status of a game. Throws an error if setting the status fails
 * @param {string} roomId Id of a room to get status from
 * @param {GameStatus} status to set
 */
const setStatus = async (roomId: string, status: GameStatus) => {
  const result = await client.json.set(
    roomId,
    '$.gameStatus',
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
const getClientStatus = async (roomId: string): Promise<string> => {
  const result = await client.json.get(
    roomId,
    {path: '$.clientStatus'}
  );
  if(!Array.isArray(result) || result.length !== 1 || typeof result[0] !== 'string') {
    throw new Error('Cant get client status');
  }

  return result[0];
};

/**
 * Function to set isActive state of a game. Throws an error if setting the status fails.
 * @param {string} roomId Id of game to set status
 * @param {boolean} isActive value to set status to
 */
const setClientStatus = async (roomId: string, isActive: boolean) => {
  const result = await client.json.set(
    roomId,
    '$.clientStatus',
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
 * @param {string} turn Id of user whose turn it is
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
 * Returns a players list in a game
 * @param roomId
 * @returns
 */
const getPlayersInAGame = async (roomId: string): Promise<Array<RedisPlayer>> => {
  const result = await client.json.get(
    roomId,
    {path: '$.players'}
  ) as Array<RedisPlayer> | null;

  if(!Array.isArray(result) || result.length !== 1 || !Array.isArray(result[0])) {
    throw new Error('Cant get players in a game');
  }

  return result[0];
};


const deleteRoom = async (roomId: string) => {
  await client.del(roomId);
};


const getGameState = async (roomId: string): Promise<GameState>=> {
  const result = await client.json.get(roomId) as GameState | null;
  if(!result) throw new Error('Error getting game state');
  return new GameState(
    result.winners,
    result.gameStatus,
    result.clientStatus,
    result.turn,
    result.deck,
    result.playDeck,
    result.players,
    result.lastPlay,
    result.statementHistory,
  );
};

const setGameState = async (roomId: string, gameState: GameState) => {
  const result = await client.json.set(
    roomId,
    '$',
    {...gameState}
  );
  if(result !== 'OK') throw new Error('Cant set game state');
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

const setWinners = async (roomId: string, winners: Array<User>) => {
  await client.json.set(
    roomId,
    '$.winners',
    winners,
  );
};


export default{
  getGameState,
  setGameState,
  setLastPlay,
  createRoom,
  deleteRoom,
  addUserToRoom,
  getPlayersInAGame,
  removePlayerFromRoom,
  getClientStatus,
  setClientStatus,
  setTurn,
  setWinners,
  getStatus,
  setStatus,
};