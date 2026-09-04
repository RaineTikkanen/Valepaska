import redis from 'redis'
import { REDIS_URL } from '../utils/config.js'
import getShuffledDeck from '../deck/deck.js'
import { Card } from '../deck/deck.type.js';
import { Play, User, GameState } from './controller.type.js';
import { GameStateUpdate } from '../services/gameService.type.js';
import { getRandomInt } from '../utils/utils.js';



const client = redis.createClient({
  url: REDIS_URL
})

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
      turnIndex: null,
      deck: deck,
      playDeck: [],
      users:[],
      lastPlay: {
        cards: [],
        user: null,
        statement: {
          value: null,
          amount: null,
          isTrue: null,
        },
      },
    })
  return result
}

const removeUserFromGame = async (roomId: string, userId: string) => {
  const index = await getUserIndexInAGame(roomId, userId);
  await client.json.del(
    roomId,
    {path: `$.users[${index}]`}
  )
}



const addUserToGame = async (roomId: string, userId: string) => {
  const gameState = await getGameState(roomId);
  if (gameState && gameState.isActive){
    throw new Error('Game is active. Can not join.')
  }
  await client.json.arrAppend(
    roomId,
    '$.users',
    {
      id: userId,
      hand: []
    }
  )
}



const play = async (key: string, play: Play) => {
  const result = await client.json.set( 
    key, 
    '$.gameState', 
    {
      cards: play.cards, 
      statement: {
        value: play.statement.value,
        amount: play.statement.amount
      }
    }
  );
  return result
}


/**
 * Returns a users list in a game
 * @param roomId 
 * @returns 
 */
const getUsersInAGame = async (roomId: string): Promise<User[] | null> =>{
  return await client.json.get(
    roomId, 
    {path: '.users'}
  ) as User[] | null;
}



/**
 * Returns users index in users array
 * @param roomId   
 * @param userId 
 * @returns 
 */
const getUserIndexInAGame = async (roomId: string, userId: string): Promise<number | null> => {
  const users = await getUsersInAGame(roomId)

  if (!users) return null
  
  return users.findIndex(p => p.id === userId); 
}



/**
 * Adds number of cards to a users hand
 * @param roomId 
 * @param index user index in users array
 * @param cards cards to add to hand
 */
const appendUserHandByIndex = async (roomId: string, index: number, cards: Card[]) => {
  await client.json.arrAppend(
    roomId,
    `$.users[${index}].hand`,
    cards
  )
}



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

    if (card===null) return

    cards= cards.concat(card)
  }
  await appendUserHandByIndex(roomId, index, cards)  
}

const getCardFromDeck = async (roomId: string): Promise<Card | null> => {
  return await client.json.arrPop(
    roomId,
    {path: '.deck'}
  ) as Card | null
}



/**
 * Deals number of cards to a user
 * @param roomId 
 * @param userId user to deal cards to
 * @param amount number of cards to deal 
 * @returns  
 */
const dealCardsToUserById = async (roomId: string, userId: string, amount: number) =>{
  const index = await getUserIndexInAGame(roomId, userId)

  if(index==null) return

  await dealCardsToUserByIndex(roomId, index, amount)
}



/**
 * Deals 5 cards to each user in a game, draws the starting player and changes 'isActive' to 'true'
 * @param roomId   
 */
const initiateGame = async (roomId: string) => {
  const users = await getUsersInAGame(roomId)

  if(users==null) return

  for (const user of users) {
    await dealCardsToUserById(roomId, user.id, 5);
  }

  const starterIndex = getRandomInt(users.length);
  await client.json.set(
    roomId,
    '$.turnIndex',
    starterIndex
  )
  await client.json.set(
    roomId,
    '$.isActive',
    true
  )
}



const deleteRoom = async (roomId: string) => {
  const result = await client.del(roomId)
  return result
}



const getGameState = async (roomId: string): Promise<GameState | null>=> { 
  return await client.json.get(roomId) as GameState | null;
}

const getGameStateUpdate = async (roomId: string, ): Promise<GameStateUpdate | null> => {
  const gameState = await getGameState(roomId)
  console.log('gameState from redis:', gameState)
  if (gameState===null) throw new Error('GameState not found') 

  const users = gameState.users;
  if(gameState.turnIndex===null) throw new Error('GameState.turnIndex not found')
  const turn = users[gameState.turnIndex].id;

  return {
    turn: turn,
    lastPlay: null,
  }
}

export default{
  play, 
  getGameState, 
  createRoom,
  deleteRoom,
  addUserToGame,
  initiateGame,
  dealCardsToUserById,
  getUsersInAGame,
  getGameStateUpdate,
  removeUserFromGame,
}