export interface Options {
  length?: number;
  lowercase?: boolean | number;
  uppercase?: boolean | number;
  numbers?: boolean | number;
  symbols?: boolean | number;
  umlauts?: boolean | number;
  excludeSimilar?: boolean;
  normalDistribute?: boolean;

  lowercaseWeight?: number;
  uppercaseWeight?: number;
  numbersWeight?: number;
  symbolsWeight?: number;
  umlautsWeight?: number;
}

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
