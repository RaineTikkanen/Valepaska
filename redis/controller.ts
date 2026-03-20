import redis from 'redis'
import { REDIS_URL } from '../utils/config.js'
import shuffledDeck from '../deck/deck.js'
import { Card } from '../deck/deck.type.js';
import { Play, User, GameState } from './controller.type.js';
import { gameStateUpdate } from '../services/gameService.type.js';




const client = redis.createClient({
  url: REDIS_URL
})

client.on('error', err => console.log('Redis Client Error', err));

await client.connect();

/**
 * 
 * @param gameId Creates a game and adds one user in it
 * @param userId 
 *
 */
const createGame = async (gameId: string, userId: string ) => {
  const deck = shuffledDeck();
  const result = await client.json.set(
    gameId, 
    '$', 
    {
      turn: null,
      deck: deck,
      playDeck: [],
      users:[
        {
          id: userId,
          hand: []
        }
      ],
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

const removeUserFromGame = async (gameId: string, userId: string) => {
  const index = await getUserIndexInAGame(gameId, userId);
  await client.json.del(
    gameId,
    {path: `$.users[${index}]`}
  )
}



const addUserToGame = async (gameId: string, userId: string) => {
  try{
    await client.json.arrAppend(
      gameId,
      '$.users',
      {
        id: userId,
        hand: []
      }
    )
  }catch(e){
    throw(e)
  }
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
 * @param gameId 
 * @returns 
 */
const getUsersInAGame = async (gameId: string): Promise<User[] | null> =>{
  return await client.json.get(
    gameId, 
    {path: '.users'}
  ) as User[] | null;
}



/**
 * Returns users index in users array
 * @param gameId 
 * @param userId 
 * @returns 
 */
const getUserIndexInAGame = async (gameId: string, userId: string): Promise<number | null> => {
  const users = await getUsersInAGame(gameId)

  if (!users) return null
  
  return users.findIndex(p => p.id === userId); 
}



/**
 * Adds number of cards to a users hand
 * @param gameId 
 * @param index user index in users array
 * @param cards cards to add to hand
 */
const appendUserHandByIndex = async (gameId: string, index: number, cards: Card[]) => {
  await client.json.arrAppend(
    gameId,
    `$.users[${index}].hand`,
    cards
  )
}


/**
 * Returns stock deck
 * @param gameId 
 * @returns
 */
const getDeck = async (gameId:string): Promise<Card[]> =>{
  return client.json.get(
    gameId,
    {path: 'deck'}
  ) as Promise<Card[]>
}



/**
 * Deals number of cards to a user by index
 * @param gameId 
 * @param index user index in users array
 * @param amount number of cards to deal
 */
const dealCardsToUserByIndex = async (gameId: string, index: number, amount: number) => {
  let cards: Array<Card>=[];


  for(let i=0; i < amount; i++){
    const card = await getCardFromDeck(gameId);

    if (card===null) return

    cards= cards.concat(card)
  }
  await appendUserHandByIndex(gameId, index, cards)  
}

const getCardFromDeck = async (gameId: string): Promise<Card | null> => {
  return await client.json.arrPop(
    gameId,
    {path: '.deck'}
  ) as Card | null
}



/**
 * Deals number of cards to a user
 * @param gameId 
 * @param userId user to deal cards to
 * @param amount number of cards to deal 
 * @returns  
 */
const dealCardsToUserById = async (gameId: string, userId: string, amount: number) =>{
  const index = await getUserIndexInAGame(gameId, userId)

  if(index==null) return

  await dealCardsToUserByIndex(gameId, index, amount)
}



/**
 * Deals 5 cards to each user in a game
 * @param gameId 
 */
const dealInitialCards = async (gameId: string) => {
  const users = await getUsersInAGame(gameId)

  if(users==null) return

  for (const user of users) {
    await dealCardsToUserById(gameId, user.id, 5);
  }
}



const deleteGame = async (gameId: string) => {
  const result = await client.del(gameId)
  return result
}



const getGameState = async (gameId: string): Promise<GameState | null>=> { 
  return await client.json.get(gameId) as GameState | null;
}

const getGameStateUpdate = async (gameId: string, ): Promise<gameStateUpdate | null> => {
  const gameState = await getGameState(gameId)
  if (gameState===null) return null
  return {
    turn: gameState.turn,
    lastPlay: null,
  }
}

const getUserById = async (gameId: string, userId: string): Promise<User | null > => {
  const users = await getUsersInAGame(gameId);
  if(!users) return null
  
  const user = users.filter((user) => user.id===userId);
  console.log(user)
  return null
}

/*
const getUserHand = async (gameId: string, userId: string): Promise<Card[] | null> => {
  const users = getUserById(gameId, userId);
  return null
}
  */


const setGameDeck = async (gameId: string, deck: Card[]) => {
  await client.json.set(
    gameId,
    '$.deck',
    deck
  )
}



export default{
  play, 
  getGameState, 
  createGame,
  deleteGame,
  addUserToGame,
  dealInitialCards,
  dealCardsToUserById,
  getUsersInAGame,
  getGameStateUpdate,
  removeUserFromGame
}