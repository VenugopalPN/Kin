import type { Gift } from '../types.ts';
import { formatMoney } from '../lib/format.ts';
import './ThankYouWall.css';

interface ThankYouWallProps {
  gifts: Gift[];
  hideAmounts: boolean;
  highlightId?: string | null;
  compact?: boolean;
}

function sortGifts(gifts: Gift[]): Gift[] {
  return [...gifts].sort((a, b) => {
    if (b.amount !== a.amount) return b.amount - a.amount;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

export function ThankYouWall({ gifts, hideAmounts, highlightId, compact }: ThankYouWallProps) {
  const sorted = sortGifts(gifts);

  if (sorted.length === 0) {
    return (
      <div className={compact ? 'wall wall-compact' : 'wall'}>
        <h3 className="wall-title">Thank you</h3>
        <p className="muted">Be the first to give.</p>
      </div>
    );
  }

  return (
    <div className={compact ? 'wall wall-compact' : 'wall'}>
      <h3 className="wall-title">Thank you</h3>
      <ul className="wall-list">
        {sorted.map((gift, index) => (
          <li
            key={gift.id}
            className={
              'wall-row' +
              (index === 0 ? ' wall-row-top' : '') +
              (gift.id === highlightId ? ' wall-row-new' : '')
            }
          >
            <span className="wall-name">{gift.donorFirstName}</span>
            {!hideAmounts && <span className="wall-amount">{formatMoney(gift.amount)}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}
