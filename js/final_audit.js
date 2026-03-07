const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres:postgres@localhost:5432/cre_db?schema=corpus' });

async function run() {
    await client.connect();
    await client.query('SET search_path TO corpus');

    try {
        const res = await client.query(`
WITH fw AS (
    SELECT '5c613146-37b6-4335-8433-b5c99bee68d6'::uuid AS framework_version_id
),
issues AS (
-- 1) RISKS GLOBALMENTE DÉBILES
SELECT 'GLOBALLY_WEAK_RISK' AS issue, r.code AS entity_code, r.name AS entity_name
FROM map_risk_control m
JOIN corpus_risk r ON r.id = m.risk_id
JOIN fw ON fw.framework_version_id = m.framework_version_id
GROUP BY r.id, r.code, r.name HAVING MAX(m.mitigation_strength) < 3

UNION ALL
-- 2) CONTROLES HUÉRFANOS
SELECT 'ORPHAN_CONTROL', c.code, c.name
FROM corpus_control c
LEFT JOIN map_risk_control m
    ON m.control_id = c.id
   AND m.framework_version_id = (SELECT framework_version_id FROM fw)
WHERE m.control_id IS NULL

UNION ALL
-- 3) SINGLE POINT OF FAILURE
SELECT 'SINGLE_POINT_RISK', r.code, r.name
FROM map_risk_control m
JOIN corpus_risk r ON r.id = m.risk_id
JOIN fw ON fw.framework_version_id = m.framework_version_id
GROUP BY r.id, r.code, r.name HAVING COUNT(*) = 1
)
SELECT * FROM issues ORDER BY issue, entity_code;
    `);

        console.log('Final Audit Query Results:');
        if (res.rows.length === 0) {
            console.log('No issues found! Everything is clean.');
        } else {
            console.table(res.rows);
        }
    } catch (err) {
        console.error('Error executing query:', err.message);
    } finally {
        await client.end();
    }
}

run();
