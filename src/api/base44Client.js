const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');
const TOKEN_KEY = 'sipegawai_access_token';

const getToken = () => {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
};

const setToken = (token) => {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch { /* storage may be unavailable */ }
};

const request = async (path, options = {}) => {
  const headers = new Headers(options.headers || {});
  if (options.body && !(options.body instanceof FormData)) headers.set('Content-Type', 'application/json');
  const token = getToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const text = await response.text();
  let data;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!response.ok) {
    const error = new Error(data?.message || data?.error || `Request failed (${response.status})`);
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data;
};

const entityHandler = (entity) => ({
  list: (sort, limit, skip, fields) => request(`/api/entities/${encodeURIComponent(entity)}?${new URLSearchParams({ ...(sort ? { sort } : {}), ...(limit ? { limit } : {}), ...(skip ? { skip } : {}), ...(fields ? { fields: Array.isArray(fields) ? fields.join(',') : fields } : {}) })}`),
  filter: (query = {}, sort, limit, skip, fields) => request(`/api/entities/${encodeURIComponent(entity)}?${new URLSearchParams({ q: JSON.stringify(query), ...(sort ? { sort } : {}), ...(limit ? { limit } : {}), ...(skip ? { skip } : {}), ...(fields ? { fields: Array.isArray(fields) ? fields.join(',') : fields } : {}) })}`),
  get: (id) => request(`/api/entities/${encodeURIComponent(entity)}/${encodeURIComponent(id)}`),
  create: (data) => request(`/api/entities/${encodeURIComponent(entity)}`, { method: 'POST', body: JSON.stringify(data) }),
  bulkCreate: (data) => request(`/api/entities/${encodeURIComponent(entity)}/bulk`, { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/api/entities/${encodeURIComponent(entity)}/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(data) }),
  bulkUpdate: (data) => request(`/api/entities/${encodeURIComponent(entity)}/bulk`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => request(`/api/entities/${encodeURIComponent(entity)}/${encodeURIComponent(id)}`, { method: 'DELETE' }),
});

const entities = new Proxy({}, {
  get: (_target, entity) => entity === 'then' ? undefined : entityHandler(entity),
});

const auth = {
  me: () => request('/api/auth/me'),
  loginViaEmailPassword: async (email, password) => {
    const result = await request('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    setToken(result.access_token);
    return result;
  },
  register: (data) => request('/api/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  setToken,
  logout: async () => { setToken(null); try { await request('/api/auth/logout'); } catch { /* already logged out */ } },
  redirectToLogin: () => { window.location.assign('/login'); },
  loginWithProvider: () => { throw new Error('Google Login belum dikonfigurasi pada backend Cloudflare.'); },
  resetPasswordRequest: (email) => request('/api/auth/reset-password-request', { method: 'POST', body: JSON.stringify({ email }) }),
  resetPassword: () => { throw new Error('Reset password email belum dikonfigurasi.'); },
  verifyOtp: () => { throw new Error('OTP belum dikonfigurasi.'); },
  resendOtp: () => { throw new Error('OTP belum dikonfigurasi.'); },
  isAuthenticated: async () => { try { await auth.me(); return true; } catch { return false; } },
};

const functions = {
  invoke: (name, body) => request(`/api/functions/${encodeURIComponent(name)}`, { method: 'POST', body: JSON.stringify(body || {}) }),
};

const integrations = {
  Core: {
    UploadFile: async () => { throw new Error('Storage eksternal belum dikonfigurasi.'); },
    ExtractDataFromUploadedFile: async () => { throw new Error('Import file akan tersedia setelah storage eksternal dikonfigurasi.'); },
    InvokeLLM: async () => { throw new Error('AI provider belum dikonfigurasi pada backend Cloudflare.'); },
  },
};

export const base44 = { entities, auth, functions, integrations };
