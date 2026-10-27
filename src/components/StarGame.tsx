import { useState } from 'react';
import './StarGame.css';

interface StarGameProps {
  onDone: (amount: number, stars: number) => void;
  onSkip: () => void;
}

const STAR_COUNT = 5;
const STAR_VALUE = 5;

export function StarGame({ onDone, onSkip }: StarGameProps) {
  const [lit, setLit] = useState(0);

  function toggleStar(index: number) {
    // Tapping a star lights it (and every star before it), like filling a row.
    setLit(index + 1 === lit ? index : index + 1);
  }

  return (
    <div className="star-game">
      <p className="star-game-intro">Add a star for every $5 you'd like to give.</p>
      <div className="star-sky" role="group" aria-label="Tap stars to add to your gift">
        {Array.from({ length: STAR_COUNT }, (_, index) => (
          <button
            key={index}
            type="button"
            className={index < lit ? 'star star-lit' : 'star'}
            aria-pressed={index < lit}
            aria-label={`Star ${index + 1}`}
            onClick={() => toggleStar(index)}
          >
            ★
          </button>
        ))}
      </div>
      <p className="star-game-total">
        {lit === 0 ? 'No stars yet' : `${lit} star${lit === 1 ? '' : 's'} — $${lit * STAR_VALUE}`}
      </p>
      <div className="star-game-actions">
        <button
          type="button"
          className="big-button primary"
          disabled={lit === 0}
          onClick={() => onDone(lit * STAR_VALUE, lit)}
        >
          Add ${lit * STAR_VALUE} and continue
        </button>
        <button type="button" className="link-button" onClick={onSkip}>
          Skip
        </button>
      </div>
    </div>
  );
}
