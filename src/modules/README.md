# Modules Architecture

Dependency direction:
- ui/api -> application -> domain contracts -> infrastructure

Rules:
- No Prisma/SQL in domain.
- No business rules in api.
- No direct DB calls from ui.
- Cross-module access must use exported use cases/contracts.
