import { TapUnitsGame } from './TapUnitsGame.tsx';

export interface GamePlayProps {
  onDone: (amount: number, units: number) => void;
  onSkip: () => void;
}

export function StarsGame({ onDone, onSkip }: GamePlayProps) {
  return (
    <TapUnitsGame
      intro="Add a star for every $5 you'd like to give."
      glyph="★"
      unitLabel="star"
      groupLabel="Tap stars to add to your gift"
      onDone={onDone}
      onSkip={onSkip}
    />
  );
}

export function HeartsGame({ onDone, onSkip }: GamePlayProps) {
  return (
    <TapUnitsGame
      intro="Add a heart for every $5 you'd like to give."
      glyph="♥"
      unitLabel="heart"
      groupLabel="Tap hearts to add to your gift"
      onDone={onDone}
      onSkip={onSkip}
    />
  );
}

export function BalloonsGame({ onDone, onSkip }: GamePlayProps) {
  return (
    <TapUnitsGame
      intro="Pop a balloon for every $5 you'd like to give."
      glyph="●"
      unitLabel="balloon"
      mode="toggle"
      groupLabel="Tap balloons to pop them and add to your gift"
      onDone={onDone}
      onSkip={onSkip}
    />
  );
}
