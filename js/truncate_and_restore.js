const { Client } = require('pg');
const c = new Client({ connectionString: 'postgresql://postgres:postgres@localhost:5432/cre_db?schema=corpus' });

(async () => {
    await c.connect();

    // 1. Truncate map_risk_control
    console.log('Truncating map_risk_control...');
    await c.query('TRUNCATE TABLE corpus.map_risk_control;');
    console.log('Done. map_risk_control is now empty.');

    // 2. Restore FK constraints that were dropped from tables referencing corpus_control
    const fksToRestore = [
        { table: 'corpus_control_obligation', col: 'control_id', name: 'corpus_control_obligation_control_id_fkey', onDelete: 'CASCADE' },
        { table: 'corpus_control_artifact', col: 'control_id', name: 'corpus_control_artifact_control_id_fkey', onDelete: 'CASCADE' },
        { table: 'corpus_control_risk_map', col: 'control_id', name: 'corpus_control_risk_control_id_fkey', onDelete: 'CASCADE' },
        { table: 'corpus_control_source', col: 'control_id', name: 'corpus_control_source_control_id_fkey', onDelete: 'CASCADE' },
        { table: 'corpus_test_control', col: 'control_id', name: 'corpus_control_test_control_fk', onDelete: 'CASCADE' },
        { table: 'corpus_test_control_procedure', col: 'control_id', name: 'corpus_control_test_procedure_control_id_fkey', onDelete: 'CASCADE' },
        { table: 'corpus_test_control_run', col: 'control_id', name: 'corpus_control_test_run_control_id_fkey', onDelete: 'CASCADE' },
        { table: 'corpus_material_event', col: 'control_id', name: 'corpus_material_event_control_id_fkey', onDelete: 'NO ACTION' },
        { table: 'corpus_evaluation_control_state', col: 'control_id', name: 'corpus_evaluation_control_state_control_id_fkey', onDelete: 'NO ACTION' },
        { table: 'corpus_model_run_control', col: 'control_id', name: 'corpus_model_run_control_control_id_fkey', onDelete: 'NO ACTION' },
        { table: 'map_obligation_control', col: 'control_id', name: 'fk_ocm_control', onDelete: 'CASCADE' },
        { table: 'corpus_audit_finding', col: 'control_id', name: 'corpus_audit_finding_control_id_fkey', onDelete: 'NO ACTION' },
    ];

    // Also restore FKs ON corpus_control itself (catalog references)
    const selfFks = [
        { table: 'corpus_control', col: 'control_type_id', ref: 'corpus_catalog_control_type', name: 'corpus_control_control_type_id_fkey', onDelete: 'NO ACTION' },
        { table: 'corpus_control', col: 'automation_id', ref: 'corpus_catalog_control_automation', name: 'corpus_control_automation_id_fkey', onDelete: 'NO ACTION' },
        { table: 'corpus_control', col: 'frequency_id', ref: 'corpus_catalog_control_frequency', name: 'corpus_control_frequency_id_fkey', onDelete: 'NO ACTION' },
        { table: 'corpus_control', col: 'primary_cf_risk_id', ref: 'corpus_risk', name: 'fk_control_primary_cf', onDelete: 'NO ACTION' },
    ];

    console.log('\nRestoring FK constraints referencing corpus_control...');
    for (const fk of fksToRestore) {
        try {
            await c.query(`ALTER TABLE corpus."${fk.table}" DROP CONSTRAINT IF EXISTS "${fk.name}";`);
            await c.query(`
        ALTER TABLE corpus."${fk.table}"
        ADD CONSTRAINT "${fk.name}"
        FOREIGN KEY ("${fk.col}") REFERENCES corpus.corpus_control(id)
        ON DELETE ${fk.onDelete} ON UPDATE NO ACTION NOT VALID;
      `);
            console.log(`  OK: ${fk.name} on ${fk.table}`);
        } catch (e) {
            console.log(`  SKIP: ${fk.name} on ${fk.table} -> ${e.message}`);
        }
    }

    console.log('\nRestoring FK constraints ON corpus_control (catalogs)...');
    for (const fk of selfFks) {
        try {
            await c.query(`ALTER TABLE corpus."${fk.table}" DROP CONSTRAINT IF EXISTS "${fk.name}";`);
            await c.query(`
        ALTER TABLE corpus."${fk.table}"
        ADD CONSTRAINT "${fk.name}"
        FOREIGN KEY ("${fk.col}") REFERENCES corpus."${fk.ref}"(id)
        ON DELETE ${fk.onDelete} ON UPDATE NO ACTION NOT VALID;
      `);
            console.log(`  OK: ${fk.name}`);
        } catch (e) {
            console.log(`  SKIP: ${fk.name} -> ${e.message}`);
        }
    }

    console.log('\nDone.');
    await c.end();
})();
