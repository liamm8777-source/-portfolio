# How the Copilot Agent Should Work

## General Behavior
- Generate code incrementally and logically.
- Never generate unused code.
- Prefer clarity over cleverness.
- Follow Angular official recommendations.

## Coding Standards
- Use TypeScript strict typing.
- Avoid `any`.
- Use explicit return types for public APIs.
- Use functional patterns where possible.

## Naming Conventions
- Components: `feature-name.component.ts`
- Services: `feature-name.service.ts`
- Signals: camelCase, descriptive.
- Routes: kebab‑case paths.

## Architecture Expectations
- Standalone components by default.
- Feature‑based folders.
- Core logic isolated from UI.
- No circular dependencies.

## Dependency Management
- Minimize external dependencies.
- Justify each dependency with clear usage.
- Prefer Angular and browser‑native solutions.

## Testing Strategy
- Write unit tests for services and critical components.
- Avoid snapshot tests unless useful.
- Tests must be deterministic.

## Tooling
- ESLint must pass.
- Prettier formatting enforced.
- Use Angular CLI commands where possible.

## Error Handling
- Handle errors explicitly.
- Never silently ignore failures.
- Provide meaningful error messages.

## Output Rules
- When generating code, show full files.
- Do not include unrelated changes.
