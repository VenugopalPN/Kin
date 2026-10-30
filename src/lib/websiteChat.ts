import { DEFAULT_ACCENT } from './schoolLook.ts';

export const CHAT_STEPS = ['name', 'place', 'welcome', 'color', 'email', 'banner', 'logo', 'confirm'] as const;

export type ChatMode = 'create' | 'edit';

export type ChatStep = (typeof CHAT_STEPS)[number];

export interface ChatDraft {
  name: string;
  place: string;
  welcomeLine: string;
  accentColor: string;
  contactEmail: string;
  bannerImage: string;
  logoImage: string;
}

export const DEMO_NAME = 'Riverside College';
export const DEMO_PLACE = 'Bendigo';
export const DEMO_WELCOME = 'Fundraisers for our community.';
export const DEMO_EMAIL = 'hello@riverside.example';

export function emptyDraft(): ChatDraft {
  return {
    name: '',
    place: '',
    welcomeLine: '',
    accentColor: '',
    contactEmail: '',
    bannerImage: '',
    logoImage: '',
  };
}

export function promptFor(step: ChatStep, draft: ChatDraft, mode: ChatMode = 'create'): string {
  switch (step) {
    case 'name':
      return 'What should the website be called?';
    case 'place':
      return 'Where is it?';
    case 'welcome':
      return 'A short welcome line for the public page?';
    case 'color':
      return 'Pick an accent color, or skip to keep orange.';
    case 'email':
      return 'A contact email for the public page?';
    case 'banner':
      return 'Pick a photo for the top of the page, or skip to keep the current one.';
    case 'logo':
      return 'Upload a logo, or skip this.';
    case 'confirm':
      return mode === 'edit' ? `Save ${draft.name.trim()}?` : `Create ${draft.name.trim()}?`;
  }
}

function nextStep(step: ChatStep): ChatStep {
  return CHAT_STEPS[CHAT_STEPS.indexOf(step) + 1] ?? 'confirm';
}

function previousStep(step: ChatStep): ChatStep | null {
  const index = CHAT_STEPS.indexOf(step);
  return index > 0 ? CHAT_STEPS[index - 1] : null;
}

function withoutStep(draft: ChatDraft, step: ChatStep): ChatDraft {
  const next = { ...draft };
  if (step === 'name') next.name = '';
  if (step === 'place') next.place = '';
  if (step === 'welcome') next.welcomeLine = '';
  if (step === 'color') next.accentColor = '';
  if (step === 'email') next.contactEmail = '';
  if (step === 'banner') next.bannerImage = '';
  if (step === 'logo') next.logoImage = '';
  return next;
}

export function canGoBack(step: ChatStep): boolean {
  return step !== 'name';
}

export function replyToText(
  draft: ChatDraft,
  step: ChatStep,
  raw: string,
): { error: string } | { draft: ChatDraft; reply: string; next: ChatStep } {
  const text = raw.trim();
  if (step === 'name') {
    if (!text) return { error: 'A name is needed.' };
    return { draft: { ...draft, name: text }, reply: text, next: nextStep(step) };
  }
  if (step === 'place') {
    if (!text) return { error: 'Type a place, or skip.' };
    return { draft: { ...draft, place: text }, reply: text, next: nextStep(step) };
  }
  if (step === 'welcome') {
    if (!text) return { error: 'Type a welcome line, or skip.' };
    return { draft: { ...draft, welcomeLine: text }, reply: text, next: nextStep(step) };
  }
  if (step === 'email') {
    if (!text) return { error: 'Type an email, or skip.' };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) return { error: "That doesn't look like an email." };
    return { draft: { ...draft, contactEmail: text }, reply: text, next: nextStep(step) };
  }
  return { error: 'Use the choice below.' };
}

export function replyToColor(draft: ChatDraft, color: string): { draft: ChatDraft; reply: string; next: ChatStep } {
  const accent = /^#[0-9a-fA-F]{6}$/.test(color) ? color : DEFAULT_ACCENT;
  return { draft: { ...draft, accentColor: accent }, reply: accent, next: 'email' };
}

export function replyToImage(
  draft: ChatDraft,
  step: 'banner' | 'logo',
  image: string,
): { draft: ChatDraft; reply: string; next: ChatStep } {
  if (step === 'banner') {
    return { draft: { ...draft, bannerImage: image }, reply: 'Banner added', next: 'logo' };
  }
  return { draft: { ...draft, logoImage: image }, reply: 'Logo added', next: 'confirm' };
}

export function replyToStockPhoto(
  draft: ChatDraft,
  photo: { label: string; src: string },
): { draft: ChatDraft; reply: string; next: ChatStep } {
  return { draft: { ...draft, bannerImage: photo.src }, reply: photo.label, next: 'logo' };
}

export function replyToSkip(
  draft: ChatDraft,
  step: ChatStep,
  mode: ChatMode = 'create',
): { draft: ChatDraft; reply: string; next: ChatStep } | null {
  if (step === 'name' || step === 'confirm') return null;
  return { draft: mode === 'edit' ? draft : withoutStep(draft, step), reply: 'Skip', next: nextStep(step) };
}

export function goBack(draft: ChatDraft, step: ChatStep, mode: ChatMode = 'create'): { draft: ChatDraft; step: ChatStep } | null {
  const previous = previousStep(step);
  if (!previous) return null;
  return { draft: mode === 'edit' ? draft : withoutStep(draft, previous), step: previous };
}

export function demoConversation(): { draft: ChatDraft; step: ChatStep } {
  return {
    draft: {
      name: DEMO_NAME,
      place: DEMO_PLACE,
      welcomeLine: DEMO_WELCOME,
      accentColor: '',
      contactEmail: DEMO_EMAIL,
      bannerImage: '',
      logoImage: '',
    },
    step: 'confirm',
  };
}
