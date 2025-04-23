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
}

export interface Options {
  length: number;
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

export interface CharGroups {
  lowercase: string;
  uppercase: string;
  numbers: string;
  symbols: string;
  umlauts: string;
}

// all available charGroups
export const charGroups: CharGroups = {
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  numbers: '0123456789',
  symbols: `!"#$%&'()*+,-./:;<=>?@[]^_{|}~`,
  umlauts: 'äöüÄÖÜ',
};

const defaults: Options = {
  length: 10,
  lowercase: true,
  uppercase: true,
  numbers: true,
  symbols: true,
  umlauts: false,
  excludeSimilar: false,
  normalDistribute: false,
};

const similarChars: string = 'lOI01|';

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

  updateChars(charGroup: CharGroups) {
    this.charGroups = { ...this.charGroups, ...charGroup };
    this.charGroupsExclude = { ...this.charGroups };

    this.charsUpdated = true;
  }

  create(options?: Options): Output {
    this.settings = { ...defaults, ...options };

    const anyGroupSelected = Object.entries(charGroups).some(
      ([name]) => this.settings[name as keyof Options]
    );

    if (!anyGroupSelected) {
      console.error('At least one character group must be selected.');
      return this.generatePassword();
    }

    this.charset = '';
    const currentCharGroups = this.getCharGroups();
    let requiredChars: string[] = [];

    // normal distribute
    if (this.settings.normalDistribute) {
      const groups = this.computeDistributedGroups(currentCharGroups);
      if (!this.charset.length) return this.generatePassword();
      requiredChars = this.selectCharacters(groups);
      return this.generatePassword(requiredChars);
    }

    // fallback to default distribution
    requiredChars = this.generateRequiredChars(currentCharGroups);
    if (!requiredChars.length) return this.generatePassword();

    if (requiredChars.length > this.settings.length) {
      this.settings.length = requiredChars.length;
    }

    const charSetSize = this.charset.length;
    let passwordArray: string[] = [...requiredChars];
    for (let i = requiredChars.length; i < this.settings.length; i++) {
      passwordArray.push(this.charset[Math.floor(Math.random() * charSetSize)]);
    }
    return this.generatePassword(passwordArray);
  }

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
    const targetLength = Math.max(this.settings.length, totalMin);
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

  private generatePassword(chars?: string[]): Output {
    if (!chars) return { password: '', entropy: 0 };
    const passwordArray = shuffleArray(chars);
    const password = passwordArray.join('');
    const entropy = password.length * Math.log2(this.charset.length);
    return { password, entropy };
  }

  // for default distribution
  private generateRequiredChars(charGroups: CharGroups) {
    let requiredChars: string[] = [];
    for (const [name, chars] of Object.entries(charGroups)) {
      const val = this.settings[name as keyof Options];
      if (!val || !chars) continue;

      this.charset += chars;
      const min = getNumber(val);
      for (let i = 0; i < min; i++) {
        requiredChars.push(chars[Math.floor(Math.random() * chars.length)]);
      }
    }
    return requiredChars;
  }
}

export const password = () => new PasswordClass();
