import type { ReactNode } from 'react';
import './Tracker.css';

interface TrackerProps {
  label: string;
  description: string;
  action?: ReactNode;
}

/** The thin brand bar at the top of every page: a label, a sentence, and one optional action. */
export function Tracker({ label, description, action }: TrackerProps) {
  return (
    <div className="tracker">
      <span className="tracker-brand brand-mark">Kin</span>
      <span className="tracker-step tracker-step-active">{label}</span>
      <p className="tracker-sentence">{description}</p>
      {action && <div className="tracker-action">{action}</div>}
    </div>
  );
}
