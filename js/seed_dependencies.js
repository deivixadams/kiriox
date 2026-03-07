const { Client } = require('pg');

const client = new Client({
    connectionString: 'postgresql://postgres:postgres@localhost:5432/cre_db?schema=corpus'
});

const dependencies = [
    { parent_obligation_code: 'OB_001', child_obligation_code: 'OB_023', dependency_type: 'STRUCTURAL', dependency_strength: 5.0, collapse_trigger: true, propagation_multiplier: 2.0 },
    { parent_obligation_code: 'OB_023', child_obligation_code: 'OB_052', dependency_type: 'STRUCTURAL', dependency_strength: 4.0, collapse_trigger: false, propagation_multiplier: 1.5 },
    { parent_obligation_code: 'OB_052', child_obligation_code: 'OB_057', dependency_type: 'OPERATIONAL', dependency_strength: 5.0, collapse_trigger: true, propagation_multiplier: 2.5 },
    { parent_obligation_code: 'OB_047', child_obligation_code: 'OB_049', dependency_type: 'STRUCTURAL', dependency_strength: 5.0, collapse_trigger: true, propagation_multiplier: 2.5 },
    { parent_obligation_code: 'OB_033', child_obligation_code: 'OB_044', dependency_type: 'LEGAL', dependency_strength: 5.0, collapse_trigger: true, propagation_multiplier: 2.0 },
    { parent_obligation_code: 'OB_064', child_obligation_code: 'OB_057', dependency_type: 'DATA', dependency_strength: 4.5, collapse_trigger: false, propagation_multiplier: 1.4 },
    { parent_obligation_code: 'OB_015', child_obligation_code: 'OB_052', dependency_type: 'STRUCTURAL', dependency_strength: 4.0, collapse_trigger: false, propagation_multiplier: 1.3 },
    { parent_obligation_code: 'OB_062', child_obligation_code: 'OB_063', dependency_type: 'DATA', dependency_strength: 4.0, collapse_trigger: false, propagation_multiplier: 1.2 },
    { parent_obligation_code: 'OB_069', child_obligation_code: 'OB_071', dependency_type: 'LEGAL', dependency_strength: 4.0, collapse_trigger: false, propagation_multiplier: 1.3 },
    { parent_obligation_code: 'OB_049', child_obligation_code: 'OB_072', dependency_type: 'LEGAL', dependency_strength: 5.0, collapse_trigger: true, propagation_multiplier: 2.5 }
];

async function run() {
    await client.connect();
    let insertCount = 0;

    try {
        // Check if we need to map parent_id/child_id by fetching the mapping from corpus_obligation
        // Wait, the table definition check (see previous step) shows the columns are: 
        // parent_obligation_code, child_obligation_code, dependency_type, dependency_strength, collapse_trigger, propagation_multiplier
        // So we can insert directly without ID mapping as the columns use the string codes.

        console.log('Truncating corpus_obligation_dependencies (if exists any old data)...');
        await client.query('TRUNCATE TABLE corpus.corpus_obligation_dependencies;');

        for (const dep of dependencies) {
            const query = `
        INSERT INTO corpus.corpus_obligation_dependencies (
          parent_obligation_code, 
          child_obligation_code, 
          dependency_type, 
          dependency_strength, 
          collapse_trigger, 
          propagation_multiplier,
          created_at,
          updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      `;

            const values = [
                dep.parent_obligation_code,
                dep.child_obligation_code,
                dep.dependency_type,
                dep.dependency_strength,
                dep.collapse_trigger,
                dep.propagation_multiplier
            ];

            await client.query(query, values);
            console.log(`Inserted dependency: ${dep.parent_obligation_code} -> ${dep.child_obligation_code}`);
            insertCount++;
        }

        console.log(`\nSuccessfully inserted ${insertCount} dependencies into corpus_obligation_dependencies.`);

    } catch (err) {
        console.error('Error during execution:', err);
    } finally {
        await client.end();
    }
}

run();
