import { validate as uuidValidate } from 'uuid';

export const parseId = (id: unknown): string => {
  if (!id || !isString(id)) {
    throw new Error('Id is not a string');
  }
  if (!uuidValidate(id)) {
    throw new Error('Invalid id format');
  }
  return id;
};

export const isString = (text: unknown): text is string => {
  return typeof text === 'string' || text instanceof String;
};


export const getRandomInt = (max:number): number => {
  return Math.floor(Math.random() * max);
};

export const timeout = async (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};
