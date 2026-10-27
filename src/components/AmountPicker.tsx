import type { AmountTier } from '../types.ts';
import './AmountPicker.css';

interface AmountPickerProps {
  amounts: AmountTier[];
  selected: number;
  onSelect: (value: number) => void;
}

export function AmountPicker({ amounts, selected, onSelect }: AmountPickerProps) {
  return (
    <div className="amount-picker" role="radiogroup" aria-label="Choose an amount">
      {amounts.map((tier) => (
        <button
          key={tier.value}
          type="button"
          role="radio"
          aria-checked={selected === tier.value}
          className={selected === tier.value ? 'amount-option amount-option-selected' : 'amount-option'}
          onClick={() => onSelect(tier.value)}
        >
          {tier.label}
        </button>
      ))}
    </div>
  );
}
