const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres:postgres@localhost:5432/cre_db?schema=corpus' });

async function run() {
    await client.connect();

    const query = `
    SELECT '00_SUMMARY' AS section,
      (SELECT COUNT(*) FROM corpus.corpus_obligation) AS obligations_total,
      (SELECT COUNT(*) FROM corpus.corpus_control) AS controls_total,
      (SELECT COUNT(*) FROM corpus.map_obligation_control) AS mappings_total,
      (SELECT COUNT(*) FROM corpus.map_obligation_control WHERE satisfaction_mode='DIRECT' AND regulator_acceptance='HIGH') AS mappings_direct_high
    ;
    
    SELECT '01_FK_MISSING_OBLIGATION' AS section, m.* FROM corpus.map_obligation_control m LEFT JOIN corpus.corpus_obligation o ON o.id = m.obligation_id WHERE o.id IS NULL;
    
    SELECT '02_FK_MISSING_CONTROL' AS section, m.* FROM corpus.map_obligation_control m LEFT JOIN corpus.corpus_control c ON c.id = m.control_id WHERE c.id IS NULL;
    
    SELECT '03_ORPHAN_OBLIGATIONS' AS section, o.id AS obligation_id, o.title AS obligation_title FROM corpus.corpus_obligation o WHERE NOT EXISTS (SELECT 1 FROM corpus.map_obligation_control m WHERE m.obligation_id = o.id) ORDER BY o.title;
    
    SELECT '04_ORPHAN_CONTROLS' AS section, c.id AS control_id, c.name AS control_name FROM corpus.corpus_control c WHERE NOT EXISTS (SELECT 1 FROM corpus.map_obligation_control m WHERE m.control_id = c.id) ORDER BY c.name;
    
    SELECT '05_NO_DIRECT_HIGH' AS section, o.id AS obligation_id, o.title AS obligation_title FROM corpus.corpus_obligation o WHERE NOT EXISTS (SELECT 1 FROM corpus.map_obligation_control m WHERE m.obligation_id = o.id AND m.satisfaction_mode = 'DIRECT' AND m.regulator_acceptance = 'HIGH') ORDER BY o.title;
    
    SELECT '06_DUPLICATES' AS section, control_id, obligation_id, COUNT(*) AS n FROM corpus.map_obligation_control GROUP BY control_id, obligation_id HAVING COUNT(*) > 1;
    
    SELECT '07_INVALID_ENUMS' AS section, * FROM corpus.map_obligation_control WHERE satisfaction_mode NOT IN ('DIRECT','INDIRECT','COMPENSATING') OR regulator_acceptance NOT IN ('HIGH','MED','LOW');
    
    SELECT '08_EVIDENCE_REQUIRED_NULL' AS section, * FROM corpus.map_obligation_control WHERE evidence_required IS NULL;
    
    SELECT '09_MIN_COVERAGE_OUT_OF_RANGE' AS section, * FROM corpus.map_obligation_control WHERE min_coverage_threshold IS NOT NULL AND (min_coverage_threshold < 0 OR min_coverage_threshold > 1);
    
    SELECT '10_EXISTENTIAL_NO_DIRECT_HIGH' AS section, o.id AS obligation_id, o.title AS obligation_title, (o.rationale::jsonb)->>'structural_level' AS structural_level FROM corpus.corpus_obligation o WHERE (o.rationale::jsonb)->>'structural_level' = 'EXISTENTIAL' AND NOT EXISTS (SELECT 1 FROM corpus.map_obligation_control m WHERE m.obligation_id = o.id AND m.satisfaction_mode = 'DIRECT' AND m.regulator_acceptance = 'HIGH') ORDER BY o.title;

    SELECT '11_OBLIGATION_COVERAGE_SUMMARY' AS section, o.id AS obligation_id, o.title AS obligation_title, COALESCE(COUNT(m.control_id),0) AS controls_mapped, COALESCE(SUM(CASE WHEN m.satisfaction_mode='DIRECT' AND m.regulator_acceptance='HIGH' THEN 1 ELSE 0 END),0) AS direct_high_count FROM corpus.corpus_obligation o LEFT JOIN corpus.map_obligation_control m ON m.obligation_id = o.id GROUP BY o.id, o.title ORDER BY direct_high_count ASC, controls_mapped ASC, o.title LIMIT 20;

    SELECT '12_TOP_CONTROLS_BY_OBLIGATION_COUNT' AS section, c.id AS control_id, c.name AS control_name, COUNT(m.obligation_id) AS obligations_supported FROM corpus.corpus_control c JOIN corpus.map_obligation_control m ON m.control_id = c.id GROUP BY c.id, c.name ORDER BY obligations_supported DESC, c.name LIMIT 50;

    SELECT '13_SAMPLE_MAPPINGS' AS section, o.title AS obligation, c.name AS control, m.satisfaction_mode, m.regulator_acceptance, m.evidence_required, m.min_coverage_threshold, m.created_at, m.updated_at FROM corpus.map_obligation_control m JOIN corpus.corpus_obligation o ON o.id = m.obligation_id JOIN corpus.corpus_control c ON c.id = m.control_id ORDER BY o.title, c.name LIMIT 20;
  `;

    try {
        const res = await client.query(query);

        res.forEach((r, i) => {
            console.log('\\n================ SECTION ' + i + ' ================');
            if (r.rows && r.rows.length > 0) {
                console.table(r.rows);
            } else {
                console.log('(Empty)');
            }
        });
    } catch (e) {
        console.error(e.message);
    } finally {
        await client.end();
    }
}

run();
