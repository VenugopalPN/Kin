import { useSyncExternalStore } from 'react';
import type { Campaign, Gift, KinData, Promoter, School } from '../types.ts';
import { buildSeedData } from './seed.ts';
import { newId, slugify } from './id.ts';
import type { DraftCampaign } from './ai.ts';

const STORAGE_KEY = 'kin-demo-v1';

const SESSION_KEY = 'kin-org-admin';

export function credentialsForSlug(slug: string) {
  return { adminUsername: slug, adminPassword: `kin-${slug}` };
}

function normalizeSchool(school: School): School {
  const credentials = credentialsForSlug(school.slug);
  return {
    ...school,
    welcomeLine: school.welcomeLine ?? '',
    accentColor: school.accentColor ?? '',
    contactEmail: school.contactEmail ?? '',
    bannerImage: school.bannerImage ?? '',
    logoImage: school.logoImage ?? '',
    adminUsername: school.adminUsername || credentials.adminUsername,
    adminPassword: school.adminPassword || credentials.adminPassword,
  };
}

function load(): KinData {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return buildSeedData();
    const parsed = JSON.parse(raw) as KinData;
    if (!parsed.schools || !parsed.campaigns || !parsed.gifts) return buildSeedData();
    return {
      ...parsed,
      schools: parsed.schools.map(normalizeSchool),
      gifts: parsed.gifts.map((gift) => ({ ...gift, promoterId: gift.promoterId ?? '' })),
      promoters: parsed.promoters ?? [],
    };
  } catch {
    return buildSeedData();
  }
}

let data: KinData = load();
const listeners = new Set<() => void>();

function persist() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Storage can fail (private browsing, quota). The demo still works in memory.
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): KinData {
  return data;
}

export function useKinData(): KinData {
  return useSyncExternalStore(subscribe, getSnapshot);
}

export function findSchoolBySlug(slug: string): School | undefined {
  return data.schools.find((s) => s.slug === slug);
}

/** The school every generic link (doors, platform header) points to until the demo picks another one. */
export function getDefaultSchool(): School | undefined {
  return data.schools[0];
}

/** The default campaign for generic links (Tracker fallback, doors) when a specific one isn't known. */
export function campaignForSchool(schoolId: string): Campaign | undefined {
  return data.campaigns.find((c) => c.schoolId === schoolId);
}

/** Every campaign a school is running, most recently published first. A school can run several at once. */
export function campaignsForSchool(schoolId: string): Campaign[] {
  return data.campaigns
    .filter((c) => c.schoolId === schoolId)
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
}

export function findCampaignById(campaignId: string): Campaign | undefined {
  return data.campaigns.find((c) => c.id === campaignId);
}

