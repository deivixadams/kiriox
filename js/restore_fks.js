const { Client } = require('pg');

const client = new Client({
    connectionString: 'postgresql://postgres:postgres@localhost:5432/cre_db?schema=corpus'
});

const fks = [
    { table: 'corpus_material_event', col: 'obligation_id', cascade: false },
    { table: 'corpus_obligation_risk', col: 'obligation_id', cascade: true },
    { table: 'corpus_obligation_source', col: 'obligation_id', cascade: true },
    { table: 'corpus_control_obligation', col: 'obligation_id', cascade: true },
    { table: 'corpus_parameter_obligation_weight', col: 'obligation_id', cascade: false },
    { table: 'corpus_model_run_obligation', col: 'obligation_id', cascade: false },
    { table: 'corpus_audit_finding', col: 'obligation_id', cascade: false },
    { table: 'corpus_evaluation_scope', col: 'obligation_id', cascade: false }
];

async function run() {
    await client.connect();
    console.log('Restoring foreign key constraints...');

    for (const fk of fks) {
        const constraintName = `${fk.table}_${fk.col}_fkey`;
        try {
            // First drop if it somehow exists
            await client.query(`
        ALTER TABLE corpus."${fk.table}"
        DROP CONSTRAINT IF EXISTS "${constraintName}";
      `);

            const onDelete = fk.cascade ? 'CASCADE' : 'NO ACTION';

            // Add constraint back
            await client.query(`
        ALTER TABLE corpus."${fk.table}"
        ADD CONSTRAINT "${constraintName}"
        FOREIGN KEY ("${fk.col}")
        REFERENCES corpus.corpus_obligation(id)
        ON DELETE ${onDelete} ON UPDATE NO ACTION;
      `);
            console.log(`Success: Added ${constraintName} to ${fk.table}`);
        } catch (e) {
            if (e.message.includes('relation') && e.message.includes('does not exist')) {
                console.log(`Skipped: Table ${fk.table} does not exist or relation is invalid.`);
            } else {
                console.error(`Error adding constraint to ${fk.table}:`, e.message);
            }
        }
    }

    // Also verify corpus_obligation -> corpus_domain constraint was recreated or create it
    try {
        const domainFkName = 'corpus_obligation_domain_id_fkey';
        await client.query(`
        ALTER TABLE corpus.corpus_obligation
        DROP CONSTRAINT IF EXISTS "${domainFkName}";
     `);
        await client.query(`
        ALTER TABLE corpus.corpus_obligation
        ADD CONSTRAINT "${domainFkName}"
        FOREIGN KEY (domain_id)
        REFERENCES corpus.corpus_domain(id)
        ON DELETE CASCADE ON UPDATE NO ACTION;
     `);
        console.log(`Success: Added ${domainFkName} to corpus_obligation`);
    } catch (e) {
        console.error(`Error adding domain constraint to corpus_obligation:`, e.message);
    }

    await client.end();
}
run();
