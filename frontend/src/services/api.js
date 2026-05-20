import { auth } from './firebase';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

async function authHeader() {
  const u = auth.currentUser;
  if (!u) return {};
  const token = await u.getIdToken();
  return { Authorization: `Bearer ${token}` };
}

async function req(method, path, body) {
  const headers = { 'Content-Type': 'application/json', ...(await authHeader()) };
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return res.json();
}

export const api = {
  // auth
  register: (data) => req('POST', '/api/auth/register', data),
  me:       ()     => req('GET',  '/api/auth/me'),
  updateMe: (data) => req('PUT',  '/api/auth/me', data),
  officers: ()     => req('GET',  '/api/auth/officers'),
  setRole:  (uid, role) => req('PUT', `/api/auth/officers/${uid}/role`, { role }),
  deleteOfficer: (uid) => req('DELETE', `/api/auth/officers/${uid}`),

  // items
  items:       () => req('GET', '/api/items'),
  createItem:  (data) => req('POST', '/api/items', data),
  updateItem:  (id, data) => req('PUT', `/api/items/${id}`, data),
  deleteItem:  (id) => req('DELETE', `/api/items/${id}`),
  seedItems:   () => req('POST', '/api/items/seed'),

  // evidence
  evidence: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return req('GET', `/api/evidence${qs ? '?' + qs : ''}`);
  },
  addEvidence: (data) => req('POST', '/api/evidence', data),
  deleteEvidence: (id) => req('DELETE', `/api/evidence/${id}`),
  resetAllData: () => req('POST', '/api/evidence/reset-all'),

  // treasury
  treasury: ()       => req('GET',  '/api/treasury'),
  addTreasury: (data)=> req('POST', '/api/treasury', data),
  resetTreasury: ()  => req('POST', '/api/treasury/reset'),

  // reports
  summary: () => req('GET', '/api/reports/summary'),
};
