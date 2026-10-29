import { useState } from 'react';
import './TapUnitsGame.css';

export interface TapUnitsGameProps {
  intro: string;
  glyph: string;
  unitLabel: string;
  unitValue?: number;
  unitCount?: number;
  /** fill = light from the left; toggle = each unit pops independently */
  mode?: 'fill' | 'toggle';
  groupLabel: string;
  onDone: (amount: number, units: number) => void;
  onSkip: () => void;
}

const DEFAULT_COUNT = 5;
const DEFAULT_VALUE = 5;

export function TapUnitsGame({
  intro,
  glyph,
  unitLabel,
  unitValue = DEFAULT_VALUE,
  unitCount = DEFAULT_COUNT,
  mode = 'fill',
  groupLabel,
  onDone,
  onSkip,
}: TapUnitsGameProps) {
  const [lit, setLit] = useState(0);
  const [popped, setPopped] = useState<boolean[]>(() => Array.from({ length: unitCount }, () => false));

  const units = mode === 'fill' ? lit : popped.filter(Boolean).length;
  const amount = units * unitValue;
  const plural = units === 1 ? unitLabel : `${unitLabel}s`;

  function handleFillTap(index: number) {
    setLit(index + 1 === lit ? index : index + 1);
  }

  function handleToggleTap(index: number) {
    setPopped((prev) => prev.map((on, i) => (i === index ? !on : on)));
  }

  return (
    <div className="tap-units-game">
      <p className="tap-units-intro">{intro}</p>
      <div className="tap-units-row" role="group" aria-label={groupLabel}>
        {Array.from({ length: unitCount }, (_, index) => {
          const active = mode === 'fill' ? index < lit : popped[index];
          return (
            <button
              key={index}
              type="button"
              className={active ? 'tap-unit tap-unit-lit' : 'tap-unit'}
              aria-pressed={active}
              aria-label={`${unitLabel} ${index + 1}`}
              onClick={() => (mode === 'fill' ? handleFillTap(index) : handleToggleTap(index))}
            >
              {glyph}
            </button>
          );
        })}
      </div>
      <p className="tap-units-total">
        {units === 0 ? `No ${unitLabel}s yet` : `${units} ${plural} — $${amount}`}
      </p>
      <div className="tap-units-actions">
        <button
          type="button"
          className="big-button primary"
          disabled={units === 0}
          onClick={() => onDone(amount, units)}
        >
          Add ${amount} and continue
        </button>
        <button type="button" className="link-button" onClick={onSkip}>
          Skip
        </button>
      </div>
    </div>
  );
}
