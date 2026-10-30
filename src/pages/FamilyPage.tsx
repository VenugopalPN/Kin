import { useState, type FormEvent } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Tracker } from '../components/Tracker.tsx';
import { ResetDemoButton } from '../components/ResetDemoButton.tsx';
import { AmountPicker } from '../components/AmountPicker.tsx';
import { ProgressBar } from '../components/ProgressBar.tsx';
import { FinishedNotice } from '../components/FinishedNotice.tsx';
import { useKinData, findSchoolBySlug, findCampaignById, giftsForCampaign, addGift, isFinished } from '../lib/store.ts';
import { findGame } from '../lib/games.ts';
import { schoolLook } from '../lib/schoolLook.ts';
import { NotFoundPage } from './NotFoundPage.tsx';
import './FamilyPage.css';

type GivePath = 'choose' | 'direct' | 'play' | 'played';

function AmountEditor({ amount, onChange }: { amount: number | null; onChange: (value: number | null) => void }) {
  return (
    <div className="family-amount-edit">
      <label className="field-label" htmlFor="gift-amount">
        Edit your amount
      </label>
      <div className="family-amount-edit-row">
        <span className="family-amount-prefix">$</span>
        <input
          id="gift-amount"
          className="text-input family-amount-input"
          type="number"
          min="1"
          inputMode="numeric"
          value={amount ?? ''}
          onChange={(e) => {
            const next = Number(e.target.value);
            onChange(e.target.value === '' ? null : next > 0 ? next : null);
          }}
        />
      </div>
    </div>
  );
}

function GiveDetails({
  donorName,
  onNameChange,
  matchingSentence,
  selectedAmount,
  onReadAloud,
}: {
  donorName: string;
  onNameChange: (value: string) => void;
  matchingSentence: string;
  selectedAmount: number | null;
  onReadAloud: () => void;
}) {
  return (
    <>
      <div>
        <label className="field-label" htmlFor="donor-name">
          Your first name
        </label>
        <input
          id="donor-name"
          className="text-input"
          value={donorName}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="June"
          required
        />
      </div>

      <p className="family-matching">{matchingSentence}</p>

      <button type="submit" className="ribbon family-give" disabled={!selectedAmount}>
        Give
      </button>

      <button type="button" className="link-button" onClick={onReadAloud}>
        Read this to me
      </button>
    </>
  );
}

export function FamilyPage() {
  useKinData();
  const { schoolSlug = '', campaignId = '' } = useParams();
  const [searchParams] = useSearchParams();
  const promoterId = searchParams.get('promoter') ?? '';
  const school = findSchoolBySlug(schoolSlug);
  const [donorName, setDonorName] = useState('');
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [stars, setStars] = useState(0);
  const [gameAmount, setGameAmount] = useState(0);
  const [givePath, setGivePath] = useState<GivePath>('choose');
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
  const finished = isFinished(campaign);
  const game = findGame(campaign.gameId);
  const offersGame = Boolean(game);
  const activePath: GivePath = offersGame ? givePath : 'direct';

  function handleGameDone(amount: number, units: number) {
    setSelectedAmount(amount);
    setGameAmount(amount);
    setStars(units);
    setGivePath('played');
  }

  function handleGive(event: FormEvent) {
    event.preventDefault();
    if (!selectedAmount) return;
    const gift = addGift(campaign!.id, donorName, selectedAmount, stars, promoterId);
    if (!gift) return;
    setLastDonor(gift.donorFirstName);
    setStep('thanks');
  }

  function handleGiveAgain() {
    setStep('give');
    setDonorName('');
    setSelectedAmount(null);
    setStars(0);
    setGivePath(offersGame ? 'choose' : 'direct');
  }

  function handleChooseDirect() {
    setStars(0);
    setSelectedAmount(null);
    setGivePath('direct');
  }

  function handleChoosePlay() {
    setStars(0);
    setSelectedAmount(null);
    setGivePath('play');
  }

  function handleChangePath() {
    setStars(0);
    setSelectedAmount(null);
    setGivePath('choose');
  }

  function handleReadAloud() {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const text = `Hi ${campaign!.greetingName}. ${campaign!.childFirstName}'s class is raising money for ${campaign!.cause || campaign!.title}. ${campaign!.matchingSentence}`;
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
  }

  const GameComponent = game?.Component;
  const showDirectForm = activePath === 'direct' || !offersGame;
  const showPlayedForm = activePath === 'played';
  const showPathChoice = offersGame && activePath === 'choose';
  const showPlay = offersGame && activePath === 'play' && GameComponent;

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
        {step === 'give' && finished ? (
          <FinishedNotice schoolName={school.name} contactEmail={school.contactEmail} />
        ) : step === 'give' ? (
          <form onSubmit={handleGive} className="family-form">
            {showPathChoice && (
              <div className="family-path-choice" role="group" aria-label="How would you like to give?">
                <p className="family-path-label">How would you like to give?</p>
                <button type="button" className="big-button ghost family-path-button" onClick={handleChooseDirect}>
                  Give directly
                </button>
                <button type="button" className="big-button primary family-path-button" onClick={handleChoosePlay}>
                  Play and give
                </button>
              </div>
            )}

            {showPlay && (
              <GameComponent onDone={handleGameDone} onSkip={handleChangePath} />
            )}

            {showPlayedForm ? (
              <>
                <button type="button" className="link-button family-change-path" onClick={handleChangePath}>
                  Choose how to give again
                </button>
                <p className="family-game-amount">Your gift from the game: ${gameAmount}</p>
                <AmountEditor amount={selectedAmount} onChange={setSelectedAmount} />
                <GiveDetails
                  donorName={donorName}
                  onNameChange={setDonorName}
                  matchingSentence={campaign.matchingSentence}
                  selectedAmount={selectedAmount}
                  onReadAloud={handleReadAloud}
                />
              </>
            ) : null}

            {showDirectForm && (
              <>
                {offersGame && (
                  <button type="button" className="link-button family-change-path" onClick={handleChangePath}>
                    Choose how to give again
                  </button>
                )}
                <AmountPicker
                  amounts={campaign.amounts}
                  selected={selectedAmount ?? -1}
                  onSelect={(value) => {
                    setSelectedAmount(value);
                    setStars(0);
                  }}
                />
                <AmountEditor amount={selectedAmount} onChange={setSelectedAmount} />
                <GiveDetails
                  donorName={donorName}
                  onNameChange={setDonorName}
                  matchingSentence={campaign.matchingSentence}
                  selectedAmount={selectedAmount}
                  onReadAloud={handleReadAloud}
                />
              </>
            )}
          </form>
        ) : (
          <div className="family-thanks">
            <h2 className="family-thanks-title">Thank you, {lastDonor}!</h2>
            <p className="muted">— {campaign.childFirstName}</p>
            {!finished && (
              <button type="button" className="ribbon" onClick={handleGiveAgain}>
                Give again
              </button>
            )}
          </div>
        )}
      </section>
      </div>

      <ResetDemoButton />
    </div>
  );
}
