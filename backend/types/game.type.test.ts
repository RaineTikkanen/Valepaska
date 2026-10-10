import {describe, it} from 'node:test';
import assert from 'node:assert/strict';
import {parseStatement, parseUser} from './game.type.js';
import {GameState} from './game.type.js';
import type {Card} from './deck.type.js';

/*eslint-disable @typescript-eslint/no-floating-promises*/

describe('parseStatement', () => {
  it('accepts valid statement', () => {
    assert.doesNotThrow(()=>parseStatement({value: 2, amount: 1}));
    assert.doesNotThrow(()=>parseStatement({value: 10, amount: 1}));
    assert.doesNotThrow(()=>parseStatement({value: 1, amount: 1}));
    assert.doesNotThrow(()=>parseStatement({value: 4, amount: 2}));
    assert.doesNotThrow(()=>parseStatement({value: 13, amount: 4}));
  });
  it('does not accept invalid statement', () => {
    assert.throws(()=>parseStatement({value: 10, amount: 2}));
    assert.throws(()=>parseStatement({value: 1, amount: 2}));
    assert.throws(()=>parseStatement({value: 2, amount: 2}));
    assert.throws(()=>parseStatement({value: 1, amount: 5}));
    assert.throws(()=>parseStatement({value: 3, amount: 0}));
    assert.throws(()=>parseStatement({value: 14, amount: 1}));
  });
});

describe('parseUser', ()=>{
  it('accepts valid user', () => {
    assert.doesNotThrow(()=>parseUser({name: '12345678901234567890', id: '01a0f6d2-ed33-71b2-9798-9b2cb76ee82c'}));
  });
  it('does not accept too long username', () => {
    assert.throws(()=>parseUser({name: '123456789012345678901', id: '01a0f6d2-ed33-71b2-9798-9b2cb76ee82c'}));
  });
  it('does not accept too short', () => {
    assert.throws(()=>parseUser({name: '123', id: '01a0f6d2-ed33-71b2-9798-9b2cb76ee82c'}));
  });
  it('does not accept invalid id', () => {
    assert.throws(()=>parseUser({name: '12345678901234567890', id: 'e82c'}));
  });
});


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

describe('GameState.toGameStateUpdate', () => {
  it('creates a client update containing current winners, last play and hand counts', () => {
    const userOne = {id: 'user-1', name: 'User One'};
    const userTwo = {id: 'user-2', name: 'User Two'};
    const userThree = {id: 'user-3', name: 'User Three'};
    const handCard: Card = {name: 'C1', value: 1, suit: 'C'};
    const playCard: Card = {name: 'D2', value: 2, suit: 'D'};

    const state = new GameState(
      [userTwo.id],
      'PLAYING',
      'GAME',
      userOne.id,
      [],
      [playCard],
      [
        {user: userOne, hand: [handCard]},
        {user: userTwo, hand: [playCard]},
        {user: userThree, hand: []},
      ],
      {
        cards: [playCard],
        user: userOne,
        statement: {value: 2, amount: 1},
      },
      {value: 2, amount: 1},
    );

    assert.deepEqual(state.toGameStateUpdate(), {
      players: [
        {user: userOne, amountOfCards: 1},
        {user: userTwo, amountOfCards: 1},
        {user: userThree, amountOfCards: 0},
      ],
      winners: [userTwo],
      lastPlay: {
        statement: {value: 2, amount: 1},
        user: userOne,
      },
      amountOfCardsInPlay: 1,
      sameCardsInPlay: 1,
      cardsInDeck: 0,
      clientStatus: 'GAME',
    });
  });
});

describe('GameState.updateStatementHistory', () => {
  it('adds a new statement when the value changes and accumulates the amount when it matches', () => {
    const state = new GameState();

    state.updateStatementHistory({value: 5, amount: 2});
    assert.deepEqual(state.statementHistory, {value: 5, amount: 2});

    state.updateStatementHistory({value: 5, amount: 1});
    assert.deepEqual(state.statementHistory, {value: 5, amount: 3});

    state.updateStatementHistory({value: 9, amount: 1});
    assert.deepEqual(state.statementHistory, {value: 9, amount: 1});
  });
});

describe('GameState.advanceTurn', () => {
  const players = [
    {user: {id: 'user-1', name: 'User One'}, hand: []},
    {user: {id: 'user-2', name: 'User Two'}, hand: []},
    {user: {id: 'user-3', name: 'User Three'}, hand: []},
  ];

  it('advances to the next player', () => {
    const state = new GameState([], 'PLAYING', 'GAME', 'user-1', [], [], players);
    state.advanceTurn();
    assert.equal(state.turn, 'user-2');
  });

  it('wraps around to the first player after the last player', () => {
    const state = new GameState([], 'PLAYING', 'GAME', 'user-3', [], [], players);
    state.advanceTurn();
    assert.equal(state.turn, 'user-1');
  });

  it('skips players who have already won', () => {
    const state = new GameState(['user-2'], 'PLAYING', 'GAME', 'user-1', [], [], players);
    state.advanceTurn();
    assert.equal(state.turn, 'user-3');
  });
});


