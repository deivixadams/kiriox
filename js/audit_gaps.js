const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres:postgres@localhost:5432/cre_db?schema=corpus' });

async function run() {
    await client.connect();
    await client.query('SET search_path TO corpus');
    const FW = '5c613146-37b6-4335-8433-b5c99bee68d6';

    const r = await client.query(`
    SELECT * FROM (
      SELECT 'CRITICAL' AS severity, 'UNMAPPED_RISK' AS issue,
             r.id AS entity_id, r.code AS entity_code, r.name AS entity_name, r.risk_type AS context,
             NULL::text AS notes
      FROM corpus_risk r
      LEFT JOIN map_risk_control m ON m.risk_id = r.id AND m.framework_version_id = $1
      WHERE m.risk_id IS NULL

      UNION ALL

      SELECT 'CRITICAL', 'GLOBALLY_WEAK_RISK_MAX_LT_3',
             r.id, r.code, r.name, r.risk_type,
             ('best_strength=' || MAX(m.mitigation_strength))::text
      FROM map_risk_control m
      JOIN corpus_risk r ON r.id = m.risk_id
      WHERE m.framework_version_id = $1
      GROUP BY r.id, r.code, r.name, r.risk_type
      HAVING MAX(m.mitigation_strength) < 3

      UNION ALL

      SELECT 'HIGH', 'ORPHAN_CONTROL',
             c.id, c.code, c.name, NULL::text,
             'Control no mitiga ningún riesgo en esta versión.'
      FROM corpus_control c
      LEFT JOIN map_risk_control m ON m.control_id = c.id AND m.framework_version_id = $1
      WHERE m.control_id IS NULL

      UNION ALL

      SELECT 'HIGH', 'SINGLE_POINT_OF_FAILURE',
             r.id, r.code, r.name, r.risk_type,
             ('mappings=' || COUNT(*))::text
      FROM map_risk_control m
      JOIN corpus_risk r ON r.id = m.risk_id
      WHERE m.framework_version_id = $1
      GROUP BY r.id, r.code, r.name, r.risk_type
      HAVING COUNT(*) = 1
    ) AS combined
    ORDER BY
      CASE severity WHEN 'CRITICAL' THEN 1 WHEN 'HIGH' THEN 2 ELSE 3 END,
      issue,
      entity_code;
  `, [FW]);

    console.log('Total issues found:', r.rows.length);
    console.log('');
    for (const row of r.rows) {
        console.log(`[${row.severity}] ${row.issue} | ${row.entity_code} | ${row.entity_name} | ctx=${row.context || '-'} | ${row.notes || ''}`);
    }

    await client.end();
}
run().catch(e => { console.error(e.message); process.exit(1); });
