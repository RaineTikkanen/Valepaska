import type { Statement } from '../types/game';

export const isString = (text: unknown): text is string => {
  return typeof text === 'string' || text instanceof String;
};

export const isStatement = (value: unknown): value is Statement => {
  
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const statement = value as Record<string, unknown>;
  return typeof statement.value === 'number' && typeof statement.amount === 'number';
};

