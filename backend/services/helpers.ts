import type { GameState } from '../redis/controller.type.js';
import type { GameStateUpdate } from './gameService.type.js';
import type { User } from '../redis/controller.type.js';
import type { Card } from '../deck/deck.type.js';

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

/**
* Returns users index in users array
* @param {string} userId id of user
* @param {string[]} users array of all users
* @returns {number} index position of userId in users array
*/
const getIndexInUsersArray = (userId: string, users: Array<User>): number=> {
  const index= users.findIndex(p => p.id === userId);
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
const getNextTurnId = (users: Array<User>, turnIndex: number, winners: Array<string>): string => {
  const remainingUsers = users.filter(u => !winners.includes(u.id));

  if(remainingUsers.length-1 === turnIndex){
    turnIndex = 0;
  }else{
    turnIndex++;
  }

  return remainingUsers[turnIndex].id;
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
      card => JSON.stringify(card) === JSON.stringify(cardToRemove)
    );

    if (cardIndex !== -1) remainingArray.splice(cardIndex, 1);
  }

  return remainingArray;
};

export default {
  createGameStateUpdateFromGameState,
  getIndexInUsersArray,
  getNextTurnId,
  removeCardsFromCardsArray,
};