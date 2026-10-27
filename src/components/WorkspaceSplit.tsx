import type { ReactNode } from 'react';
import './WorkspaceSplit.css';

interface WorkspaceSplitProps {
  work: ReactNode;
  preview: ReactNode;
  workLabel?: string;
  previewLabel?: string;
  caption?: string;
}

export function WorkspaceSplit({
  work,
  preview,
  workLabel = 'Work',
  previewLabel = 'Preview',
  caption = 'Changes save automatically on this device.',
}: WorkspaceSplitProps) {
  return (
    <div className="split">
      <section className="split-pane">
        <p className="split-label">{workLabel}</p>
        <div className="split-card">{work}</div>
        {caption ? <p className="split-caption">{caption}</p> : null}
      </section>
      <section className="split-pane">
        <p className="split-label">{previewLabel}</p>
        <div className="split-card split-card-preview">{preview}</div>
      </section>
    </div>
  );
}
