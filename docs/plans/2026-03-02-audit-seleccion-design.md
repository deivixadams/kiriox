# Diseño: Paso 2 Selección de auditoría (dominios, obligaciones, riesgos)

Fecha: 2026-03-02

## Objetivo
Implementar el Paso 2 del wizard de auditorías para seleccionar dominios, obligaciones y riesgos reales del corpus, con filtrado consistente y conteos derivados, usando el mismo draft.

## Alcance
- UI de selección en `/validacion/auditorias/nueva` (Paso 2).
- Nuevos endpoints de catálogo para riesgos reales.
- Derivación de conteos reales (riesgos/controles) a partir de obligaciones activas.
- Sin cambios al esquema del draft ni a la persistencia (solo se usa `risk_ids`).
- Paso 3 manejará “aspectos agregados por el usuario” (fuera de este trabajo).

## Datos y API
### `GET /api/audit/catalog/risks`
Devuelve riesgos reales desde `corpus.corpus_risk` con columnas reales:
- `id`, `code`, `name`, `description`, `status`
- `riskTypeName` (desde `corpus_catalog_risk_type`)
- `riskLayerName` (desde `corpus_catalog_risk_layer`)
- `domainIds` (array derivado desde `corpus_obligation_risk` -> `corpus_obligation.domain_id`)

Soporta filtros:
- `domain_id=...` (múltiples)
- `obligation_id=...` (múltiples)

### `POST /api/audit/derive-scope`
- Resuelve obligaciones activas según modo (todas por dominio o subset).
- `riskCount`: `SELECT DISTINCT risk_id FROM corpus_obligation_risk WHERE obligation_id = ANY(...)`.
- `controlCount`: igual a la lógica actual.

## UI/UX
Paso 2 presenta:
1. **Dominios** (checkbox list).
2. **Obligaciones** (todas o subset; si subset, lista filtrada por dominios).
3. **Alcance derivado** (obligaciones, riesgos, controles, pruebas).
4. **Tabla de riesgos** (estilo similar a `RisksView`), con:
   - Columnas: Nivel (risk layer), Riesgo, Tipo, Estado.
   - Acciones: seleccionar todo, limpiar selección, contador.

### Reglas de filtrado
- Dominios filtran obligaciones y riesgos.
- Subset de obligaciones filtra riesgos por `obligation_id`.
- Cambios de dominios limpian selecciones inválidas de obligaciones y riesgos.

## Persistencia
Se mantiene en el draft:
- `domain_ids`, `obligation_ids`, `risk_ids`, `derived_counts`.

## Verificación manual
1. Seleccionar dominio: se cargan obligaciones y riesgos.
2. Cambiar a subset: riesgos se filtran por obligaciones seleccionadas.
3. Cambiar dominios: se limpian selecciones inválidas.
4. Guardar y recargar: se preservan selecciones.
5. Conteos derivados coinciden con el corpus.
