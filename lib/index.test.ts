import { describe, it, expect } from 'vitest';
import { type Options } from './defaults';
import { password } from './index';

describe('Password generator', () => {
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
