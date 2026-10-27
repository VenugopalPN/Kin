import { Link } from 'react-router-dom';
import './DoorsPage.css';
import './LandingPage.css';

export function LandingPage() {
  return (
    <div className="app-field doors-field">
      <div className="doors-intro">
        <h1 className="doors-brand brand-mark">Kin</h1>
        <p className="doors-tagline">
          Kin is a fundraising platform: build a branded website, launch a campaign, recruit promoters, and let
          anyone give. Choose how you're running it.
        </p>
      </div>
      <div className="landing-grid">
        <Link to="/doors" className="door-card door-ink landing-card">
          <h2 className="door-title">SaaS</h2>
          <p className="door-sentence">Platform, campaign, promoter, and donor.</p>
        </Link>
        <Link to="/doors?mode=licensed" className="door-card door-cream landing-card">
          <h2 className="door-title">Licensed</h2>
          <p className="door-sentence">See the campaign, promoter, and donor experience, platform setup hidden.</p>
        </Link>
      </div>
    </div>
  );
}
