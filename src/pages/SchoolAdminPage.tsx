import { useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { Tracker } from '../components/Tracker.tsx';
import { ResetDemoButton } from '../components/ResetDemoButton.tsx';
import { ProgressBar } from '../components/ProgressBar.tsx';
import { AdminSidebar } from '../components/AdminSidebar.tsx';
import { FullScreenWall } from '../components/FullScreenWall.tsx';
import { ThankYouWall } from '../components/ThankYouWall.tsx';
import { useKinData, findSchoolBySlug, findCampaignById, giftsForCampaign, updateCampaign, orgAdminSession, leaderboardForCampaign } from '../lib/store.ts';
import { schoolLook } from '../lib/schoolLook.ts';
import { formatMoney } from '../lib/format.ts';
import { NotFoundPage } from './NotFoundPage.tsx';
import './SchoolAdminPage.css';

export function SchoolAdminPage() {
  useKinData();
  const { schoolSlug = '', campaignId = '' } = useParams();
  const school = findSchoolBySlug(schoolSlug);
  const [showWall, setShowWall] = useState(false);
  const [editingTier, setEditingTier] = useState<number | null>(null);
  const [tierEdit, setTierEdit] = useState<{ value: string; label: string }>({ value: '', label: '' });

  if (!school) return <NotFoundPage />;
  if (!orgAdminSession(school.id)) {
    return <Navigate to={`/s/${school.slug}/login`} replace />;
  }

  const campaign = findCampaignById(campaignId);
  if (!campaign || campaign.schoolId !== school.id) return <NotFoundPage />;

  const gifts = giftsForCampaign(campaign.id);
  const raised = gifts.reduce((sum, g) => sum + g.amount, 0);
  const top = leaderboardForCampaign(campaign.id)[0];

  function startEditingTier(index: number) {
    const tier = campaign!.amounts[index];
    setEditingTier(index);
    setTierEdit({ value: String(tier.value), label: tier.label });
  }

  function saveTier() {
    if (editingTier === null) return;
    const value = Number(tierEdit.value) || campaign!.amounts[editingTier].value;
    const label = tierEdit.label.trim() || `$${value}`;
    const amounts = campaign!.amounts.map((tier, index) => (index === editingTier ? { value, label } : tier));
    updateCampaign(campaign!.id, { amounts });
    setEditingTier(null);
  }

  return (
    <div className="app-field admin-page" style={schoolLook(school)}>
      <Tracker label="Manage the fundraiser" description="You are managing this fundraiser." />

      <div className="admin-shell">
        <AdminSidebar schoolSlug={school.slug} schoolName={school.name} active="dashboard" />
        <div className="admin-shell-main">
          <Link to={`/s/${school.slug}/admin`} className="admin-back-link">
            Back to the dashboard
          </Link>

          <section className="manage-hero-card">
            <h1>{campaign.title}</h1>
            <p className="admin-raised">
              {formatMoney(raised)} raised of {formatMoney(campaign.goal)}
            </p>
            <ProgressBar raised={raised} goal={campaign.goal} />
          </section>

          <section className="manage-ribbon">
            <div>
              <p className="field-label">Promoters</p>
              <p className="admin-share-url">
                {top && top.total > 0
                  ? `${top.promoter.name} leads with ${formatMoney(top.total)}.`
                  : 'No gifts through promoter links yet.'}
              </p>
            </div>
            <Link className="pill-outline manage-copy" to={`/s/${school.slug}/admin/${campaign.id}/promoters`}>
              Leaderboard and links
            </Link>
          </section>

          <section className="manage-body">
            <div>
              <p className="manage-letter">{campaign.letterBody}</p>
              <p className="muted admin-share-note">
                Each promoter gets their own link, so you can see who brought in each gift.
              </p>
              <h2>Amounts</h2>
              <div className="admin-tiers">
                {campaign.amounts.map((tier, index) =>
                  editingTier === index ? (
                    <div key={index} className="admin-tier-edit">
                      <input
                        className="text-input"
                        type="number"
                        value={tierEdit.value}
                        onChange={(e) => setTierEdit((t) => ({ ...t, value: e.target.value }))}
                        aria-label="Amount"
                      />
                      <input
                        className="text-input"
                        value={tierEdit.label}
                        onChange={(e) => setTierEdit((t) => ({ ...t, label: e.target.value }))}
                        aria-label="Label"
                      />
                      <button type="button" className="big-button primary" onClick={saveTier}>
                        Save
                      </button>
                    </div>
                  ) : (
                    <button key={index} type="button" className="admin-tier" onClick={() => startEditingTier(index)}>
                      <span>{tier.label}</span>
                      <span className="admin-tier-change">Change</span>
                    </button>
                  ),
                )}
              </div>
              <label className="admin-toggle">
                <input
                  type="checkbox"
                  checked={campaign.hideAmounts}
                  onChange={(e) => updateCampaign(campaign.id, { hideAmounts: e.target.checked })}
                />
                Hide dollar amounts on the leaderboard
              </label>
            </div>
            <div>
              <ThankYouWall gifts={gifts} hideAmounts={campaign.hideAmounts} compact />
              <button type="button" className="big-button ghost manage-wall" onClick={() => setShowWall(true)}>
                Show the wall
              </button>
            </div>
          </section>
        </div>
      </div>

      {showWall && (
        <FullScreenWall
          schoolName={school.name}
          gifts={gifts}
          hideAmounts={campaign.hideAmounts}
          onClose={() => setShowWall(false)}
        />
      )}
      <ResetDemoButton />
    </div>
  );
}
