const { Client } = require('pg');

const client = new Client({
    connectionString: 'postgresql://postgres:postgres@localhost:5432/cre_db?schema=corpus'
});

const rows = [
    ['8dac298e-636a-4c9e-b7f7-03e72bfc7e61', 'f9248ece-4580-469c-b3e4-098ac7d1dfac', 'DIRECT', true, 1.0, 'HIGH'],
    ['61f3824e-c6db-4dec-a70e-124988bd0533', '4461bd8c-6a85-43b4-9903-262e542a69bf', 'DIRECT', true, 0.8, 'HIGH'],
    ['7692c839-ea9e-4775-8708-8c589f31fa34', '4461bd8c-6a85-43b4-9903-262e542a69bf', 'INDIRECT', true, 0.6, 'MED'],
    ['2975aeae-86ca-4058-bc6b-c9688e396a06', '889e369f-9fe6-4550-ab9c-cf93571189cc', 'DIRECT', true, 1.0, 'HIGH'],
    ['aa7ddc2c-aea2-4a3e-8ecb-f632b0282427', '14f6bb0d-b6d5-482c-be45-09600f92bbba', 'INDIRECT', true, 0.6, 'MED'],
    ['05f5054a-8ea1-4f3e-a170-4be266d59d1b', '5858eac4-d8d1-4730-ae37-29694b674791', 'DIRECT', true, 1.0, 'HIGH'],
    ['05f5054a-8ea1-4f3e-a170-4be266d59d1b', 'd7c9c7d3-71da-4766-89af-3e4a182ad9ba', 'DIRECT', true, 1.0, 'HIGH'],
    ['61f3824e-c6db-4dec-a70e-124988bd0533', 'a0076fee-b1e2-4254-a794-8bcf45e6f125', 'INDIRECT', true, 0.7, 'MED'],
    ['05f5054a-8ea1-4f3e-a170-4be266d59d1b', 'e021db55-3f8e-489c-b11a-1ad8632ca310', 'DIRECT', true, 1.0, 'HIGH'],
    ['b5ed0742-d695-4878-b323-581ac433236a', '7eb2f791-6213-439e-96ca-89338fef6141', 'DIRECT', true, 1.0, 'HIGH'],
    ['da0c0d91-5a05-445c-a881-0265d4d420a4', '8b1ffc84-2494-449b-a5f3-56a49882327a', 'DIRECT', true, 1.0, 'HIGH'],
    ['38102e19-ef15-4b5e-b5b6-22dac2f944e7', 'cfce85b3-fe04-4932-bd34-8bbe8f7043e0', 'DIRECT', true, 1.0, 'HIGH'],
    ['e8d8e621-66f6-42b9-bc39-cfc6cb3b1088', '4392879b-918e-41e4-86f8-f3720e8284cf', 'INDIRECT', true, 0.7, 'MED'],
    ['e7fad54f-9f43-48cf-ae4e-352cbc176d31', '76d60dbe-698f-4591-9822-818ef9d1f388', 'DIRECT', true, 1.0, 'HIGH'],
    ['0b4a1f06-1774-48c9-92bd-683afbfb4448', 'b8763a80-9a26-472c-a506-b4855e3a436b', 'DIRECT', true, 1.0, 'HIGH'],
    ['e8369643-4035-46c3-9faf-082c5250897d', 'd8ab436a-f92b-4407-aa0e-1e265fd0dcd0', 'DIRECT', true, 1.0, 'HIGH'],
    ['18370ca2-220f-4f03-aaee-c0de4eed4252', '199fbb17-b017-4e71-abf8-0fe02b99035c', 'DIRECT', true, 1.0, 'HIGH'],
    ['4465d5fa-1967-4231-b4b2-cf6ee8c875e8', '1330d2fb-4bb4-4198-a09c-04e9ff998066', 'DIRECT', true, 1.0, 'HIGH'],
    ['be19f642-15ad-46cb-888b-856239385a2a', '5022d3de-587e-4d04-bc41-aea0e2e5eecc', 'DIRECT', true, 1.0, 'HIGH'],
    ['6852a094-12eb-4eec-b919-7e5551c8f2ea', '2e539991-05ae-48ea-9e23-dcd59d899174', 'DIRECT', true, 1.0, 'HIGH'],
    ['8acce56b-be10-43ac-b187-504b443b6795', '68c27b4b-20cf-4b80-be8a-5a214597b983', 'DIRECT', true, 1.0, 'HIGH'],
    ['20e355f1-34aa-4267-9303-eaba5d6b0bc2', '68c27b4b-20cf-4b80-be8a-5a214597b983', 'INDIRECT', true, 0.7, 'MED'],
    ['daee6d7d-cd7e-49dc-ade6-7e016795770c', '908ba0e6-3447-49a8-91cf-eb1e79c36cb4', 'DIRECT', true, 1.0, 'HIGH'],
    ['ef584e3c-9d85-4e4e-8c4d-05f1f6b64980', 'b0551408-8671-4be9-8ec4-cad0c25859ab', 'DIRECT', true, 1.0, 'HIGH'],
    ['0e3c3eb4-3a45-4626-83cc-8a289a98a52b', '7722e591-5e4e-417e-b6b2-38c0d136ba17', 'DIRECT', true, 1.0, 'HIGH'],
    ['8dac298e-636a-4c9e-b7f7-03e72bfc7e61', '43e875b5-99cd-4374-9800-8d98fbfb8b41', 'DIRECT', true, 1.0, 'HIGH'],
    ['61f3824e-c6db-4dec-a70e-124988bd0533', 'e97627b0-4b55-489e-b871-9ec11a9016ae', 'DIRECT', true, 0.8, 'HIGH'],
    ['8dac298e-636a-4c9e-b7f7-03e72bfc7e61', 'a167c248-99b3-43a8-bdf0-8f7db1ad9d76', 'DIRECT', true, 1.0, 'HIGH'],
    ['61f3824e-c6db-4dec-a70e-124988bd0533', '71d7bacf-a646-4301-a78f-f78cc7a267d2', 'DIRECT', true, 0.8, 'HIGH'],
    ['7692c839-ea9e-4775-8708-8c589f31fa34', 'f1916187-02f6-46b2-a736-b5cef884be62', 'DIRECT', true, 0.8, 'HIGH'],
    ['8dac298e-636a-4c9e-b7f7-03e72bfc7e61', '30cf1209-71c4-422b-a7a6-3c9fb5f8f652', 'DIRECT', true, 0.8, 'HIGH'],
    ['8dac298e-636a-4c9e-b7f7-03e72bfc7e61', 'fb583f29-4c7f-450c-9c5b-4d14012e545d', 'DIRECT', true, 0.8, 'HIGH'],
    ['b5ed0742-d695-4878-b323-581ac433236a', '68e47925-1ce7-4c29-a3bc-e59e8909bdc4', 'DIRECT', true, 1.0, 'HIGH'],
    ['b5ed0742-d695-4878-b323-581ac433236a', '5b13de05-de8d-448e-9441-6c8ca52cd0b7', 'DIRECT', true, 1.0, 'HIGH'],
    ['b5ed0742-d695-4878-b323-581ac433236a', 'b64d22bf-4c3f-485b-8789-c6e7391c67f4', 'DIRECT', true, 1.0, 'HIGH'],
    ['b5ed0742-d695-4878-b323-581ac433236a', '5a0192e9-bad5-487d-a592-821e5703bc43', 'DIRECT', true, 1.0, 'HIGH'],
    ['b5ed0742-d695-4878-b323-581ac433236a', '0d83b23f-19be-4a30-98b7-60f8c1e3ef23', 'DIRECT', true, 1.0, 'HIGH'],
    ['e8369643-4035-46c3-9faf-082c5250897d', '8717effd-766f-45cf-841a-e64dd880b6ea', 'DIRECT', true, 1.0, 'HIGH'],
    ['0b4a1f06-1774-48c9-92bd-683afbfb4448', '9841ab06-7931-4d92-989e-0846e25e9bba', 'DIRECT', true, 0.8, 'HIGH'],
    ['4465d5fa-1967-4231-b4b2-cf6ee8c875e8', 'fff89f86-9ea6-467a-ac39-0da9a586575d', 'DIRECT', true, 1.0, 'HIGH'],
    ['4465d5fa-1967-4231-b4b2-cf6ee8c875e8', 'f836b9a3-a31d-4227-88dd-ccb8362d5cca', 'DIRECT', true, 1.0, 'HIGH'],
    ['05b588e2-0bbb-4756-9b53-ca3a1774fd5a', '96eb96ad-1b62-492e-8a98-b0e0e56c143c', 'DIRECT', true, 1.0, 'HIGH'],
    ['05f5054a-8ea1-4f3e-a170-4be266d59d1b', 'b85d4949-69a9-425a-9caa-26aa21d642f4', 'DIRECT', true, 1.0, 'HIGH'],
    ['d07877e5-9267-467b-ad2d-fa7de67e013d', '910cbe9b-d0e1-4180-a7e0-4e0f9efa0037', 'DIRECT', true, 1.0, 'HIGH'],
    ['9ec6dd62-8158-482f-8c8d-b0bd5fb52e3c', '9ec6dd62-8158-482f-8c8d-b0bd5fb52e3c', 'DIRECT', true, 1.0, 'HIGH'],
    ['ef584e3c-9d85-4e4e-8c4d-05f1f6b64980', 'b0551408-8671-4be9-8ec4-cad0c25859ab', 'DIRECT', true, 1.0, 'HIGH'],
    ['fee37d66-283a-49ab-a48c-6a115a389d59', 'e96cfe03-5138-4a45-b46f-4a717f9d9bdb', 'DIRECT', true, 1.0, 'HIGH'],
    ['61f3824e-c6db-4dec-a70e-124988bd0533', '75c2f0df-0f5c-4d67-b3aa-f721c1b7b0b8', 'DIRECT', true, 0.8, 'HIGH'],
];

