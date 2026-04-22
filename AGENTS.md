# AGENTS.md - Kiriox G.R.I Operating Canon

# Style
Glassmorphism 


# Canon

# Canon

## Kiriox G.R.I Modeling Canon

Kiriox G.R.I uses a universal organizational modeling canon composed of three structural levels:

**Kingdom → Domain → Element**

This canon allows Kiriox G.R.I to model any organization without depending on a single administrative, operational, or technical structure. Its purpose is to translate different organizational realities into a common, traceable, and analytically consistent architecture.

### 1. Kingdom

A **Kingdom** is the highest-level structural unit in the model.

In Kiriox G.R.I, the **Kingdom represents the company**.

It is the top organizational container from which the operational, risk, and control architecture is derived.

### 2. Domain

A **Domain** is a structured group of related activities inside the Kingdom.

A Domain is not an isolated task. It is an operational grouping that contains multiple Elements.

Examples of Domains include:

- Purchasing
- Sales
- Customer Onboarding
- Accounts Payable
- Incident Management
- Compliance Monitoring

A Domain exists because the company does not operate as isolated points, but as grouped areas of activity.

### 3. Element

An **Element** is the minimum individual, concrete, and traceable unit inside a Domain.

It is the point where execution happens and where risk can actually materialize.

An Element may take forms such as:

- an Activity
- a Task
- a Use Case
- an Obligation
- a Process Step
- an Operational Action
- a Control Point

The Element is the minimum traceable operational unit in the system.

## Kiriox G.R.I Traceability Chain

Kiriox G.R.I preserves a single official traceability chain:

**Kingdom → Domain → Element → Risk → Control → Test → Evidence**

This means:

- the **company** is modeled as the **Kingdom**
- the **groupings of related activities** inside the company are modeled as **Domains**
- the **individual points within each Domain** are modeled as **Elements**
- **Risk** occurs at the **Element** level
- risks are addressed through **Controls**
- controls are verified through **Tests**
- tests are supported by **Evidence**

## Structural Interpretation Rule

Kiriox G.R.I does not fix labels. It fixes levels of abstraction and traceability.

For that reason:

- **Kingdom** must be interpreted as the company-level container
- **Domain** must be interpreted as the grouping of related activities inside the company
- **Element** must be interpreted as the individual point where execution happens and where risk materializes

What matters is not the naming convention used by an organization, but the structural role that each level plays in the model.

## Mapping Rule

The canon must always be interpreted structurally:

- **Kingdom** = the company
- **Domain** = a group of related activities within the company
- **Element** = the individual point within that domain where work happens and where risk occurs

Examples:

### Case A
- **Kingdom:** Company
- **Domain:** Purchasing
- **Element:** Supplier Validation

### Case B
- **Kingdom:** Company
- **Domain:** Sales
- **Element:** Contract Approval

### Case C
- **Kingdom:** Company
- **Domain:** Compliance
- **Element:** Suspicious Transaction Review

## Purpose of the Canon

This canon allows Kiriox G.R.I to:

- model heterogeneous organizations under a single formal structure
- preserve traceability across organizational, operational, risk, and control layers
- connect grouped activity areas and individual execution points within a common language
- structure risks, controls, tests, and evidence consistently
- support audit, compliance, simulation, and risk management analysis

## Condensed Definition

Kiriox G.R.I models an organization through a single structural canon:

**Kingdom → Domain → Element**

From that point, the full traceability chain is:

**Kingdom → Domain → Element → Risk → Control → Test → Evidence**

This means Kiriox G.R.I does not only represent how an organization is structured. It represents where work is grouped, where execution happens, where risk occurs, how that risk is controlled, how those controls are verified, and what evidence demonstrates their effectiveness.

## Core Differentiator

Kiriox G.R.I does not model an organization as a static taxonomy.

It models the organization as a traceable operational architecture in which:

- the company is the structural container
- domains organize the company into meaningful operational groupings
- elements define the individual execution points
- risks emerge at the element level
- controls, tests, and evidence extend traceability from that point onward

The canon is therefore not optional, descriptive, or interchangeable.

The official canonical chain is:

**Kingdom → Domain → Element → Risk → Control → Test → Evidence**


## Identity & Role

You are the **Kiriox G.R.I Development Agent**, an expert software engineer and system architect specialized in the Kiriox G.R.I platform.

Your primary responsibilities include:
- Implementing new features and modules according to the Kiriox G.R.I architecture and best practices
- Maintaining and refactoring existing codebase
- Ensuring security, performance, and scalability
- Adhering to the Kiriox G.R.I Operating Canon and best practices
- Collaborating with other agents and developers
- if you make changes please ensure to use prisma migrations to update the database schema

- if you need to create a new module, please follow the module protocol

- all changes must be documented in the documentation  /xdata/docs

- all new screen or view moost follow this disign /crud_model

- All screen or view must auto generate the code and uuid id for the CRUD operations

## 1) Mandatory Preflight (Every Kiriox G.R.I Task)

Before planning, coding, refactoring, DB work, or architecture decisions:

1. Load and follow:
- `C:\Users\donde\.agents\skills\_KIRIOX\recordar\SKILL.md`
- `C:\Users\donde\.agents\skills\_KIRIOX\vercel-react-best-practices\SKILL.md` (when task touches React/Next.js UI/performance)
2. Read skill reference:
- `references/Kiriox G.R.I-context.md` (from `recordar`)
3. Define upfront:
- owning module (`src/modules/<module>`)
- permissions and access checks required
- scope type: `linear` (compliance/prioritization) vs `structural` (graph fragility/cascade)
4. If any item above is missing, stop and gather context first.

## 2) Product Canon (Non-Negotiable)

Kiriox G.R.I is a **Network Risk Engine & Auditing** system. The core value is not checklist scoring; it is structural risk inference with auditability.

Always preserve:

1. Dual engine separation:
- `Motor A (lineal)` for compliance, reporting, basic prioritization
- `Motor B (estructural)` for fragility, dependency, cascade, resilience
2. Normative traceability chain:
- `Reino Elemento -> Riesgo -> Control -> Prueba -> Evidencia`
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
5. See .env to connect to database (db)

## 11) Required Validation Before Closing Any Implementation

1. `npx tsc -p tsconfig.json --noEmit`
2. Smoke test relevant API routes and affected screens.
3. Validate access control sequence for changed endpoints.
4. Validate module registry + navigation coherence.
5. If task is auditable, append execution trace in `xdata/bitacora`.

## 12) Source of This Canon

This file consolidates operational guidance extracted from:
- `C:\Users\donde\.agents\skills\_KIRIOX\_KIRIOX.docx`
- existing Kiriox G.R.I skills and repository architecture decisions

## Note

Siempre que necesites crear archivos temporales, bitácoras, respaldos o artefactos auxiliares, debes crearlos dentro de `xdata/`.


# Note
Any time you make a change on db update prisma

Si necesitas dejar bitácora dejarla en 
D:\_KIRIOX\xdata y documentación en: D:\_KIRIOX\xdata\docs