export function giftsForCampaign(campaignId: string): Gift[] {
  return data.gifts
    .filter((g) => g.campaignId === campaignId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export type SchoolSetup = Pick<School, 'welcomeLine' | 'accentColor' | 'contactEmail' | 'bannerImage' | 'logoImage'>;

export function createSchool(name: string, suburb: string, setup: Partial<SchoolSetup> = {}): School {
  const baseSlug = slugify(name);
  let slug = baseSlug;
  let n = 2;
  while (data.schools.some((s) => s.slug === slug)) {
    slug = `${baseSlug}-${n}`;
    n += 1;
  }
  const school: School = {
    id: newId('school'),
    slug,
    name: name.trim() || 'New school',
    suburb: suburb.trim(),
    createdAt: new Date().toISOString(),
    welcomeLine: setup.welcomeLine?.trim() ?? '',
    accentColor: setup.accentColor?.trim() ?? '',
    contactEmail: setup.contactEmail?.trim() ?? '',
    bannerImage: setup.bannerImage ?? '',
    logoImage: setup.logoImage ?? '',
    ...credentialsForSlug(slug),
  };
  data = { ...data, schools: [...data.schools, school] };
  persist();
  return school;
}

export function updateSchool(
  schoolId: string,
  patch: Partial<SchoolSetup> & { name?: string; suburb?: string },
) {
  data = {
    ...data,
    schools: data.schools.map((school) => {
      if (school.id !== schoolId) return school;
      const next = normalizeSchool(school);
      if (patch.name !== undefined && patch.name.trim()) next.name = patch.name.trim();
      if (patch.suburb !== undefined) next.suburb = patch.suburb.trim();
      if (patch.welcomeLine !== undefined) next.welcomeLine = patch.welcomeLine.trim();
      if (patch.accentColor !== undefined) next.accentColor = patch.accentColor.trim();
      if (patch.contactEmail !== undefined) next.contactEmail = patch.contactEmail.trim();
      if (patch.bannerImage !== undefined) next.bannerImage = patch.bannerImage;
      if (patch.logoImage !== undefined) next.logoImage = patch.logoImage;
      return next;
    }),
  };
  persist();
}

export function loginOrgAdmin(slug: string): boolean {
  const school = findSchoolBySlug(slug);
  if (!school) return false;
  sessionStorage.setItem(SESSION_KEY, school.id);
  return true;
}

export function orgAdminSession(schoolId: string): boolean {
  return sessionStorage.getItem(SESSION_KEY) === schoolId;
}

export function logoutOrgAdmin() {
  sessionStorage.removeItem(SESSION_KEY);
}

export function publishCampaign(school: School, cause: string, draft: DraftCampaign): Campaign {
  const campaign: Campaign = {
    id: newId('campaign'),
    schoolId: school.id,
    cause: cause.trim(),
    title: draft.title,
    letterBody: draft.letterBody,
    goal: draft.goal,
    endDate: draft.endDate,
    amounts: draft.amounts,
    hideAmounts: false,
    matchingSentence: draft.matchingSentence,
    childFirstName: 'your child',
    greetingName: 'Aunty June',
    thankYouLine: draft.thankYouLine,
    publishedAt: new Date().toISOString(),
  };
  data = { ...data, campaigns: [...data.campaigns, campaign] };
  persist();
  return campaign;
}

export function updateCampaign(campaignId: string, patch: Partial<Campaign>) {
  data = {
    ...data,
    campaigns: data.campaigns.map((c) => (c.id === campaignId ? { ...c, ...patch } : c)),
  };
  persist();
}

export function addGift(
  campaignId: string,
  donorFirstName: string,
  amount: number,
  stars: number,
  promoterId = '',
): Gift {
  const gift: Gift = {
    id: newId('gift'),
    campaignId,
    donorFirstName: donorFirstName.trim() || 'A friend',
    amount,
    stars,
    createdAt: new Date().toISOString(),
    promoterId: data.promoters.some((p) => p.id === promoterId && p.campaignId === campaignId) ? promoterId : '',
  };
  data = { ...data, gifts: [...data.gifts, gift] };
  persist();
  return gift;
}

export const MAX_PROMOTERS = 10;

const DEMO_PROMOTER_NAMES = [
  'Maya Patel',
  'Chris Nguyen',
  'Elena Rossi',
  'Jordan Blake',
  'Samira Khan',
  'Owen Clarke',
  'Hannah Brooks',
  'Luca Moretti',
  'Freya Walsh',
  'Noah Bennett',
];

/** Earlier demo builds stored family names. Rename only those exact names. */
const OLD_DEMO_PROMOTER_NAMES: Record<string, string> = {
  'Aunty June': 'Maya Patel',
  'Uncle Sam': 'Chris Nguyen',
  'Nana Lee': 'Elena Rossi',
  'Grandpa Tom': 'Jordan Blake',
  'Aunty Priya': 'Samira Khan',
  'Uncle Alex': 'Owen Clarke',
  'Nana Kim': 'Hannah Brooks',
  'Grandpa Joe': 'Luca Moretti',
  'Aunty Mei': 'Freya Walsh',
  'Uncle Raj': 'Noah Bennett',
};

function migratePromoterNames(stored: KinData): KinData {
  let changed = false;
  const promoters = stored.promoters.map((promoter) => {
    const name = OLD_DEMO_PROMOTER_NAMES[promoter.name];
    if (!name) return promoter;
    changed = true;
    return { ...promoter, name };
  });
  return changed ? { ...stored, promoters } : stored;
}

const migrated = migratePromoterNames(data);
if (migrated !== data) {
  data = migrated;
  persist();
}

export function promotersForCampaign(campaignId: string): Promoter[] {
  return data.promoters.filter((p) => p.campaignId === campaignId);
}

export function findPromoterById(promoterId: string): Promoter | undefined {
  return data.promoters.find((p) => p.id === promoterId);
}

/** Fills a campaign up to ten promoter slots with demo names, keeping any it already has. */
export function ensurePromotersSeeded(campaignId: string) {
  const existing = promotersForCampaign(campaignId);
  if (existing.length >= MAX_PROMOTERS) return;
  const taken = new Set(existing.map((p) => p.name));
  const fresh: Promoter[] = DEMO_PROMOTER_NAMES.filter((name) => !taken.has(name))
    .slice(0, MAX_PROMOTERS - existing.length)
    .map((name) => ({ id: newId('promoter'), campaignId, name, sentAt: '' }));
  data = { ...data, promoters: [...data.promoters, ...fresh] };
  persist();
}

export function updatePromoterName(promoterId: string, name: string) {
  data = {
    ...data,
    promoters: data.promoters.map((p) => (p.id === promoterId ? { ...p, name } : p)),
  };
  persist();
}

export function markPromotersSent(campaignId: string, promoterIds: string[]) {
  const sentAt = new Date().toISOString();
  const ids = new Set(promoterIds);
  data = {
    ...data,
    promoters: data.promoters.map((p) => (p.campaignId === campaignId && ids.has(p.id) ? { ...p, sentAt } : p)),
  };
  persist();
}

export interface LeaderboardRow {
  promoter: Promoter;
  total: number;
  giftCount: number;
}

/** Every promoter on a campaign, ranked by what was given through their own link. */
export function leaderboardForCampaign(campaignId: string): LeaderboardRow[] {
  const gifts = data.gifts.filter((g) => g.campaignId === campaignId);
  return promotersForCampaign(campaignId)
    .map((promoter) => {
      const theirs = gifts.filter((g) => g.promoterId === promoter.id);
      return { promoter, total: theirs.reduce((sum, g) => sum + g.amount, 0), giftCount: theirs.length };
    })
    .sort((a, b) => b.total - a.total || b.giftCount - a.giftCount);
}

export function resetDemo() {
  data = buildSeedData();
  persist();
}
