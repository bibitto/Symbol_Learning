import * as uuid from 'uuid';
import crypto from 'crypto-js';

export const createRandomKey = uuid.v4;

export const encryptString = (message: string, key: string) => {
  return crypto.AES.encrypt(message, key).toString();
};

export const decryptString = (cipherText: string, key: string) => {
  return crypto.AES.decrypt(cipherText, key).toString(crypto.enc.Utf8);
};
