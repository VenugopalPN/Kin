import type { AmountTier } from '../types.ts';

export interface CampaignFields {
  title: string;
  letterBody: string;
  goal: number;
  amounts: AmountTier[];
}

export interface CampaignErrors {
  title?: string;
  letterBody?: string;
  goal?: string;
  amounts?: (string | undefined)[];
}

export const MIN_LETTER_LENGTH = 10;

function isWholeAmount(value: number): boolean {
  return Number.isInteger(value) && value >= 1;
}

export function validateTitle(title: string): string | undefined {
  return title.trim() ? undefined : 'Type a title, like "Books for the library".';
}

export function validateLetter(letterBody: string): string | undefined {
  return letterBody.trim().length >= MIN_LETTER_LENGTH
    ? undefined
    : 'Write a sentence or two about what the money is for.';
}

export function validateGoal(goal: number): string | undefined {
  return isWholeAmount(goal) ? undefined : 'Type a goal in whole dollars, like 500.';
}

export function validateTier(tier: AmountTier): string | undefined {
  if (!isWholeAmount(tier.value)) return 'Type an amount in whole dollars, like 25.';
  if (!tier.label.trim()) return 'Say what this amount buys, like "one book".';
  return undefined;
}

export function validateCampaignFields(input: CampaignFields): CampaignErrors {
  const errors: CampaignErrors = {};
  const title = validateTitle(input.title);
  const letterBody = validateLetter(input.letterBody);
  const goal = validateGoal(input.goal);
  const amounts = input.amounts.map(validateTier);
  if (title) errors.title = title;
  if (letterBody) errors.letterBody = letterBody;
  if (goal) errors.goal = goal;
  if (amounts.some(Boolean)) errors.amounts = amounts;
  return errors;
}

export function hasErrors(errors: CampaignErrors): boolean {
  return Boolean(errors.title || errors.letterBody || errors.goal || errors.amounts?.some(Boolean));
}
