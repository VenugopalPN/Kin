import { beforeEach, describe, expect, it } from 'vitest';
import {
  addGift,
  campaignsForSchool,
  createSchool,
  ensurePromotersSeeded,
  findCampaignById,
  finishCampaign,
  getDefaultSchool,
  giftsForCampaign,
  handleStorageEvent,
  isFinished,
  leaderboardForCampaign,
  promotersForCampaign,
  publishCampaign,
  resetDemo,
  updateCampaign,
} from './store.ts';
import { draftCampaignFromCause } from './ai.ts';

const STORAGE_KEY = 'kin-demo-v1';

beforeEach(() => {
  window.localStorage.clear();
  resetDemo();
});

describe('createSchool', () => {
  it('gives each new website its own address', () => {
    const first = createSchool('Riverside College', 'Bendigo');
    const second = createSchool('Riverside College', 'Ballarat');
    expect(first.slug).toBe('riverside-college');
    expect(second.slug).toBe('riverside-college-2');
  });
});

describe('publishCampaign', () => {
  it('saves a running fundraiser for the school', () => {
    const school = createSchool('Riverside College', 'Bendigo');
    const campaign = publishCampaign(school, 'library books', draftCampaignFromCause('library books', school.name));
    expect(campaign.finishedAt).toBe('');
    expect(campaignsForSchool(school.id).map((c) => c.id)).toEqual([campaign.id]);
  });
});

describe('addGift', () => {
  it('credits a gift to a promoter on the same campaign', () => {
    const gift = addGift('campaign_wattle_books', 'Ana', 20, 0, 'promoter_wattle_maya');
    expect(gift?.promoterId).toBe('promoter_wattle_maya');
  });

  it('ignores a promoter from another campaign', () => {
    const gift = addGift('campaign_wattle_sports', 'Ana', 20, 0, 'promoter_wattle_maya');
    expect(gift?.promoterId).toBe('');
  });

  it('uses a friendly name when none is given', () => {
    expect(addGift('campaign_wattle_books', '  ', 10, 0)?.donorFirstName).toBe('A friend');
  });
});

describe('finishCampaign', () => {
  it('marks the fundraiser finished and refuses new gifts', () => {
    const before = giftsForCampaign('campaign_wattle_books').length;
    finishCampaign('campaign_wattle_books');
    const campaign = findCampaignById('campaign_wattle_books')!;
    expect(isFinished(campaign)).toBe(true);
    expect(addGift('campaign_wattle_books', 'Late', 10, 0)).toBeNull();
    expect(giftsForCampaign('campaign_wattle_books')).toHaveLength(before);
  });

  it('keeps the first finish date', () => {
    finishCampaign('campaign_wattle_books');
    const first = findCampaignById('campaign_wattle_books')!.finishedAt;
    finishCampaign('campaign_wattle_books');
    expect(findCampaignById('campaign_wattle_books')!.finishedAt).toBe(first);
  });
});

describe('leaderboardForCampaign', () => {
  it('ranks promoters by what came through their link', () => {
    const rows = leaderboardForCampaign('campaign_wattle_books');
    expect(rows[0].promoter.name).toBe('Maya Patel');
    expect(rows[0].total).toBe(75);
    expect(rows[0].giftCount).toBe(2);
    expect(rows[1].promoter.name).toBe('Chris Nguyen');
  });

  it('breaks a tie on amount by number of gifts', () => {
    // Maya has $75 from 2 gifts; two more $25 gifts give Chris $75 from 3.
    addGift('campaign_wattle_books', 'A', 25, 0, 'promoter_wattle_chris');
    addGift('campaign_wattle_books', 'B', 25, 0, 'promoter_wattle_chris');
    const [first, second] = leaderboardForCampaign('campaign_wattle_books');
    expect(first.total).toBe(75);
    expect(second.total).toBe(75);
    expect(first.promoter.name).toBe('Chris Nguyen');
  });
});

describe('ensurePromotersSeeded', () => {
  it('fills up to ten promoters without duplicating names', () => {
    ensurePromotersSeeded('campaign_wattle_books');
    const names = promotersForCampaign('campaign_wattle_books').map((p) => p.name);
    expect(names).toHaveLength(10);
    expect(new Set(names).size).toBe(10);
  });
});

describe('cross-tab sync', () => {
  it('picks up a save made in another tab', () => {
    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY)!);
    stored.campaigns = stored.campaigns.map((c: { id: string }) =>
      c.id === 'campaign_wattle_books' ? { ...c, title: 'Changed elsewhere' } : c,
    );
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    handleStorageEvent({ key: STORAGE_KEY });
    expect(findCampaignById('campaign_wattle_books')!.title).toBe('Changed elsewhere');
  });

  it('fills in fields older saves are missing', () => {
    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY)!);
    stored.campaigns = stored.campaigns.map((c: Record<string, unknown>) => {
      const copy = { ...c };
      delete copy.finishedAt;
      return copy;
    });
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    handleStorageEvent({ key: STORAGE_KEY });
    expect(findCampaignById('campaign_wattle_books')!.finishedAt).toBe('');
  });

  it('ignores other storage keys', () => {
    updateCampaign('campaign_wattle_books', { title: 'Kept' });
    window.localStorage.setItem('something-else', '1');
    handleStorageEvent({ key: 'something-else' });
    expect(findCampaignById('campaign_wattle_books')!.title).toBe('Kept');
  });
});

describe('seed data', () => {
  it('starts with Wattle Primary running two fundraisers', () => {
    const school = getDefaultSchool()!;
    expect(school.slug).toBe('wattle-primary');
    expect(campaignsForSchool(school.id)).toHaveLength(2);
  });
});
