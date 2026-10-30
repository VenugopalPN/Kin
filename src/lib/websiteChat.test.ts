import { describe, expect, it } from 'vitest';
import {
  canGoBack,
  emptyDraft,
  goBack,
  promptFor,
  replyToColor,
  replyToSkip,
  replyToStockPhoto,
  replyToText,
} from './websiteChat.ts';
import { DEFAULT_ACCENT } from './schoolLook.ts';

describe('replyToText', () => {
  it('needs a name before moving on', () => {
    expect(replyToText(emptyDraft(), 'name', '   ')).toEqual({ error: 'A name is needed.' });
  });

  it('moves from name to place', () => {
    const result = replyToText(emptyDraft(), 'name', ' Riverside ');
    expect(result).toMatchObject({ next: 'place', draft: { name: 'Riverside' } });
  });

  it('rejects an email without an @', () => {
    expect(replyToText(emptyDraft(), 'email', 'hello.example.com')).toEqual({
      error: "That doesn't look like an email.",
    });
  });
});

describe('replyToColor', () => {
  it('falls back to the default accent for a bad colour', () => {
    expect(replyToColor(emptyDraft(), 'red').draft.accentColor).toBe(DEFAULT_ACCENT);
  });
});

describe('replyToStockPhoto', () => {
  it('sets the banner and moves to the logo step', () => {
    const result = replyToStockPhoto(emptyDraft(), { label: 'Garden', src: '/stock/garden.jpg' });
    expect(result).toMatchObject({ next: 'logo', reply: 'Garden', draft: { bannerImage: '/stock/garden.jpg' } });
  });
});

describe('replyToSkip', () => {
  it('cannot skip the name', () => {
    expect(replyToSkip(emptyDraft(), 'name')).toBeNull();
  });

  it('clears a skipped answer when creating', () => {
    const draft = { ...emptyDraft(), welcomeLine: 'Hello' };
    expect(replyToSkip(draft, 'welcome', 'create')?.draft.welcomeLine).toBe('');
  });

  it('keeps the saved answer when editing', () => {
    const draft = { ...emptyDraft(), welcomeLine: 'Hello' };
    expect(replyToSkip(draft, 'welcome', 'edit')?.draft.welcomeLine).toBe('Hello');
  });
});

describe('goBack', () => {
  it('has nowhere to go from the first step', () => {
    expect(canGoBack('name')).toBe(false);
    expect(goBack(emptyDraft(), 'name')).toBeNull();
  });

  it('returns to the previous step and clears it when creating', () => {
    const draft = { ...emptyDraft(), name: 'Riverside', place: 'Bendigo' };
    expect(goBack(draft, 'welcome', 'create')).toEqual({ draft: { ...draft, place: '' }, step: 'place' });
  });
});

describe('promptFor', () => {
  it('asks to save, not create, when editing', () => {
    const draft = { ...emptyDraft(), name: 'Riverside' };
    expect(promptFor('confirm', draft, 'edit')).toBe('Save Riverside?');
    expect(promptFor('confirm', draft, 'create')).toBe('Create Riverside?');
  });
});
