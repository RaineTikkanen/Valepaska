import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import helpers from './helpers.js';
import type {GameState, RedisPlayer} from '../types/controller.type.js';
import type {GameStateUpdate} from '../types/game.type.js';
import type {Card} from '../types/deck.type.js';


/*eslint-disable @typescript-eslint/no-floating-promises*/

const player1: RedisPlayer = {
  user: {
    name: 'user1',
    id: 'id_1'
  },
  hand: [
    {name:'S12',suit:'S',value:12},
    {name:'D4',suit:'D',value:4},
    {name:'H9',suit:'H',value:9},
    {name:'H11',suit:'H',value:11},
    {name:'D8',suit:'D',value:8},
    {name:'S3',suit:'S',value:3},
  ]
};

const player2: RedisPlayer = {
  user: {
    name: 'user2',
    id: 'id_2'
  },
  hand: [
    {name:'C3',suit:'C',value:3},
    {name:'C4',suit:'C',value:4},
    {name:'D10',suit:'D',value:10},
    {name:'S1',suit:'S',value:1},
    {name:'D13',suit:'D',value:13},
    {name:'H3',suit:'H',value:3}
  ]
};

const player3: RedisPlayer = {
  user: {
    name: 'user3',
    id: 'id_3'
  },
  hand: [
    {name:'D12',suit:'D',value:12},
    {name:'S11',suit:'S',value:11},
    {name:'H12',suit:'H',value:12},
    {name:'D3',suit:'D',value:3},
    {name:'H1',suit:'H',value:1}
  ]
};

const players = [player1, player2, player3];


describe('createGameStateUpdateFromGameState', ()=>{

  const gameState: GameState = {
    winners: [],
    gameStatus: 'IDLE',
    clientStatus: 'GAME',
    turn:  player3.user.id,
    deck: [
      {name:'C9',suit:'C',value:9},
      {name:'D5',suit:'D',value:5},
      {name:'S2',suit:'S',value:2},
      {name:'H6',suit:'H',value:6},
      {name:'D2',suit:'D',value:2},
      {name:'S8',suit:'S',value:8},
      {name:'C6',suit:'C',value:6},
    ],
    playDeck: [
      {name:'H13',suit:'H',value:13},
      {name:'S5',suit:'S',value:5},
      {name:'S9',suit:'S',value:9},
      {name:'C8',suit:'C',value:8},
      {name:'H5',suit:'H',value:5},
      {name:'H8',suit:'H',value:8},
      {name:'S4',suit:'S',value:4},
      {name:'D11',suit:'D',value:11},
      {name:'S7',suit:'S',value:7},
    ],
    players: players,
    lastPlay: {
      user: player2.user,
      statement:{
        amount: 2,
        value: 7,
      },
      cards: [
        {name:'C5',suit:'C',value:5},
        {name:'C10',suit:'C',value:10},
      ]
    },
    statementHistory: {
      amount: 3,
      value: 7,
    },
  };
  it('creates gameStateUpdate correctrly', () => {
    const gameStateUpdate: GameStateUpdate = helpers.createGameStateUpdateFromGameState(gameState);
    assert.equal(gameStateUpdate.winners.length, 0);
    assert.equal(gameStateUpdate.lastPlay!.user.id, 'id_2');
    assert.equal(gameStateUpdate.lastPlay!.user.name, 'user2');
    assert.equal(gameStateUpdate.lastPlay!.statement.amount, 2 );
    assert.equal(gameStateUpdate.lastPlay!.statement.value, 7);
    assert.equal(gameStateUpdate.amountOfCardsInPlay, 9);
    assert.equal(gameStateUpdate.sameCardsInPlay, 3);
    assert.equal(gameStateUpdate.players[0].user.id, 'id_1');
    assert.equal(gameStateUpdate.players.length, 3);
    assert.equal(gameStateUpdate.players[1].user.name, 'user2');
    assert.equal(gameStateUpdate.players[2].amountOfCards, 5);
    assert.equal(gameStateUpdate.cardsInDeck, 7);
  });
});

describe('updatePlayerHand', () =>{
  const newHand: Array<Card> = [
    {name:'H13',suit:'H',value:13},
    {name:'S5',suit:'S',value:5},
    {name:'S9',suit:'S',value:9},
    {name:'C8',suit:'C',value:8},
  ];

  it('updates the hand correctly', () => {
    const newPlayers = helpers.updatePlayerHand(players, 'id_2', newHand);
    assert.equal(newPlayers.length, 3);
    assert.equal(newPlayers[0].user.id, 'id_1');
    assert.equal(newPlayers[0].hand.length, 6);
    assert.equal(newPlayers[1].hand.length, 4);
    assert.equal(newPlayers[2].hand.length, 5);
    assert.equal(newPlayers[1].hand, newHand);
  });
});

describe('getIndexInUsersArray', () =>{
  it('gets index correctly', () => {
    assert.equal(helpers.getIndexInUsersArray('id_2', players), 1);
    assert.equal(helpers.getIndexInUsersArray('id_3', players), 2);
  });
});

describe('getNextTurnId', () =>{
  it('gets next turn correctly with no winners', () => {
    assert.equal(helpers.getNextTurnId(players, 'id_1', []), 'id_2');
    assert.equal(helpers.getNextTurnId(players, 'id_2', []), 'id_3');
    assert.equal(helpers.getNextTurnId(players, 'id_3', []), 'id_1');
  });
  it('gets next turn correctly with winners', () => {
    assert.equal(helpers.getNextTurnId(players, 'id_1', [player2.user]), 'id_3');
    assert.equal(helpers.getNextTurnId(players, 'id_2', [player3.user]), 'id_1');
    assert.equal(helpers.getNextTurnId(players, 'id_3', [player1.user]), 'id_2');
  });
});

describe('removeCardsFromCardsArray', () =>{
  const cards: Array<Card> = [
    {name:'S5',suit:'S',value:5},
    {name:'S9',suit:'S',value:9},
    {name:'C8',suit:'C',value:8},
    {name:'H5',suit:'H',value:5},
    {name:'H8',suit:'H',value:8},
    {name:'S4',suit:'S',value:4},
  ];
  const cards2: Array<Card> = [
    {name:'H5',suit:'H',value:5},
    {name:'H8',suit:'H',value:8},
    {name:'S4',suit:'S',value:4},
  ];

  const newCards = helpers.removeCardsFromCardsArray(cards2, cards);
  assert.equal(newCards.length, 3);
  for (let i = 0; i < 3; i++) {
    assert(newCards.includes(cards[i]));
  }

  for (let i = 3; i < 6; i++) {
    console.log(cards[i]);
    assert(!newCards.includes(cards[i]));
  }
});