describe('GameState.startGame', () => {
  it('deals five cards to each player and selects the starting player', () => {
    const players = [
      {user:{id: 'user-1', name: 'User One'}, hand: []},
      {user:{id: 'user-2', name: 'User Two'}, hand: []},
      {user:{id: 'user-3', name: 'User Three'}, hand: []},
    ];
    const cards: Array<Card> = [
      { name: 'C1', suit: 'C', value: 1 },
      { name: 'C2', suit: 'C', value: 2 },
      { name: 'C3', suit: 'C', value: 3 },
      { name: 'D6', suit: 'D', value: 6 },
      { name: 'D7', suit: 'D', value: 7 },
      { name: 'D8', suit: 'D', value: 8 },
      { name: 'H8', suit: 'H', value: 8 },
      { name: 'H9', suit: 'H', value: 9 },
      { name: 'H10', suit: 'H', value: 10 },
      { name: 'S9', suit: 'S', value: 9 },
      { name: 'S10', suit: 'S', value: 10 },
      { name: 'S11', suit: 'S', value: 11 },
      { name: 'S12', suit: 'S', value: 12 },
      { name: 'S13', suit: 'S', value: 13 },
      { name: 'S2', suit: 'S', value: 2 },
      { name: 'S3', suit: 'S', value: 3 },
      { name: 'S4', suit: 'S', value: 4 },
      { name: 'S5', suit: 'S', value: 5 },
      { name: 'D12', suit: 'D', value: 12 },
      { name: 'D13', suit: 'D', value: 13 },
      { name: 'H1', suit: 'H', value: 1 },
      { name: 'H2', suit: 'H', value: 2 },
      { name: 'H3', suit: 'H', value: 3 },
    ];
    const state = new GameState(
      [],
      'IDLE',
      'LOBBY',
      '',
      [...cards],
      [],
      players,
    );

    state.startGame();


    assert.deepEqual(state.players.map(player => player.hand), [
      cards.slice(0, 5),
      cards.slice(5, 10),
      cards.slice(10, 15),
    ]);
    assert.deepEqual(state.deck, cards.slice(15));
    assert.equal(true, players.some(p=>p.user.id === state.turn));
    assert.equal(state.clientStatus, 'GAME');
  });
});

describe('GameState.dealPlayDeckToPlayer', () => {
  it('adds the play deck cards to the selected player hand and clears the play deck', () => {
    const handCard: Card = {name: 'C1', value: 1, suit: 'C'};
    const playCards: Array<Card> = [
      {name: 'D2', value: 2, suit: 'D'},
      {name: 'H3', value: 3, suit: 'H'},
    ];
    const players = [
      {user: {id: 'user-1', name: 'User One'}, hand: [handCard]},
      {user: {id: 'user-2', name: 'User Two'}, hand: []},
    ];
    const state = new GameState([], 'PLAYING', 'GAME', 'user-1', [], playCards, players);

    state.dealPlayDeckToPlayer('user-1');

    assert.deepEqual(players[0].hand, [handCard, ...playCards]);
    assert.deepEqual(players[1].hand, []);
    assert.deepEqual(state.playDeck, []);
  });

  it('throws when the specified player does not exist without changing the play deck', () => {
    const playCard: Card = {name: 'D2', value: 2, suit: 'D'};
    const state = new GameState(
      [],
      'PLAYING',
      'GAME',
      '',
      [],
      [playCard],
      [{user: {id: 'user-1', name: 'User One'}, hand: []}],
    );

    assert.throws(() => state.dealPlayDeckToPlayer('missing-user'), );
    assert.deepEqual(state.playDeck, [playCard]);
    assert.deepEqual(state.players[0].hand, []);
  });
});

describe('GameState.updateWinners', () => {
  it('does not add winners while cards remain in the deck', () => {
    const player = {id: 'user-1', name: 'User One'};
    const state = new GameState(
      [],
      'PLAYING',
      'GAME',
      '',
      [{name: 'C1', value: 1, suit: 'C'}],
      [],
      [{user: player, hand: []}],
    );

    state.updateWinners();

    assert.deepEqual(state.winners, []);
    assert.equal(state.clientStatus, 'GAME');
  });

  it('awards players with empty hands except the player who made the last play', () => {
    const playerOne = {id: 'user-1', name: 'User One'};
    const playerTwo = {id: 'user-2', name: 'User Two'};
    const playerThree = {id: 'user-3', name: 'User Three'};
    const state = new GameState(
      [],
      'PLAYING',
      'GAME',
      '',
      [],
      [],
      [
        {user: playerOne, hand: []},
        {user: playerTwo, hand: []},
        {user: playerThree, hand: []},
      ],
      {
        cards: [{name: 'D2', value: 2, suit: 'D'}],
        user: playerTwo,
        statement: {value: 2, amount: 1},
      },
    );

    state.updateWinners();
    state.updateWinners();

    assert.deepEqual(state.winners, [playerOne.id, playerThree.id]);
    assert.equal(state.clientStatus, 'RESULTS');
  });
});


