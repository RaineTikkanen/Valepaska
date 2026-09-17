import redis from 'redis';
import { REDIS_URL } from '../utils/config.js';
import getShuffledDeck from '../deck/deck.js';
import type { Card } from '../deck/deck.type.js';
import type { Play, User, GameState } from './controller.type.js';
import type { Play as servicePlay, Statement} from '../services/gameService.type.js';
import type { GameStateUpdate } from '../services/gameService.type.js';
import { getRandomInt } from '../utils/utils.js';



const client = redis.createClient({
  url: REDIS_URL
});

client.on('error', err => console.log('Redis Client Error', err));

await client.connect();

/**
 * 
 * @param roomId Creates a game and adds one user in it
 * @param userId 
 *
 */
const createRoom = async (roomId: string ) => {
  const deck = getShuffledDeck();
  const result = await client.json.set(
    roomId, 
    '$', 
    {
      isActive: false,
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
  return result;
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

//TODO: Move logic to gameService
const removePlayedCardsFromUserHand = async (roomId: string, userId: string, playedCards: Card[]) => {
  const users = await getUsersInAGame(roomId);
  
  const userIndex = users.findIndex((u) => u.id === userId);

  if (userIndex === -1) throw new Error('User not found');

  const hand = await client.json.get(
    roomId,
    {path: `$.users[${userIndex}].hand`}
  ) as Card[][] | null;

  if (hand === null) throw new Error('userHand not found');

  const remainingHand = [...hand[0]];

  for (const playedCard of playedCards) {
    const cardIndex = remainingHand.findIndex(
      card => JSON.stringify(card) === JSON.stringify(playedCard)
    );

    if (cardIndex !== -1) remainingHand.splice(cardIndex, 1);
  }

  await client.json.set(
    roomId,
    `$.users[${userIndex}].hand`,
    remainingHand
  );
};



//TODO: move logic to gameService
const play = async (roomId: string, play: Play) => {

  if (play.statement.amount === null) return;

  await removePlayedCardsFromUserHand(roomId, play.user, play.cards);

  //update last play
  await client.json.set( 
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
  
  //update play deck
  for (const card of play.cards) {
    await client.json.arrAppend(
      roomId,
      '$.playDeck',
      card
    );
  }

  const users = await getUsersInAGame(roomId);
  const userHand = users.find((u) => u.id === play.user)?.hand;
  if(!userHand) throw new Error('Error finding users');

  await dealCardsToUserById(roomId, play.user, 5-userHand.length);
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
const appendUserHandByIndex = async (roomId: string, index: number, cards: Card[]) => {
  for (const card of cards) {
    await client.json.arrAppend(
      roomId,
      `$.users[${index}].hand`,
      card
    );
  }
};



//TODO: Move logic to gameservice
/**
 * Deals number of cards to a user by index
 * @param roomId 
 * @param index user index in users array
 * @param amount number of cards to deal
 */
const dealCardsToUserByIndex = async (roomId: string, index: number, amount: number) => {
  let cards: Array<Card>=[];


  for(let i=0; i < amount; i++){
    const card = await getCardFromDeck(roomId);

    if (card===null) return;

    cards= cards.concat(card);
  }
  await appendUserHandByIndex(roomId, index, cards);  
};


//OK
const getCardFromDeck = async (roomId: string): Promise<Card | null> => {
  return await client.json.arrPop(
    roomId,
    {path: '.deck'}
  ) as Card | null;
};


//TODO: MOVE LOGIC TO GAMESERVICE
/**
 * Deals number of cards to a user
 * @param roomId 
 * @param userId user to deal cards to
 * @param amount number of cards to deal 
 * @returns  
 */
const dealCardsToUserById = async (roomId: string, userId: string, amount: number) =>{
  const users = await getUsersInAGame(roomId);

  const index = users.findIndex((u) => u.id === userId);

  if(index==null) return;

  await dealCardsToUserByIndex(roomId, index, amount);
};




//TODO: MOVE LOGIC TO GAMESERVICE
/**
 * Deals 5 cards to each user in a game, draws the starting player and changes 'isActive' to 'true'
 * @param roomId   
 */

const initiateGame = async (roomId: string): Promise<string> => {
  const users = await getUsersInAGame(roomId);

  for (const user of users) {
    await dealCardsToUserById(roomId, user.id, 5);
  }

  const starterIndex = getRandomInt(users.length);
  const starter = users[starterIndex].id;

  await client.json.set(
    roomId,
    '$.turn',
    starter
  );

  await client.json.set(
    roomId,
    '$.isActive',
    true
  );
  return users[starterIndex].id;
};


//OK
const deleteRoom = async (roomId: string) => {
  const result = await client.del(roomId);
  return result;
};


//OK
const getGameState = async (roomId: string): Promise<GameState>=> { 
  const result = await client.json.get(roomId) as GameState | null;
  if(!result) throw new Error('Error getting game state');
  return result;
};


//OK
const getLastPlay = async (roomId: string): Promise<Play> => {
  const lastPlay = await client.json.get(
    roomId,
    { path: '.lastPlay' }
  ) as Play | null;

  if(!lastPlay) throw new Error('LastPlay not found');

  return lastPlay;
};


//OK
const getStatementHistory = async (roomId: string): Promise<Statement> => {
  const result = await client.json.get(
    roomId,
    { path: '.statementHistory' }
  ) as Statement | null;

  if(!result) throw new Error('statementHistory not found');
  return result;
};


//Ok
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


//TODO: Move logic to gameService
const getGameStateUpdate = async (roomId: string, ): Promise<GameStateUpdate> => {
  const gameState = await getGameState(roomId);

  
  if (!gameState) throw new Error('GameState not found'); 



  const lastPlay: servicePlay= {
    statement: gameState.lastPlay.statement,
    user: gameState.lastPlay.user
  };

  const sameCardsInPlay = gameState.statementHistory.amount;

  return {
    lastPlay: lastPlay,
    amountOfCardsInPlay: gameState.playDeck.length,
    sameCardsInPlay: sameCardsInPlay,
  };
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


//Ok
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


//TODO: Move this logic to gameService
const playDeckToUser = async (roomId: string, userId:string) =>{
  const playDeck = await getPlayDeck(roomId);
  const users = await getUsersInAGame(roomId);
  const userIndex = users.findIndex((u) => u.id === userId);

  await appendUserHandByIndex(roomId, userIndex, playDeck);

};


//TODO: Move this logic to gameService
const lastStatementIsTrue = async (roomId: string): Promise<boolean> => {

  const lastPlay = await getLastPlay(roomId);

  if (!lastPlay || !lastPlay.statement.amount ||
      !lastPlay.statement.value || !Array.isArray(lastPlay.cards)) {
    throw new Error('No last play');
  }

  return lastPlay.cards.every(card => card.value === lastPlay.statement.value);

};

export default{
  play, 
  getGameState, 
  getLastPlay,
  getStatementHistory,
  setStatementHistory,
  createRoom,
  deleteRoom,
  addUserToGame,
  initiateGame,
  dealCardsToUserById,
  getUsersInAGame,
  getGameStateUpdate,
  removeUserFromGame,
  lastStatementIsTrue,
  playDeckToUser,
  clearPlayDeck,
  clearLastPlay,
  getIsActive,
  setTurn,
  getTurn,
};