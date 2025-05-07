import { describe, it, expect } from 'vitest';
import { type Options, type CharGroups } from './types';
import { password } from './index';

describe('PasswordClass.create', () => {
  it('should generate a password of specified length', () => {
    const pwd = password();
    const result = pwd.create({
      length: 16,
      lowercase: true,
      uppercase: true,
      numbers: true,
      symbols: true,
    });
    expect(result.password).toHaveLength(16);
  });

  it('should generate only lowercase characters if only lowercase is enabled', () => {
    const lowercaseCharRegex = /^[a-z]{10}$/;
    const pwd = password();
    const result = pwd.create({
      length: 10,
      lowercase: 10,
      uppercase: false,
      numbers: false,
      symbols: false,
    });
    expect(result.password).toMatch(lowercaseCharRegex);
  });

  it('should honor excludeSimilar option', () => {
    const pwd = password();
    const result = pwd.create({
      length: 20,
      lowercase: true,
      uppercase: true,
      numbers: true,
      symbols: false,
      excludeSimilar: true,
    });
    const similarChars = 'lOI01|';
    for (const char of result.password) {
      expect(similarChars.includes(char)).toBe(false);
    }
  });

  it('should return empty password if no groups are enabled', () => {
    const pwd = password();
    const result = pwd.create({
      length: 10,
      lowercase: false,
      uppercase: false,
      numbers: false,
      symbols: false,
    });
    expect(result.password).toBe('');
  });

  it('should generate with normalDistribute set', () => {
    const pwd = password();
    const options: Options = {
      length: 12,
      lowercase: 1,
      uppercase: 1,
      numbers: 1,
      symbols: 1,
      normalDistribute: true,
    };
    const result = pwd.create(options);
    expect(result.password).toHaveLength(12);
  });

  it('should should create a weight distributed password', () => {
    const pwd = password();
    const length = 16;
    const options: Options = {
      length,
      lowercaseWeight: 25,
      uppercaseWeight: 25,
      numbersWeight: 25,
      symbolsWeight: 25,
      normalDistribute: true,
    };

    const result = pwd.create(options);
    const len = length / 4;
    expect(result.statistic.lowercase).toBe(len);
    expect(result.statistic.uppercase).toBe(len);
    expect(result.statistic.numbers).toBe(len);
    expect(result.statistic.symbols).toBe(len);
    expect(result.length).toBe(options.length);
  });

  it('should should create a weight distributed password, with leftovers', () => {
    const pwd = password();
    const length = 30;
    const options: Options = {
      length,
      lowercaseWeight: 1,
      uppercaseWeight: 1,
      numbersWeight: 1,
      symbolsWeight: 1,
      normalDistribute: true,
    };

    const result = pwd.create(options);
    const len = Math.floor(length / 4);

    expect(result.statistic.lowercase).toBe(len + 1);
    expect(result.statistic.uppercase).toBe(len + 1);
    expect(result.statistic.numbers).toBe(len);
    expect(result.statistic.symbols).toBe(len);
    expect(result.length).toBe(options.length);
  });

  it('should should create a weight distributed password', () => {
    const pwd = password();
    const length = 30;
    const options: Options = {
      length,
      lowercaseWeight: 1,
      numbersWeight: 1,
      normalDistribute: true,
    };

    const result = pwd.create(options);
    expect(result.statistic.lowercase).toBe(14);
    expect(result.statistic.uppercase).toBe(1);
    expect(result.statistic.numbers).toBe(14);
    expect(result.statistic.symbols).toBe(1);
    expect(result.length).toBe(options.length);
  });

  it('should should through an error if password length request is 0', () => {
    const pwd = password();
    const length = 0;
    const options: Options = { length };

    expect(() => pwd.create(options)).toThrowError();
  });
});

