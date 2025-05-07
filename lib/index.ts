import {
  type CharGroups,
  type Options,
  type Output,
  type PasswordStrength,
  type PasswordStrengthStatistic,
} from './types';

import { defaults, charGroups, defaultStatistic } from './defaults';
import { shuffleArray, getNumber } from './util';

const similarChars: string = 'lOI01|';

class PasswordClass {
  charGroups: CharGroups;
  settings!: Options;
  charsUpdated: boolean;
  charset!: string;
  filteredCharGroups: CharGroups;
  lastExcludeSimilar: boolean = false;
  anyGroupSelected: boolean;

  /**
   * The class constructor
   *
   * @param options The override the default values
   */
  constructor(options?: Options) {
    this.charGroups = { ...charGroups };
    this.filteredCharGroups = { ...charGroups };
    this.charsUpdated = false;
    this.charset = '';
    this.anyGroupSelected = true;

    this.init(options);
  }

  /**
   * To compute the Password
   *
   * @param charGroups the groups (and chars) to be used
   * @param normalDistribute should the chars be normally distributed for each defined group
   * @returns
   */
  private computePasswordArray(
    charGroups: CharGroups,
    normalDistribute: boolean = false
  ): {
    statistic: PasswordStrengthStatistic;
    password: string[];
  } {
    const groups: {
      name: string;
      chars: string;
      weight: number;
    }[] = [];

    const statistic = { ...defaultStatistic };
    let totalMin = 0;
    let totalWeight = 0;
    const password: string[] = [];

    this.charset = '';

    const addRandomChar = (group: { name: string; chars: string }) => {
      const name = group.name as keyof PasswordStrengthStatistic;
      const chars = group.chars;
      password.push(chars[Math.floor(Math.random() * chars.length)]);
      statistic[name]++;
    };

    // required
    for (const [name, chars] of Object.entries(charGroups) as [
      keyof CharGroups,
      string
    ][]) {
      const val = this.settings[name];
      if (!val || !chars) continue;

      const min = getNumber(val);
      const weight =
        getNumber(this.settings[`${name}Weight` as keyof Options]) || 0;

      groups.push({ name, chars, weight });
      statistic[name] = min;

      for (let i = 0; i < min; i++) {
        password.push(chars[Math.floor(Math.random() * chars.length)]);
      }

      this.charset += chars;

      totalMin += min;
      totalWeight += weight;
    }

    // @ts-ignore: this.settings.length can't be undefined here!
    const targetLength = Math.max(this.settings.length, totalMin);
    const remaining = targetLength - totalMin;

    if (!normalDistribute) {
      for (let i = 0; i < remaining; i++) {
        const char =
          this.charset[Math.floor(Math.random() * this.charset.length)];
        password.push(char);
        const group = this.getGroupFromChar(char);
        if (group) statistic[group.name]++;
      }

      return { password, statistic };
    }

    if (remaining > 0) {
      if (totalWeight > 0) {
        let distributed = 0;

        for (const group of groups) {
          const share = Math.floor((group.weight / totalWeight) * remaining);
          if (0 === share) continue;
          distributed += share;
          for (let i = 0; i < share; i++) addRandomChar(group);
        }

        // distribute leftovers
        for (let i = 0; distributed < remaining; i++, distributed++) {
          addRandomChar(groups[i % groups.length]);
        }
      } else {
        // Even distribution fallback
        for (let i = 0; i < remaining; i++) {
          addRandomChar(groups[i % groups.length]);
        }
      }
    }

    return { password, statistic };
  }

  /**
   * Generate the output object
   *
   * @param chars the password as a character array
   * @param statistic statistic value
   * @returns
   */
  private generatePassword(
    chars?: string[],
    statistic?: PasswordStrengthStatistic
  ): Output {
    if (!statistic) statistic = { ...defaultStatistic };
    if (!chars)
      return {
        password: '',
        length: 0,
        strength: 0,
        entropy: 0,
        statistic,
      };
    const passwordArray = shuffleArray(chars);
    const password = passwordArray.join('');
    const length = password.length;
    const entropy = length * Math.log2(this.charset.length);
    const strength = Math.min(entropy / 100, 1);

    return { entropy, length, password, strength, statistic };
  }

