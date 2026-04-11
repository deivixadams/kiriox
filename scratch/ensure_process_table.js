
const { Client } = require('pg');
require('dotenv').config();

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });
  await client.connect();
  
  // Create table core.process if it doesn't exist
  // We add category_id for the requirement
  await client.query(`
    CREATE TABLE IF NOT EXISTS core.process (
        process_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
        process_code VARCHAR(100) NOT NULL,
        process_name VARCHAR(255) NOT NULL,
        process_description TEXT,
        category_id BIGINT,
        rationale JSONB,
        sequence_order INTEGER,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        process_owner_user_id UUID,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        
        CONSTRAINT fk_process_category 
            FOREIGN KEY (category_id) 
            REFERENCES core.process_category(id)
            ON DELETE SET NULL
    );
    
    -- Sync with Prisma if needed later, but for now we have it in DB.
  `);
  
  console.log("Table core.process verified/created.");
  await client.end();
}

main().catch(console.error);
