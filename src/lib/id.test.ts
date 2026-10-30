import { describe, expect, it } from 'vitest';
import { newId, slugify } from './id.ts';

describe('slugify', () => {
  it('turns a name into a readable address', () => {
    expect(slugify('  Wattle Primary School! ')).toBe('wattle-primary-school');
  });

  it('collapses punctuation and spaces', () => {
    expect(slugify("St. Mary's -- P&C")).toBe('st-mary-s-p-c');
  });

  it('falls back when nothing usable is left', () => {
    expect(slugify('!!!')).toBe('school');
  });
});

describe('newId', () => {
  it('keeps the prefix and does not repeat', () => {
    const a = newId('gift');
    const b = newId('gift');
    expect(a.startsWith('gift_')).toBe(true);
    expect(a).not.toBe(b);
  });
});
