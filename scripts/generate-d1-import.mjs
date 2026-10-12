import { readdir, readFile, writeFile } from 'node:fs/promises';

const sql = (value) => `'${String(value ?? '').replaceAll("'", "''")}'`;
const nullable = (value) => value ? sql(value) : 'NULL';
const files = (await readdir('migration-export')).filter((file) => file.endsWith('.json') && file !== 'manifest.json');
const lines = [];

for (const file of files) {
  const entity = file.replace(/\.json$/, '');
  const records = JSON.parse(await readFile(`migration-export/${file}`, 'utf8'));
  for (const input of records) {
    const record = { ...input };
    const recordId = record.id || crypto.randomUUID();
    record.id = recordId;
    const created = record.created_date || null;
    const updated = record.updated_date || created;
    lines.push(`INSERT OR REPLACE INTO records(entity, id, data, created_date, updated_date) VALUES (${sql(entity)}, ${sql(recordId)}, ${sql(JSON.stringify(record))}, ${nullable(created)}, ${nullable(updated)});`);
  }
}

await writeFile('migration-export/d1-import.sql', `${lines.join('\n')}\n`);
console.log(`Generated ${lines.length - 2} INSERT statements.`);
