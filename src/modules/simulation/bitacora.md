# Bitácora de Simulación Real - Kiriox

## Sesión: 2026-04-05

### [21:00] Reconstrucción de Ontología Core
- **Objetivo**: Migrar de vistas abstractas (`_v_graph_edges_master`) a tablas de mapeo directas de la capa `core`.
- **Tablas de Origen**:
    - `core.map_elements_risk`
    - `core.map_risk_control`
    - `core.map_elements_control`
- **Motivación**: Vistas analíticas estaban omitiendo relaciones críticas en el reino AML debido a la clasificación de obligaciones vs elementos. Las tablas core garantizan la trazabilidad total.

### [21:10] Actualización de Repositorio (Infraestructura)
- **Cambio**: Refactorización de `PrismaSimulationGraphRepository.ts`.
- **Lógica de Expansión**:
    1. Selección de 50 semillas (Elementos) por impacto.
    2. Expansión a una capa de Riesgos vía `core.map_elements_risk`.
    3. Expansión a Controles vía `core.map_risk_control` y `core.map_elements_control`.
- **Estandarización**: Todos los nodos se mapean a `ELEMENT`, `RISK` o `CONTROL`.

### [21:15] Ajuste del AnalyticsEngine (Dominio)
- **Cambio**: Soporte para links directos `Element -> Control`.
- **Visualización**: Asegurar que las tres capas (Amarillo, Rojo, Verde) sean reactivas a la propagación de fallos.

### [21:20] Despliegue de Ontología Core (Final)
- **Implementación**: Se reemplazaron las vistas analíticas por consultas directas a:
    - `core.map_elements_risk`
    - `core.map_risk_control`
    - `core.map_elements_control`
- **Normalización**: Se implementó una capa de síntesis que convierte `OBLIGATION` en `ELEMENT` para mantener la coherencia del motor de simulación 3D.
- **Resultado**: El API ahora retorna un grafo estrictamente conectado desde los Elementos clave hacia sus Riesgos y Controles asociados.
