import { useState, type FormEvent, type KeyboardEvent, type ReactNode } from 'react';
import './InlineEditField.css';

interface InlineEditFieldProps {
  id: string;
  label: string;
  value: string;
  /** What the closed field shows; defaults to the value. */
  display?: ReactNode;
  multiline?: boolean;
  numeric?: boolean;
  validate: (value: string) => string | undefined;
  onSave: (value: string) => void;
}

/** Tap the text to change it, the same way amount tiers are changed. One Save, no separate edit page. */
export function InlineEditField({
  id,
  label,
  value,
  display,
  multiline = false,
  numeric = false,
  validate,
  onSave,
}: InlineEditFieldProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [error, setError] = useState<string | undefined>();
  const [saved, setSaved] = useState(false);

  function open() {
    setDraft(value);
    setError(undefined);
    setSaved(false);
    setEditing(true);
  }

  function cancel() {
    setEditing(false);
    setError(undefined);
  }

  function save(event: FormEvent) {
    event.preventDefault();
    const problem = validate(draft);
    if (problem) {
      setError(problem);
      return;
    }
    onSave(draft.trim());
    setEditing(false);
    setSaved(true);
  }

  const errorId = `${id}-error`;

  if (!editing) {
    return (
      <div className="inline-edit">
        <button type="button" className="inline-edit-show" onClick={open} aria-label={`Change ${label.toLowerCase()}`}>
          <span className="inline-edit-value">{display ?? value}</span>
          <span className="admin-tier-change">Change</span>
        </button>
        <p className="inline-edit-saved" aria-live="polite">
          {saved ? 'Saved. Everyone sees this now.' : ''}
        </p>
      </div>
    );
  }

  const shared = {
    id,
    className: multiline ? 'text-input inline-edit-textarea' : 'text-input',
    value: draft,
    autoFocus: true,
    'aria-invalid': Boolean(error),
    'aria-describedby': error ? errorId : undefined,
    onKeyDown: (event: KeyboardEvent) => {
      if (event.key === 'Escape') cancel();
    },
  };

  return (
    <form className="inline-edit inline-edit-open" onSubmit={save}>
      <label className="field-label" htmlFor={id}>
        {label}
      </label>
      {multiline ? (
        <textarea {...shared} rows={4} onChange={(e) => setDraft(e.target.value)} />
      ) : (
        <input
          {...shared}
          type={numeric ? 'number' : 'text'}
          min={numeric ? 1 : undefined}
          inputMode={numeric ? 'numeric' : undefined}
          onChange={(e) => setDraft(e.target.value)}
        />
      )}
      {error && (
        <p className="field-error" id={errorId} role="alert">
          {error}
        </p>
      )}
      <div className="inline-edit-actions">
        <button type="submit" className="big-button primary">
          Save
        </button>
        <button type="button" className="link-button" onClick={cancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
