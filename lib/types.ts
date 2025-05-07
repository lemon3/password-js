export interface PasswordStrength {
  entropy: number;
  length: number;
  statistic: PasswordStrengthStatistic;
  strength: number;
}

export interface Output extends PasswordStrength {
  password: string;
}

export interface CharGroups {
  lowercase: string;
  uppercase: string;
  numbers: string;
  symbols: string;
  umlauts: string;
}

export interface PasswordStrengthStatistic {
  lowercase: number;
  uppercase: number;
  numbers: number;
  symbols: number;
  umlauts: number;
}

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
