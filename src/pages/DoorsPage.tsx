import { Link, useSearchParams } from 'react-router-dom';
import { useKinData, getDefaultSchool, campaignForSchool } from '../lib/store.ts';
import './DoorsPage.css';

const DOORS = [
  {
    id: 'school',
    tone: 'ink',
    title: 'Platform',
    sentence: 'Create a website.',
  },
  {
    id: 'fundraiser',
    tone: 'green',
    title: 'Campaign',
    sentence: 'Start the fundraiser.',
  },
  {
    id: 'note',
    tone: 'amber',
    title: 'Promoter',
    sentence: 'Send the note.',
  },
  {
    id: 'give',
    tone: 'cream',
    title: 'Donor',
    sentence: 'Give.',
  },
] as const;

export function DoorsPage() {
  useKinData();
  const school = getDefaultSchool();
  const [searchParams] = useSearchParams();
  const licensed = searchParams.get('mode') === 'licensed';
  const visibleDoors = licensed ? DOORS.filter((door) => door.id !== 'school') : DOORS;

  function hrefFor(id: string): string {
    if (id === 'school') return '/platform';
    if (!school) return '/platform';
    if (id === 'fundraiser') return `/s/${school.slug}/admin`;
    const campaign = campaignForSchool(school.id);
    if (!campaign) return `/s/${school.slug}/admin`;
    if (id === 'note') return `/s/${school.slug}/promoter/${campaign.id}`;
    return `/s/${school.slug}/give/${campaign.id}`;
  }

  return (
    <div className="app-field doors-field">
      <div className="doors-intro">
        <h1 className="doors-brand brand-mark">Kin</h1>
        <p className="doors-tagline">Giving and getting go together. Pick a door to see how.</p>
        <Link to="/" className="doors-change-link">
          Change deployment
        </Link>
      </div>
      <div className="doors-grid doors-grid-compact">
        {visibleDoors.map((door) => (
          <Link key={door.id} to={hrefFor(door.id)} className={`door-card door-${door.tone}`}>
            <h2 className="door-title">{door.title}</h2>
            <p className="door-sentence">{door.sentence}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
