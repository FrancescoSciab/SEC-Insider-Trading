import { format, formatDistanceToNow, parseISO, isValid } from 'date-fns';

export function formatCurrency(value, compact = false) {
  if (value == null || isNaN(value)) return '—';
  const abs = Math.abs(value);
  if (compact) {
    if (abs >= 1_000_000_000) return `$${(abs / 1_000_000_000).toFixed(1)}B`;
    if (abs >= 1_000_000) return `$${(abs / 1_000_000).toFixed(1)}M`;
    if (abs >= 1_000) return `$${(abs / 1_000).toFixed(0)}K`;
    return `$${abs.toFixed(0)}`;
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatShares(value) {
  if (value == null || isNaN(value)) return '—';
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${(abs / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `${(abs / 1_000).toFixed(1)}K`;
  return abs.toLocaleString('en-US');
}

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    const d = typeof dateStr === 'string' ? parseISO(dateStr) : new Date(dateStr);
    if (!isValid(d)) return '—';
    return format(d, 'MMM d, yyyy');
  } catch {
    return String(dateStr).slice(0, 10);
  }
}

export function formatDateRelative(dateStr) {
  if (!dateStr) return '—';
  try {
    const d = typeof dateStr === 'string' ? parseISO(dateStr) : new Date(dateStr);
    if (!isValid(d)) return '—';
    return formatDistanceToNow(d, { addSuffix: true });
  } catch {
    return formatDate(dateStr);
  }
}

export function formatPercent(value) {
  if (value == null || isNaN(value)) return '—';
  return `${(value * 100).toFixed(1)}%`;
}

export function isBuy(tx) {
  return tx.sharesTraded > 0;
}

export function getTransactionSign(tx) {
  if (tx.sharesTraded > 0) return '+';
  if (tx.sharesTraded < 0) return '-';
  return '';
}
