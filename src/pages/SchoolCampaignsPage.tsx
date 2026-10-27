import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Tracker } from '../components/Tracker.tsx';
import { ResetDemoButton } from '../components/ResetDemoButton.tsx';
import { WebsiteChat } from '../components/WebsiteChat.tsx';
import { AdminSidebar } from '../components/AdminSidebar.tsx';
import { StatCard } from '../components/StatCard.tsx';
import { ProgressBar } from '../components/ProgressBar.tsx';
import {
  useKinData,
  findSchoolBySlug,
  campaignsForSchool,
  giftsForCampaign,
  publishCampaign,
  updateSchool,
  orgAdminSession,
} from '../lib/store.ts';
import { draftCampaignFromCause, type DraftCampaign } from '../lib/ai.ts';
import { schoolLook } from '../lib/schoolLook.ts';
import { formatMoney } from '../lib/format.ts';
import { emptyDraft, type ChatDraft } from '../lib/websiteChat.ts';
import type { AmountTier } from '../types.ts';
import { NotFoundPage } from './NotFoundPage.tsx';
import './SchoolAdminPage.css';

export function SchoolCampaignsPage() {
  useKinData();
  const { schoolSlug = '' } = useParams();
  const school = findSchoolBySlug(schoolSlug);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [cause, setCause] = useState('');
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editDraft, setEditDraft] = useState<ChatDraft>(emptyDraft);
  const [titleOverride, setTitleOverride] = useState<string | null>(null);
  const [letterOverride, setLetterOverride] = useState<string | null>(null);
  const [goalOverride, setGoalOverride] = useState<string | null>(null);
  const [amountsOverride, setAmountsOverride] = useState<AmountTier[] | null>(null);
  const autoDraft = useMemo(() => draftCampaignFromCause(cause, school?.name ?? ''), [cause, school?.name]);

  useEffect(() => {
    if (searchParams.get('section') === 'website' && school) {
      setEditDraft({
        name: school.name,
        place: school.suburb,
        welcomeLine: school.welcomeLine,
        accentColor: school.accentColor,
        contactEmail: school.contactEmail,
        bannerImage: school.bannerImage,
        logoImage: school.logoImage,
      });
      setEditing(true);
      setSearchParams({}, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, school?.id]);

  if (!school) return <NotFoundPage />;
  if (!orgAdminSession(school.id)) {
    return <Navigate to={`/s/${school.slug}/login`} replace />;
  }

  const campaigns = campaignsForSchool(school.id);
  const campaignGifts = campaigns.map((campaign) => giftsForCampaign(campaign.id));
  const totalRaised = campaignGifts.reduce((sum, gifts) => sum + gifts.reduce((s, g) => s + g.amount, 0), 0);
  const totalDonors = campaignGifts.reduce((sum, gifts) => sum + gifts.length, 0);

  const draft: DraftCampaign = {
    ...autoDraft,
    title: titleOverride ?? autoDraft.title,
    letterBody: letterOverride ?? autoDraft.letterBody,
    goal: goalOverride !== null && Number(goalOverride) > 0 ? Number(goalOverride) : autoDraft.goal,
    amounts: amountsOverride ?? autoDraft.amounts,
  };
  const goalInputValue = goalOverride ?? String(draft.goal);

  function handleCauseChange(value: string) {
    setCause(value);
    if (!value.trim()) {
      setTitleOverride(null);
      setLetterOverride(null);
      setGoalOverride(null);
      setAmountsOverride(null);
    }
  }

  function handleTierChange(index: number, patch: Partial<AmountTier>) {
    const next = draft.amounts.map((tier, i) => (i === index ? { ...tier, ...patch } : tier));
    setAmountsOverride(next);
  }

  function handleCancelCreate() {
    setCreating(false);
    setCause('');
    setTitleOverride(null);
    setLetterOverride(null);
    setGoalOverride(null);
    setAmountsOverride(null);
  }

  function handleCreate(event: FormEvent) {
    event.preventDefault();
    if (!cause.trim()) return;
    const finalDraft: DraftCampaign = {
      ...draft,
      title: draft.title.trim() || autoDraft.title,
      letterBody: draft.letterBody.trim() || autoDraft.letterBody,
      amounts: draft.amounts.map((tier, index) => {
        const value = tier.value > 0 ? tier.value : autoDraft.amounts[index].value;
        return { value, label: tier.label.trim() || `$${value}` };
      }),
    };
    const campaign = publishCampaign(school!, cause, finalDraft);
    navigate(`/s/${school!.slug}/admin/${campaign.id}`);
  }

  return (
    <div className="app-field admin-page" style={schoolLook(school)}>
      <Tracker label="Start the fundraiser" description="You are choosing which fundraiser to run." />

      <div className="admin-shell">
        <AdminSidebar schoolSlug={school.slug} schoolName={school.name} active={editing ? 'website' : 'dashboard'} />
        <div className="admin-shell-main">
          {editing ? (
            <>
              <div className="website-preview-strip" style={schoolLook({ accentColor: editDraft.accentColor, bannerImage: editDraft.bannerImage })}>
                <div className="website-preview-photo" aria-hidden="true" />
                <div className="site-name-row">
                  {editDraft.logoImage && <img className="site-logo" src={editDraft.logoImage} alt="" />}
                  <div>
                    <p className="website-preview-name">{editDraft.name.trim() || 'Your name'}</p>
                    <p className="muted website-preview-line">{editDraft.welcomeLine.trim() || 'A welcome line appears here once you write it.'}</p>
                  </div>
                </div>
              </div>
              <WebsiteChat
              key={school.id}
              mode="edit"
              initialDraft={editDraft}
              heading={
                <>
                  <span className="accent">Edit </span>website
                </>
              }
              confirmLabel="Save website"
              onDraftChange={setEditDraft}
              onCancel={() => setEditing(false)}
              onComplete={(next) => {
                updateSchool(school.id, {
                  name: next.name,
                  suburb: next.place,
                  welcomeLine: next.welcomeLine,
                  accentColor: next.accentColor,
                  contactEmail: next.contactEmail,
                  bannerImage: next.bannerImage,
                  logoImage: next.logoImage,
                });
                setEditing(false);
              }}
              />
            </>
          ) : (
            <>
              {!creating && (
                <section className="dashboard-section">
                  <div className="dashboard-head">
                    <h1>{campaigns.length > 0 ? 'Fundraisers running now' : 'No fundraisers yet'}</h1>
                    <button type="button" className="ribbon" onClick={() => setCreating(true)}>
                      Create a fundraiser
                    </button>
                  </div>

                  <div className="stat-row">
                    <StatCard label="Raised" value={formatMoney(totalRaised)} />
                    <StatCard label="Active fundraisers" value={String(campaigns.length)} />
                    <StatCard label="Donors" value={String(totalDonors)} />
                  </div>

                  {campaigns.length > 0 ? (
                    <ul className="list-tiles">
                      {campaigns.map((campaign) => {
                        const raised = giftsForCampaign(campaign.id).reduce((sum, g) => sum + g.amount, 0);
                        return (
                          <li key={campaign.id}>
                            <article className="list-tile">
                              <div className="list-tile-photo" aria-hidden="true" />
                              <div className="list-tile-body">
                                <p className="campaign-list-title">{campaign.title}</p>
                                <ProgressBar raised={raised} goal={campaign.goal} />
                                <p className="muted" style={{ margin: 0 }}>
                                  {formatMoney(raised)} raised of {formatMoney(campaign.goal)}
                                </p>
                                <Link className="big-button ghost campaign-manage-link" to={`/s/${school.slug}/admin/${campaign.id}`}>
                                  Manage
                                </Link>
                              </div>
                            </article>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <p className="muted">No fundraiser has been started yet.</p>
                  )}
                </section>
              )}

              {creating && (
                <>
                  <section className="list-create">
                    <h2>
                      <span className="accent">What </span>should the money buy?
                    </h2>
                    <form onSubmit={handleCreate} className="admin-question-form">
                      <p className="muted">
                        One answer is enough. Kin writes the letter, the amounts, and the goal for you — change
                        anything before you publish.
                      </p>
                      <input
                        className="text-input"
                        value={cause}
                        onChange={(e) => handleCauseChange(e.target.value)}
                        placeholder="Books for the library"
                        required
                        autoFocus
                      />
                      <div className="list-create-actions">
                        <button type="submit" className="ribbon list-write">
                          Write the fundraiser
                        </button>
                        <button type="button" className="link-button" onClick={handleCancelCreate}>
                          Cancel
                        </button>
                      </div>
                    </form>
                  </section>
                  <section className="list-draft">
                    <DraftPreview
                      cause={cause}
                      draft={draft}
                      goalInputValue={goalInputValue}
                      onTitleChange={setTitleOverride}
                      onLetterChange={setLetterOverride}
                      onGoalChange={setGoalOverride}
                      onTierChange={handleTierChange}
                    />
                  </section>
                </>
              )}
            </>
          )}
        </div>
      </div>

      <ResetDemoButton />
    </div>
  );
}

interface DraftPreviewProps {
  cause: string;
  draft: DraftCampaign;
  goalInputValue: string;
  onTitleChange: (value: string) => void;
  onLetterChange: (value: string) => void;
  onGoalChange: (value: string) => void;
  onTierChange: (index: number, patch: Partial<AmountTier>) => void;
}

function DraftPreview({
  cause,
  draft,
  goalInputValue,
  onTitleChange,
  onLetterChange,
  onGoalChange,
  onTierChange,
}: DraftPreviewProps) {
  if (!cause.trim()) {
    return <p className="draft-empty">Start typing. The fundraiser appears here.</p>;
  }
  return (
    <div className="draft-preview">
      <p className="draft-kicker">Written for you — change anything</p>

      <label className="field-label" htmlFor="draft-title">
        Title
      </label>
      <input
        id="draft-title"
        className="text-input draft-title-input"
        value={draft.title}
        onChange={(e) => onTitleChange(e.target.value)}
      />

      <label className="field-label" htmlFor="draft-letter">
        Letter
      </label>
      <textarea
        id="draft-letter"
        className="text-input draft-letter-input"
        value={draft.letterBody}
        onChange={(e) => onLetterChange(e.target.value)}
        rows={4}
      />

      <label className="field-label" htmlFor="draft-goal">
        Fundraising goal
      </label>
      <input
        id="draft-goal"
        className="text-input draft-goal-input"
        type="number"
        min="1"
        value={goalInputValue}
        onChange={(e) => onGoalChange(e.target.value)}
      />

      <p className="field-label draft-tiers-label">Gift amounts</p>
      <div className="draft-tiers">
        {draft.amounts.map((tier, index) => (
          <div key={index} className="admin-tier-edit draft-tier">
            <input
              className="text-input"
              type="number"
              min="1"
              value={tier.value}
              onChange={(e) => onTierChange(index, { value: Number(e.target.value) || 0 })}
              aria-label={`Tier ${index + 1} amount`}
            />
            <input
              className="text-input"
              value={tier.label}
              onChange={(e) => onTierChange(index, { label: e.target.value })}
              aria-label={`Tier ${index + 1} label`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
