const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres:postgres@localhost:5432/cre_db?schema=corpus' });

async function run() {
    await client.connect();
    await client.query('SET search_path TO corpus');

    const FW = '5c613146-37b6-4335-8433-b5c99bee68d6';

    console.log('==============================================');
    console.log('CRE / MAP_RISK_CONTROL AUDIT REPORT');
    console.log('framework_version_id =', FW);
    console.log('generated_at =', new Date().toISOString());
    console.log('==============================================\n');

    // 0) SANITY
    const q0 = await client.query(`SELECT COUNT(*) AS mappings FROM map_risk_control WHERE framework_version_id = $1`, [FW]);
    console.log('--- 0) SANITY: TOTAL MAPPINGS ---');
    console.table(q0.rows);

    // A) Summary by risk type
    const qA = await client.query(`
    SELECT r.risk_type, COUNT(DISTINCT r.id) AS risks, COUNT(m.*) AS mappings,
      ROUND(AVG(m.mitigation_strength)::numeric,3) AS avg_strength,
      MIN(m.mitigation_strength) AS min_strength, MAX(m.mitigation_strength) AS max_strength
    FROM corpus_risk r LEFT JOIN map_risk_control m ON m.risk_id=r.id AND m.framework_version_id=$1
    GROUP BY r.risk_type ORDER BY r.risk_type
  `, [FW]);
    console.log('\n--- A) SUMMARY BY RISK TYPE ---');
    console.table(qA.rows);

    // 1) Unmapped risks
    const q1 = await client.query(`
    SELECT r.code, r.name, r.risk_type FROM corpus_risk r
    LEFT JOIN map_risk_control m ON m.risk_id=r.id AND m.framework_version_id=$1
    WHERE m.risk_id IS NULL ORDER BY r.risk_type, r.code
  `, [FW]);
    console.log('\n--- 1) UNMAPPED RISKS ---');
    if (q1.rows.length === 0) console.log('  (none)');
    else console.table(q1.rows);

    // 2) Orphan controls
    const q2 = await client.query(`
    SELECT c.code, c.name FROM corpus_control c
    LEFT JOIN map_risk_control m ON m.control_id=c.id AND m.framework_version_id=$1
    WHERE m.control_id IS NULL ORDER BY c.code
  `, [FW]);
    console.log('\n--- 2) ORPHAN CONTROLS ---');
    if (q2.rows.length === 0) console.log('  (none)');
    else console.table(q2.rows);

    // 3) Risks with weak links (min < 3)
    const q3 = await client.query(`
    SELECT r.code, r.name, r.risk_type, COUNT(*) AS mappings,
      MIN(m.mitigation_strength) AS min_str, MAX(m.mitigation_strength) AS max_str
    FROM map_risk_control m JOIN corpus_risk r ON r.id=m.risk_id
    WHERE m.framework_version_id=$1 GROUP BY r.id,r.code,r.name,r.risk_type
    HAVING MIN(m.mitigation_strength)<3 ORDER BY min_str ASC, mappings ASC, r.risk_type, r.code
  `, [FW]);
    console.log('\n--- 3) RISKS WITH WEAK LINKS (min < 3) ---');
    if (q3.rows.length === 0) console.log('  (none)');
    else console.table(q3.rows);

    // 3b) Globally weak (max < 3)
    const q3b = await client.query(`
    SELECT r.code, r.name, r.risk_type, COUNT(*) AS mappings,
      MAX(m.mitigation_strength) AS best_str
    FROM map_risk_control m JOIN corpus_risk r ON r.id=m.risk_id
    WHERE m.framework_version_id=$1 GROUP BY r.id,r.code,r.name,r.risk_type
    HAVING MAX(m.mitigation_strength)<3 ORDER BY best_str ASC, mappings ASC, r.risk_type, r.code
  `, [FW]);
    console.log('\n--- 3b) GLOBALLY WEAK RISKS (max < 3) ---');
    if (q3b.rows.length === 0) console.log('  (none)');
    else console.table(q3b.rows);

    // 4) Single point of failure
    const q4 = await client.query(`
    SELECT r.code, r.name, r.risk_type, COUNT(*) AS mappings
    FROM map_risk_control m JOIN corpus_risk r ON r.id=m.risk_id
    WHERE m.framework_version_id=$1 GROUP BY r.id,r.code,r.name,r.risk_type
    HAVING COUNT(*)=1 ORDER BY r.risk_type, r.code
  `, [FW]);
    console.log('\n--- 4) SINGLE POINT OF FAILURE (1 control) ---');
    if (q4.rows.length === 0) console.log('  (none)');
    else console.table(q4.rows);

    // 5) Terminal risks < 2 controls
    const q5 = await client.query(`
    SELECT r.code, r.name, COUNT(*) AS mappings
    FROM map_risk_control m JOIN corpus_risk r ON r.id=m.risk_id
    WHERE m.framework_version_id=$1 AND r.risk_type='TERMINAL'
    GROUP BY r.id,r.code,r.name HAVING COUNT(*)<2 ORDER BY mappings ASC, r.code
  `, [FW]);
    console.log('\n--- 5) TERMINAL RISKS WITH < 2 CONTROLS ---');
    if (q5.rows.length === 0) console.log('  (none)');
    else console.table(q5.rows);

    // 6) Duplicates
    const q6 = await client.query(`
    SELECT control_id, risk_id, COUNT(*) AS n
    FROM map_risk_control WHERE framework_version_id=$1
    GROUP BY control_id, risk_id, framework_version_id HAVING COUNT(*)>1
    ORDER BY n DESC, control_id, risk_id
  `, [FW]);
    console.log('\n--- 6) DUPLICATES (logical key) ---');
    if (q6.rows.length === 0) console.log('  (none)');
    else console.table(q6.rows);

    // 7) Quality violations
    const q7 = await client.query(`
    SELECT control_id, risk_id, mitigation_strength, effect_type
    FROM map_risk_control
    WHERE framework_version_id=$1
      AND (mitigation_strength IS NULL OR mitigation_strength<1 OR mitigation_strength>5
           OR COALESCE(TRIM(effect_type),'')='')
    ORDER BY risk_id, control_id
  `, [FW]);
    console.log('\n--- 7) QUALITY VIOLATIONS ---');
    if (q7.rows.length === 0) console.log('  (none)');
    else console.table(q7.rows);

    // 8) Broken references
    const q8 = await client.query(`
    SELECT m.control_id,
      CASE WHEN c.id IS NULL THEN true ELSE false END AS missing_control,
      m.risk_id,
      CASE WHEN r.id IS NULL THEN true ELSE false END AS missing_risk,
      m.mitigation_strength, m.effect_type
    FROM map_risk_control m
    LEFT JOIN corpus_risk r ON r.id=m.risk_id
    LEFT JOIN corpus_control c ON c.id=m.control_id
    WHERE m.framework_version_id=$1 AND (r.id IS NULL OR c.id IS NULL)
    ORDER BY missing_risk DESC, missing_control DESC
  `, [FW]);
    console.log('\n--- 8) BROKEN REFERENCES ---');
    if (q8.rows.length === 0) console.log('  (none)');
    else console.table(q8.rows);

    // 9) Top 20 risks by density
    const q9 = await client.query(`
    SELECT r.risk_type, r.code, r.name, COUNT(*) AS mappings,
      MIN(m.mitigation_strength) AS min_str, MAX(m.mitigation_strength) AS max_str,
      ROUND(AVG(m.mitigation_strength)::numeric,3) AS avg_str
    FROM map_risk_control m JOIN corpus_risk r ON r.id=m.risk_id
    WHERE m.framework_version_id=$1
    GROUP BY r.risk_type,r.code,r.name ORDER BY mappings DESC, avg_str DESC LIMIT 20
  `, [FW]);
    console.log('\n--- 9) TOP 20 RISKS BY MAPPING COUNT ---');
    console.table(q9.rows);

    // 10) Top 20 controls by usage
    const q10 = await client.query(`
    SELECT c.code, c.name, COUNT(*) AS mappings,
      ROUND(AVG(m.mitigation_strength)::numeric,3) AS avg_str,
      MIN(m.mitigation_strength) AS min_str, MAX(m.mitigation_strength) AS max_str
    FROM map_risk_control m JOIN corpus_control c ON c.id=m.control_id
    WHERE m.framework_version_id=$1
    GROUP BY c.code,c.name ORDER BY mappings DESC, avg_str DESC LIMIT 20
  `, [FW]);
    console.log('\n--- 10) TOP 20 CONTROLS BY USAGE ---');
    console.table(q10.rows);

    await client.end();
}

run().catch(e => { console.error(e); process.exit(1); });
