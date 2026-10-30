import { useState, type FormEvent, type ReactNode } from 'react';
import { readScaledImage, STOCK_PHOTOS } from '../lib/images.ts';
import { appPath } from '../lib/publicUrl.ts';
import { DEFAULT_ACCENT } from '../lib/schoolLook.ts';
import {
  canGoBack,
  demoConversation,
  emptyDraft,
  goBack,
  promptFor,
  replyToColor,
  replyToImage,
  replyToSkip,
  replyToStockPhoto,
  replyToText,
  type ChatDraft,
  type ChatMode,
  type ChatStep,
} from '../lib/websiteChat.ts';
import './WebsiteChat.css';

interface WebsiteChatProps {
  mode: ChatMode;
  initialDraft?: ChatDraft;
  heading: ReactNode;
  confirmLabel: string;
  showDemo?: boolean;
  onComplete: (draft: ChatDraft) => void;
  onCancel?: () => void;
  onDraftChange?: (draft: ChatDraft) => void;
}

function textFor(draft: ChatDraft, step: ChatStep): string {
  if (step === 'name') return draft.name;
  if (step === 'place') return draft.place;
  if (step === 'welcome') return draft.welcomeLine;
  if (step === 'email') return draft.contactEmail;
  return '';
}

export function WebsiteChat({
  mode,
  initialDraft,
  heading,
  confirmLabel,
  showDemo = false,
  onComplete,
  onCancel,
  onDraftChange,
}: WebsiteChatProps) {
  const starting = initialDraft ?? emptyDraft();
  const [step, setStep] = useState<ChatStep>('name');
  const [draft, setDraft] = useState<ChatDraft>(starting);
  const [composer, setComposer] = useState(mode === 'edit' ? starting.name : '');
  const [color, setColor] = useState(starting.accentColor || DEFAULT_ACCENT);
  const [error, setError] = useState('');

  function advance(next: ChatStep, nextDraft: ChatDraft) {
    setDraft(nextDraft);
    setStep(next);
    setComposer(mode === 'edit' ? textFor(nextDraft, next) : '');
    setError('');
    if (next === 'color') setColor(nextDraft.accentColor || DEFAULT_ACCENT);
    onDraftChange?.(nextDraft);
  }

  function handleText(event: FormEvent) {
    event.preventDefault();
    const result = replyToText(draft, step, composer);
    if ('error' in result) {
      setError(result.error);
      return;
    }
    advance(result.next, result.draft);
  }

  function handleSkip() {
    const result = replyToSkip(draft, step, mode);
    if (!result) return;
    advance(result.next, result.draft);
  }

  function handleBack() {
    const result = goBack(draft, step, mode);
    if (!result) return;
    setDraft(result.draft);
    setStep(result.step);
    setComposer(mode === 'edit' ? textFor(result.draft, result.step) : '');
    setError('');
    setColor(result.draft.accentColor || DEFAULT_ACCENT);
    onDraftChange?.(result.draft);
  }

  async function handleImage(file: File | undefined) {
    if (!file || (step !== 'banner' && step !== 'logo')) return;
    setError('');
    try {
      const image = await readScaledImage(file, step === 'banner' ? 1600 : 400, step === 'logo' ? 'image/png' : 'image/jpeg');
      const result = replyToImage(draft, step, image);
      advance(result.next, result.draft);
    } catch {
      setError('That image could not be used.');
    }
  }

  function handleDemo() {
    const result = demoConversation();
    setDraft(result.draft);
    setStep(result.step);
    setComposer('');
    setColor(DEFAULT_ACCENT);
    setError('');
    onDraftChange?.(result.draft);
  }

  const textStep = step === 'name' || step === 'place' || step === 'welcome' || step === 'email';

  return (
    <section className="platform-chat">
      <h2>{heading}</h2>
      <p className="chat-kin" aria-live="polite">
        {promptFor(step, draft, mode)}
      </p>

      <div className="chat-compose">
        {textStep && (
          <form className="chat-line" onSubmit={handleText}>
            <label className="visually-hidden" htmlFor="chat-answer">
              Your answer
            </label>
            <input
              id="chat-answer"
              className="text-input"
              value={composer}
              onChange={(event) => setComposer(event.target.value)}
              placeholder={step === 'email' ? 'hello@example.com' : 'Type your answer'}
            />
            <button type="submit" className="ribbon chat-send">
              Send
            </button>
          </form>
        )}

        {step === 'color' && (
          <div className="chat-line">
            <label className="visually-hidden" htmlFor="chat-color">
              Accent color
            </label>
            <input
              id="chat-color"
              className="chat-color"
              type="color"
              value={color}
              onChange={(event) => setColor(event.target.value)}
            />
            <button
              type="button"
              className="ribbon chat-send"
              onClick={() => {
                const result = replyToColor(draft, color);
                advance(result.next, result.draft);
              }}
            >
              Use this color
            </button>
          </div>
        )}

        {step === 'banner' && (
          <div className="chat-photos" role="group" aria-label="Photos to choose from">
            {STOCK_PHOTOS.map((photo) => {
              const chosen = draft.bannerImage === photo.src;
              return (
                <button
                  key={photo.id}
                  type="button"
                  className={chosen ? 'chat-photo chat-photo-chosen' : 'chat-photo'}
                  aria-pressed={chosen}
                  onClick={() => {
                    const result = replyToStockPhoto(draft, photo);
                    advance(result.next, result.draft);
                  }}
                >
                  <img className="chat-photo-img" src={appPath(photo.src)} alt="" />
                  <span className="chat-photo-label">{photo.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {(step === 'banner' || step === 'logo') && (
          <div className="chat-line">
            <label className="field-label" htmlFor="chat-file">
              {step === 'banner' ? 'Or use your own photo' : 'Logo'}
            </label>
            <input
              id="chat-file"
              className="chat-file"
              type="file"
              accept="image/*"
              onChange={(event) => {
                void handleImage(event.target.files?.[0]);
                event.target.value = '';
              }}
            />
          </div>
        )}

        {step === 'confirm' && (
          <button type="button" className="ribbon chat-send" onClick={() => onComplete(draft)}>
            {confirmLabel}
          </button>
        )}

        {(canGoBack(step) || step !== 'name' || mode === 'edit') && (
          <div className="chat-nav">
            {canGoBack(step) && (
              <button type="button" className="link-button chat-back" onClick={handleBack}>
                Back
              </button>
            )}
            {step !== 'name' && step !== 'confirm' && (
              <button type="button" className="link-button" onClick={handleSkip}>
                Skip
              </button>
            )}
            {mode === 'edit' && (
              <button type="button" className="link-button" onClick={onCancel}>
                Cancel
              </button>
            )}
          </div>
        )}

        {error && <p className="chat-error">{error}</p>}
      </div>

      {showDemo && (
        <button type="button" className="demo-fill" onClick={handleDemo}>
          <span className="demo-fill-badge">Demo</span>
          Fill demo values
        </button>
      )}
    </section>
  );
}
