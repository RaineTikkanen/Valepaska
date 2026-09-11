import redis from 'redis'
import { REDIS_URL } from '../utils/config.js'
import getShuffledDeck from '../deck/deck.js'
import { Card } from '../deck/deck.type.js';
import { Play, User, GameState } from './controller.type.js';
import { Play as servicePlay, Statement} from '../services/gameService.type.js';
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
    })
  return result
}



const removeUserFromGame = async (roomId: string, userId: string) => {
  const users = await getUsersInAGame(roomId);
  const index = getUserIndex(userId, users);
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

const setTurnIndex = async (roomId: string, index: number) => {
  await client.json.set(
    roomId,
    '$.turnIndex',
    index
  )
}

const setTurnIndexByUserId = async (roomId: string, userId: string)  => {
  const users = await getUsersInAGame(roomId);
  const userIndex = getUserIndex(userId, users)
  await setTurnIndex(roomId, userIndex)
}

const getTurnIndex = async(roomId: string): Promise<number> => {
  return await client.json.get(
    roomId, 
    {path: '.turnIndex'}
  ) as number
}

const advanceTurn = async (roomId: string): Promise<string>=> {

  const turnIndex = await getTurnIndex(roomId)

  const users = await getUsersInAGame(roomId)

  if(!users) throw new Error('Users not found')
  if(turnIndex===null) throw new Error('TurnIndex not found')

  if(users.length-1 === turnIndex){
    await setTurnIndex(roomId, 0)
    return users[0].id;
  }else{
    await setTurnIndex(roomId, turnIndex+1)
    return users[turnIndex+1].id
  }
}

const getPlayDeck = async (roomId: string): Promise<Card[]> => {
  return await client.json.get(
    roomId,
    {path: '.playDeck'}
  ) as Card[];
}

const removePlayedCardsFromUserHand = async (roomId: string, userId: string, playedCards: Card[]) => {
  const users = await getUsersInAGame(roomId)
  
  const userIndex = getUserIndex(userId, users)

  if (userIndex === -1) throw new Error('User not found')

  const hand = await client.json.get(
    roomId,
    {path: `$.users[${userIndex}].hand`}
  ) as Card[][] | null

  if (hand === null) throw new Error('userHand not found')

  const remainingHand = [...hand[0]]

  for (const playedCard of playedCards) {
    const cardIndex = remainingHand.findIndex(
      card => JSON.stringify(card) === JSON.stringify(playedCard)
    )

    if (cardIndex !== -1) remainingHand.splice(cardIndex, 1)
  }

  await client.json.set(
    roomId,
    `$.users[${userIndex}].hand`,
    remainingHand
  )
}


const play = async (roomId: string, play: Play) => {

  if (play.statement.amount === null) return;

  // const fakeCards: Card[] = [{
  //   name: 'C2',
  //   suit: 'C',
  //   value: 2,
  // }]

  await removePlayedCardsFromUserHand(roomId, play.user, play.cards)

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
  
  //update playdeck
  for (const card of play.cards) {
    await client.json.arrAppend(
      roomId,
      '$.playDeck',
      card
    );
  }

  const userHand = await getUserHand(roomId, play.user);
  
  await dealCardsToUserById(roomId, play.user, 5-userHand.length)
}


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

  if(users===null) throw new Error('Users not found')

  return users
}



/**
 * Returns users index in users array
 * @param roomId   
 * @param userId 
 * @returns 
 */
const getUserIndex = (userId: string, users: User[]): number=> {  
  return users.findIndex(p => p.id === userId); 
}

/**
 * Returns a user's hand in a game
 * @param roomId
 * @param userId
 * @returns
 */
const getUserHand = async (roomId: string, userId: string): Promise<Card[]> => {
  const users = await getUsersInAGame(roomId);

  const index = getUserIndex(userId, users)

  if (index === -1) throw new Error('Index not found')

  return users[index].hand;
}


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
    )
  }
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
  const users = await getUsersInAGame(roomId)

  const index = getUserIndex(userId, users)

  if(index==null) return

  await dealCardsToUserByIndex(roomId, index, amount)
}





/**
 * Deals 5 cards to each user in a game, draws the starting player and changes 'isActive' to 'true'
 * @param roomId   
 */
const initiateGame = async (roomId: string): Promise<string> => {
  const users = await getUsersInAGame(roomId)

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
  return users[starterIndex].id
}



const deleteRoom = async (roomId: string) => {
  const result = await client.del(roomId)
  return result
}



const getGameState = async (roomId: string): Promise<GameState | null>=> { 
  return await client.json.get(roomId) as GameState | null;
}

const getLastPlay = async (roomId: string): Promise<Play> => {
  const lastPlay = await client.json.get(
    roomId,
    { path: '.lastPlay' }
  ) as Play | null

  if(lastPlay===null) throw new Error('LastPlay not found')
  
  return lastPlay
}

const getStatementHistory = async (roomId: string): Promise<Statement> => {
  const result = await client.json.get(
    roomId,
    { path: '.statementHistory' }
  ) as Statement | null

  if(result === null) throw new Error('statementHistory not found')
  return result
}

const setStatementHistory = async (
  roomId: string,
  statement: Statement
) => {
  await client.json.set(
    roomId,
    '$.statementHistory',
    {
      value: statement.value,
      amount: statement.amount
    }
  )
}

const getGameStateUpdate = async (roomId: string, ): Promise<GameStateUpdate> => {
  const gameState = await getGameState(roomId)

  
  if (gameState===null) throw new Error('GameState not found') 



  const lastPlay: servicePlay= {
    statement: gameState.lastPlay.statement,
    user: gameState.lastPlay.user
  }

  const sameCardsInPlay = gameState.statementHistory.amount
  return {
    lastPlay: lastPlay,
    amountOfCardsInPlay: gameState.playDeck.length,
    sameCardsInPlay: sameCardsInPlay,
  }
}

const clearPlaydeck = async (roomId: string) => {

  await client.json.set(
    roomId,
    '$.playDeck',
    []
  );
}

const clearLastPlay = async (roomId: string) => {

  await client.json.set(
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
  )
}

const playDeckToUser = async (roomId: string, userId:string) =>{
  const playDeck = await getPlayDeck(roomId);
  const users = await getUsersInAGame(roomId);
  const userIndex = getUserIndex(userId, users);

  await appendUserHandByIndex(roomId, userIndex, playDeck)

}

const lastStatementIsTrue = async (roomId: string): Promise<boolean> => {

  const lastPlay = await getLastPlay(roomId);

  if (lastPlay === null || lastPlay.statement.amount === null ||
      lastPlay.statement.value === null || !Array.isArray(lastPlay.cards)) {
    throw new Error('No last play')
  }

  return lastPlay.cards.every(card => card.value === lastPlay.statement.value)

}

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
  getUserHand,
  getGameStateUpdate,
  removeUserFromGame,
  advanceTurn,
  lastStatementIsTrue,
  playDeckToUser,
  clearPlaydeck,
  clearLastPlay,
  setTurnIndexByUserId,
}