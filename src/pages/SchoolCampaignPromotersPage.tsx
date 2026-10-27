import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { Tracker } from '../components/Tracker.tsx';
import { ResetDemoButton } from '../components/ResetDemoButton.tsx';
import { AdminSidebar } from '../components/AdminSidebar.tsx';
import {
  useKinData,
  findSchoolBySlug,
  findCampaignById,
  orgAdminSession,
  ensurePromotersSeeded,
  promotersForCampaign,
  leaderboardForCampaign,
  updatePromoterName,
  markPromotersSent,
} from '../lib/store.ts';
import { schoolLook } from '../lib/schoolLook.ts';
import { formatMoney } from '../lib/format.ts';
import type { Promoter } from '../types.ts';
import { NotFoundPage } from './NotFoundPage.tsx';
import './SchoolAdminPage.css';
import './SchoolCampaignPromotersPage.css';

function promoterLink(schoolSlug: string, promoter: Promoter) {
  return `${window.location.origin}/s/${schoolSlug}/promoter/${promoter.campaignId}?promoter=${promoter.id}`;
}

export function SchoolCampaignPromotersPage() {
  useKinData();
  const { schoolSlug = '', campaignId = '' } = useParams();
  const school = findSchoolBySlug(schoolSlug);
  const campaign = findCampaignById(campaignId);
  const validCampaign = !!school && !!campaign && campaign.schoolId === school.id;
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sentTo, setSentTo] = useState<Promoter[] | null>(null);
  const [showSend, setShowSend] = useState(false);

  useEffect(() => {
    if (validCampaign) ensurePromotersSeeded(campaignId);
  }, [validCampaign, campaignId]);

  useEffect(() => {
    if (!showSend) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') closeSend();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showSend]);

  if (!school) return <NotFoundPage />;
  if (!orgAdminSession(school.id)) {
    return <Navigate to={`/s/${school.slug}/login`} replace />;
  }
  if (!campaign || !validCampaign) return <NotFoundPage />;

  const promoters = promotersForCampaign(campaign.id);
  const leaderboard = leaderboardForCampaign(campaign.id);
  const raisedByPromoters = leaderboard.reduce((sum, row) => sum + row.total, 0);
  const topTotal = Math.max(1, ...leaderboard.map((row) => row.total));

  const unsent = promoters.filter((promoter) => !promoter.sentAt);

  function toggle(promoterId: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(promoterId)) next.delete(promoterId);
      else next.add(promoterId);
      return next;
    });
  }

  function toggleAll() {
    const ids = promoters.map((promoter) => promoter.id);
    setSelected((current) => (current.size === ids.length && ids.length > 0 ? new Set() : new Set(ids)));
  }

  function handleSend() {
    const ids = promoters.filter((p) => selected.has(p.id) && p.name.trim()).map((p) => p.id);
    if (ids.length === 0) return;
    markPromotersSent(campaign!.id, ids);
    setSentTo(promoters.filter((p) => ids.includes(p.id)));
    setSelected(new Set());
  }

  function openSend() {
    setSentTo(null);
    setShowSend(true);
  }

  function closeSend() {
    setShowSend(false);
    setSentTo(null);
    setSelected(new Set());
  }

  return (
    <div className="app-field admin-page" style={schoolLook(school)}>
      <Tracker label="Promoters" description="See who is raising the most, and send links to helpers." />

      <div className="admin-shell">
        <AdminSidebar schoolSlug={school.slug} schoolName={school.name} active="dashboard" />
        <div className="admin-shell-main">
          <section className="dashboard-section">
            <Link to={`/s/${school.slug}/admin/${campaign.id}`} className="admin-back-link">
              Back to the fundraiser
            </Link>
            <div className="cp-head">
              <div>
                <h1>{campaign.title}</h1>
                <p className="muted cp-intro">
                  {formatMoney(raisedByPromoters)} raised through promoter links. Gifts from the plain give link are not
                  counted here.
                </p>
              </div>
              <button type="button" className="ribbon cp-open-send" onClick={openSend}>
                Send links to promoters
                {unsent.length > 0 && <span className="cp-open-send-count"> · {unsent.length} not sent</span>}
              </button>
            </div>

            <div className="cp-panel cp-leaderboard-panel">
              <h2>Leaderboard</h2>
              <ol className="cp-leaderboard">
                {leaderboard.map((row, index) => (
                  <li
                    key={row.promoter.id}
                    className={index === 0 && row.total > 0 ? 'cp-leader-row cp-leader-top' : 'cp-leader-row'}
                  >
                    <div className="cp-leader-top-line">
                      <span className="cp-rank">{index + 1}</span>
                      <span className="cp-leader-name">
                        {row.promoter.name.trim() || 'Unnamed promoter'}
                        {index === 0 && row.total > 0 && <span className="cp-top-badge">Top promoter</span>}
                      </span>
                      <span className="cp-leader-gifts muted">
                        {row.giftCount} {row.giftCount === 1 ? 'gift' : 'gifts'}
                      </span>
                      <span className="cp-leader-total">{formatMoney(row.total)}</span>
                    </div>
                    <div className="cp-leader-bar-track">
                      <div
                        className={index === 0 && row.total > 0 ? 'cp-leader-bar-fill cp-leader-bar-fill-top' : 'cp-leader-bar-fill'}
                        style={{ width: `${(row.total / topTotal) * 100}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </section>
        </div>
      </div>

      {showSend && (
        <div className="cp-send-backdrop" onClick={closeSend}>
          <div className="cp-send-modal" onClick={(e) => e.stopPropagation()}>
            {sentTo ? (
              <div className="cp-sent">
                <p className="cp-sent-kicker">
                  <span className="demo-fill-badge">Demo</span>
                </p>
                <h2>
                  <span className="accent">Links </span>sent
                </h2>
                <p className="muted">These messages were not really sent. Copy a link to share it yourself.</p>
                <ul className="cp-sent-list">
                  {sentTo.map((promoter) => (
                    <li key={promoter.id}>
                      <p className="cp-sent-name">{promoter.name}</p>
                      <a className="cp-link" href={promoterLink(school.slug, promoter)} target="_blank" rel="noreferrer">
                        {promoterLink(school.slug, promoter)}
                      </a>
                    </li>
                  ))}
                </ul>
                <button type="button" className="ribbon" onClick={closeSend}>
                  Done
                </button>
              </div>
            ) : (
              <>
                <div className="cp-send-head">
                  <h2>Send the link</h2>
                  <button type="button" className="link-button" onClick={toggleAll} disabled={promoters.length === 0}>
                    {selected.size === promoters.length && promoters.length > 0 ? 'Clear all' : 'Select all'}
                  </button>
                </div>
                <p className="muted cp-send-note">Tick the promoters who should get their own link to this fundraiser.</p>
                <ul className="cp-send-list">
                  {promoters.map((promoter, index) => (
                    <li key={promoter.id} className="cp-send-row">
                      <input
                        type="checkbox"
                        className="cp-check"
                        checked={selected.has(promoter.id)}
                        onChange={() => toggle(promoter.id)}
                        aria-label={`Send to ${promoter.name || `promoter ${index + 1}`}`}
                      />
                      <input
                        className="cp-name"
                        value={promoter.name}
                        onChange={(e) => updatePromoterName(promoter.id, e.target.value)}
                        aria-label={`Promoter ${index + 1} name`}
                      />
                      {promoter.sentAt && <span className="cp-status">Sent</span>}
                    </li>
                  ))}
                </ul>
                <div className="cp-send-actions">
                  <button type="button" className="link-button" onClick={closeSend}>
                    Cancel
                  </button>
                  <button type="button" className="ribbon cp-send-button" onClick={handleSend} disabled={selected.size === 0}>
                    Send link to {selected.size || 'selected'} {selected.size === 1 ? 'promoter' : 'promoters'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <ResetDemoButton />
    </div>
  );
}
