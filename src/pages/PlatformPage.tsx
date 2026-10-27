import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Tracker } from '../components/Tracker.tsx';
import { ResetDemoButton } from '../components/ResetDemoButton.tsx';
import { WebsiteChat } from '../components/WebsiteChat.tsx';
import { useKinData, createSchool } from '../lib/store.ts';
import { schoolLook } from '../lib/schoolLook.ts';
import { absoluteAppUrl } from '../lib/publicUrl.ts';
import { emptyDraft, type ChatDraft } from '../lib/websiteChat.ts';
import type { School } from '../types.ts';
import './PlatformPage.css';

export function PlatformPage() {
  const data = useKinData();
  const [draft, setDraft] = useState<ChatDraft>(emptyDraft);
  const [chatKey, setChatKey] = useState(0);
  const [sent, setSent] = useState<School | null>(null);

  function handleDone() {
    setSent(null);
    setDraft(emptyDraft());
    setChatKey((current) => current + 1);
  }

  return (
    <div className="app-field platform-page">
      <Tracker label="Create a website" description="You are creating a website." />

      <div className="platform-preview-strip" style={schoolLook({ accentColor: draft.accentColor, bannerImage: draft.bannerImage })}>
        <div className="website-preview-photo" aria-hidden="true" />
        <div className="site-name-row">
          {draft.logoImage && <img className="site-logo" src={draft.logoImage} alt="" />}
          <div>
            <p className="website-preview-name">{draft.name.trim() || 'Your name'}</p>
            <p className="muted website-preview-line">
              {draft.place.trim() || 'Place'} · {draft.welcomeLine.trim() || 'A welcome line appears here once you write it.'}
            </p>
          </div>
        </div>
      </div>

      <div className="platform-main">
        {sent ? (
          <CredentialEmail school={sent} onDone={handleDone} />
        ) : (
          <WebsiteChat
            key={chatKey}
            mode="create"
            heading={
              <>
                <span className="accent">Create </span>a website
              </>
            }
            confirmLabel="Create the website"
            showDemo
            onDraftChange={setDraft}
            onComplete={(next) => {
              const school = createSchool(next.name, next.place, next);
              setDraft({
                name: school.name,
                place: school.suburb,
                welcomeLine: school.welcomeLine,
                accentColor: school.accentColor,
                contactEmail: school.contactEmail,
                bannerImage: school.bannerImage,
                logoImage: school.logoImage,
              });
              setSent(school);
            }}
          />
        )}

        {data.schools.length > 0 && (
          <section className="platform-schools">
            <h2>
              Websites <span className="accent">on this computer</span>
            </h2>
            <ul className="platform-tiles">
              {data.schools.map((school) => (
                <li key={school.id}>
                  <Link to={`/s/${school.slug}/admin`} className="platform-tile">
                    <span className="platform-tile-photo" style={schoolLook(school)} aria-hidden="true" />
                    <span className="platform-tile-name">{school.name}</span>
                    <span className="platform-tile-suburb">{school.suburb || 'No place given'}</span>
                    <span className="platform-tile-link">Website</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      <ResetDemoButton />
    </div>
  );
}

function CredentialEmail({ school, onDone }: { school: School; onDone: () => void }) {
  const website = absoluteAppUrl(`/s/${school.slug}`);
  const signIn = `${website}/login`;
  const addressedTo = school.contactEmail.trim();

  return (
    <section className="credential-email">
      <p className="credential-kicker">
        <span className="demo-fill-badge">Demo</span>
      </p>
      <h2>
        <span className="accent">Email </span>for the org admin
      </h2>
      <p className="muted">
        {addressedTo
          ? `This message was not really emailed to ${addressedTo}.`
          : 'No contact email was given. This message was not really emailed.'}
      </p>
      <p className="credential-to">To: {addressedTo || 'No contact email was given'}</p>
      <dl className="credential-list">
        <div>
          <dt>Website</dt>
          <dd>{website}</dd>
        </div>
        <div>
          <dt>Sign in</dt>
          <dd>{signIn}</dd>
        </div>
        <div>
          <dt>Username</dt>
          <dd>{school.adminUsername}</dd>
        </div>
        <div>
          <dt>Password</dt>
          <dd>{school.adminPassword}</dd>
        </div>
      </dl>
      <button type="button" className="ribbon" onClick={onDone}>
        Done
      </button>
    </section>
  );
}
