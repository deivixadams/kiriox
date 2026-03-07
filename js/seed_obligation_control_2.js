const { Client } = require('pg');

const client = new Client({
    connectionString: 'postgresql://postgres:postgres@localhost:5432/cre_db?schema=corpus'
});

// Fixed: null thresholds replaced with 1.0 (DIRECT mode requires a threshold)
const rows = [
    ['ef584e3c-9d85-4e4e-8c4d-05f1f6b64980', '6379d333-6d2a-4225-9af0-27b3efee1169', 'DIRECT', true, 1.0, 'HIGH'],
    ['4465d5fa-1967-4231-b4b2-cf6ee8c875e8', 'b2869522-f8b6-49cb-8155-92c226ed16c4', 'DIRECT', true, 0.8, 'HIGH'],
    ['ef584e3c-9d85-4e4e-8c4d-05f1f6b64980', 'f4f2d326-1dd0-4346-aece-2372d8c39be8', 'DIRECT', true, 1.0, 'HIGH'],
    ['4465d5fa-1967-4231-b4b2-cf6ee8c875e8', 'e1ae4f3a-2729-466e-88ca-00815dc83551', 'DIRECT', true, 0.8, 'HIGH'],
    ['38102e19-ef15-4b5e-b5b6-22dac2f944e7', '6d279505-b611-4a7a-8bb5-2cf6d52ee8b7', 'DIRECT', true, 0.8, 'HIGH'],
    ['fee37d66-283a-49ab-a48c-6a115a389d59', '26dc219a-2ca5-48dd-820e-af380ef53b2e', 'DIRECT', true, 1.0, 'HIGH'],
    ['d07877e5-9267-467b-ad2d-fa7de67e013d', '2cf0d3d5-d479-4dcd-9857-40a503fbe1a2', 'DIRECT', true, 1.0, 'HIGH'],
    ['18370ca2-220f-4f03-aaee-c0de4eed4252', '6dd11e67-cd09-43d6-b30b-4a1e8728e751', 'DIRECT', true, 1.0, 'HIGH'],
    ['20e355f1-34aa-4267-9303-eaba5d6b0bc2', '814d52fc-2983-467d-b2b1-b1ddad7881bb', 'DIRECT', true, 0.7, 'HIGH'],
    ['fee37d66-283a-49ab-a48c-6a115a389d59', '6b2bfd30-6bc0-4264-aeec-ee41f6f475b0', 'DIRECT', true, 1.0, 'HIGH'],
    ['6852a094-12eb-4eec-b919-7e5551c8f2ea', 'f96fb161-0efa-4145-bb68-e555a3da531e', 'DIRECT', true, 1.0, 'HIGH'],
    ['daee6d7d-cd7e-49dc-ade6-7e016795770c', 'f4611e30-23fc-47aa-a0eb-e6ab91ec8899', 'DIRECT', true, 0.8, 'HIGH'],
    ['ef584e3c-9d85-4e4e-8c4d-05f1f6b64980', '4e6f6fcf-3b63-401b-90b8-3f2f2df1bb4d', 'DIRECT', true, 1.0, 'HIGH'],
    ['8dac298e-636a-4c9e-b7f7-03e72bfc7e61', 'f1e536af-e389-44f7-bfaa-bba029fe5fb7', 'DIRECT', true, 0.7, 'HIGH'],
    ['ef584e3c-9d85-4e4e-8c4d-05f1f6b64980', '785b4d3d-0851-4f45-a0ca-d7bc3a2bd0cd', 'DIRECT', true, 1.0, 'HIGH'],
    ['bfa6b210-fc74-4a10-a560-52eb1a4c4999', 'c86954d8-7719-4dcc-8057-ff3c4a0964cd', 'DIRECT', true, 0.7, 'HIGH'],
    ['0e3c3eb4-3a45-4626-83cc-8a289a98a52b', '3d20479d-8a9c-4a9a-b0c8-10f2ebb3e232', 'DIRECT', true, 0.8, 'HIGH'],
    ['ef584e3c-9d85-4e4e-8c4d-05f1f6b64980', '897f3dfb-75cf-4883-a4f1-cc7e9e305545', 'DIRECT', true, 1.0, 'HIGH'],
    ['daee6d7d-cd7e-49dc-ade6-7e016795770c', '6d006ac3-ec92-4683-8b9a-f14bc24eae4b', 'DIRECT', true, 0.8, 'HIGH'],
    ['20e355f1-34aa-4267-9303-eaba5d6b0bc2', '9d3106c8-eb79-4329-bf89-1c2e3eb0b906', 'DIRECT', true, 1.0, 'HIGH'],
    ['8dac298e-636a-4c9e-b7f7-03e72bfc7e61', 'd1ea5025-add8-4c87-966f-4dc6f1d16cff', 'DIRECT', true, 0.7, 'HIGH'],
    ['e7fad54f-9f43-48cf-ae4e-352cbc176d31', '3bb6ef0d-988a-4437-bb40-eb03b457f818', 'DIRECT', true, 1.0, 'HIGH'],
    ['be19f642-15ad-46cb-888b-856239385a2a', '2d595699-d27b-48b2-9ac7-212b9b30145c', 'DIRECT', true, 1.0, 'HIGH'],
    ['fee37d66-283a-49ab-a48c-6a115a389d59', 'b39013e5-eaa4-488e-ad77-b6b2da1cc6e3', 'DIRECT', true, 0.7, 'HIGH'],
    ['ace8d3e4-cecc-4d00-b820-dfc1cb4b2333', '0336f07c-2e1c-4735-ad2f-100f8d02c4b5', 'DIRECT', true, 0.7, 'HIGH'],
    ['0a7e8deb-286d-41c6-9d25-67fc9189587e', '0217adce-16c9-4a9c-8d4c-9d83a7711236', 'DIRECT', true, 0.8, 'HIGH'],
    ['daee6d7d-cd7e-49dc-ade6-7e016795770c', 'b1ad2bb6-7e69-4b36-b63c-107eecadcad4', 'DIRECT', true, 1.0, 'HIGH'],
];

async function run() {
    await client.connect();
    let insertCount = 0;

    try {
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
            if (res.rowCount > 0) insertCount++;
            else console.log(`Skipped duplicate: ${r[0]} | ${r[1]}`);
        }

        console.log(`\nInserted: ${insertCount} new rows.`);
        const count = await client.query('SELECT COUNT(*) FROM corpus.map_obligation_control;');
        console.log(`Total rows in map_obligation_control: ${count.rows[0].count}`);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

run();
