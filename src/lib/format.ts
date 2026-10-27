export function formatMoney(amount: number): string {
  return `$${amount.toLocaleString('en-AU')}`;
}

export function formatDateLong(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString('en-AU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

export function dayName(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString('en-AU', { weekday: 'long' });
}

export function daysFromNow(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}
