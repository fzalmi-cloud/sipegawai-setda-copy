const json = (body, status = 200, extra = {}) => new Response(JSON.stringify(body), {
  status,
  headers: { 'Content-Type': 'application/json; charset=utf-8', ...extra },
});

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
};

const withCors = (response) => {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(cors)) headers.set(key, value);
  return new Response(response.body, { status: response.status, headers });
};

const now = () => new Date().toISOString();
const id = () => crypto.randomUUID();

const parseBody = async (request) => {
  try { return await request.json(); } catch { return {}; }
};

const sha256 = async (value) => {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
};

const randomToken = () => {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

const hashPassword = async (password, salt = null) => {
  const saltBytes = salt ? Uint8Array.from(atob(salt), (c) => c.charCodeAt(0)) : crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: saltBytes, iterations: 120000, hash: 'SHA-256' }, key, 256);
  const encodedSalt = btoa(String.fromCharCode(...saltBytes));
  const encodedHash = btoa(String.fromCharCode(...new Uint8Array(bits)));
  return `${encodedSalt}:${encodedHash}`;
};

const verifyPassword = async (password, encoded) => {
  if (!encoded || !encoded.includes(':')) return false;
  const [salt, expected] = encoded.split(':');
  const actual = (await hashPassword(password, salt)).split(':')[1];
  return actual === expected;
};

const getBearer = (request) => request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '') || null;

const getUser = async (request, env) => {
  const token = getBearer(request);
  if (!token) return null;
  const tokenHash = await sha256(token);
  const session = await env.DB.prepare('SELECT user_id, expires_at FROM sessions WHERE token_hash = ?').bind(tokenHash).first();
  if (!session || session.expires_at < now()) return null;
  const row = await env.DB.prepare("SELECT data FROM records WHERE entity = 'User' AND id = ?").bind(session.user_id).first();
  if (!row) return null;
  return { ...JSON.parse(row.data), id: session.user_id };
};

const requireUser = async (request, env) => {
  const user = await getUser(request, env);
  if (!user) throw new HttpError('Unauthorized', 401);
  return user;
};

const requireAdmin = async (request, env) => {
  const user = await requireUser(request, env);
  if (!['admin', 'super_admin', 'admin_kepegawaian'].includes(user.role)) throw new HttpError('Forbidden', 403);
  return user;
};

class HttpError extends Error {
  constructor(message, status = 500, data = null) { super(message); this.status = status; this.data = data; }
}

const getRecords = async (env, entity) => {
  const result = await env.DB.prepare('SELECT id, data FROM records WHERE entity = ?').bind(entity).all();
  return result.results.map((row) => ({ ...JSON.parse(row.data), id: row.id }));
};

const getRecord = async (env, entity, recordId) => {
  const row = await env.DB.prepare('SELECT id, data FROM records WHERE entity = ? AND id = ?').bind(entity, recordId).first();
  return row ? { ...JSON.parse(row.data), id: row.id } : null;
};

const saveRecord = async (env, entity, data, recordId = data.id || id()) => {
  const timestamp = now();
  const record = { ...data, id: recordId, created_date: data.created_date || timestamp, updated_date: timestamp };
  await env.DB.prepare(`INSERT INTO records(entity, id, data, created_date, updated_date) VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(entity, id) DO UPDATE SET data = excluded.data, updated_date = excluded.updated_date`)
    .bind(entity, recordId, JSON.stringify(record), record.created_date, timestamp).run();
  return record;
};

const removeRecord = async (env, entity, recordId) => {
  await env.DB.prepare('DELETE FROM records WHERE entity = ? AND id = ?').bind(entity, recordId).run();
};

