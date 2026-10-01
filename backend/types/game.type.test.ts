import {describe, it} from 'node:test';
import assert from 'node:assert/strict';
import {parseStatement, parseUser} from './game.type.js';

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