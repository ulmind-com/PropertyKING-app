/**
 * Shared vocabulary for distressed listings — labels, colours and the small
 * derived numbers (discount, days to auction) the UI shows in several places.
 *
 * Mirrors the website's src/utils/distress.js so both clients label and colour
 * a listing identically. The only difference is colours: the web build uses
 * Tailwind classes, React Native needs literal values.
 */

export const DISTRESS_TYPES = [
  { value: 'pre_foreclosure', label: 'Pre-Foreclosure', short: 'Pre-Foreclosure' },
  { value: 'foreclosure',     label: 'Foreclosure',     short: 'Foreclosure' },
  { value: 'auction',         label: 'Auction',         short: 'Auction' },
  { value: 'bank_owned',      label: 'Bank Owned (REO)', short: 'Bank Owned' },
  { value: 'short_sale',      label: 'Short Sale',      short: 'Short Sale' },
  { value: 'tax_lien',        label: 'Tax Lien',        short: 'Tax Lien' },
  { value: 'fixer_upper',     label: 'Fixer Upper',     short: 'Fixer Upper' },
];

const BY_VALUE = Object.fromEntries(DISTRESS_TYPES.map(t => [t.value, t]));

/** Badge background per distress type — same hues as the web build. */
export const DISTRESS_COLOR = {
  pre_foreclosure: '#F59E0B',
  foreclosure:     '#DC2626',
  auction:         '#EA580C',
  bank_owned:      '#2563EB',
  short_sale:      '#7C3AED',
  tax_lien:        '#BE123C',
  fixer_upper:     '#0D9488',
};

export function distressLabel(type, short = false) {
  const t = BY_VALUE[type];
  if (!t) return String(type || '').replace(/_/g, ' ');
  return short ? t.short : t.label;
}

export function distressColor(type) {
  return DISTRESS_COLOR[type] || '#171717';
}

/** Percentage below estimated market value, or null when we cannot tell. */
export function discountPct(property) {
  const est = property?.distress?.estimated_value;
  const price = property?.price;
  if (!est || !price || est <= price) return null;
  return Math.round(((est - price) / est) * 100);
}

export function formatMoney(value, { compact = false } = {}) {
  if (value == null) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD',
    maximumFractionDigits: 0,
    notation: compact ? 'compact' : 'standard',
  }).format(value);
}

/**
 * The API returns naive UTC datetimes ("2026-08-24T15:14:29"), which `new Date`
 * would read as local time. Parse as UTC explicitly.
 */
export function parseUTC(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  const s = String(value);
  const hasZone = /(?:Z|[+-]\d{2}:?\d{2})$/.test(s);
  const d = new Date(hasZone ? s : `${s}Z`);
  return isNaN(d) ? null : d;
}

/** Whole days until the auction, negative once it has passed. */
export function daysUntil(value) {
  const d = parseUTC(value);
  if (!d) return null;
  return Math.ceil((d.getTime() - Date.now()) / 86400000);
}

export function formatDate(value) {
  const d = parseUTC(value);
  return d ? d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
}

export function timeAgo(value) {
  const d = parseUTC(value);
  if (!d) return '—';
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
  return d.toLocaleDateString();
}

/** Status pill colours shared by claims and edit requests. */
export const STATUS_COLOR = {
  pending:  { bg: '#FEF3C7', fg: '#92400E', label: 'Pending review' },
  approved: { bg: '#D1FAE5', fg: '#065F46', label: 'Approved' },
  claimed:  { bg: '#D1FAE5', fg: '#065F46', label: 'Approved' },
  rejected: { bg: '#FEE2E2', fg: '#991B1B', label: 'Rejected' },
};

export function statusStyle(status) {
  return STATUS_COLOR[status] || { bg: '#F5F5F5', fg: '#525252', label: status || '—' };
}
