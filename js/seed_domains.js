const { Client } = require('pg');

const client = new Client({
    connectionString: 'postgresql://postgres:postgres@localhost:5432/cre_db?schema=corpus'
});

const domains = [
    {
        code: 'DOM_01',
        name: 'Arquitectura de Responsabilidad Institucional',
        description: 'Define la responsabilidad del órgano de dirección y alta gerencia sobre el programa AML/CFT. Incluye gobierno corporativo, aprobación del marco AML, supervisión estratégica y asignación de recursos. Su objetivo es asegurar que el cumplimiento sea una función estructural y no operativa aislada. Es crítico porque establece la rendición de cuentas y el "tone at the top".',
        status: 'active',
        framework_version_id: '768b8105-935b-42e3-af21-dc63e5ff8292'
    },
    {
        code: 'DOM_02',
        name: 'Función de Cumplimiento',
        description: 'Regula la designación, independencia, autoridad y recursos del Oficial de Cumplimiento y su equipo. Incluye estructura organizacional, escalamiento y autonomía funcional. Su objetivo es garantizar ejecución técnica independiente del programa AML. Es esencial para evitar conflictos de interés y asegurar defensa regulatoria.',
        status: 'active',
        framework_version_id: '768b8105-935b-42e3-af21-dc63e5ff8292'
    },
    {
        code: 'DOM_03',
        name: 'Ingeniería de Gestión del Riesgo AML/CFT',
        description: 'Establece el enfoque basado en riesgo (RBA), metodologías de evaluación institucional, segmentación por clientes/productos/canales/países y validación de modelos. Su objetivo es identificar, medir y priorizar exposición. Es fundamental porque convierte obligaciones normativas en riesgo cuantificable.',
        status: 'active',
        framework_version_id: '768b8105-935b-42e3-af21-dc63e5ff8292'
    },
    {
        code: 'DOM_04',
        name: 'Gestión de Clientes y Beneficiarios Finales',
        description: 'Abarca CDD, EDD, identificación y verificación de clientes, beneficiarios finales, PEP, perfil económico y actualización continua. Su objetivo es prevenir el ingreso de riesgo indebido al sistema. Es crítico porque constituye la primera línea de defensa preventiva.',
        status: 'active',
        framework_version_id: '768b8105-935b-42e3-af21-dc63e5ff8292'
    },
    {
        code: 'DOM_05',
        name: 'Medidas Especiales y Restricciones (EDD, PEP, Sanciones Financieras)',
        description: 'Incluye listas de sanciones, congelamiento de activos, prohibiciones estructurales, restricciones a relaciones y controles hard-gate. Su objetivo es impedir relaciones o transacciones prohibidas por ley o sanciones internacionales. Es vital porque previene exposición inmediata y sanciones severas.',
        status: 'active',
        framework_version_id: '768b8105-935b-42e3-af21-dc63e5ff8292'
    },
    {
        code: 'DOM_06',
        name: 'Detección, Análisis y Reportería',
        description: 'Comprende monitoreo transaccional, análisis de alertas, gestión de casos, reportes a la UAF (ROS) y reportes regulatorios sistemáticos. Su objetivo es identificar actividad sospechosa y cumplir deberes de reporte. Es clave porque materializa la obligación de colaboración con el Estado.',
        status: 'active',
        framework_version_id: '768b8105-935b-42e3-af21-dc63e5ff8292'
    },
    {
        code: 'DOM_07',
        name: 'Integridad, Registros y Trazabilidad de Información',
        description: 'Incluye conservación de registros, integridad de datos, calidad, logs, controles de acceso y cadena de custodia. Su objetivo es garantizar evidencia verificable y defensa demostrable ante supervisión. Es esencial porque sin trazabilidad no existe defensa regulatoria.',
        status: 'active',
        framework_version_id: '768b8105-935b-42e3-af21-dc63e5ff8292'
    },
    {
        code: 'DOM_08',
        name: 'Supervisión Estatal y Potestad de Inspección',
        description: 'Regula la interacción con el supervisor y autoridades, entrega de información, inspecciones, requerimientos obligatorios y cooperación institucional. Su objetivo es asegurar capacidad de respuesta ante fiscalización. Es crítico porque determina la exposición dinámica frente al Estado.',
        status: 'active',
        framework_version_id: '768b8105-935b-42e3-af21-dc63e5ff8292'
    },
    {
        code: 'DOM_09',
        name: 'Régimen Sancionador Administrativo',
        description: 'Define infracciones, multas, criterios de graduación, agravantes y responsabilidad administrativa de la entidad. Su objetivo es modelar consecuencias regulatorias ante incumplimiento. Es fundamental para cuantificar impacto económico y reputacional.',
        status: 'active',
        framework_version_id: '768b8105-935b-42e3-af21-dc63e5ff8292'
    },
    {
        code: 'DOM_10',
        name: 'Marco Penal y Consecuencias Legales',
        description: 'Incluye tipificación penal relacionada con LA/FT, responsabilidad individual y corporativa, decomiso y consecuencias penales asociadas. Su objetivo es reflejar el riesgo legal estructural que trasciende la sanción administrativa. Es clave para medir riesgo existencial.',
        status: 'active',
        framework_version_id: '768b8105-935b-42e3-af21-dc63e5ff8292'
    }
];

async function run() {
    await client.connect();
    let insertCount = 0;

    try {
        for (const d of domains) {
            const query = `
        INSERT INTO corpus.corpus_domain (code, name, description, status, framework_version_id)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id;
      `;
            const values = [d.code, d.name, d.description, d.status, d.framework_version_id];
            const res = await client.query(query, values);
            console.log(`Inserted domain: ${d.name} with ID: ${res.rows[0].id}`);
            insertCount++;
        }

        console.log(`\nSuccessfully inserted ${insertCount} domains into corpus.corpus_domain.`);
    } catch (err) {
        console.error('Error inserting domains:', err);
    } finally {
        await client.end();
    }
}

run();