describe('GameState.statementIsTrue', () => {
  const state = new GameState();
  it('throws error if lastPlay is null', () => {
    assert.throws(()=>state.statementIsTrue());
  });

  it('returns false when statement is false', ()=> {
    state.lastPlay = {
      cards:[
        { name: 'H8', suit: 'H', value: 8 },
        { name: 'H9', suit: 'H', value: 9 },
        { name: 'H10', suit: 'H', value: 10 },
      ],
      user: {id: 'user-2', name: 'User Two'},
      statement: {
        value: 6,
        amount: 3,
      }
    };
    assert.equal(false, state.statementIsTrue());
  });

  it('returns true when statement is true', ()=>{
    state.lastPlay = {
      cards:[
        { name: 'H8', suit: 'H', value: 8 },
        { name: 'C8', suit: 'C', value: 8 },
        { name: 'D8', suit: 'D', value: 8 },
      ],
      user: {id: 'user-2', name: 'User Two'},
      statement: {
        value: 8,
        amount: 3,
      }
    };
    assert.equal(true, state.statementIsTrue());
  });
});

describe('GameState.resolveDoubt', () => {
  const doubter = {id: 'user-1', name: 'User One'};
  const lastPlayer = {id: 'user-2', name: 'User Two'};
  const playCard: Card = {name: 'C8', value: 8, suit: 'C'};

  it('gives the play deck to the doubter when the statement is true', () => {
    const state = new GameState(
      [],
      'WAITING_DOUBT',
      'GAME',
      doubter.id,
      [{name: 'D3', value: 3, suit: 'D'}],
      [playCard],
      [
        {user: doubter, hand: []},
        {user: lastPlayer, hand: []},
      ],
      {
        cards: [playCard],
        user: lastPlayer,
        statement: {value: 8, amount: 1},
      },
      {value: 8, amount: 1},
    );

    const loserId = state.resolveDoubt(doubter.id);

    assert.equal(loserId, doubter.id);
    assert.equal(state.turn, lastPlayer.id);
    assert.deepEqual(state.players[0].hand, [playCard]);
    assert.deepEqual(state.playDeck, []);
    assert.equal(state.lastPlay, null);
    assert.equal(state.statementHistory, null);
  });

  it('gives the play deck to the last player when the statement is false', () => {
    const falsePlayCard: Card = {name: 'D9', value: 9, suit: 'D'};
    const state = new GameState(
      [],
      'WAITING_DOUBT',
      'GAME',
      doubter.id,
      [{name: 'H3', value: 3, suit: 'H'}],
      [falsePlayCard],
      [
        {user: doubter, hand: []},
        {user: lastPlayer, hand: []},
      ],
      {
        cards: [falsePlayCard],
        user: lastPlayer,
        statement: {value: 8, amount: 1},
      },
      {value: 8, amount: 1},
    );

    const loserId = state.resolveDoubt(doubter.id);

    assert.equal(loserId, lastPlayer.id);
    assert.equal(state.turn, doubter.id);
    assert.deepEqual(state.players[1].hand, [falsePlayCard]);
    assert.deepEqual(state.playDeck, []);
    assert.equal(state.lastPlay, null);
    assert.equal(state.statementHistory, null);
  });

  it('throws when there is no last play to resolve', () => {
    const state = new GameState();

    assert.throws(() => state.resolveDoubt(doubter.id), /No last play/);
  });
});

describe('GameState.resolvePlay', () => {
  it('records the play, moves played cards, draws replacements and updates statement history', () => {
    const player = {id: 'user-1', name: 'User One'};
    const playedCard: Card = {name: 'C8', value: 8, suit: 'C'};
    const remainingCard: Card = {name: 'D3', value: 3, suit: 'D'};
    const replacementCard: Card = {name: 'H5', value: 5, suit: 'H'};
    const state = new GameState(
      [],
      'PLAYING',
      'GAME',
      player.id,
      [replacementCard],
      [],
      [{user: player, hand: [playedCard, remainingCard]}],
      null,
      {value: 8, amount: 1},
    );
    const statement = {value: 8, amount: 2};

    state.resolvePlay(player.id, [playedCard], statement);

    assert.deepEqual(state.lastPlay, {
      cards: [playedCard],
      user: player,
      statement,
    });
    assert.deepEqual(state.players[0].hand, [remainingCard, replacementCard]);
    assert.deepEqual(state.playDeck, [playedCard]);
    assert.deepEqual(state.deck, []);
    assert.deepEqual(state.statementHistory, {value: 8, amount: 3});
  });

  it('throws for an unknown player', () => {
    const player = {id: 'user-1', name: 'User One'};
    const card: Card = {name: 'C8', value: 8, suit: 'C'};
    const state = new GameState(
      [],
      'PLAYING',
      'GAME',
      player.id,
      [],
      [],
      [{user: player, hand: [card]}],
    );

    assert.throws(
      () => state.resolvePlay('missing-user', [card], {value: 8, amount: 1}),
      /Player not found: missing-user/,
    );
    assert.equal(state.lastPlay, null);
    assert.deepEqual(state.players[0].hand, [card]);
    assert.deepEqual(state.playDeck, []);
  });
});