const equals = (actual, expected) => {
  if (expected && typeof expected === 'object' && !Array.isArray(expected)) {
    if ('$in' in expected) return expected.$in.includes(actual);
    if ('$nin' in expected) return !expected.$nin.includes(actual);
    if ('$ne' in expected) return actual !== expected.$ne;
    if ('$gte' in expected && !(actual >= expected.$gte)) return false;
    if ('$gt' in expected && !(actual > expected.$gt)) return false;
    if ('$lte' in expected && !(actual <= expected.$lte)) return false;
    if ('$lt' in expected && !(actual < expected.$lt)) return false;
    return true;
  }
  return actual === expected;
};

const matches = (record, query) => Object.entries(query || {}).every(([key, value]) => equals(record[key], value));

const project = (record, fields) => {
  if (!fields) return record;
  const names = fields.split(',').map((field) => field.trim()).filter(Boolean);
  return Object.fromEntries(['id', ...names].filter((key, index, list) => list.indexOf(key) === index).map((key) => [key, record[key]]));
};

const listEntity = async (request, env, entity) => {
  const url = new URL(request.url);
  const query = url.searchParams.get('q');
  const filter = query ? JSON.parse(query) : {};
  const sortParam = url.searchParams.get('sort');
  const sortField = sortParam?.replace(/^-/, '') || 'created_date';
  const descending = sortParam?.startsWith('-') ?? true;
  const limit = Math.min(Number(url.searchParams.get('limit') || 1000), 10000);
  const skip = Number(url.searchParams.get('skip') || 0);
  let records = (await getRecords(env, entity)).filter((record) => matches(record, filter));
  records.sort((a, b) => {
    const left = a[sortField] ?? '';
    const right = b[sortField] ?? '';
    const result = left < right ? -1 : left > right ? 1 : 0;
    return descending ? -result : result;
  });
  return records.slice(skip, skip + limit).map((record) => project(record, url.searchParams.get('fields')));
};

const handleEntity = async (request, env, entity, actionId = null) => {
  await requireUser(request, env);
  const method = request.method;
  if (method === 'GET' && actionId) {
    const record = await getRecord(env, entity, actionId);
    if (!record) throw new HttpError('Record not found', 404);
    return json(record);
  }
  if (method === 'GET') return json(await listEntity(request, env, entity));
  if (method === 'POST' && actionId === 'bulk') {
    const items = await parseBody(request);
    const records = [];
    for (const item of items) records.push(await saveRecord(env, entity, item));
    return json(records, 201);
  }
  if (method === 'POST') return json(await saveRecord(env, entity, await parseBody(request)), 201);
  if (method === 'PUT' && actionId === 'bulk') {
    const items = await parseBody(request);
    const records = [];
    for (const item of items) {
      if (!item.id) continue;
      const existing = await getRecord(env, entity, item.id);
      if (existing) records.push(await saveRecord(env, entity, { ...existing, ...item }, item.id));
    }
    return json(records);
  }
  if (method === 'PUT' && actionId) {
    const existing = await getRecord(env, entity, actionId);
    if (!existing) throw new HttpError('Record not found', 404);
    return json(await saveRecord(env, entity, { ...existing, ...(await parseBody(request)) }, actionId));
  }
  if (method === 'DELETE' && actionId) {
    await removeRecord(env, entity, actionId);
    return json({ success: true });
  }
  throw new HttpError('Method not allowed', 405);
};

const issueSession = async (env, userId) => {
  const token = randomToken();
  await env.DB.prepare('INSERT INTO sessions(token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)')
    .bind(await sha256(token), userId, new Date(Date.now() + 7 * 86400000).toISOString(), now()).run();
  return token;
};

