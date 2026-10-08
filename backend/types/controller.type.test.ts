import {describe, it} from 'node:test';
import assert from 'node:assert/strict';
import {GameState} from './controller.type.js';
import type {Card} from './deck.type.js';

/*eslint-disable @typescript-eslint/no-floating-promises*/

describe('GameState.dealCardsToUser', () => {
  it('deals cards from the deck into the specified user hand', () => {
    const cards: Array<Card> = [
      {name: 'C1', value: 1, suit: 'C'},
      {name: 'D2', value: 2, suit: 'D'},
      {name: 'H3', value: 3, suit: 'H'},
    ];
    const state = new GameState(
      [],
      'IDLE',
      'LOBBY',
      '',
      [...cards],
      [],
      [
        {user: {id: 'user-1', name: 'User One'}, hand: []},
        {user: {id: 'user-2', name: 'User Two'}, hand: []},
      ],
    );

    state.dealCardsToUser('user-2', 2);

    assert.deepEqual(state.players[0].hand, []);
    assert.deepEqual(state.players[1].hand, cards.slice(0, 2));
    assert.deepEqual(state.deck, cards.slice(2));
  });

  it('appends dealt cards to the user existing hand', () => {
    const existingCard: Card = {name: 'C1', value: 1, suit: 'C'};
    const dealtCard: Card = {name: 'D2', value: 2, suit: 'D'};
    const state = new GameState(
      [],
      'IDLE',
      'LOBBY',
      '',
      [dealtCard],
      [],
      [{user: {id: 'user-1', name: 'User One'}, hand: [existingCard]}],
    );

    state.dealCardsToUser('user-1', 1);

    assert.deepEqual(state.players[0].hand, [existingCard, dealtCard]);
    assert.deepEqual(state.deck, []);
  });

  it('rejects invalid amounts without changing the deck or hand', () => {
    const card: Card = {name: 'C1', value: 1, suit: 'C'};
    const state = new GameState(
      [],
      'IDLE',
      'LOBBY',
      '',
      [card],
      [],
      [{user: {id: 'user-1', name: 'User One'}, hand: []}],
    );

    assert.throws(() => state.dealCardsToUser('user-1', -1), RangeError);
    assert.throws(() => state.dealCardsToUser('user-1', 1.5), RangeError);
    assert.deepEqual(state.deck, [card]);
    assert.deepEqual(state.players[0].hand, []);
  });
});

describe('GameState.cardsFromHandToPlayDeck', () => {
  it('moves the specified cards from the user hand to the play deck', () => {
    const cards: Array<Card> = [
      {name: 'C1', value: 1, suit: 'C'},
      {name: 'D2', value: 2, suit: 'D'},
      {name: 'H3', value: 3, suit: 'H'},
    ];
    const previousPlayCard: Card = {name: 'S4', value: 4, suit: 'S'};
    const state = new GameState(
      [],
      'IDLE',
      'LOBBY',
      '',
      [],
      [previousPlayCard],
      [{user: {id: 'user-1', name: 'User One'}, hand: cards}],
    );

    state.cardsFromHandToPlayDeck('user-1', [cards[0], cards[2]]);

    assert.deepEqual(state.players[0].hand, [cards[1]]);
    assert.deepEqual(state.playDeck, [previousPlayCard, cards[0], cards[2]]);
  });

  it('leaves the hand and play deck unchanged if a card is not in the hand', () => {
    const handCard: Card = {name: 'C1', value: 1, suit: 'C'};
    const missingCard: Card = {name: 'D2', value: 2, suit: 'D'};
    const state = new GameState(
      [],
      'IDLE',
      'LOBBY',
      '',
      [],
      [],
      [{user: {id: 'user-1', name: 'User One'}, hand: [handCard]}],
    );

    assert.throws(
      () => state.cardsFromHandToPlayDeck('user-1', [missingCard]),
      /Card not found in player hand/,
    );
    assert.deepEqual(state.players[0].hand, [handCard]);
    assert.deepEqual(state.playDeck, []);
  });
});
