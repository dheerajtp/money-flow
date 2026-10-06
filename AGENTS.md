# AGENTS.md

## Where things live
- This directory (`web/`) is its own git repo and the app root. The parent `money-manager/` is NOT a git repo; it holds `supabase/schema.sql` (the entire DB in one file, safe to re-run), specs, and the AI workflow docs.
- `src/lib/`: pure, unit-tested logic (money, dates, parser, goals/freedom maths). New shared logic belongs here with colocated `*.test.js`.
- `src/components/`, `src/pages/`: one component per file.
- `src/test/setup.js`: Vitest setup (jsdom, jest-dom).
- Root `CLAUDE.md` + `.ai/` + `rules/` + `STACK_CONFIG.md`: the project's AI workflow docs.

## Commands (run from `web/`)
- `npm run dev` — Vite dev server on :5173.
- `npm run check` — lint + unit/screen tests + production build. Run this before declaring done. There is no separate typecheck step.
- `npm test` / `npm run test:watch` — Vitest. Single test: `npx vitest run src/lib/money.test.js` (or `-t '<name>'`).
- `npm run db:test`, `npm run api:test`, `npm run visual` — require Docker; they spin up throwaway Postgres/PostgREST containers (scripts live in `../supabase/test/`). Don't run without Docker.

## Hard constraints
- Plain JavaScript only (`.js`/`.jsx`). No TypeScript, ever — this overrides tool defaults.
- Vite env: only `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Never put the service-role key or DB password in `web/`. A real project URL/anon key is committed in `.env` (tracked, not gitignored); `.env.local` is gitignored and overrides it.
- `src/lib/supabase.js` tolerates missing env by falling back to a placeholder client and rendering `ConfigErrorPage` — don't "fix" that.
- Root `CLAUDE.md` mandates an audit → report → approval gate before implementing changes (bug fixes, features, DB changes). Default to audit-only and wait for explicit approval unless the user says to implement immediately. Don't do destructive DB schema changes without approval.
- Stack is `react-supabase` (see `STACK_CONFIG.md`): no Node/Express backend — data access goes through `@supabase/supabase-js` in `src/lib/db.js` and hooks.

## Testing quirks
- Component/screen tests mock Supabase at the `src/lib` boundary; they do not need a running backend or real `.env`.
- `npm run visual` screenshots pages with `playwright-core` into `$SHOT_DIR` (default `/tmp/moneyflow-shots`); it needs a dev server running and the real Supabase project from `.env`.

## Working rules for this repo
The audit docs above are the baseline for "how it works today".
DB inspection so far has been read-only (schema/config/aggregates, no personal data). Keep it that way unless explicitly told otherwise.
# Mandatory Engineering Workflow
## Audit Before Implementation
For every bug fix, feature request, behavior change, API change, database change, or architectural change:
**DO NOT IMPLEMENT IMMEDIATELY.**
First perform an audit of the existing codebase and determine how the requested behavior currently works.
The required workflow is:
1. Understand the requirement.
2. Locate the relevant routes/controllers/services/repositories/models.
3. Trace the current behavior end-to-end.
4. Identify the actual root cause or implementation gap.
5. Identify existing functionality that can be reused.
6. Identify security, tenant-isolation, RBAC, database, API, and backward-compatibility implications.
7. Determine the minimum correct implementation.
8. Report the audit findings.
9. Provide a copy-pasteable implementation prompt.
10. STOP and wait for explicit approval before modifying code.
Never modify source code during the audit phase unless the user explicitly asks to skip the audit and implement immediately.
---
## Required Audit Response
Before implementation, always provide:
### 1. Current Behavior
Explain what the system currently does.
### 2. Root Cause
Identify the actual technical reason for the issue.
Do not speculate. Inspect the relevant implementation first.
### 3. Affected Code
List the relevant:
routes
controllers
services
repositories
models/schema
middleware
validators
background jobs
configuration
Only include files that are actually relevant.
### 4. Proposed Behavior
Explain exactly what the system should do after the change.
### 5. Implementation Approach
Explain the smallest safe implementation approach.
Consider:
existing architecture
tenant isolation
authentication
authorization/RBAC
database integrity
API compatibility
backward compatibility
existing patterns
error handling
### 6. Risks / Edge Cases
Identify relevant edge cases before implementation.
### 7. Testing Plan
Describe how the implementation will be verified, preferably against the real running backend/database where available.
### 8. Implementation Prompt
After the audit, provide a complete copy-pasteable prompt that can be given to the implementation agent.
The prompt must contain:
exact requirement
relevant existing behavior
root cause
implementation constraints
files/components to inspect
things that must NOT be changed
acceptance criteria
testing requirements
expected final report
### 9. WAIT FOR APPROVAL
After providing the audit and implementation prompt:
**STOP.**
Do not modify code.
Wait for the user to explicitly approve implementation.
Examples of approval:
"implement it"
"go ahead"
"proceed"
"use this prompt"
"apply the fix"
Do not interpret questions or discussion as implementation approval.
---
# Implementation Phase
Only after explicit approval:
1. Re-read the relevant implementation and CLAUDE.md rules.
2. Implement the approved change.
3. Do not expand scope without approval.
4. Run relevant tests.
5. Verify against the real database/API when applicable.
6. Check for regressions.
7. Report:
   - files changed
   - implementation summary
   - tests performed
   - test results
   - database/migration changes
   - API/OpenAPI changes
   - remaining limitations
---
# Important: Do Not Mix Audit and Implementation
Never combine:
AUDIT + IMPLEMENTATION
in one step unless the user explicitly asks for immediate implementation.
The default behavior is:
AUDIT → REPORT → IMPLEMENTATION PROMPT → WAIT → IMPLEMENT → TEST → REPORT