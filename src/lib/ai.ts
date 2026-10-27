import { daysFromNow, dayName } from './format.ts';
import type { AmountTier } from '../types.ts';

export interface DraftCampaign {
  title: string;
  letterBody: string;
  goal: number;
  endDate: string;
  amounts: AmountTier[];
  matchingSentence: string;
  thankYouLine: string;
}

interface CauseTemplate {
  match: RegExp;
  thing: string;
  title: string;
  tiers: [string, string, string];
  goal: number;
}

const TEMPLATES: CauseTemplate[] = [
  {
    match: /book|library|read/i,
    thing: 'books for the library',
    title: 'Books for the library',
    tiers: ['one book', 'a set of readers', 'a shelf of books'],
    goal: 500,
  },
  {
    match: /playground|slide|swing/i,
    thing: 'a new playground',
    title: 'A new playground',
    tiers: ['a swing chain', 'a climbing rung', 'a new slide step'],
    goal: 1200,
  },
  {
    match: /sport|basketball|hoop|ball/i,
    thing: 'sports gear',
    title: 'New sports gear',
    tiers: ['a ball', 'a set of bibs', 'a basketball hoop'],
    goal: 650,
  },
  {
    match: /jacket|coat|winter|cold|clothes/i,
    thing: 'winter jackets',
    title: 'Winter jackets for every child',
    tiers: ['a pair of gloves', 'a warm jumper', 'a winter jacket'],
    goal: 800,
  },
  {
    match: /music|art|instrument|paint/i,
    thing: 'art and music supplies',
    title: 'Art and music supplies',
    tiers: ['a set of paints', 'a music lesson', 'a class instrument'],
    goal: 700,
  },
];

const DEFAULT_TEMPLATE: CauseTemplate = {
  match: /.*/,
  thing: 'what the class needs',
  title: 'Support our class',
  tiers: ['a small lift', 'a solid boost', 'a big help'],
  goal: 600,
};

function templateFor(cause: string): CauseTemplate {
  return TEMPLATES.find((t) => t.match.test(cause)) ?? DEFAULT_TEMPLATE;
}

/** The whole AI step: one answer in, a finished campaign out. */
export function draftCampaignFromCause(cause: string, schoolName: string): DraftCampaign {
  const template = templateFor(cause.trim() || DEFAULT_TEMPLATE.thing);
  const endDate = daysFromNow(14);
  const [small, medium, large] = template.tiers;
  return {
    title: template.title,
    letterBody: `${schoolName} is raising money for ${template.thing}. Every gift, big or small, gets us closer.`,
    goal: template.goal,
    endDate,
    amounts: [
      { value: 10, label: `$10 — ${small}` },
      { value: 25, label: `$25 — ${medium}` },
      { value: 50, label: `$50 — ${large}` },
    ],
    matchingSentence: 'The organiser adds the same amount tonight.',
    thankYouLine: 'Thank you for helping our class.',
  };
}

/** One short message that works pasted into WhatsApp, a text, or Facebook. */
export function writeShareMessage(opts: {
  greetingName: string;
  childFirstName: string;
  schoolName: string;
  cause: string;
  link: string;
}): string {
  return `Hi ${opts.greetingName}, it's ${opts.childFirstName}! ${opts.schoolName} is raising money for ${opts.cause}. Would you give a gift? ${opts.link}`;
}

/** A sensible, labelled preview — not a real prediction. */
export function bestTimeSentence(endDateIso: string): string {
  const day = dayName(endDateIso);
  return `Send it this evening, around 7:30pm. The fundraiser ends ${day}.`;
}

/** A fixed, labelled preview of the one thing to do today. */
export function todayAdviceSentence(): string {
  return 'Send your message to three people today. A reply to each one doubles the chance they give.';
}
