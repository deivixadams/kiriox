const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

function loadEnv(envPath) {
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadEnv(path.resolve(__dirname, '..', '..', '.env'));

const sqlPath = path.resolve(__dirname, '20260226_security_users.sql');

async function ensureSecurityUserScopePK(client) {
  const res = await client.query(`
    SELECT c.conname, array_agg(a.attname ORDER BY a.attnum) AS cols
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    JOIN unnest(c.conkey) WITH ORDINALITY AS k(attnum, ord) ON true
    JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = k.attnum
    WHERE c.contype = 'p'
      AND n.nspname = 'corpus'
      AND t.relname = 'security_user_scope'
    GROUP BY c.conname;
  `);

  if (res.rows.length === 0) {
    return;
  }

  const currentPk = res.rows[0];
  const cols = currentPk.cols || [];
  if (cols.length === 1 && cols[0] === 'id') {
    return;
  }

  await client.query(`ALTER TABLE corpus.security_user_scope DROP CONSTRAINT "${currentPk.conname}";`);
  await client.query(`ALTER TABLE corpus.security_user_scope ADD PRIMARY KEY (id);`);
}

async function ensureScopeIdColumn(client) {
  const col = await client.query(`
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'corpus'
      AND table_name = 'security_user_scope'
      AND column_name = 'id'
    LIMIT 1;
  `);

  if (col.rowCount === 0) {
    await client.query(`ALTER TABLE corpus.security_user_scope ADD COLUMN id uuid DEFAULT gen_random_uuid();`);
    await client.query(`UPDATE corpus.security_user_scope SET id = gen_random_uuid() WHERE id IS NULL;`);
  }
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not configured');
  }

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  try {
    const sql = fs.readFileSync(sqlPath, 'utf8');
    await client.query('BEGIN');
    await client.query(sql);

    await ensureScopeIdColumn(client);
    await ensureSecurityUserScopePK(client);

    await client.query('COMMIT');
    console.log('Migration applied successfully.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', err);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

main();
