const API_BASE = '/api';

async function request(url, options = {}) {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Network error' }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

export const api = {
  // Stats
  getStats: () => request('/stats'),

  // Donors
  getDonors: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/donors?${qs}`);
  },

  // Hospitals
  getHospitals: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/hospitals?${qs}`);
  },

  // Blood Requests
  getRequests: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/requests?${qs}`);
  },
  createRequest: (data) => request('/requests', { method: 'POST', body: JSON.stringify(data) }),
  fulfillRequest: (requestId, donorIds) =>
    request(`/requests/${requestId}/fulfill`, { method: 'PATCH', body: JSON.stringify({ donorIds }) }),

  // AI: Donor Matching
  runMatching: (requestId) => request(`/match/${requestId}`, { method: 'POST' }),
  getMatchResults: (requestId) => request(`/match/${requestId}`),

  // AI: Predictions
  getPredictions: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/predictions?${qs}`);
  },
  getPredictionAccuracy: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/predictions/accuracy?${qs}`);
  },

  // AI: Chatbot
  chat: (message) => request('/chat', { method: 'POST', body: JSON.stringify({ message }) }),
};