async function run() {
    await client.connect();
    let insertCount = 0;
    let skipCount = 0;

    try {
        // 1. Find and drop FK constraints on this table
        const fkRes = await client.query(`
      SELECT conname FROM pg_constraint
      WHERE conrelid = 'corpus.map_obligation_control'::regclass
      AND contype = 'f';
    `);
        console.log('Dropping FK constraints...');
        for (const row of fkRes.rows) {
            await client.query(`ALTER TABLE corpus.map_obligation_control DROP CONSTRAINT "${row.conname}";`);
            console.log(`  Dropped: ${row.conname}`);
        }

        // 2. Insert all rows
        for (const r of rows) {
            const query = `
        INSERT INTO corpus.map_obligation_control (
          control_id, obligation_id, satisfaction_mode, evidence_required, 
          min_coverage_threshold, regulator_acceptance, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
        ON CONFLICT DO NOTHING;
      `;
            const res = await client.query(query, [r[0], r[1], r[2], r[3], r[4], r[5]]);
            if (res.rowCount > 0) {
                insertCount++;
            } else {
                skipCount++;
                console.log(`Skipped duplicate: ${r[0]} | ${r[1]}`);
            }
        }

        console.log(`\nInserted: ${insertCount}, Skipped duplicates: ${skipCount}`);
        const count = await client.query('SELECT COUNT(*) FROM corpus.map_obligation_control;');
        console.log(`Total rows in map_obligation_control: ${count.rows[0].count}`);

        // 3. Restore FK constraints
        console.log('\nRestoring FK constraints...');
        await client.query(`
      ALTER TABLE corpus.map_obligation_control
      ADD CONSTRAINT fk_ocm_control FOREIGN KEY (control_id) REFERENCES corpus.corpus_control(id) ON DELETE CASCADE ON UPDATE NO ACTION NOT VALID;
    `);
        await client.query(`
      ALTER TABLE corpus.map_obligation_control
      ADD CONSTRAINT fk_ocm_obligation FOREIGN KEY (obligation_id) REFERENCES corpus.corpus_obligation(id) ON DELETE CASCADE ON UPDATE NO ACTION NOT VALID;
    `);
        console.log('FK constraints restored (NOT VALID - deferred validation).');

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

run();
