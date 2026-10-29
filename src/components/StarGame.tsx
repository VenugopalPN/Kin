import { StarsGame } from './DonorGames.tsx';

interface StarGameProps {
  onDone: (amount: number, stars: number) => void;
  onSkip: () => void;
}

/** Thin wrapper kept for any direct imports; the catalog uses StarsGame. */
export function StarGame({ onDone, onSkip }: StarGameProps) {
  return <StarsGame onDone={onDone} onSkip={onSkip} />;
}
