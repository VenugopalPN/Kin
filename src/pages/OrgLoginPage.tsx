import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { Tracker } from '../components/Tracker.tsx';
import { ResetDemoButton } from '../components/ResetDemoButton.tsx';
import { useKinData, findSchoolBySlug, loginOrgAdmin, orgAdminSession } from '../lib/store.ts';
import { schoolLook } from '../lib/schoolLook.ts';
import { NotFoundPage } from './NotFoundPage.tsx';
import './OrgLoginPage.css';

export function OrgLoginPage() {
  useKinData();
  const { schoolSlug = '' } = useParams();
  const navigate = useNavigate();
  const school = findSchoolBySlug(schoolSlug);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  if (!school) return <NotFoundPage />;
  if (orgAdminSession(school.id)) {
    return <Navigate to={`/s/${school.slug}/admin`} replace />;
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!school || !loginOrgAdmin(school.slug)) return;
    navigate(`/s/${school.slug}/admin`);
  }

  return (
    <div className="app-field org-login-page" style={schoolLook(school)}>
      <Tracker label="Sign in" description="You are signing in as the org admin." />
      <div className="sheet-stack">
        <section className="sheet org-login-sheet">
          <div className="site-name-row">
            {school.logoImage && <img className="site-logo" src={school.logoImage} alt="" />}
            <p className="org-login-school">{school.name}</p>
          </div>
          <h1>
            <span className="accent">Sign </span>in
          </h1>
          <form onSubmit={handleSubmit} className="admin-question-form">
            <label className="field-label" htmlFor="org-username">
              Username
            </label>
            <input
              id="org-username"
              className="text-input"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
            />
            <label className="field-label" htmlFor="org-password">
              Password
            </label>
            <input
              id="org-password"
              className="text-input"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
            />
            <button type="submit" className="ribbon org-login-submit">
              Sign in
            </button>
          </form>
          <button
            type="button"
            className="demo-fill"
            onClick={() => {
              setUsername(school.adminUsername);
              setPassword(school.adminPassword);
            }}
          >
            <span className="demo-fill-badge">Demo</span>
            Fill demo values
          </button>
        </section>
      </div>
      <ResetDemoButton />
    </div>
  );
}
