const { Client } = require('pg');

const client = new Client({
    connectionString: 'postgresql://postgres:postgres@localhost:5432/cre_db?schema=corpus'
});

const rows = [
    ['8dac298e-636a-4c9e-b7f7-03e72bfc7e61', 'cfa1ccb7-cf8f-4753-bb63-d175467d4f4f', 3, '768b8105-935b-42e3-af21-dc63e5ff8292', 'correct', 'Gestión central de hallazgos sostiene la existencia operativa del programa AML.', 'Seguimiento formal, responsables y remediación trazable.'],
    ['61f3824e-c6db-4dec-a70e-124988bd0533', 'cd65a681-428e-4b60-8a50-c7f0056af2b3', 3, '768b8105-935b-42e3-af21-dc63e5ff8292', 'detect', 'Auditoría independiente detecta debilidades de gobierno.', 'Plan anual y reporte a órgano de administración.'],
    ['7692c839-ea9e-4775-8708-8c589f31fa34', 'cd65a681-428e-4b60-8a50-c7f0056af2b3', 2, '768b8105-935b-42e3-af21-dc63e5ff8292', 'detect', 'Testing continuo identifica desviaciones estructurales.', 'Matriz de controles críticos y evidencia periódica.'],
    ['61f3824e-c6db-4dec-a70e-124988bd0533', 'edd2056a-47cd-4588-83a8-5a13b9e36b33', 3, '768b8105-935b-42e3-af21-dc63e5ff8292', 'detect', 'Auditoría valida actualización del programa.', 'Revisión documental y trazabilidad de versiones.'],
    ['aa7ddc2c-aea2-4a3e-8ecb-f632b0282427', 'd63febe6-5064-450b-a518-15497f5dcb5b', 2, '768b8105-935b-42e3-af21-dc63e5ff8292', 'prevent', 'Gobernanza de overrides evita distorsión del apetito AML.', 'Registro y justificación de cambios de rating.'],
    ['05f5054a-8ea1-4f3e-a170-4be266d59d1b', '20e6da15-2cee-4816-8d50-2d282f8a9263', 3, '768b8105-935b-42e3-af21-dc63e5ff8292', 'prevent', 'IAM asegura independencia funcional y segregación.', 'Roles y recertificación periódica.'],
    ['05f5054a-8ea1-4f3e-a170-4be266d59d1b', 'b8797dec-8783-4d53-9b49-50ad6fe04fa6', 3, '768b8105-935b-42e3-af21-dc63e5ff8292', 'prevent', 'Segregación reduce acceso indebido a datos AML.', 'Controles de acceso mínimos necesarios.'],
    ['05b588e2-0bbb-4756-9b53-ca3a1774fd5a', 'f106bbeb-0229-4549-af8e-caf7debb665e', 3, '768b8105-935b-42e3-af21-dc63e5ff8292', 'prevent', 'Control calidad datos reduce defectos estructurales.', 'KPIs de completitud y reconciliación.'],
    ['b5ed0742-d695-4878-b323-581ac433236a', '6cb65512-d8df-4854-a343-28ece721420a', 3, '768b8105-935b-42e3-af21-dc63e5ff8292', 'detect', 'Validación independiente fortalece RBA técnico.', 'Backtesting y documentación técnica.'],
    ['e8d8e621-66f6-42b9-bc39-cfc6cb3b1088', 'c610daea-8c5e-46f2-b9d4-43644098050e', 3, '768b8105-935b-42e3-af21-dc63e5ff8292', 'prevent', 'Monitoreo reforzado reduce subestimación del riesgo.', 'Segmentación ajustada por perfil.'],
    ['20962a58-10b1-4dd0-97bb-95f3196400ea', '0b89039e-02bd-4d86-90ff-941e4ce3936e', 2, '768b8105-935b-42e3-af21-dc63e5ff8292', 'prevent', 'Aprobación reforzada mitiga evaluación deficiente nuevos productos.', 'Revisión formal previa a lanzamiento.'],
    ['38102e19-ef15-4b5e-b5b6-22dac2f944e7', '5ac47a97-251b-49a3-bf12-6508b0d5a6fb', 3, '768b8105-935b-42e3-af21-dc63e5ff8292', 'prevent', 'Triggers operables aseguran ejecución de acciones.', 'Automatización sin discrecionalidad.'],
    ['da0c0d91-5a05-445c-a881-0265d4d420a4', 'a993feb1-e815-4cde-9875-9d4d945389f2', 3, '768b8105-935b-42e3-af21-dc63e5ff8292', 'detect', 'Gobierno del modelo gestiona drift estructural.', 'Registro de cambios y monitoreo continuo.'],
    ['2975aeae-86ca-4058-bc6b-c9688e396a06', '2e6223a2-184d-4543-b319-34568e6f6371', 2, '768b8105-935b-42e3-af21-dc63e5ff8292', 'prevent', 'Gestión formal de excepciones controla terceros AML.', 'Registro centralizado y aprobación documentada.'],
    ['7692c839-ea9e-4775-8708-8c589f31fa34', '581acad2-047c-4b79-af60-ec867cff5be4', 3, '768b8105-935b-42e3-af21-dc63e5ff8292', 'detect', 'Testing de controles identifica fallas estructurales.', 'Cobertura periódica sobre controles críticos.'],
    ['8dac298e-636a-4c9e-b7f7-03e72bfc7e61', '717d0d62-e901-4ef2-913f-2f1629e6c024', 3, '768b8105-935b-42e3-af21-dc63e5ff8292', 'correct', 'Gestión de remediación reduce persistencia de fallas.', 'SLAs y seguimiento ejecutivo.'],
    ['e7fad54f-9f43-48cf-ae4e-352cbc176d31', 'b2ea4573-1f18-4574-adca-98795e2f9743', 3, '768b8105-935b-42e3-af21-dc63e5ff8292', 'prevent', 'Hard-block evita apertura sin identidad válida.', 'Bloqueo sistémico obligatorio previo a onboarding.'],
    ['0b4a1f06-1774-48c9-92bd-683afbfb4448', 'd9862f44-5f9e-48f7-a18c-e33c32cc1248', 3, '768b8105-935b-42e3-af21-dc63e5ff8292', 'prevent', 'Verificación documental mitiga KYC insuficiente.', 'Integración antifraude y validación externa.'],
    ['e8369643-4035-46c3-9faf-082c5250897d', 'ae32bce6-c4ec-4321-8013-9f9ba01d5123', 3, '768b8105-935b-42e3-af21-dc63e5ff8292', 'prevent', 'Identificación de beneficiario final reduce opacidad.', 'Requerimiento documental obligatorio.'],
    ['4465d5fa-1967-4231-b4b2-cf6ee8c875e8', 'a313b97a-d4db-49d5-9596-2537dbed37ab', 3, '768b8105-935b-42e3-af21-dc63e5ff8292', 'prevent', 'Workflow EDD asegura aplicación cuando corresponde.', 'Bloqueo automático si no se completa EDD.'],
    ['4465d5fa-1967-4231-b4b2-cf6ee8c875e8', '0cd5b2fa-8f09-412b-a5eb-122c390b41c3', 3, '768b8105-935b-42e3-af21-dc63e5ff8292', 'detect', 'EDD por PEP detecta riesgo político no identificado.', 'Actualización periódica listas PEP.'],
    ['be19f642-15ad-46cb-888b-856239385a2a', '0b972768-3990-4699-b681-98a5609e2e55', 3, '768b8105-935b-42e3-af21-dc63e5ff8292', 'detect', 'Screening periódico detecta coincidencias sanciones.', 'Actualización automática listas.'],
    ['6852a094-12eb-4eec-b919-7e5551c8f2ea', '82412509-6e8b-4be0-8431-383d97d595e9', 3, '768b8105-935b-42e3-af21-dc63e5ff8292', 'prevent', 'Bloqueo automático ejecuta congelamiento.', 'Sin intervención manual.'],
    ['8acce56b-be10-43ac-b187-504b443b6795', '5eb4a754-6cfb-42b7-9d71-c4f89f2ce475', 3, '768b8105-935b-42e3-af21-dc63e5ff8292', 'detect', 'Motor monitoreo detecta patrones sospechosos.', 'Cobertura transaccional integral.'],
    ['0a7e8deb-286d-41c6-9d25-67fc9189587e', '1069cb76-bcc9-4fc5-8e59-8b2c445d7955', 2, '768b8105-935b-42e3-af21-dc63e5ff8292', 'detect', 'Cobertura y exclusiones justificadas reducen brechas.', 'Documentación formal de exclusiones.'],
    ['daee6d7d-cd7e-49dc-ade6-7e016795770c', 'c9af81bd-2602-4f56-aaf9-9f2211bc5761', 3, '768b8105-935b-42e3-af21-dc63e5ff8292', 'correct', 'Investigación reproducible mejora calidad decisión.', 'Evidencia completa del caso.'],
    ['daee6d7d-cd7e-49dc-ade6-7e016795770c', '89c5c6c7-b040-421a-8960-56d9cd7de9e9', 3, '768b8105-935b-42e3-af21-dc63e5ff8292', 'correct', 'Proceso formal reduce decisiones defectuosas.', 'Checklist documentado y revisión independiente.'],
    ['ef584e3c-9d85-4e4e-8c4d-05f1f6b64980', '0fbccfc1-475e-4166-a4cd-929d19ddb22f', 3, '768b8105-935b-42e3-af21-dc63e5ff8292', 'correct', 'ROS oportuno mitiga incumplimiento reporte.', 'Acuse de envío y trazabilidad.'],
    ['05f5054a-8ea1-4f3e-a170-4be266d59d1b', 'cbb0fd91-7e0a-4242-8413-51ce452f74a7', 2, '768b8105-935b-42e3-af21-dc63e5ff8292', 'prevent', 'Segregación funciones reduce riesgo tipping-off.', 'Restricción acceso a casos sensibles.'],
    ['0e3c3eb4-3a45-4626-83cc-8a289a98a52b', '360ba540-f0e7-461f-9fb3-b540c8d48e38', 3, '768b8105-935b-42e3-af21-dc63e5ff8292', 'evidence', 'Cadena de custodia protege integridad evidencia.', 'Registro completo de acciones.'],
    ['05f5054a-8ea1-4f3e-a170-4be266d59d1b', '3d1f9081-44a0-4412-9cc5-f35d11b209bf', 2, '768b8105-935b-42e3-af21-dc63e5ff8292', 'prevent', 'IAM asegura disponibilidad controlada ante autoridad.', 'Accesos priorizados y monitoreados.'],
    ['8acce56b-be10-43ac-b187-504b443b6795', '90a07f0e-f403-49f6-a112-45afd23f3705', 3, '768b8105-935b-42e3-af21-dc63e5ff8292', 'detect', 'Motor detecta patrones de colocación en efectivo.', 'Cobertura depósitos estructurados.'],
    ['20e355f1-34aa-4267-9303-eaba5d6b0bc2', '9a77d6fc-beed-46e9-96f1-cffe4af8f9bb', 3, '768b8105-935b-42e3-af21-dc63e5ff8292', 'detect', 'Escenarios específicos identifican smurfing.', 'Umbrales dinámicos y alertas agrupadas.'],
    ['20e355f1-34aa-4267-9303-eaba5d6b0bc2', '6a16587d-414c-46d9-be80-981be0a9495d', 3, '768b8105-935b-42e3-af21-dc63e5ff8292', 'detect', 'Escenarios layering detectan estratificación.', 'Rutas, hubs y circularidad.'],
    ['8acce56b-be10-43ac-b187-504b443b6795', '5373e1e8-b44d-4b24-9528-f400cb31e065', 2, '768b8105-935b-42e3-af21-dc63e5ff8292', 'detect', 'Motor identifica mezcla de fondos atípica.', 'Patrones in/out anómalos.'],
    ['8acce56b-be10-43ac-b187-504b443b6795', '0756c6b9-0060-4c07-8c22-dc24e3a879f3', 2, '768b8105-935b-42e3-af21-dc63e5ff8292', 'detect', 'Alta velocidad y rotación de activos detectada.', 'Indicadores turnover inusual.'],
    ['e8d8e621-66f6-42b9-bc39-cfc6cb3b1088', '8feeeb14-3e3c-4cfe-a282-b53b08669fe4', 2, '768b8105-935b-42e3-af21-dc63e5ff8292', 'detect', 'Monitoreo reforzado detecta integración progresiva.', 'Segmentación sectorial.'],
    ['20e355f1-34aa-4267-9303-eaba5d6b0bc2', '2b18e495-784a-4633-a11c-e3e911a76a84', 3, '768b8105-935b-42e3-af21-dc63e5ff8292', 'detect', 'Escenarios TBML detectan comercio atípico.', 'Cruce datos comercio exterior.'],
    ['8acce56b-be10-43ac-b187-504b443b6795', '1f9ddae7-c8bd-42d3-bf1e-5677c9709f3e', 3, '768b8105-935b-42e3-af21-dc63e5ff8292', 'detect', 'Motor identifica patrones de corresponsalía abusiva.', 'Análisis flujos nested.'],
    ['20e355f1-34aa-4267-9303-eaba5d6b0bc2', '7e86d48b-33c8-46f0-8bc3-27f78fc8a758', 2, '768b8105-935b-42e3-af21-dc63e5ff8292', 'detect', 'Escenarios detectan flujos transfronterizos opacos.', 'Alertas jurisdicción alto riesgo.'],
    ['e8d8e621-66f6-42b9-bc39-cfc6cb3b1088', '1c737ab8-07e3-43e3-82fa-cde9e5e7bfb0', 2, '768b8105-935b-42e3-af21-dc63e5ff8292', 'detect', 'Monitoreo reforzado mitiga arbitraje regulatorio.', 'Segmentación por país.'],
    ['8acce56b-be10-43ac-b187-504b443b6795', 'c29fd43b-f6da-4ea1-924e-139748b63329', 3, '768b8105-935b-42e3-af21-dc63e5ff8292', 'detect', 'Motor detecta abuso de canales digitales.', 'Indicadores velocidad y micro-transacciones.'],
    ['e8369643-4035-46c3-9faf-082c5250897d', 'ba330329-5d7c-416b-bde7-b859f76a108a', 2, '768b8105-935b-42e3-af21-dc63e5ff8292', 'prevent', 'Validación BF mitiga abuso fiduciario.', 'Revisión estructura jurídica.'],
    ['e8369643-4035-46c3-9faf-082c5250897d', '80c64e72-8661-4ace-af96-022c9d74802b', 2, '768b8105-935b-42e3-af21-dc63e5ff8292', 'prevent', 'Identificación estructura corporativa reduce abuso.', 'Documentación legal soporte.'],
    ['e8369643-4035-46c3-9faf-082c5250897d', '18e1c43e-0b55-4606-843f-48795841968c', 2, '768b8105-935b-42e3-af21-dc63e5ff8292', 'prevent', 'Identificación terceros reduce uso nominees.', 'Declaraciones formales.'],
    ['e8369643-4035-46c3-9faf-082c5250897d', '65e48960-8a09-469b-b267-86a99d922b03', 3, '768b8105-935b-42e3-af21-dc63e5ff8292', 'prevent', 'Identificación BF reduce opacidad estructural.', 'Revisión documental completa.'],
    ['0e3c3eb4-3a45-4626-83cc-8a289a98a52b', '3acfc1f6-cade-45b6-923d-320692e9a654', 2, '768b8105-935b-42e3-af21-dc63e5ff8292', 'evidence', 'Cadena de custodia permite detectar colusión.', 'Registro de decisiones y accesos.'],
    ['b5ed0742-d695-4878-b323-581ac433236a', 'd63febe6-5064-450b-a518-15497f5dcb5b', 2, '768b8105-935b-42e3-af21-dc63e5ff8292', 'detect', 'Validación independiente detecta incoherencia entre apetito y aplicación.', 'Revisión periódica parámetros.'],
    ['e8d8e621-66f6-42b9-bc39-cfc6cb3b1088', '26187359-7ceb-40c9-93f9-afacbeacae57', 2, '768b8105-935b-42e3-af21-dc63e5ff8292', 'detect', 'Monitoreo reforzado valida segmentación aplicada.', 'Revisión cohortes por riesgo.'],
    ['61f3824e-c6db-4dec-a70e-124988bd0533', '2e6223a2-184d-4543-b319-34568e6f6371', 2, '768b8105-935b-42e3-af21-dc63e5ff8292', 'detect', 'Auditoría evalúa debida diligencia sobre terceros.', 'Revisión contratos y monitoreo.'],
    ['4465d5fa-1967-4231-b4b2-cf6ee8c875e8', '2b18e495-784a-4633-a11c-e3e911a76a84', 2, '768b8105-935b-42e3-af21-dc63e5ff8292', 'prevent', 'EDD reforzado reduce riesgo comercio abusivo.', 'Sector comercio exterior.'],
    ['ef584e3c-9d85-4e4e-8c4d-05f1f6b64980', '2b18e495-784a-4633-a11c-e3e911a76a84', 2, '768b8105-935b-42e3-af21-dc63e5ff8292', 'correct', 'Reporte oportuno limita exposición regulatoria.', 'ROS documentado.'],
    ['05f5054a-8ea1-4f3e-a170-4be266d59d1b', '3acfc1f6-cade-45b6-923d-320692e9a654', 3, '768b8105-935b-42e3-af21-dc63e5ff8292', 'prevent', 'Segregación funciones reduce colusión.', 'Separación roles críticos.'],
    ['d07877e5-9267-467b-ad2d-fa7de67e013d', '3acfc1f6-cade-45b6-923d-320692e9a654', 2, '768b8105-935b-42e3-af21-dc63e5ff8292', 'detect', 'Logs permiten detectar actividad irregular.', 'Monitoreo accesos.'],
    ['ef584e3c-9d85-4e4e-8c4d-05f1f6b64980', 'c316f838-b08e-490c-a9a9-191f3ca2c57a', 2, '768b8105-935b-42e3-af21-dc63e5ff8292', 'correct', 'Reporte oportuno reduce sanción potencial.', 'Cumplimiento plazos legales.'],
    ['61f3824e-c6db-4dec-a70e-124988bd0533', 'c316f838-b08e-490c-a9a9-191f3ca2c57a', 2, '768b8105-935b-42e3-af21-dc63e5ff8292', 'detect', 'Auditoría reduce riesgo sanción grave.', 'Identificación temprana fallas.'],
    ['8dac298e-636a-4c9e-b7f7-03e72bfc7e61', 'dff54c52-57fd-4817-a8b4-a03d78e636bd', 3, '768b8105-935b-42e3-af21-dc63e5ff8292', 'correct', 'Gestión central evita acumulación de fallas.', 'Seguimiento transversal.'],
    ['7692c839-ea9e-4775-8708-8c589f31fa34', 'dff54c52-57fd-4817-a8b4-a03d78e636bd', 2, '768b8105-935b-42e3-af21-dc63e5ff8292', 'detect', 'Testing evita degradación sistémica.', 'Revisión periódica integral.'],
];

async function run() {
    await client.connect();
    let insertCount = 0;

    try {
        for (const r of rows) {
            const query = `
        INSERT INTO corpus.map_risk_control (
          control_id, risk_id, mitigation_strength, framework_version_id, effect_type, rationale, coverage_notes
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7);
      `;
            await client.query(query, r);
            insertCount++;
        }

        console.log(`Successfully inserted ${insertCount} rows into corpus.map_risk_control.`);
        const count = await client.query('SELECT COUNT(*) FROM corpus.map_risk_control;');
        console.log(`Total rows: ${count.rows[0].count}`);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

run();
