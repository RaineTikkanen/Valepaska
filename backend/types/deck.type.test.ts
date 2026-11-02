import {describe, it} from 'node:test';
import assert from 'node:assert/strict';
import { parseCardValue, parseCardSuit, parseCardName, parseCard} from './deck.type.js';
import { CardValues, CardSuits} from './deck.type.js';
import getShuffledDeck from '../deck/deck.js';

/*eslint-disable @typescript-eslint/no-floating-promises*/

describe('Card value parser', () => {
  it('should accept CardValues', () => {
    CardValues.forEach((v) => {
      assert.doesNotThrow(() => parseCardValue(v));
    });
  });
  it('should not accept values not in CardValues', () => {
    assert.throws(() => parseCardValue(0));
    assert.throws(() => parseCardValue(1));
    assert.throws(() => parseCardValue('2'));
  });
});

describe('Card suit parser', () => {
  it('should accept CardSuit', () => {
    CardSuits.forEach((s) => {
      assert.doesNotThrow(() => parseCardSuit(s));
    });
  });
  it('should not accept values not in CardSuites', () => {
    assert.throws(() => parseCardSuit(1));
    assert.throws(() => parseCardSuit('A'));
  });
});

describe('Card name parser', () => {
  it('should accept CardName', () => {
    CardSuits.forEach((s) => {
      CardValues.forEach((v)=>{
        const name = `${s}${v}`;
        assert.doesNotThrow(() => parseCardName(name));

      });
    });
  });
  it('should not accept values not in CardNames', () => {
    assert.throws(() => parseCardName(1));
    assert.throws(() => parseCardName('C'));
    assert.throws(() => parseCardName('C123'));
    assert.throws(() => parseCardName('C1'));
    assert.throws(() => parseCardName('A12'));
    assert.throws(() => parseCardName('JOAMS'));
  });
});

describe('Card parser', () => {
  const deck = getShuffledDeck();
  it('should accept every card in deck', () => {
    deck.forEach((c) => {
      assert.doesNotThrow(() => parseCard(c));
    });
  });
  it('should not accept invalid cards', () => {
    const invalidValue= {name: 'C14', value: 1, suit: 'C'};
    const invalidName = {name: 'A14', suit: 'C', value: 14};
    const invalidSuit = {name: 'C14', suit: 'G', value: 14};
    const conflictingSuit = {name: 'C14', suit: 'H', value: 14};
    const conflictingValue = {name: 'C14', suit: 'C', value: 2};

    assert.throws(() => parseCard(invalidValue));
    assert.throws(() => parseCard(invalidName));
    assert.throws(() => parseCard(invalidSuit ));
    assert.throws(() => parseCard(conflictingSuit));
    assert.throws(() => parseCard(conflictingValue));
  });
});