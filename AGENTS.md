# AGENTS.md - Kiriox

## Mandatory Pre-Coding Preflight (Kiriox)

Before planning, coding, refactoring, or proposing architecture in this repository, every agent must:

1. Load and follow `C:\Users\donde\.agents\skills\_KIRIOX\recordar\SKILL.md`.
2. Read `references/kiriox-context.md` from that skill.
3. Define:
- owning module (`src/modules/<module>`)
- required permissions
- whether the change belongs to linear analysis or structural graph analysis
4. If any preflight item is missing, stop and gather context first.

## Enforced Architectural Rules

1. `app/` is exposure only (thin wrappers for routes/pages).
2. Business logic must live in `src/modules/*` by layers:
- `domain`
- `application`
- `infrastructure`
- `api`
- `ui`
3. Prisma access must be centralized through:
- `src/infrastructure/db/prisma/client.ts`
4. Every backend endpoint must enforce access with `withAccess` or `withModuleAccess`:
- auth -> membership -> module enabled -> permission
5. Navigation must reflect effective access, never replace backend authorization.

## Change Safety Gate (required before closing)

1. Run: `npx tsc -p tsconfig.json --noEmit`
2. Verify read/write permissions for affected endpoints.
3. Ensure module registry/dependencies remain coherent when module scope changes.
4. Document outcome in project bitacora when the task requires auditable execution trace.

