import type { ComponentType } from 'react';
import {
  BalloonsGame,
  HeartsGame,
  StarsGame,
  type GamePlayProps,
} from '../components/DonorGames.tsx';

export type { GamePlayProps };

export interface GameDefinition {
  id: string;
  name: string;
  blurb: string;
  unitLabel: string;
  Component: ComponentType<GamePlayProps>;
}

/** Built-in catalog. Add a fourth game later with a new component + one row here. */
export const GAME_CATALOG: GameDefinition[] = [
  {
    id: 'stars',
    name: 'Add a star',
    blurb: 'A few large taps — $5 a star.',
    unitLabel: 'star',
    Component: StarsGame,
  },
  {
    id: 'hearts',
    name: 'Add a heart',
    blurb: 'Same light taps — $5 a heart.',
    unitLabel: 'heart',
    Component: HeartsGame,
  },
  {
    id: 'balloons',
    name: 'Pop a balloon',
    blurb: 'Pop up to five balloons — $5 each.',
    unitLabel: 'balloon',
    Component: BalloonsGame,
  },
];

export function findGame(gameId: string | null | undefined): GameDefinition | undefined {
  if (!gameId) return undefined;
  return GAME_CATALOG.find((game) => game.id === gameId);
}
