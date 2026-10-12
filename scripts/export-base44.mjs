import { mkdir, writeFile } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';

const loadEnv = (path) => {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match || process.env[match[1]]) continue;
    process.env[match[1]] = match[2].trim().replace(/^['"]|['"]$/g, '');
  }
};

loadEnv('.env.migration.local');

const token = process.env.BASE44_SERVICE_TOKEN;
const appId = process.env.BASE44_APP_ID;
const baseUrl = (process.env.BASE44_APP_BASE_URL || 'https://base44.app').replace(/\/+$/, '');
if (!token || !appId) throw new Error('BASE44_SERVICE_TOKEN dan BASE44_APP_ID wajib diisi');

const entities = [
  'User', 'Employee', 'Unit', 'Service', 'ServiceRequirement', 'ServiceTicket',
  'TicketChecklist', 'TicketComment', 'TicketDocument', 'TicketStatusHistory',
  'LeaveRequest', 'KgbRecord', 'FunctionalPositionTest', 'DocumentArchive',
  'DocumentTemplate', 'Regulation', 'Notification', 'AuditLog',
];

const headers = {
  Authorization: `Bearer ${token}`,
  'X-App-Id': appId,
};

const fetchPage = async (entity, skip) => {
  const url = new URL(`${baseUrl}/api/apps/${appId}/entities/${entity}`);
  url.searchParams.set('limit', '1000');
  url.searchParams.set('skip', String(skip));
  const response = await fetch(url, { headers });
  const text = await response.text();
  if (!response.ok) throw new Error(`${entity}: HTTP ${response.status} ${text.slice(0, 300)}`);
  const data = JSON.parse(text);
  if (!Array.isArray(data)) throw new Error(`${entity}: response bukan array`);
  return data;
};

await mkdir('migration-export', { recursive: true });
const manifest = { exported_at: new Date().toISOString(), app_id: appId, entities: {} };

for (const entity of entities) {
  const records = [];
  let skip = 0;
  while (true) {
    const page = await fetchPage(entity, skip);
    records.push(...page);
    process.stdout.write(`${entity}: ${records.length}\n`);
    if (page.length < 1000) break;
    skip += page.length;
  }
  await writeFile(`migration-export/${entity}.json`, `${JSON.stringify(records, null, 2)}\n`);
  manifest.entities[entity] = records.length;
}

await writeFile('migration-export/manifest.json', `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Export selesai: ${Object.values(manifest.entities).reduce((a, b) => a + b, 0)} record.`);
