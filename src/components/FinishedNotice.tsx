import './FinishedNotice.css';

interface FinishedNoticeProps {
  schoolName: string;
  contactEmail: string;
}

/** Shown wherever someone could otherwise give to, or promote, a fundraiser that has finished. */
export function FinishedNotice({ schoolName, contactEmail }: FinishedNoticeProps) {
  const email = contactEmail.trim();
  return (
    <div className="finished-notice" role="status">
      <h2 className="finished-notice-title">This fundraiser has finished</h2>
      <p>Thank you to everyone who gave.</p>
      {email && (
        <p>
          <a className="finished-notice-link" href={`mailto:${email}`}>
            Ask {schoolName} about the next one
          </a>
        </p>
      )}
    </div>
  );
}
