# Planner section — implementation plan (money-flow repo)

## Primary goal
Every day the user opens one page and sees how much they can safely spend until the next salary, what bills land before then, and whether they are on track. It is a pay-period plan built from the data the app already holds (accounts, entries, recurring, goals).

## Status
**Phase 0 redone against the real repo (`github.com/dheerajtp/money-flow`, deployed at money-flow-jade.vercel.app).** An earlier draft was written against a different repo (`finance-management`) and is discarded. No code has been changed. Phase 1 has not started.

## Phase 0: Discovery findings

**How this serves the primary goal:** the spec matches this app closely. Estimated entries, Loan accounts, card statement/due days, recurring items and an emergency-fund goal already exist, so the Planner mostly adds calculation and a page, not new concepts.

### Repo rules that shape the work (from `AGENTS.md`)
- Plain JavaScript only, no TypeScript. React 19 + Vite + react-router + Supabase JS + Recharts. **No** react-query, react-hook-form, zod or jotai. Do not add them.
- Pure logic goes in `src/lib/` with a colocated `*.test.js` (Vitest already configured: `npm test`, `npm run check` = lint + test + build). Data access is `supabase.from/rpc` inside pages and components, wrapped with `q()` from `lib/db.js`; hooks like `useAsync`, `useAccounts` exist.
- One component per file in `src/components/`, one page per file in `src/pages/`. Existing UI: `Card`, `Button`, `KpiCard`, `StatCard`, `Notice`, `EmptyState`, `LoadingState`, `MoneyText`, `PageHeader`, `TabBar`, `ConfirmModal`; tokens in `styles/tokens.css`.
- **Audit-before-implement gate:** this plan is the audit. Wait for explicit approval before each phase's code.
- DB changes are made by editing `supabase/schema.sql` (one re-runnable file) in the parent folder `money-manager/`, which is **not in this repo** and not on this machine.

### Spec vs. what exists
| Spec assumes | Reality in money-flow |
|---|---|
| Estimated entries created from Recurring | **Exists.** RPC `sync_recurring(p_as_of)` creates `entries` with `status = 'estimated'`; runs on app open (`useRecurringSync`) and via "Run now". A pasted real bank message (`confirm_draft`) replaces the estimate. |
| Account types incl. Loan, SIP, card | `bank, sip, stock, credit_card, loan, debit_card, insurance` (`lib/accountFields.js`). No cash type. Loan details: `emi_amount, emi_day, first_emi_month, last_emi_month`. |
| Card statement day, due day | **Exists** in `accounts.details` for credit_card: `credit_limit, statement_day, due_day`. Only `period_spend_limit` is new. |
| Recurring items, paused/ended | Table `recurring_items`: `kind` (subscription / emi / insurance), `paying_account_id`, `linked_account_id`, `amount`, `frequency`, `first_due_date`, `track_from`, `status` (active / paused / ended), `end_date`. RPC `upcoming_recurring(p_from, p_to)` returns `{item_id, name, kind, due_date, amount, paying_account_id}`. |
| Entries income/expense/transfer | Table `entries`: `kind` (income / expense / transfer), `status` (draft / estimated / confirmed), `source`, `account_id`, `to_account_id` (transfers, incl. SIP and EMI), `category_id`, `entry_date`, `amount`, `merchant_key`; line items in `entry_items`. |
| Current balances | RPC `account_positions(p_at)` (used by `useAccounts`). Liabilities (card, loan) are negative positions. |
| Salary category | Per-user rows in `categories` (`name, kind, has_items`). Users can rename, so it is chosen in settings, not matched by name. |
| Goals / emergency fund | Table `goals`: `kind` (`emergency` / `bucket`), `priority`, `status`, `target_amount`, `saved_so_far`, `target_date`. |
| Budgets | **No budget table.** New tables needed. |
| Spending by category | RPCs `category_spending(p_from, p_to)`, `monthly_summary`. |
| Safe-to-spend page | **None exists.** Dashboard (`HomePage.jsx`) is where the small tile goes. |
| Nav | `lib/nav.js` `NAV_GROUPS` "Plan" group: Goals, Recurring, Freedom. Add Planner above Goals; routes in `App.jsx`. |

