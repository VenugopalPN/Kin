import type { CSSProperties } from 'react';
import type { School } from '../types.ts';

export const DEFAULT_ACCENT = '#c1595a';
const DEFAULT_BANNER = '/cover.jpg';

export function schoolLook(school: Pick<School, 'accentColor' | 'bannerImage'>): CSSProperties {
  const accent = /^#[0-9a-fA-F]{6}$/.test(school.accentColor || '') ? school.accentColor : DEFAULT_ACCENT;
  const image = school.bannerImage?.trim() || DEFAULT_BANNER;
  return {
    '--accent': accent,
    '--banner': `url("${image.replace(/"/g, '%22')}")`,
  } as CSSProperties;
}
