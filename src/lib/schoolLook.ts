import type { CSSProperties } from 'react';
import { appPath } from './publicUrl.ts';
import type { School } from '../types.ts';

export const DEFAULT_ACCENT = '#a4423f';
const DEFAULT_BANNER = '/cover.jpg';

export function schoolLook(school: Pick<School, 'accentColor' | 'bannerImage'>): CSSProperties {
  const accent = /^#[0-9a-fA-F]{6}$/.test(school.accentColor || '') ? school.accentColor : DEFAULT_ACCENT;
  const chosen = school.bannerImage?.trim() || DEFAULT_BANNER;
  const image = chosen.startsWith('/') && !chosen.startsWith('//') ? appPath(chosen) : chosen;
  return {
    '--accent': accent,
    '--banner': `url("${image.replace(/"/g, '%22')}")`,
  } as CSSProperties;
}
