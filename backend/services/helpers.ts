import type { GameState } from '../redis/controller.type.js';
import type { GameStateUpdate } from './gameService.type.js';
import type { User } from '../redis/controller.type.js';
import type { Card } from '../deck/deck.type.js';

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
* @param userId 
* @param users[]
* @returns index
*/
const getIndexInUsersArray = (userId: string, users: User[]): number=> {  
  const index= users.findIndex(p => p.id === userId); 
  if(index===-1) throw new Error('Cant find user index');
  return index;
};

const getNextTurnId = (users: User[], turnIndex: number, winners: string[]): string => {
  const u = users.filter(u => !winners.includes(u.id));
  console.debug('##############################################################');
  console.log('winners:', winners);
  console.log('users without winners:', u);
  console.debug('##############################################################');

  if(users.length-1 === turnIndex){
    turnIndex = 0;
  }else{
    turnIndex++;
  }

  return users[turnIndex].id;
};

const removeCardsFromCardsArray = (cardsToRemove: Card[], arrayToRemoveFrom: Card[]): Card[] =>{
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