import './StatCard.css';

interface StatCardProps {
  label: string;
  value: string;
}

/** One number, one label. Used in a row on the admin dashboard. */
export function StatCard({ label, value }: StatCardProps) {
  return (
    <div className="stat-card">
      <p className="stat-card-label">{label}</p>
      <p className="stat-card-value">{value}</p>
    </div>
  );
}
