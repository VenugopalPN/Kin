import type { KinData } from '../types.ts';
import { daysFromNow } from './format.ts';

const now = new Date();
const twelveDaysOut = daysFromNow(12);
const minutesAgo = (mins: number) => new Date(now.getTime() - mins * 60_000).toISOString();

export function buildSeedData(): KinData {
  return {
    schools: [
      {
        id: 'school_wattle',
        slug: 'wattle-primary',
        name: 'Wattle Primary',
        suburb: 'Hazelbrook',
        createdAt: minutesAgo(600),
        welcomeLine: '',
        accentColor: '',
        contactEmail: '',
        bannerImage: '',
        logoImage: '',
        adminUsername: 'wattle-primary',
        adminPassword: 'kin-wattle-primary',
      },
    ],
    campaigns: [
      {
        id: 'campaign_wattle_books',
        schoolId: 'school_wattle',
        cause: 'books for the library',
        title: 'Books for the library',
        letterBody:
          "Wattle Primary is raising money for books for the library. Every gift, big or small, gets us closer.",
        goal: 500,
        endDate: twelveDaysOut,
        amounts: [
          { value: 10, label: '$10 — one book' },
          { value: 25, label: '$25 — a set of readers' },
          { value: 50, label: '$50 — a shelf of books' },
        ],
        hideAmounts: false,
        matchingSentence: 'The organiser adds the same amount tonight.',
        childFirstName: 'Asha',
        greetingName: 'Aunty June',
        thankYouLine: 'Thank you for helping our class.',
        gameId: 'stars',
        publishedAt: minutesAgo(480),
      },
      {
        id: 'campaign_wattle_sports',
        schoolId: 'school_wattle',
        cause: 'a new basketball hoop',
        title: 'New sports gear',
        letterBody:
          "Wattle Primary is raising money for a new basketball hoop. Every gift, big or small, gets us closer.",
        goal: 650,
        endDate: daysFromNow(9),
        amounts: [
          { value: 10, label: '$10 — a ball' },
          { value: 25, label: '$25 — a set of bibs' },
          { value: 50, label: '$50 — a basketball hoop' },
        ],
        hideAmounts: false,
        matchingSentence: 'The organiser adds the same amount tonight.',
        childFirstName: 'Leo',
        greetingName: 'Uncle Sam',
        thankYouLine: 'Thank you for helping our team.',
        gameId: 'stars',
        publishedAt: minutesAgo(120),
      },
    ],
    promoters: [
      {
        id: 'promoter_wattle_maya',
        campaignId: 'campaign_wattle_books',
        name: 'Maya Patel',
        sentAt: minutesAgo(200),
      },
      {
        id: 'promoter_wattle_chris',
        campaignId: 'campaign_wattle_books',
        name: 'Chris Nguyen',
        sentAt: minutesAgo(200),
      },
    ],
    gifts: [
      {
        id: 'gift_1',
        campaignId: 'campaign_wattle_books',
        donorFirstName: 'June',
        amount: 50,
        stars: 0,
        createdAt: minutesAgo(90),
        promoterId: 'promoter_wattle_maya',
      },
      {
        id: 'gift_2',
        campaignId: 'campaign_wattle_books',
        donorFirstName: 'Raj',
        amount: 25,
        stars: 3,
        createdAt: minutesAgo(60),
        promoterId: 'promoter_wattle_chris',
      },
      {
        id: 'gift_3',
        campaignId: 'campaign_wattle_books',
        donorFirstName: 'Mei',
        amount: 25,
        stars: 0,
        createdAt: minutesAgo(40),
        promoterId: 'promoter_wattle_maya',
      },
      {
        id: 'gift_4',
        campaignId: 'campaign_wattle_books',
        donorFirstName: 'Sam',
        amount: 10,
        stars: 2,
        createdAt: minutesAgo(15),
        promoterId: '',
      },
      {
        id: 'gift_5',
        campaignId: 'campaign_wattle_sports',
        donorFirstName: 'Priya',
        amount: 10,
        stars: 0,
        createdAt: minutesAgo(50),
        promoterId: '',
      },
      {
        id: 'gift_6',
        campaignId: 'campaign_wattle_sports',
        donorFirstName: 'Tom',
        amount: 50,
        stars: 0,
        createdAt: minutesAgo(20),
        promoterId: '',
      },
    ],
  };
}
