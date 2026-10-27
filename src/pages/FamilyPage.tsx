import { useState, type FormEvent } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Tracker } from '../components/Tracker.tsx';
import { ResetDemoButton } from '../components/ResetDemoButton.tsx';
import { AmountPicker } from '../components/AmountPicker.tsx';
import { StarGame } from '../components/StarGame.tsx';
import { ProgressBar } from '../components/ProgressBar.tsx';
import { useKinData, findSchoolBySlug, findCampaignById, giftsForCampaign, addGift } from '../lib/store.ts';
import { schoolLook } from '../lib/schoolLook.ts';
import { NotFoundPage } from './NotFoundPage.tsx';
import './FamilyPage.css';

export function FamilyPage() {
  useKinData();
  const { schoolSlug = '', campaignId = '' } = useParams();
  const [searchParams] = useSearchParams();
  const promoterId = searchParams.get('promoter') ?? '';
  const school = findSchoolBySlug(schoolSlug);
  const [donorName, setDonorName] = useState('');
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [stars, setStars] = useState(0);
  const [showStarGame, setShowStarGame] = useState(false);
  const [step, setStep] = useState<'give' | 'thanks'>('give');
  const [lastDonor, setLastDonor] = useState('');

  if (!school) return <NotFoundPage />;
  const campaign = findCampaignById(campaignId);

  if (!campaign || campaign.schoolId !== school.id) {
    return (
      <div className={`app-field page-cream${school.bannerImage ? ' site-has-banner' : ''}`} style={schoolLook(school)}>
        <Tracker label="Give" description="Ask for a current fundraiser link." />
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

  const raised = giftsForCampaign(campaign.id).reduce((sum, g) => sum + g.amount, 0);

  function handleStarDone(amount: number, starCount: number) {
    setSelectedAmount(amount);
    setStars(starCount);
    setShowStarGame(false);
  }

  function handleGive(event: FormEvent) {
    event.preventDefault();
    if (!selectedAmount) return;
    const gift = addGift(campaign!.id, donorName, selectedAmount, stars, promoterId);
    setLastDonor(gift.donorFirstName);
    setStep('thanks');
  }

  function handleGiveAgain() {
    setStep('give');
    setDonorName('');
    setSelectedAmount(null);
    setStars(0);
  }

  function handleReadAloud() {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const text = `Hi ${campaign!.greetingName}. ${campaign!.childFirstName}'s class is raising money for ${campaign!.cause || campaign!.title}. ${campaign!.matchingSentence}`;
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
  }

  return (
    <div className="app-field family-page" style={schoolLook(school)}>
      <Tracker label="Give" description="You are giving to this fundraiser." />

      <div className="family-fit">
      <section className="family-hero">
        <div className="framed-photo-wrap">
          <div className="framed-photo-panel" aria-hidden="true" />
          <div className="framed-photo-img" aria-hidden="true" />
        </div>
        <div className="family-hero-copy">
          <p className="family-school">{school.name}</p>
          <h1 className="family-greeting">
            Hi <span className="accent">{campaign.greetingName}</span>
          </h1>
          <p className="family-sentence">
            {campaign.childFirstName}'s class is raising money for {campaign.cause || campaign.title}.
          </p>
          <ProgressBar raised={raised} goal={campaign.goal} />
        </div>
      </section>

      <section className="family-band">
        {step === 'give' ? (
          <form onSubmit={handleGive} className="family-form">
            <AmountPicker amounts={campaign.amounts} selected={selectedAmount ?? -1} onSelect={setSelectedAmount} />

            {showStarGame ? (
              <StarGame onDone={handleStarDone} onSkip={() => setShowStarGame(false)} />
            ) : (
              <button type="button" className="link-button family-star-link" onClick={() => setShowStarGame(true)}>
                Add a star instead
              </button>
            )}

            <div>
              <label className="field-label" htmlFor="donor-name">
                Your first name
              </label>
              <input
                id="donor-name"
                className="text-input"
                value={donorName}
                onChange={(e) => setDonorName(e.target.value)}
                placeholder="June"
                required
              />
            </div>

            <p className="family-matching">{campaign.matchingSentence}</p>

            <button type="submit" className="ribbon family-give" disabled={!selectedAmount}>
              Give
            </button>

            <button type="button" className="link-button" onClick={handleReadAloud}>
              Read this to me
            </button>
          </form>
        ) : (
          <div className="family-thanks">
            <h2 className="family-thanks-title">Thank you, {lastDonor}!</h2>
            <p className="muted">— {campaign.childFirstName}</p>
            <button type="button" className="ribbon" onClick={handleGiveAgain}>
              Give again
            </button>
          </div>
        )}
      </section>
      </div>
      <ResetDemoButton />
    </div>
  );
}
