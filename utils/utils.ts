import { validate as uuidValidate } from 'uuid';

export const parseId = (id: unknown): string => {
  if (typeof id !== 'string') {
    throw new Error('Invalid id');
  }
  if (!uuidValidate(id)) {
    throw new Error('Invalid id format');
  }
  return id;
}

export const getRandomInt = (max:number): number => {
  return Math.floor(Math.random() * max);
}