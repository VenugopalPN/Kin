import type { ReactNode } from 'react';
import './HeroBanner.css';

interface HeroBannerProps {
  schoolName: string;
  suburb?: string;
  title: string;
  line?: string;
  action?: ReactNode;
  compact?: boolean;
}

export function HeroBanner({ schoolName, suburb, title, line, action, compact }: HeroBannerProps) {
  return (
    <div className={compact ? 'hero hero-compact' : 'hero'}>
      <div className="hero-copy">
        <p className="hero-kicker">{schoolName}</p>
        <h1 className="hero-title">{title}</h1>
        {suburb ? <p className="hero-suburb">{suburb}</p> : null}
        {line ? <p className="hero-line">{line}</p> : null}
        {action}
      </div>
    </div>
  );
}