### Patterns to copy
- Pure maths with ISO date strings and `today` passed in: `lib/dates.js` (`todayISO`, `addDays`, `nthMonthDate`, `clampDate`), `lib/loans.js`, `lib/periods.js`, `lib/freedom.js`. Reuse; don't write a second date helper.
- Page shape: `RecurringPage.jsx` / `GoalsPage.jsx` (`useAsync` + `q()` + loading, error and empty states).
- Component tests mock Supabase at the `src/lib` boundary (`pages/pages.test.jsx`).

### Anti-patterns
- Don't store derived data. Only `planned_spend` is stored (in `pay_periods`).
- Transfers are never spending: SIP, EMI transfers, emergency-fund moves, own-account moves.
- No hard-coded names, accounts or amounts anywhere in code (see fixture rules).
- Don't add libraries the repo doesn't use. The service-role key never goes in `web/`.

### Data and test-fixture rules (every phase)
- **Every amount comes from the user's data:** `account_positions`, entries, `recurring_items` / `upcoming_recurring`. Nothing names Groww, a SIP, Netflix or a bank. A user with no SIP, card or salary entry simply has that part absent (zero or hidden), never an error.
- **One common fixture format** in `src/lib/planner/fixture.js` (test helper): `buildFixture(overrides)` returns `{ today, settings, accounts: [{id, type, position, details}], upcoming: [{item_id, kind, due_date, amount, paying_account_id}], entries: [{id, kind, status, account_id, to_account_id, category_id, entry_date, amount}], categories }`, in the shapes the RPCs and tables return.
- Each acceptance row is a small override of that fixture. The spec's "Main Bank", "Netflix", "BSNL", "Groww" are sample labels only; tests assert computed numbers, never names. Row 7 is generic: paused or ended recurring items of any kind are excluded, plus a case with none.
- Planner `lib` functions take fixture-shaped data and `today` as arguments (no `Date.now()`, no Supabase), so tests and the app run the same code.

## Decisions (updated)
1. **Estimated entries: resolved.** Use the existing ones. `committed` = recurring occurrences paid from the spending account, due after today and on or before the next salary date, with **no** entry yet (estimated or real). A posted estimate already lowers the balance and is not counted again. Test: posting an estimate leaves safe-to-spend unchanged.
   - **Confirmed against the live DB (project ref `rkyqpkvtzqooowzvpzdq`):** estimates are `entries` rows with `status='estimated'`, `source='recurring'`, `recurring_item_id`, `due_date`, unique on `(recurring_item_id, due_date)`. `sync_recurring` creates estimates up to `p_as_of`, advances `recurring_items.generated_through`, and ends EMI items after the last EMI. `upcoming_recurring(p_from, p_to)` starts at `greatest(track_from, generated_through + 1)`, returns active items only, `p_from` is exclusive, and takes EMI/insurance amounts from the linked account.
   - **Rule:** `committed` = `upcoming_recurring(today, expected_salary_date)` where `paying_account_id = spending_account_id` and no `entries` row has the same `recurring_item_id` and `due_date` (this covers a real payment logged before its estimate was created). No new DB function; done in the app layer.
2. **Salary detection: resolved.** The user picks the salary category in Planner settings. Period start = latest income entry in that category on the spending account. Fallback: with no salary entry, the period starts on `salary_day`.
3. **Budgets: resolved.** No budget table exists here, so create `budget_plans` / `budget_lines` (Phase 4).
4. **Overlap with a safe-to-spend page: resolved.** None exists here; the earlier "keep both" no longer applies.
5. **Schema file: resolved as a task.** Recover `supabase/schema.sql` with `supabase db dump` from the live project and commit it to this repo (Phase 1, step 0), so migrations and RLS patterns are versioned here.

