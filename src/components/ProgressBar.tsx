import './ProgressBar.css';

interface ProgressBarProps {
  raised: number;
  goal: number;
}

/** A slim flat line showing how close a fundraiser is to its goal. */
export function ProgressBar({ raised, goal }: ProgressBarProps) {
  const ratio = goal > 0 ? Math.min(1, raised / goal) : 0;
  const percent = Math.round(ratio * 100);

  return (
    <div className="progress-bar" role="img" aria-label={`${percent}% of the goal raised`}>
      <div className="progress-bar-fill" style={{ width: `${percent}%` }} />
    </div>
  );
}
