import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="app-field">
      <div className="sheet-stack">
        <div className="sheet" style={{ textAlign: 'center' }}>
          <h1 style={{ marginBottom: '1rem' }}>We can't find that page</h1>
          <p className="muted" style={{ marginBottom: '1.5rem' }}>
            It may belong to a website that hasn't been created on this computer yet.
          </p>
          <Link to="/" className="big-button primary">
            Back to Kin
          </Link>
        </div>
      </div>
    </div>
  );
}