describe('PasswordClass.test', () => {
  const pw = password();

  it('should return zero entropy and strength for empty password', () => {
    const result = pw.test('');
    expect(result.entropy).toBe(0);
    expect(result.length).toBe(0);
    expect(result.strength).toBe(0);
    expect(result.statistic).toEqual({
      lowercase: 0,
      uppercase: 0,
      numbers: 0,
      symbols: 0,
      umlauts: 0,
    });
  });

  it('should correctly analyze a lowercase-only password', () => {
    const result = pw.test('abcdef');
    expect(result.length).toBe(6);
    expect(result.statistic.lowercase).toBe(6);
    expect(result.statistic.uppercase).toBe(0);
    expect(result.statistic.numbers).toBe(0);
    expect(result.statistic.symbols).toBe(0);
    expect(result.statistic.umlauts).toBe(0);
    expect(result.entropy).toBeGreaterThan(0);
    expect(result.strength).toBeGreaterThan(0);
  });

  it('should correctly analyze a password with multiple groups', () => {
    const result = pw.test('aB3$ä');
    expect(result.length).toBe(5);
    expect(result.statistic.lowercase).toBe(1);
    expect(result.statistic.uppercase).toBe(1);
    expect(result.statistic.numbers).toBe(1);
    expect(result.statistic.symbols).toBe(1);
    expect(result.statistic.umlauts).toBe(1);
    expect(result.entropy).toBeGreaterThan(0);
    expect(result.strength).toBeGreaterThan(0);
  });

  it('should handle passwords with only symbols and umlauts', () => {
    const result = pw.test('!@äö');
    expect(result.length).toBe(4);
    expect(result.statistic.lowercase).toBe(0);
    expect(result.statistic.uppercase).toBe(0);
    expect(result.statistic.numbers).toBe(0);
    expect(result.statistic.symbols).toBe(2);
    expect(result.statistic.umlauts).toBe(2);
    expect(result.entropy).toBeGreaterThan(0);
    expect(result.strength).toBeGreaterThan(0);
  });

  it('should handle extremely long passwords', () => {
    const longPassword = 'aB3$ä'.repeat(1000); // 5000 characters
    const result = pw.test(longPassword);
    expect(result.length).toBe(5000);
    expect(result.entropy).toBeGreaterThan(0);
    expect(result.strength).toBeGreaterThan(0);
  });

  it('should handle passwords with only numbers', () => {
    const result = pw.test('1234567890');
    expect(result.length).toBe(10);
    expect(result.statistic.lowercase).toBe(0);
    expect(result.statistic.uppercase).toBe(0);
    expect(result.statistic.numbers).toBe(10);
    expect(result.statistic.symbols).toBe(0);
    expect(result.statistic.umlauts).toBe(0);
    expect(result.entropy).toBeGreaterThan(0);
    expect(result.strength).toBeGreaterThan(0);
  });
});

describe('PasswordClass.getCharset', () => {
  it('should return the correct charset after create()', () => {
    const pw = password();
    pw.create({
      length: 12,
      lowercase: 4,
      uppercase: 4,
      numbers: 2,
      symbols: 2,
      umlauts: 0,
    });
    const charset = pw.getCharset();
    expect(typeof charset).toBe('string');
    expect(charset).toContain('a'); // lowercase
    expect(charset).toContain('A'); // uppercase
    expect(charset).toContain('0'); // numbers
    expect(charset).toContain('!'); // symbols

    expect(charset.length).toBeGreaterThan(0);
  });

  it('should return an empty string before create()', () => {
    const pw = password();
    const charset = pw.getCharset();
    expect(charset).toBe('');
  });
});

describe('PasswordClass.setCharGroups', () => {
  it('should set new CharGroups', () => {
    const pw = password({ length: 64 });
    const myNewGroups = {
      lowercase: 'abcdefg',
      uppercase: 'HIJKMLN',
      numbers: '0123456',
      symbols: '!"§$%&/',
    };

    pw.setCharGroups(myNewGroups);
    const myPassword = pw.create();
    expect(myPassword.password).not.toContain('h');
    expect(myPassword.password).not.toContain('i');
    expect(myPassword.password).not.toContain('j');

    expect(myPassword.password).not.toContain('7');
    expect(myPassword.password).not.toContain('8');
    expect(myPassword.password).not.toContain('9');

    Object.entries(myNewGroups).forEach(([key, value]) => {
      expect(pw.getCharGroups()[key as keyof CharGroups]).toBe(value);
    });
  });
});

describe('PasswordClass.resetCharGroups', () => {
  it('should reset CharGroups', () => {
    const pw = password({ length: 64 });
    const myNewGroups = {
      lowercase: 'abcdefg',
      uppercase: 'HIJKMLN',
      numbers: '0123456',
      symbols: '!"§$%&/',
    };

    pw.setCharGroups(myNewGroups);
    Object.entries(myNewGroups).forEach(([key, value]) => {
      expect(pw.getCharGroups()[key as keyof CharGroups]).toBe(value);
    });

    pw.resetCharGroups();
    Object.entries(myNewGroups).forEach(([key, value]) => {
      expect(pw.getCharGroups()[key as keyof CharGroups]).not.toBe(value);
    });
  });
});

describe('PasswordClass.updateSettings', () => {
  it('should update the settings', () => {
    const options = { length: 64 };
    const pw = password(options);
    const longPassword = pw.create();

    const newOptions = { length: 8 };
    pw.updateSettings(newOptions);
    const shortPassword = pw.create();

    expect(longPassword.length).toBe(options.length);
    expect(shortPassword.length).toBe(newOptions.length);
  });
});
