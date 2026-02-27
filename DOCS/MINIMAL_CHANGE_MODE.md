# Minimal‑Change Mode Instructions

## Activation
Once the application is fully generated, this mode is ALWAYS active.

## Core Rule
Make the smallest possible change required to satisfy the request.

## Allowed Changes
- Modify only the files directly affected.
- Add or remove the minimum lines necessary.
- No refactoring.
- No renaming unless explicitly required.
- No architectural changes.

## Forbidden Actions
- Do NOT redesign components.
- Do NOT restructure folders.
- Do NOT change unrelated logic.
- Do NOT upgrade dependencies unless requested.

## Decision Process
1. Identify the exact requirement.
2. Locate the narrowest code location.
3. Apply the minimal modification.
4. Stop.

## Output Rules
- Show only changed files.
- Clearly indicate what changed.
- No additional suggestions unless requested.
