import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { isString, parseId} from './utils.js';

import { v7 as uuidv7 } from 'uuid';



/*eslint-disable @typescript-eslint/no-floating-promises*/

describe('isString', ()=>{
  it('accepts string', () => {
    assert.equal(isString('string'), true);
    assert.equal(isString(String('string')), true);
    assert.equal(isString(''),true);
  });
  it('does not accept non string values', ()=>{
    assert.equal(isString(3), false);
    assert.equal(isString({a:'string'}), false);
  });
});

describe('parseId', ()=>{
  it('accepts valid uuid', () => {
    const id = uuidv7();
    assert.doesNotThrow(() => parseId(id));
  });
  it('does not accept invalid id', () => {
    assert.throws(() => parseId('01a0ae94-fdd4-73479-9917-858dcbefd8a1'));
    assert.throws(() => parseId(1234));
  });
});