## Phase 1: Settings, pay period, Safe-to-spend header (spec step 1)
**How this serves the primary goal:** delivers the headline number, "₹X safe until date", and proves the maths before any UI.
1. Tests first, `src/lib/planner/*.test.js`, using `buildFixture`:
   - Row 1: balance 14281.12, floor 5000, recurring 499 (19 Nov) + 472.90 (5 Dec), no entries, card due after salary → committed 971.90, card_due 0, safe 8309, 23 days left, 361/day.
   - Row 3: the 19 Nov estimate is posted → balance −499, committed −499, safe unchanged.
   - Row 6: no salary by salary day → period extends daily, `salaryLate`, never negative ("Using your floor").
   - Row 7: paused or ended items excluded (any kind), and a no-items case.
   - Transfers excluded; fallback period start when no salary entry.
2. `planner_settings` in `schema.sql`: `user_id` unique, `spending_account_id`, `salary_category_id`, `salary_day` (1–31), `floor_amount`, `expected_salary_amount`, **all nullable, no defaults**. The setup form fills them and suggests floor = 10% of expected salary. RLS: owner only; the account must belong to the user.
3. `src/lib/planner/payPeriod.js`, `safeToSpend.js`; `src/pages/PlannerPage.jsx`, `components/PlannerHeaderCard.jsx`, `PlannerSetupForm.jsx` (existing `TextField`, `SelectField`, `Button`).
4. Route `/planner`, nav item above Goals, small "Safe to spend" tile on the dashboard. Loading, empty ("choose your spending account") and error states.

**Verify:** `npm run check`; screenshots at desktop and mobile.

## Phase 2: Coming-up timeline (spec step 2)
Merge `upcoming_recurring` (until next salary), the salary date and card statement/due dates from `accounts.details`. `lib/planner/timeline.js` + test; `PlannerTimeline.jsx`. The header breakdown links here. Tasks join in Phase 6.

## Phase 3: Weekly checkpoint (spec step 3)
`pay_periods(user_id, start_date, expected_end_date, planned_spend, closed_at)`, created lazily on first view. Test row 2: Sunday 16 Nov = 5,000 + 971.90 + 8,309 × 19 ÷ 23 = ₹12,836. `lib/planner/checkpoint.js`, `PlannerCheckpoint.jsx`.

## Phase 4: Budget plans and envelopes (spec step 4; features 2 and 7)
`budget_plans(name, start_month, end_month, is_active)`, `budget_lines(plan_id, category_id, monthly_limit, line_type, sort_order)`. The plan active on the period start applies for the whole period. Spent = expense entries (not drafts) across all accounts in the period, transfers excluded; green <80%, amber 80–100%, red >100%. Test row 5 (969.91 of 1200 = 81%, amber, bank balance unchanged). Suggested limits = median monthly spend per category over the last 3 months, rounded to ₹100. Tapping a row reuses the entries list.

## Phase 5: Card guard (spec step 5)
Cycle from `statement_day` / `due_day` in account details; cycle spend, projected bill (cycle spend + card EMIs + carried balance), warning against a new optional `period_spend_limit` in card details (extend `accountFields.js` and the account form). Test row 4 (3,823.91, warning; a 24 Nov entry falls in the next cycle). Feed `card_due` into Phase 1 when the due date falls before payday.

## Phase 6: Tasks and salary-day checklist (spec step 6)
`planner_tasks` table. Checklist built from `saving` / `fixed` budget lines, EMIs, the card bill, the emergency-fund goal (`goals.kind = 'emergency'`) and bucket goals; visible from 2 days before salary. Warn when an expense is logged against the emergency-fund account.

## Phase 7: Period review (spec step 7)
Close the period (`closed_at`); planned vs actual per category; a leftover prompt creates a transfer to the emergency-fund account through the existing transfer-entry flow.

## Final verification
Every acceptance row has a passing test; `npm run check`; RLS on every new table; no file over ~250 lines; screenshots per phase; grep confirms no hard-coded names or amounts.

**Delivery:** one PR per phase via `gh`, each after your approval.
