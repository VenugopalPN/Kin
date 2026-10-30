import { describe, expect, it } from 'vitest';
import { hasErrors, validateCampaignFields } from './validate.ts';

const valid = {
  title: 'Books for the library',
  letterBody: 'We are raising money for new books.',
  goal: 500,
  amounts: [
    { value: 10, label: 'one book' },
    { value: 25, label: 'a set of readers' },
  ],
};

describe('validateCampaignFields', () => {
  it('accepts a complete fundraiser', () => {
    const errors = validateCampaignFields(valid);
    expect(errors).toEqual({});
    expect(hasErrors(errors)).toBe(false);
  });

  it('needs a title', () => {
    expect(validateCampaignFields({ ...valid, title: '  ' }).title).toBeDefined();
  });

  it('needs more than a word or two in the letter', () => {
    expect(validateCampaignFields({ ...valid, letterBody: 'Books' }).letterBody).toBeDefined();
  });

  it.each([0, -5, 12.5, Number.NaN])('rejects a goal of %s', (goal) => {
    expect(validateCampaignFields({ ...valid, goal }).goal).toBeDefined();
  });

  it('points at the one amount that is wrong', () => {
    const errors = validateCampaignFields({
      ...valid,
      amounts: [
        { value: 10, label: 'one book' },
        { value: 25, label: ' ' },
      ],
    });
    expect(errors.amounts?.[0]).toBeUndefined();
    expect(errors.amounts?.[1]).toBeDefined();
    expect(hasErrors(errors)).toBe(true);
  });
});
