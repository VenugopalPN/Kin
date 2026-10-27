import { useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Tracker } from '../components/Tracker.tsx';
import { ResetDemoButton } from '../components/ResetDemoButton.tsx';
import { useKinData, findSchoolBySlug, findCampaignById, findPromoterById, updateCampaign } from '../lib/store.ts';
import { schoolLook } from '../lib/schoolLook.ts';
import { absoluteAppUrl } from '../lib/publicUrl.ts';
import { writeShareMessage, bestTimeSentence, todayAdviceSentence } from '../lib/ai.ts';
import { NotFoundPage } from './NotFoundPage.tsx';
import './PromoterPage.css';

export function PromoterPage() {
  useKinData();
  const { schoolSlug = '', campaignId = '' } = useParams();
  const [searchParams] = useSearchParams();
  const school = findSchoolBySlug(schoolSlug);
  const [copied, setCopied] = useState(false);

  if (!school) return <NotFoundPage />;
  const campaign = findCampaignById(campaignId);

  if (!campaign || campaign.schoolId !== school.id) {
    return (
      <div className={`app-field page-cream${school.bannerImage ? ' site-has-banner' : ''}`} style={schoolLook(school)}>
        <Tracker label="Send the note" description="Ask for a current fundraiser link." />
        <div className="sheet-stack">
          <div className="sheet" style={{ textAlign: 'center' }}>
            <h1 style={{ marginBottom: '1rem' }}>That link doesn't work</h1>
            <p className="muted">Ask {school.name} for a current fundraiser link.</p>
          </div>
        </div>
        <ResetDemoButton />
      </div>
    );
  }

  const childFirstName = campaign.childFirstName;
  const found = findPromoterById(searchParams.get('promoter') ?? '');
  const promoter = found && found.campaignId === campaign.id ? found : undefined;
  const link = absoluteAppUrl(`/s/${school.slug}/give/${campaign.id}${promoter ? `?promoter=${promoter.id}` : ''}`);
  const message = writeShareMessage({
    greetingName: campaign.greetingName,
    childFirstName: campaign.childFirstName,
    schoolName: school.name,
    cause: campaign.cause || campaign.title,
    link,
  });

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.alert(message);
    }
  }

  function handlePrint() {
    const printWindow = window.open('', '_blank', 'width=480,height=640');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>${childFirstName}'s note</title>
          <style>
            body { font-family: Georgia, serif; padding: 2.5rem; line-height: 1.6; font-size: 20px; }
            h1 { font-size: 1.6rem; }
          </style>
        </head>
        <body>
          <h1>From ${childFirstName}</h1>
          <p>${message}</p>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }

  return (
    <div className={`app-field promoter-page${school.bannerImage ? ' site-has-banner' : ''}`} style={schoolLook(school)}>
      <Tracker
        label="Send the note"
        description={
          promoter
            ? `You are ${promoter.name}, writing the note to send to anyone who might give.`
            : 'You are writing the note to send to anyone who might give.'
        }
      />

      <section className="promoter-note">
        <p className="phone-from">{campaign.childFirstName}</p>
        <p className="phone-message">{message}</p>
      </section>

      <div className="promoter-scroll">
        <section className="promoter-work">
          <div>
            <p className="muted">{school.name}</p>
            <h2>
              Hi <span className="accent">{campaign.greetingName}</span>
            </h2>
            <p className="muted">Change the names, then send this note to anyone who might give.</p>
          </div>
          <div className="promoter-fields">
            <div>
              <label className="field-label" htmlFor="child-name">
                Your first name
              </label>
              <input
                id="child-name"
                className="text-input"
                value={campaign.childFirstName}
                onChange={(e) => updateCampaign(campaign.id, { childFirstName: e.target.value })}
              />
            </div>
            <div>
              <label className="field-label" htmlFor="greeting-name">
                Who you're sending it to
              </label>
              <input
                id="greeting-name"
                className="text-input"
                value={campaign.greetingName}
                onChange={(e) => updateCampaign(campaign.id, { greetingName: e.target.value })}
              />
            </div>
          </div>
        </section>

        <div className="promoter-ribbon-row">
          <button type="button" className="ribbon" onClick={handleCopy}>
            {copied ? 'Copied!' : 'Copy the message'}
          </button>
          <button type="button" className="big-button ghost promoter-print" onClick={handlePrint}>
            Print the note
          </button>
        </div>

        <section className="promoter-cards">
          <div className="promoter-card">
            <p className="promoter-card-label">Best time to send — preview</p>
            <p className="promoter-card-text">{bestTimeSentence(campaign.endDate)}</p>
          </div>
          <div className="promoter-card">
            <p className="promoter-card-label">Do this today — preview</p>
            <p className="promoter-card-text">{todayAdviceSentence()}</p>
          </div>
        </section>
      </div>
      <ResetDemoButton />
    </div>
  );
}