  /**
   * Check which group the specified character belongs to.
   *
   * @param char The character to test
   * @returns The name and chars of the given group, or undefined
   */
  private getGroupFromChar(
    char: string
  ): { name: keyof PasswordStrengthStatistic; chars: string } | undefined {
    for (const [name, chars] of Object.entries(charGroups) as [
      keyof PasswordStrengthStatistic,
      string
    ][]) {
      if (chars.includes(char)) return { name, chars };
    }
    return undefined;
  }

  /**
   * Create the settings object
   *
   * @param options Optional option object
   */
  private init(options?: Options) {
    if (!options) {
      this.settings = { ...defaults };
    } else {
      this.settings = { ...defaults, ...options };
      if (!this.settings.length) {
        throw new Error('length should be an integer an greater than 0');
      }
    }

    this.anyGroupSelected = Object.entries(charGroups).some(
      ([name]) => this.settings[name as keyof Options]
    );
  }

  /**
   * To update the character groups being used
   *
   * @param charGroups
   */
  setCharGroups(charGroups: Partial<CharGroups>) {
    this.charGroups = { ...this.charGroups, ...charGroups };
    this.filteredCharGroups = { ...this.charGroups };
    this.charsUpdated = true;
  }

  /**
   * Returns the char groups to be used for password creation
   *
   * @returns Character Groups
   */
  getCharGroups(): CharGroups {
    const exclude = !!this.settings.excludeSimilar;

    if (!exclude) {
      this.lastExcludeSimilar = false;
      return this.charGroups;
    }

    // Rebuild only if changed or flagged
    if (this.charsUpdated || this.lastExcludeSimilar !== exclude) {
      const modified: CharGroups = { ...this.charGroups };
      for (const [group, chars] of Object.entries(modified) as [
        keyof CharGroups,
        string
      ][]) {
        modified[group] = [...chars]
          .filter((_chars) => !similarChars.includes(_chars))
          .join('');
      }
      this.filteredCharGroups = modified;
      this.charsUpdated = false;
      this.lastExcludeSimilar = exclude;
    }

    return this.filteredCharGroups;
  }

  resetCharGroups() {
    this.charGroups = { ...charGroups };
  }

  /**
   * Returns the current charset being used
   *
   * @returns Array
   */
  getCharset(): string {
    return this.charset;
  }

  /**
   * Update the settings by overriding the settings object
   * @param options The options object.
   */
  updateSettings(options: Options) {
    this.init(options);
  }

  /**
   * Test a given password
   * @param password The password to test
   * @returns Object
   */
  test(password: string): PasswordStrength {
    const statistic = { ...defaultStatistic };
    if (!password) {
      return {
        entropy: 0,
        length: 0,
        statistic,
        strength: 0,
      };
    }
    let charset = '';

    for (const char of password) {
      const group = this.getGroupFromChar(char);
      if (group) {
        const { name, chars } = group;
        if (statistic[name] === 0) {
          charset += chars;
        }
        statistic[name]++;
      }
    }

    const length = password.length;
    const entropy = length * Math.log2(charset.length);
    const strength = Math.min(entropy / 100, 1);

    return { entropy, length, statistic, strength };
  }

  /**
   * Generates a password based on the current settings.
   *
   * @param options Optional override settings.
   * @returns Object
   */
  create(options?: Options): Output {
    if (options) this.init(options);

    if (!this.anyGroupSelected) {
      // console.error('At least one character group must be selected.');
      return this.generatePassword();
    }

    const currentCharGroups = this.getCharGroups();
    const { password, statistic } = this.computePasswordArray(
      currentCharGroups,
      this.settings.normalDistribute
    );
    return this.generatePassword(password, statistic);
  }
}

const password = (options?: Options) => new PasswordClass(options);

export type {
  CharGroups,
  Options,
  Output,
  PasswordStrength,
  PasswordStrengthStatistic,
};

export { password, charGroups };
