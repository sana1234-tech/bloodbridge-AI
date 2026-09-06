const API_BASE = '/api';

let authToken = null;

async function request(url, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (authToken) headers.Authorization = `Bearer ${authToken}`;
  const res = await fetch(`${API_BASE}${url}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Network error' }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

export const api = {
  setToken(t) { authToken = t; },

  // Auth
  login: (phone, password, role) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ phone, password, role }) }),
  signupStaff: (data) =>
    request('/auth/signup/staff', { method: 'POST', body: JSON.stringify(data) }),
  signupDonor: (data) =>
    request('/auth/signup/donor', { method: 'POST', body: JSON.stringify(data) }),
  getMe: () => request('/auth/me'),

  // Verification
  getPendingVerifications: () => request('/verification/pending'),
  approveStaff: (userId) =>
    request(`/verification/${userId}/approve`, { method: 'POST', body: JSON.stringify({}) }),
  rejectStaff: (userId) =>
    request(`/verification/${userId}/reject`, { method: 'POST', body: JSON.stringify({}) }),

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
  getMyRequests: () => request('/requests/my'),
  createRequest: (data) => request('/requests', { method: 'POST', body: JSON.stringify(data) }),
  fulfillRequest: (requestId, donorIds) =>
    request(`/requests/${requestId}/fulfill`, { method: 'PATCH', body: JSON.stringify({ donorIds }) }),

  // Donor Responses
  respondToRequest: (requestId) =>
    request(`/requests/${requestId}/respond`, { method: 'POST', body: JSON.stringify({}) }),
  getRequestResponses: (requestId) => request(`/requests/${requestId}/responses`),

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

  // Replacement Donors
  registerReplacementDonor: (data) =>
    request('/replacement-donors', { method: 'POST', body: JSON.stringify(data) }),
};
