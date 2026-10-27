import { useEffect } from 'react';
import type { Gift } from '../types.ts';
import { formatMoney } from '../lib/format.ts';
import { ThankYouWall } from './ThankYouWall.tsx';
import './FullScreenWall.css';

interface FullScreenWallProps {
  schoolName: string;
  gifts: Gift[];
  hideAmounts: boolean;
  onClose: () => void;
}

export function FullScreenWall({ schoolName, gifts, hideAmounts, onClose }: FullScreenWallProps) {
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const top = [...gifts].sort((a, b) => b.amount - a.amount)[0];

  return (
    <div className="full-wall">
      <button type="button" className="full-wall-close" onClick={onClose} aria-label="Close">
        Close
      </button>
      <p className="full-wall-school">{schoolName}</p>
      {top && (
        <div className="full-wall-hero" key={top.id}>
          <p className="full-wall-hero-name">{top.donorFirstName}</p>
          {!hideAmounts && <p className="full-wall-hero-amount">{formatMoney(top.amount)}</p>}
        </div>
      )}
      <div className="full-wall-list">
        <ThankYouWall gifts={gifts} hideAmounts={hideAmounts} compact />
      </div>
    </div>
  );
}
