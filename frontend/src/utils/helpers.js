export const RATE = 2.5;
export const toWhite = (b) => Number(b) * RATE;

export const fmt = (n) =>
  Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 0 });

export const fmtDate = (ts) => {
  if (!ts) return '—';
  const d = new Date(ts);
  return d.toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
};

export const fmtDay = (ts) => {
  if (!ts) return '—';
  const d = new Date(ts);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' });
};

export const shortId = (id) => (id || '').slice(0, 8).toUpperCase();
