# Auditoria Wizard Design (Draft-First)

Fecha: 2026-02-27

## Objetivo
Construir un wizard de auditoria que funcione como "proyecto guiado" y no como formulario. El flujo debe ser E2E con persistencia incremental, IA asistiendo redaccion y generacion de cuestionarios, y materializacion final en el corpus cuando el usuario finaliza.

## Decisiones clave
- Persistencia **draft-first**: se crea una nueva tabla `corpus_assessment_draft` y no se escriben registros definitivos hasta el paso final.
- Paso 1 es **Acta de Inicio** (layout basado en `ActaInicioView.tsx` de AMLAudit).
- Jurisdiccion/Marco/Version/Empresa se seleccionan **dentro del Acta** con prefill desde el usuario, pero editables.
- Campo "Marco normativo" se **prellena** automaticamente a partir de Marco + Version y es editable.

## Tabla nueva (aprobada)
**`corpus_assessment_draft`**

Campos sugeridos:
- id (uuid, PK)
- tenant_id (uuid)
- created_by (uuid)
- status (text: draft|in_progress|ready|materialized|abandoned)
- step (int)
- jurisdiction_id (uuid)
- framework_id (uuid)
- framework_version_id (uuid)
- company_id (uuid)
- acta (jsonb)  
  - entidad_nombre
  - periodo_inicio
  - periodo_fin
  - objetivo
  - alcance
  - marco_normativo
  - metodologia
  - lider_equipo
  - auditores
  - cronograma[]
- scope_config (jsonb)  
  - domain_ids[]
  - obligation_ids[]
  - derived_counts (risks, controls, tests)
- window_start (date)
- window_end (date)
- objectives (jsonb) (objetivos sugeridos + editables)
- team (jsonb)
- questionnaire (jsonb)
- guide (jsonb)
- manual_extensions (jsonb)
- created_at (timestamptz default now())
- updated_at (timestamptz default now())
- expires_at (timestamptz nullable)

## Flujo UX (7 pasos)
1) **Acta de Inicio (Contexto)**
   - Jurisdiccion / Marco / Version / Empresa (prefill desde usuario)
   - Entidad a auditar
   - Periodo de auditoria
   - Objetivo general (IA refina)
   - Alcance (IA refina)
   - Metodologia (IA refina)
   - Equipo auditor (lider + auditores)
   - Cronograma estimado
   - Boton "Generar Acta" (DOCX) y "Continuar"
   - Guarda en `acta` del draft.

2) **Alcance regulatorio**
   - Seleccion de dominios + obligaciones (todas o subset)
   - Derivacion en tiempo real: riesgos, controles, pruebas
   - Guarda en `scope_config`

3) **Ventana y objetivos**
   - Fecha inicio (default hoy) / fin
   - Objetivos narrativos (IA sugiere, usuario edita)
   - Guarda en `window_*` y `objectives`

4) **Equipo**
   - Participantes internos + roles
   - Sugerencias basadas en dominios y ownership
   - Guarda en `team`

5) **Generacion de cuestionarios (IA)**
   - Genera cuestionarios estructurados por area
   - Guarda en `questionnaire`

6) **Guia automatica de evaluacion**
   - Lista de obligaciones -> riesgos -> controles -> pruebas
   - Reordenar, priorizar, notas
   - Guarda en `guide`

7) **Extensiones manuales**
   - Aspectos fuera del corpus
   - Guarda en `manual_extensions`

## Materializacion final
Al finalizar:
- Crear `corpus_assessment` (company_id, framework_version_id, name, scope_notes)
- Crear `corpus_evaluation` (period_start, period_end, status_id, notes)
- Crear `corpus_evaluation_scope` (dominios/obligaciones)
- Marcar draft como `materialized`

## Endpoints (alto nivel)
- `POST /api/audit/drafts` crear draft
- `GET /api/audit/drafts/:id` leer draft
- `PATCH /api/audit/drafts/:id` guardar incremental
- `POST /api/audit/drafts/:id/materialize` crear assessment+evaluation
- `POST /api/acta-inicio/export` generar DOCX
- `POST /api/ai/refine-text` refinar texto
- `POST /api/ai/questionnaire` generar cuestionarios
- `POST /api/ai/audit-guide` generar guia

## Notas de integracion
- `src/app/auditoria/page.tsx`: boton "Nueva Auditoria" navega a `/auditoria/nueva`.
- Wizard dentro de `src/app/auditoria/nueva` (ruta nueva).
- Prefill desde `security_user_scope`.

## Riesgos
- Evitar crear basura en corpus si el usuario abandona -> usar draft.
- Guardado incremental con debounce.
- IA siempre sugiere; usuario decide.

