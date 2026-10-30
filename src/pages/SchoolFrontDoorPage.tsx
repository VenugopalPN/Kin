import { Link, useParams } from 'react-router-dom';
import { Tracker } from '../components/Tracker.tsx';
import { ResetDemoButton } from '../components/ResetDemoButton.tsx';
import { ProgressBar } from '../components/ProgressBar.tsx';
import { useKinData, findSchoolBySlug, campaignsForSchool, giftsForCampaign, isFinished } from '../lib/store.ts';
import '../components/FinishedNotice.css';
import { schoolLook } from '../lib/schoolLook.ts';
import { formatMoney } from '../lib/format.ts';
import { NotFoundPage } from './NotFoundPage.tsx';
import './SchoolFrontDoorPage.css';

export function SchoolFrontDoorPage() {
  useKinData();
  const { schoolSlug = '' } = useParams();
  const school = findSchoolBySlug(schoolSlug);

  if (!school) return <NotFoundPage />;

  const all = campaignsForSchool(school.id);
  // A running fundraiser always leads; finished ones follow, newest first.
  const campaigns = [...all.filter((c) => !isFinished(c)), ...all.filter(isFinished)];
  const [campaign, ...others] = campaigns;
  const heroOpen = campaign ? !isFinished(campaign) : false;
  const gifts = campaign ? giftsForCampaign(campaign.id) : [];
  const raised = gifts.reduce((sum, g) => sum + g.amount, 0);

  return (
    <div className="app-field front-page" style={schoolLook(school)}>
      <Tracker
        label="Generic page"
        description="This is the public page."
        action={
          heroOpen && (
            <Link to={`/s/${school.slug}/give/${campaign.id}`} className="pill-outline">
              Give
            </Link>
          )
        }
      />

      <section className="front-hero">
        <div className="framed-photo-wrap">
          <div className="framed-photo-panel" aria-hidden="true" />
          <div className="framed-photo-img" aria-hidden="true" />
        </div>
        <div className="front-hero-copy">
          <div className="site-name-row">
            {school.logoImage && <img className="site-logo" src={school.logoImage} alt="" />}
            <p className="front-hero-kicker">
              {school.name}
              {school.suburb ? ` · ${school.suburb}` : ''}
            </p>
          </div>
          {school.welcomeLine.trim() && <p className="front-welcome">{school.welcomeLine}</p>}

          {campaign ? (
            <>
              <h1 className="front-hero-title">{campaign.title}</h1>
              <div className="front-give-box">
                <p className="kicker">Raised so far</p>
                <p className="front-give-total">
                  {formatMoney(raised)} <span>of {formatMoney(campaign.goal)}</span>
                </p>
                <ProgressBar raised={raised} goal={campaign.goal} />
                <p className="muted front-give-donors">{gifts.length} donors</p>
                {heroOpen ? (
                  <Link to={`/s/${school.slug}/give/${campaign.id}`} className="ribbon front-give-cta">
                    Give now
                  </Link>
                ) : (
                  <p className="finished-label">Finished. Thank you to everyone who gave.</p>
                )}
              </div>
            </>
          ) : (
            <>
              <h1 className="front-hero-title">A fundraiser is on the way</h1>
              <Link to={`/s/${school.slug}/admin`} className="ribbon front-give-cta">
                Start the fundraiser
              </Link>
            </>
          )}
        </div>
      </section>

      <section className="front-mission">
        <h2>
          <span className="accent">Our goal: </span>
          {campaign ? campaign.title : 'A fundraiser, when you are ready'}
        </h2>
        <div>
          <p>{campaign ? campaign.letterBody : `${school.name} has not started one yet.`}</p>
          <Link to={`/s/${school.slug}/admin`} className="front-manage">
            Manage
          </Link>
        </div>
      </section>

      {others.length > 0 && (
        <section className="front-also">
          <h2 className="front-also-title">
            {others.some(isFinished) ? (
              <>
                Our other <span className="accent">fundraisers</span>
              </>
            ) : (
              <>
                Also raising <span className="accent">right now</span>
              </>
            )}
          </h2>
          <ul className="front-also-list">
            {others.map((other) => {
              const otherRaised = giftsForCampaign(other.id).reduce((sum, g) => sum + g.amount, 0);
              return (
                <li key={other.id} className="front-also-card">
                  <div className="front-also-photo" aria-hidden="true" />
                  <div className="front-also-body">
                    <span className="front-also-name">{other.title}</span>
                    <p className="front-also-meta">
                      {formatMoney(otherRaised)} of {formatMoney(other.goal)}
                    </p>
                    {isFinished(other) ? (
                      <span className="finished-label">Finished</span>
                    ) : (
                      <Link to={`/s/${school.slug}/give/${other.id}`} className="big-button ghost front-also-give">
                        Give
                      </Link>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {campaign && (
        <section className="front-quote">
          <div>
            <h2>
              A note from <span className="accent">{campaign.childFirstName}</span>
            </h2>
            <p>{campaign.letterBody}</p>
          </div>
        </section>
      )}

      <footer className="front-footer">
        <span className="front-footer-brand brand-mark">Kin</span>
        <span>
          {school.name}
          {school.contactEmail.trim() && (
            <>
              {' · '}
              <a href={`mailto:${school.contactEmail}`}>{school.contactEmail}</a>
            </>
          )}
        </span>
      </footer>

      <ResetDemoButton />
    </div>
  );
}
