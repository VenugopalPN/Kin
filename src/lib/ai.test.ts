import { describe, expect, it } from 'vitest';
import { draftCampaignFromCause, writeShareMessage } from './ai.ts';

describe('draftCampaignFromCause', () => {
  it('matches a cause to its template', () => {
    const draft = draftCampaignFromCause('new basketball hoop', 'Wattle Primary');
    expect(draft.title).toBe('New sports gear');
    expect(draft.goal).toBe(650);
    expect(draft.amounts.map((a) => a.value)).toEqual([10, 25, 50]);
    expect(draft.letterBody).toContain('Wattle Primary');
  });

  it('falls back to a general fundraiser for an unknown cause', () => {
    const draft = draftCampaignFromCause('a school bus trip', 'Wattle Primary');
    expect(draft.title).toBe('Support our class');
    expect(draft.gameId).toBe('stars');
  });

  it('ends about two weeks from now', () => {
    const draft = draftCampaignFromCause('books', 'Wattle Primary');
    const days = (new Date(draft.endDate).getTime() - Date.now()) / 86_400_000;
    expect(days).toBeGreaterThan(13);
    expect(days).toBeLessThan(15);
  });
});

describe('writeShareMessage', () => {
  it('puts the names, cause, and link in one message', () => {
    const message = writeShareMessage({
      greetingName: 'Nana',
      childFirstName: 'Asha',
      schoolName: 'Wattle Primary',
      cause: 'library books',
      link: 'https://example.com/give',
    });
    expect(message).toBe(
      "Hi Nana, it's Asha! Wattle Primary is raising money for library books. Would you give a gift? https://example.com/give",
    );
  });
});
