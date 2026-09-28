import type { GameState } from '../redis/controller.type.js';
import type {GameStateUpdate, User} from './gameService.type.js';
import type { Player } from '../redis/controller.type.js';
import type { Card } from '../deck/deck.type.js';
import logger from '../utils/logger.js';

/**
 * Returns GameStateUpdate from GameState
 * @param gameState
 * @returns gameStateUpdate
*/
const createGameStateUpdateFromGameState = (gameState: GameState) => {
  const gameStateUpdate: GameStateUpdate = {
    winners: gameState.winners,
    lastPlay: {
      statement: gameState.lastPlay.statement,
      user: gameState.lastPlay.user,
    },
    amountOfCardsInPlay: gameState.playDeck.length,
    sameCardsInPlay: gameState.statementHistory.amount,
  };

  return gameStateUpdate;
};

const updatePlayerHand = (players: Array<Player>, userId: string, newHand: Array<Card>) => {
  return players.map(p => {
    if(p.user.id === userId){
      logger.debug(`userId: ${p.user.id}`);
      logger.debug(`hand: ${JSON.stringify(p.hand)}`);
      p.hand = newHand;
    }
    return p;
  });
};

/**
* Returns users index in users array
* @param {string} userId id of user
* @param {string[]} users array of all users
* @returns {number} index position of userId in users array
*/
const getIndexInUsersArray = (userId: string, users: Array<Player>): number=> {
  const index= users.findIndex(p => p.user.id === userId);
  if(index===-1) throw new Error('Cant find user index');
  return index;
};

/**
 *
 * @param  {user[]} users array of all users
 * @param {number} turnIndex index of current turn
 * @param {string[]} winners array of Ids from users that are finished
 * @returns {string} next player id
 */
const getNextTurnId = (users: Array<Player>, turn: string, winners: Array<User>): string => {
  let index = getIndexInUsersArray(turn, users);
  let userId = turn;
  do {
    if (users.length - 1 === index) {
      index = 0;
    } else {
      index++;
    }
    userId = users[index].user.id;
  }while (winners.some(w => w.id === userId));
  return userId;
};

/**
 * Returns new array of cards from which given cards are removed from
 * @param {Card[]} cardsToRemove array of cards to remove from other array
 * @param {Card[]} arrayToRemoveFrom array to remove cards from
 * @returns {Card[]} remaining array of cards
 */
const removeCardsFromCardsArray = (cardsToRemove: Array<Card>, arrayToRemoveFrom: Array<Card>): Array<Card> =>{
  const remainingArray = [...arrayToRemoveFrom];

  for (const cardToRemove of cardsToRemove) {
    const cardIndex = remainingArray.findIndex(
      card => card.name === cardToRemove.name
    );
    if (cardIndex === -1) throw new Error('Card not found in array');
    remainingArray.splice(cardIndex, 1);
  }

  return remainingArray;
};

export default {
  createGameStateUpdateFromGameState,
  getIndexInUsersArray,
  getNextTurnId,
  removeCardsFromCardsArray,
  updatePlayerHand,
};