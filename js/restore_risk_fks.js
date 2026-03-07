const { Client } = require('pg');

const client = new Client({
    connectionString: 'postgresql://postgres:postgres@localhost:5432/cre_db?schema=corpus'
});

// From schema.prisma, the FK constraints that reference corpus_risk are:
// 1. corpus_control.primary_cf_risk_id -> corpus_risk.id (fk_control_primary_cf)
// 2. corpus_control_artifact_risk.risk_id -> corpus_risk.id
// 3. corpus_control_risk_map.risk_id -> corpus_risk.id (corpus_control_risk_risk_id_fkey)
// 4. corpus_material_event.risk_id -> corpus_risk.id
// 5. corpus_obligation_risk.risk_id -> corpus_risk.id
// 6. corpus_risk.parent_risk_id -> corpus_risk.id (self-ref: fk_corpus_risk_parent_risk_id)
// 7. corpus_risk_source.risk_id -> corpus_risk.id
// 8. corpus_audit_finding.risk_id -> corpus_risk.id
// Also the catalog FKs on corpus_risk itself:
// 9. corpus_risk.risk_layer_id -> corpus_catalog_risk_layer.id (fk_corpus_risk_risk_layer_id)
// 10. corpus_risk.risk_type_id -> corpus_catalog_risk_type.id (fk_corpus_risk_risk_type_id)
// 11. corpus_risk.status_id -> corpus_catalog_status.id (fk_corpus_risk_status_id)

const fksToRestore = [
    { table: 'corpus_control', col: 'primary_cf_risk_id', ref: 'corpus_risk', refCol: 'id', name: 'fk_control_primary_cf', onDelete: 'NO ACTION' },
    { table: 'corpus_control_artifact_risk', col: 'risk_id', ref: 'corpus_risk', refCol: 'id', name: 'corpus_control_artifact_risk_risk_id_fkey', onDelete: 'CASCADE' },
    { table: 'corpus_control_risk_map', col: 'risk_id', ref: 'corpus_risk', refCol: 'id', name: 'corpus_control_risk_risk_id_fkey', onDelete: 'CASCADE' },
    { table: 'corpus_material_event', col: 'risk_id', ref: 'corpus_risk', refCol: 'id', name: 'corpus_material_event_risk_id_fkey', onDelete: 'NO ACTION' },
    { table: 'corpus_obligation_risk', col: 'risk_id', ref: 'corpus_risk', refCol: 'id', name: 'corpus_obligation_risk_risk_id_fkey', onDelete: 'NO ACTION' },
    { table: 'corpus_risk', col: 'parent_risk_id', ref: 'corpus_risk', refCol: 'id', name: 'fk_corpus_risk_parent_risk_id', onDelete: 'NO ACTION' },
    { table: 'corpus_risk_source', col: 'risk_id', ref: 'corpus_risk', refCol: 'id', name: 'corpus_risk_source_risk_id_fkey', onDelete: 'CASCADE' },
    { table: 'corpus_audit_finding', col: 'risk_id', ref: 'corpus_risk', refCol: 'id', name: 'corpus_audit_finding_risk_id_fkey', onDelete: 'NO ACTION' },
    // Catalog FKs on corpus_risk itself
    { table: 'corpus_risk', col: 'risk_layer_id', ref: 'corpus_catalog_risk_layer', refCol: 'id', name: 'fk_corpus_risk_risk_layer_id', onDelete: 'NO ACTION' },
    { table: 'corpus_risk', col: 'risk_type_id', ref: 'corpus_catalog_risk_type', refCol: 'id', name: 'fk_corpus_risk_risk_type_id', onDelete: 'NO ACTION' },
    { table: 'corpus_risk', col: 'status_id', ref: 'corpus_catalog_status', refCol: 'id', name: 'fk_corpus_risk_status_id', onDelete: 'NO ACTION' },
];

async function run() {
    await client.connect();
    console.log('Restoring FK constraints for corpus_risk...\n');

    for (const fk of fksToRestore) {
        try {
            await client.query(`ALTER TABLE corpus."${fk.table}" DROP CONSTRAINT IF EXISTS "${fk.name}";`);
            await client.query(`
        ALTER TABLE corpus."${fk.table}"
        ADD CONSTRAINT "${fk.name}"
        FOREIGN KEY ("${fk.col}")
        REFERENCES corpus."${fk.ref}"("${fk.refCol}")
        ON DELETE ${fk.onDelete} ON UPDATE NO ACTION;
      `);
            console.log(`OK: ${fk.name} on ${fk.table}`);
        } catch (e) {
            console.error(`SKIP: ${fk.name} on ${fk.table} -> ${e.message}`);
        }
    }

    console.log('\nDone restoring FK constraints.');
    await client.end();
}

run();
