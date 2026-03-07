# Diseo: Paso 2 Seleccin de auditora (dominios, obligaciones, riesgos)

Fecha: 2026-03-02

## Objetivo
Implementar el Paso 2 del wizard de auditoras para seleccionar dominios, obligaciones y riesgos reales del corpus, con filtrado consistente y conteos derivados, usando el mismo draft.

## Alcance
- UI de seleccin en `/validacion/auditorias/nueva` (Paso 2).
- Nuevos endpoints de catlogo para riesgos reales.
- Derivacin de conteos reales (riesgos/controles) a partir de obligaciones activas.
- Sin cambios al esquema del draft ni a la persistencia (solo se usa `risk_ids`).
- Paso 3 manejar aspectos agregados por el usuario (fuera de este trabajo).

## Datos y API
### `GET /api/audit/catalog/risks`
Devuelve riesgos reales desde `corpus.risk` con columnas reales:
- `id`, `code`, `name`, `description`, `status`
- `riskTypeName` (desde `catalogos.corpus_catalog_risk_type`)
- `riskLayerName` (desde `catalogos.corpus_catalog_risk_layer`)
- `domainIds` (array derivado desde `corpus.obligation_risk` -> `corpus.obligation.domain_id`)

Soporta filtros:
- `domain_id=...` (mltiples)
- `obligation_id=...` (mltiples)

### `POST /api/audit/derive-scope`
- Resuelve obligaciones activas segn modo (todas por dominio o subset).
- `riskCount`: `SELECT DISTINCT risk_id FROM corpus.obligation_risk WHERE obligation_id = ANY(...)`.
- `controlCount`: igual a la lgica actual.

## UI/UX
Paso 2 presenta:
1. **Dominios** (checkbox list).
2. **Obligaciones** (todas o subset; si subset, lista filtrada por dominios).
3. **Alcance derivado** (obligaciones, riesgos, controles, pruebas).
4. **Tabla de riesgos** (estilo similar a `RisksView`), con:
   - Columnas: Nivel (risk layer), Riesgo, Tipo, Estado.
   - Acciones: seleccionar todo, limpiar seleccin, contador.

### Reglas de filtrado
- Dominios filtran obligaciones y riesgos.
- Subset de obligaciones filtra riesgos por `obligation_id`.
- Cambios de dominios limpian selecciones invlidas de obligaciones y riesgos.

## Persistencia
Se mantiene en el draft:
- `domain_ids`, `obligation_ids`, `risk_ids`, `derived_counts`.

## Verificacin manual
1. Seleccionar dominio: se cargan obligaciones y riesgos.
2. Cambiar a subset: riesgos se filtran por obligaciones seleccionadas.
3. Cambiar dominios: se limpian selecciones invlidas.
4. Guardar y recargar: se preservan selecciones.
5. Conteos derivados coinciden con el corpus.