const handleAuth = async (request, env, path) => {
  if (path === '/api/auth/me' && request.method === 'GET') return json(await requireUser(request, env));
  if (path === '/api/auth/logout') {
    const token = getBearer(request);
    if (token) await env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(await sha256(token)).run();
    return json({ success: true });
  }
  const body = await parseBody(request);
  if (path === '/api/auth/login' && request.method === 'POST') {
    const records = await getRecords(env, 'User');
    const user = records.find((item) => String(item.email || '').toLowerCase() === String(body.email || '').toLowerCase());
    if (!user || !(await verifyPassword(body.password || '', user.password_hash))) throw new HttpError('Email atau password salah', 401);
    return json({ access_token: await issueSession(env, user.id), user });
  }
  if (path === '/api/auth/register' && request.method === 'POST') {
    if (!body.email || !body.password) throw new HttpError('Email dan password wajib diisi', 400);
    const records = await getRecords(env, 'User');
    if (records.some((item) => item.email === body.email)) throw new HttpError('Email sudah digunakan', 409);
    const user = await saveRecord(env, 'User', { email: body.email, nama_lengkap: body.nama_lengkap || body.email, role: 'pegawai', password_hash: await hashPassword(body.password), password_changed: true });
    return json({ access_token: await issueSession(env, user.id), user }, 201);
  }
  if (path === '/api/auth/reset-password-request' && request.method === 'POST') return json({ success: true, message: 'Permintaan reset diterima. Email reset akan tersedia setelah provider email dikonfigurasi.' });
  throw new HttpError('Auth endpoint not found', 404);
};

const handleFunction = async (request, env, functionName) => {
  const user = await requireAdmin(request, env);
  const body = await parseBody(request);
  if (functionName === 'createManualUser') {
    const email = body.email || `${String(body.nama_lengkap || '').toLowerCase().replace(/[^a-z0-9]+/g, '.')}@setda.sumbarprov.go.id`;
    const existing = (await getRecords(env, 'User')).find((item) => item.email === email);
    if (existing) throw new HttpError('Email sudah digunakan', 409);
    const created = await saveRecord(env, 'User', { ...body, email, role: body.role || 'pegawai', password_changed: false });
    return json({ success: true, user_id: created.id, email });
  }
  if (functionName === 'updateInvitedUser') {
    const target = (await getRecords(env, 'User')).find((item) => item.email === body.email);
    if (!target) throw new HttpError('User not found', 404);
    return json({ success: true, user_id: (await saveRecord(env, 'User', { ...target, ...body }, target.id)).id });
  }
  if (functionName === 'autoArchiveCompletedTickets') {
    const tickets = (await getRecords(env, 'ServiceTicket')).filter((item) => item.status === 'Selesai' && item.deleted === false);
    for (const ticket of tickets) await saveRecord(env, 'ServiceTicket', { ...ticket, deleted: true }, ticket.id);
    if (tickets.length) await saveRecord(env, 'AuditLog', { user_id: user.id, nama_user: user.nama_lengkap, role_user: user.role, aksi: 'Auto-Archive Completed Tickets', modul: 'ServiceTicket', detail: `${tickets.length} tiket selesai otomatis diarsipkan`, tanggal: now() });
    return json({ success: true, archived_count: tickets.length });
  }
  throw new HttpError('Function not found', 404);
};

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return withCors(new Response(null, { status: 204 }));
    const url = new URL(request.url);
    try {
      let response;
      if (url.pathname.startsWith('/api/auth/')) response = await handleAuth(request, env, url.pathname);
      else if (url.pathname.startsWith('/api/entities/')) {
        const [, , , entity, actionId] = url.pathname.split('/');
        response = await handleEntity(request, env, decodeURIComponent(entity), actionId ? decodeURIComponent(actionId) : null);
      } else if (url.pathname.startsWith('/api/functions/')) response = await handleFunction(request, env, decodeURIComponent(url.pathname.split('/')[3]));
      else if (url.pathname.startsWith('/api/')) response = json({ error: 'API endpoint not found' }, 404);
      else response = await env.ASSETS.fetch(request);
      return withCors(response);
    } catch (error) {
      return withCors(json({ error_type: 'HTTPException', message: error.message || 'Internal server error', detail: error.data || null }, error.status || 500));
    }
  },
};
