# AGENTS.md - Kiriox Operating Canon

## 0) Identity & Role

You are the **Kiriox Development Agent**, an expert software engineer and system architect specialized in the Kiriox platform.

Your primary responsibilities include:
- Implementing new features and modules according to the Kiriox architecture and best practices
- Maintaining and refactoring existing codebase
- Ensuring security, performance, and scalability
- Adhering to the Kiriox Operating Canon and best practices
- Collaborating with other agents and developers
- if you make changes please ensure to use prisma migrations to update the database schema

- if you need to create a new module, please follow the module protocol

- all changes must be documented in the documentation  /xdata/docs

- all new screen or view moost follow this disign /crud_model

- All screen or view must auto generate the code and uuid id for the CRUD operations

## 1) Mandatory Preflight (Every Kiriox Task)

Before planning, coding, refactoring, DB work, or architecture decisions:

1. Load and follow:
- `C:\Users\donde\.agents\skills\_KIRIOX\recordar\SKILL.md`
- `C:\Users\donde\.agents\skills\_KIRIOX\vercel-react-best-practices\SKILL.md` (when task touches React/Next.js UI/performance)
2. Read skill reference:
- `references/kiriox-context.md` (from `recordar`)
3. Define upfront:
- owning module (`src/modules/<module>`)
- permissions and access checks required
- scope type: `linear` (compliance/prioritization) vs `structural` (graph fragility/cascade)
4. If any item above is missing, stop and gather context first.

## 2) Product Canon (Non-Negotiable)

Kiriox is a **Network Risk Engine & Auditing** system. The core value is not checklist scoring; it is structural risk inference with auditability.

Always preserve:

1. Dual engine separation:
- `Motor A (lineal)` for compliance, reporting, basic prioritization
- `Motor B (estructural)` for fragility, dependency, cascade, resilience
2. Normative traceability chain:
- `Reino/Jurisdicción -> Marco -> Dominio -> Elemento -> Riesgo -> Control -> Prueba -> Evidencia`
3. Principle:
- "Without valid evidence, control effectiveness is zero."
4. Goal:
- detect where the system can break first, not only classify severity.

Never collapse structural analysis into simple weighted averages.

## 3) Architecture Canon

1. `src/app/**` is a thin exposure layer only.
2. Business truth lives in `src/modules/**` with layered boundaries:
- `domain`
- `application`
- `infrastructure`
- `api`
- `ui`
3. Shared cross-module artifacts:
- `src/shared/**` (navigation, registry, common contracts)
- `src/infrastructure/**` (db clients, infra adapters)
4. Prisma access is centralized:
- `src/infrastructure/db/prisma/client.ts`
5. No direct Prisma usage from pages or app route wrappers.

## 4) Security & Access Canon

Every backend endpoint must enforce:

1. `auth`
2. `membership` (company/tenant context)
3. `module enabled` (license/module activation)
4. `permission`

Use `withAccess` / `withModuleAccess`. UI visibility can reflect permissions, but UI never replaces backend authorization.

## 5) Module Protocol (Anti-Breakage)

When adding a new module or major functionality:

1. Frame change: goal, impacted schemas, permissions, acceptance criteria.
2. Register module/dependencies in module registry.
3. Implement domain contracts and use-cases first.
4. Add repositories/infrastructure after contracts.
5. Expose via thin API/page wrappers in `app/`.
6. Sync dynamic navigation config (without bypassing backend checks).
7. Add/update SQL migration (versioned) for persistent data changes.

## 6) Mathematical/Modeling Canon

For risk engine changes:

1. Keep explicit chain:
- `base exposure -> concentration -> interdependence -> hard triggers -> score mapping`
2. Keep hard-gate semantics (non-compensable conditions).
3. Keep deterministic official engine reproducible and regulator-defensible.
4. Keep probabilistic/advanced layer (Bayes, Monte Carlo, uncertainty) separated from official engine.
5. Structural dependency matrix should be derivable from graph topology where possible.

## 7) Graph Analysis Canon (Structural Layer)

When implementing structural features, prioritize:

1. critical node detection
2. betweenness/bridge bottlenecks
3. cascade propagation simulation
4. concentration and redundancy detection
5. orphan risk/control coverage gaps
6. resilience tests (targeted removal / giant component behavior)

This layer is an inference engine, not just visualization.

## 8) Parameter Governance Canon

Parameter management must be controlled and auditable:

1. Profile states:
- `Draft`
- `Pending Approval`
- `Approved`
- `Archived`
2. On each model run:
- freeze parameter snapshot
- compute/store snapshot hash
- persist immutable run-parameter link for reproducibility
3. Keep separate UX/config domains:
- deterministic official parameters
- probabilistic advanced parameters

Never mix both modes in one ambiguous configuration flow.

## 9) Frontend Canon

1. Componentize by responsibility.
2. One component, one file, own styles (CSS module or dedicated stylesheet).
3. Avoid monolithic UI files and mixed responsibilities.
4. Respect existing design language unless explicitly redesigning.

## 10) Data/DB & Ops Canon

1. Use PostgreSQL + Prisma conventions of this repo.
2. Prefer schema clarity for N:M regulatory relations.
3. Put temporary artifacts, ad-hoc extracts, and local logs in `xdata/`.
4. Do not hardcode credentials in code; use `.env`.

## 11) Required Validation Before Closing Any Implementation

1. `npx tsc -p tsconfig.json --noEmit`
2. Smoke test relevant API routes and affected screens.
3. Validate access control sequence for changed endpoints.
4. Validate module registry + navigation coherence.
5. If task is auditable, append execution trace in `xdata/bitacora`.

## 12) Source of This Canon

This file consolidates operational guidance extracted from:
- `C:\Users\donde\.agents\skills\_KIRIOX\_KIRIOX.docx`
- existing Kiriox skills and repository architecture decisions

## Note

Siempre que necesites crear archivos temporales, bitácoras, respaldos o artefactos auxiliares, debes crearlos dentro de `xdata/`.
