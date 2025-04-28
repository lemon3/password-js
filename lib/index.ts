import { defaults, type Options } from './defaults';

const shuffleArray = <T>(array: T[]): T[] => {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

const getNumber = (value: string | boolean | number | undefined): number =>
  value === true ? 1 : Number(value);

export interface Output {
  password: string;
  entropy: number;
  length: number;
  strength: number;
  statistic: PasswordStrengthStatistic;
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

export interface PasswordStrength {
  entropy: number;
  length: number;
  statistic: PasswordStrengthStatistic;
  strength: number;
}

// all available charGroups
export const charGroups: CharGroups = {
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  numbers: '0123456789',
  symbols: `!"#$%&'()*+,-./:;<=>?@[]^_{|}~`,
  umlauts: 'äöüÄÖÜ',
};

const similarChars: string = 'lOI01|';

const defaultStatistic: PasswordStrengthStatistic = {
  lowercase: 0,
  uppercase: 0,
  numbers: 0,
  symbols: 0,
  umlauts: 0,
};

class PasswordClass {
  charGroups: CharGroups;
  settings!: Options;
  charsUpdated: boolean;
  charset!: string;
  charGroupsExclude: CharGroups;
  lastExcludeSimilar: boolean = false;

  constructor() {
    this.charGroups = { ...charGroups }; // clone
    this.charGroupsExclude = { ...charGroups }; // clone
    this.charsUpdated = false;
  }

  // for default distribution
  private generateRequiredChars(charGroups: CharGroups) {
    let requiredChars: string[] = [];
    const statistic = { ...defaultStatistic };
    const groups: Partial<CharGroups> = {};

    for (const [name, chars] of Object.entries(charGroups) as [
      keyof CharGroups,
      string
    ][]) {
      const val = this.settings[name as keyof Options];
      if (!val || !chars) continue;

      this.charset += chars;
      groups[name] = charGroups[name];

      const min = getNumber(val);
      statistic[name] = min;
      for (let i = 0; i < min; i++) {
        requiredChars.push(chars[Math.floor(Math.random() * chars.length)]);
      }
    }

    return { groups, requiredChars, statistic };
  }

  // returns the char groups to be used for password creation
  private getCharGroups(): CharGroups {
    const exclude = !!this.settings.excludeSimilar;

    // Return original if excludeSimilar is false
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
          .filter((c) => !similarChars.includes(c))
          .join('');
      }
      this.charGroupsExclude = modified;
      this.charsUpdated = false;
      this.lastExcludeSimilar = exclude;
    }

    return this.charGroupsExclude;
  }

  private computeDistributedGroups(
    charGroups: CharGroups
  ): { name: string; chars: string; count: number }[] {
    const groups: {
      name: string;
      chars: string;
      count: number;
      weight: number;
    }[] = [];

    let totalMin = 0;
    let totalWeight = 0;

    for (const [name, chars] of Object.entries(charGroups) as [
      keyof CharGroups,
      string
    ][]) {
      const enabled = this.settings[name];
      if (!enabled || !chars) continue;

      const min = getNumber(enabled);
      const weight = getNumber(this.settings[`${name}Weight` as keyof Options]);
      groups.push({ name, chars, count: min, weight });
      totalMin += min;
      totalWeight += weight;
    }

    if (!groups.length) return [];

    this.charset = groups.map((g) => g.chars).join('');
    const targetLength = Math.max(this.settings.length ?? 0, totalMin);
    const remaining = targetLength - totalMin;

    if (remaining > 0) {
      if (totalWeight > 0) {
        let distributed = 0;

        for (const group of groups) {
          const share = Math.floor((group.weight / totalWeight) * remaining);
          group.count += share;
          distributed += share;
        }

        // Distribute leftover
        for (let i = 0; distributed < remaining; i++, distributed++) {
          groups[i % groups.length].count++;
        }
      } else {
        // Even distribution fallback
        for (let i = 0; i < remaining; i++) {
          groups[i % groups.length].count++;
        }
      }
    }

    return groups.map(({ name, chars, count }) => ({ name, chars, count }));
  }

  private selectCharacters(
    groups: { name: string; chars: string; count: number }[]
  ): string[] {
    const chars: string[] = [];
    for (const group of groups) {
      for (let i = 0; i < group.count; i++) {
        chars.push(group.chars[Math.floor(Math.random() * group.chars.length)]);
      }
    }
    return chars;
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

  updateChars(charGroup: CharGroups) {
    this.charGroups = { ...this.charGroups, ...charGroup };
    this.charGroupsExclude = { ...this.charGroups };

    this.charsUpdated = true;
  }

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
      for (const [group, chars] of Object.entries(charGroups)) {
        if (chars.includes(char)) {
          const charGroup = group as keyof PasswordStrengthStatistic;
          if (statistic[charGroup] === 0) {
            charset += chars;
          }
          statistic[charGroup] += 1;
          break;
        }
      }
    }

    const length = password.length;
    const entropy = password.length * Math.log2(charset.length);
    const strength = Math.min(entropy / 100, 1);

    return {
      entropy,
      length,
      statistic,
      strength,
    };
  }

  create(options?: Options): Output {
    this.settings = { ...defaults, ...(options ?? {}) };

    if (!this.settings.length) {
      this.settings.length = defaults.length;
    }

    const anyGroupSelected = Object.entries(charGroups).some(
      ([name]) => this.settings[name as keyof Options]
    );

    if (!anyGroupSelected) {
      console.error('At least one character group must be selected.');
      return this.generatePassword();
    }

    this.charset = '';
    const currentCharGroups = this.getCharGroups();

    // normal distribute
    if (this.settings.normalDistribute) {
      let requiredChars: string[] = [];
      const groups = this.computeDistributedGroups(currentCharGroups);
      const statistic = groups.reduce((prev, next) => {
        (prev as any)[next.name] = next.count;
        return prev;
      }, {} as PasswordStrengthStatistic) || { ...defaultStatistic };

      if (!this.charset.length) return this.generatePassword();
      requiredChars = this.selectCharacters(groups);
      return this.generatePassword(requiredChars, statistic);
    }

    // fallback to default distribution
    const { groups, requiredChars, statistic } =
      this.generateRequiredChars(currentCharGroups);

    if (!requiredChars.length) return this.generatePassword();

    this.settings.length = Math.max(
      this.settings.length ?? 0,
      requiredChars.length
    );

    // const charSetSize = this.charset.length;
    const passwordArray: string[] = [...requiredChars];
    const currentCharGroupsObj = Object.entries(groups);
    const currentCharGroupsLength = currentCharGroupsObj.length;

    for (let i = requiredChars.length; i < this.settings.length; i++) {
      const rand = Math.floor(Math.random() * currentCharGroupsLength);
      const [name, chars] = currentCharGroupsObj[rand];
      const char = chars[Math.floor(Math.random() * chars.length)];
      // this.charset[
      //   Math.floor(Math.random() * groups[name as keyof CharGroups].length)
      // ];

      statistic[name as keyof CharGroups]++;
      passwordArray.push(char);
      // passwordArray.push(this.charset[Math.floor(Math.random() * charSetSize)]);
    }

    return this.generatePassword(passwordArray, statistic);
  }
}

export const password = () => new PasswordClass();
