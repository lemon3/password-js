import { describe, it, expect } from 'vitest';
import { password, type Options } from './index';

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
