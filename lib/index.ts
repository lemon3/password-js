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

  constructor() {
    this.charGroups = { ...charGroups };
    this.filteredCharGroups = { ...charGroups };
    this.charsUpdated = false;
    this.charset = '';
  }

  // returns the char groups to be used for password creation
  private getCharGroups(): CharGroups {
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

    const targetLength = Math.max(this.settings.length ?? 0, totalMin);
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

  private generatePassword(
    chars?: string[],
    statistic?: PasswordStrengthStatistic
  ): Output {
    if (!chars)
      return {
        password: '',
        length: 0,
        strength: 0,
        entropy: 0,
        statistic: { ...defaultStatistic },
      };
    const passwordArray = shuffleArray(chars);
    const password = passwordArray.join('');
    const length = password.length;
    const entropy = length * Math.log2(this.charset.length);
    const strength = Math.min(entropy / 100, 1);

    if (!statistic) statistic = { ...defaultStatistic };
    return { entropy, length, password, strength, statistic };
  }

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

  updateChars(charGroup: CharGroups) {
    this.charGroups = { ...this.charGroups, ...charGroup };
    this.filteredCharGroups = { ...this.charGroups };

    this.charsUpdated = true;
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
    this.settings = { ...defaults, ...options };

    if (!this.settings.length) {
      this.settings.length = defaults.length;
    }

    const anyGroupSelected = Object.entries(charGroups).some(
      ([name]) => this.settings[name as keyof Options]
    );

    if (!anyGroupSelected) {
      // console.error('At least one character group must be selected.');
      return this.generatePassword();
    }

    const currentCharGroups = this.getCharGroups();
    const { password: passwordArray, statistic } = this.computePasswordArray(
      currentCharGroups,
      this.settings.normalDistribute
    );
    return this.generatePassword(passwordArray, statistic);
  }
}

const password = () => new PasswordClass();

export { password, charGroups };
