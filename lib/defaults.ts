import {
  type Options,
  type CharGroups,
  type PasswordStrengthStatistic,
} from './types';

// all available charGroups
export const charGroups: CharGroups = {
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  numbers: '0123456789',
  symbols: `!"#$%&'()*+,-./:;<=>?@[]^_{|}~`,
  umlauts: 'äöüÄÖÜ',
};

export const defaults: Options = {
  length: 10,
  lowercase: true,
  uppercase: true,
  numbers: true,
  symbols: true,
  umlauts: false,
  excludeSimilar: false,
  normalDistribute: false,
};

export const defaultStatistic: PasswordStrengthStatistic = {
  lowercase: 0,
  uppercase: 0,
  numbers: 0,
  symbols: 0,
  umlauts: 0,
};
