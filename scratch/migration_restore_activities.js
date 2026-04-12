const { Client } = require('pg');
require('dotenv').config();

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    console.log('Renaming table...');
    await client.query('ALTER TABLE core."_borrame-significant_activity" RENAME TO significant_activity');
    
    console.log('Adding columns...');
    await client.query('ALTER TABLE core.significant_activity ADD COLUMN IF NOT EXISTS responsible TEXT');
    await client.query('ALTER TABLE core.significant_activity ADD COLUMN IF NOT EXISTS frequency TEXT');
    await client.query('ALTER TABLE core.significant_activity ADD COLUMN IF NOT EXISTS risk_weight NUMERIC');
    await client.query('ALTER TABLE core.significant_activity ADD COLUMN IF NOT EXISTS cascade_factor NUMERIC');
    await client.query('ALTER TABLE core.significant_activity ADD COLUMN IF NOT EXISTS is_cascade BOOLEAN DEFAULT false');
    
    console.log('Migration successful.');
  } catch (err) {
    console.error('Migration failed:', err.message);
  } finally {
    await client.end();
  }
}

main();
