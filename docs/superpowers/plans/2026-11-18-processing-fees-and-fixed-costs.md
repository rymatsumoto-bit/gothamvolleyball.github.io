# Processing fees and fixed costs in Settings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Model Stripe, LeagueApps and Arbiter fees per program, and move processing fees, fixed costs and the safety margin into Settings, without changing any existing user's results.

**Architecture:** Rates live in one `PaymentRates` object (saved at top level); each program picks a payment system and sets payouts and people. `calc.ts` computes per-program processing and Arbiter fees; `storage.ts` migrates old saves so results are identical. Components only display.

**Tech Stack:** Vite, TypeScript, React, Vitest (existing). No new dependencies.

**Spec:** `docs/superpowers/specs/2026-11-18-processing-fees-and-fixed-costs-design.md` (issue #8)

## Global Constraints

- Storage key stays `gotham-gym-budget-v6`; saved inputs from before this change must load with identical results.
- Logic in `src/model/`, display in `src/components/`; components do not calculate.
- Keep `src/definitions.ts` in step with `calc.ts`; update `docs/ARCHITECTURE.md` in the same branch.
- No network calls, no new dependencies.
- Defaults: Stripe 2.9% + $0.30, LeagueApps 4.2% + $0.30, Arbiter $3.85, payouts per season 4; people paid per slot 2 for Power Class and Division Play, 0 otherwise; new programs default to Stripe.
- Each paying unit is one transaction. Money shown with `fmt()` (whole dollars); calculations keep cents.
- **Do not commit while iterating.** CLAUDE.md: the user says when; then group commits by issue, ending each message with `Refs #8` and the Co-Authored-By line. Run git and `gh` commands one at a time.

## Review Focus

- A program with no slots on the schedule has no transactions and no fees (Task 1 test).
- A Team program with 0 paying units per team counts each team as one transaction (Task 1 test).
- A corrupt or unknown `paymentSystem` falls back to Stripe rather than producing NaN (Task 1 test).
- A malformed `paymentRates` in a save (strings, missing LeagueApps) loads as numbers with zeros, never NaN (Task 2 test).
- Migration is idempotent: load a legacy save, write it, load again, and the totals are unchanged (Task 2 test).

## Before Task 1 (set-up, needs the user)

- [ ] Confirm the base branch with the user: the React port (`react-migration`) is not merged to `main`. Create a short-named branch (for example `payment-fees`) from the agreed base. Never work on `main`.
- [ ] Start `npm run dev` (http://localhost:8080) so the user can watch.
- [ ] After the user agrees, comment on #8 with the decisions (Stripe/LeagueApps/Arbiter rates, approach A, fixed costs deferred) via `gh issue comment 8`.

---

### Task 1: Rates, program fields and fee calculation

**Files:**
- Create: `src/model/rates.ts`
- Modify: `src/model/types.ts`, `src/model/program.ts`, `src/model/calc.ts`
- Test: `src/model/calc.test.ts`

**Interfaces:**
- Produces (types.ts):
  - `type PaymentSystem = "stripe" | "leagueApps"`
  - `interface ProcessingRate { percent: number; flat: number }`
  - `interface PaymentRates { stripe: ProcessingRate; leagueApps: ProcessingRate; arbiterPerPayout: number }`
  - `Program` gains `paymentSystem: PaymentSystem; payoutsPerSeason: number; peoplePaidPerSlot: number`
  - `FixedCosts` loses `processingFee`; `FixedCostKey` follows.
- Produces (rates.ts): `DEFAULT_RATES: PaymentRates` (the Global Constraints values), `defaultRates(): PaymentRates` (a copy), `ratesUnset(r: PaymentRates): boolean` (true when `arbiterPerPayout` and both `flat` values are 0).
- Produces (calc.ts): `ProgramFigures` gains `transactions: number`; `programFees(p: Program, f: ProgramFigures, rates: PaymentRates): { processingFee: number; payoutFee: number }`; `totals(programs, schedule, fixed, rates: PaymentRates): Totals` where `Totals` gains `payoutFees: number`, `feeOnRevenue` is the sum of processing fees, and `totalNonVenue` includes `payoutFees`.

- [ ] **Step 1: Write the failing tests** in `calc.test.ts`. Remove `processingFee` from `NO_FIXED` and add `const NO_RATES: PaymentRates = { stripe: { percent: 0, flat: 0 }, leagueApps: { percent: 0, flat: 0 }, arbiterPerPayout: 0 }`. Update every existing `totals(...)` call to pass a rates argument; the existing fee test becomes `rates` with both systems `{ percent: 3, flat: 0 }` and keeps its expected numbers (this proves the old behaviour is reproduced). Add a new `describe("issue #8 worked example")` using the #5 programs with `Division Play` on `"leagueApps"`, `peoplePaidPerSlot` 2 for Division Play, Power Class and Friendship Tournaments, 0 for Open Play, rates `{ stripe: {2.9, 0.3}, leagueApps: {4.2, 0.3}, arbiterPerPayout: 3.85 }`, and assertions:
  - transactions: Division Play 256, Power Class 180, Open Play 2000, Friendship Tournaments 60.
  - `programFees` processing fees (`toBeCloseTo`): 1367.04, 837, 1064, 366; payout fees: 123.2, 184.8, 0, 61.6.
  - totals: `feeOnRevenue` 3634.04, `payoutFees` 369.6, `netRevenue` 82085.96, `totalNonVenue` 6229.6, `rawBreakeven` 75856.36, `maxVenue` 75856.36 (reserve 0).
  - A program with no slots (not on the schedule) has `transactions` 0 and both fees 0.
  - A Team program with `payingUnits: 0`, `teams: 10`, 1 slot, 2 seasons, 3 payments has `transactions` 60.
  - A program with `paymentSystem` set to an unknown string (cast) is charged the Stripe rate.
  - A deficit with fees still gives `maxVenue` 0.

- [ ] **Step 2: Run** `npx vitest run src/model/calc.test.ts`. Expected: FAIL (type and missing-field errors).

- [ ] **Step 3: Implement** the types, `rates.ts`, `newProgram()` defaults (`paymentSystem: "stripe"`, `payoutsPerSeason: 4`, `peoplePaidPerSlot: 0`), `DEFAULT_PROGRAMS` overrides (`peoplePaidPerSlot: 2` on Power Class and Division Play), and the calculation. `transactions = seasons × slots × payments × units` (the revenue product without the fee). `processingFee = revenue × percent/100 + transactions × flat`, rate chosen by `paymentSystem` with Stripe as fallback. `payoutFee = arbiterPerPayout × peoplePaidPerSlot × slots × payoutsPerSeason × seasons`. `rawBreakeven = netRevenue − totalNonVenue`, where `totalNonVenue` includes `payoutFees`.

- [ ] **Step 4: Run** `npx vitest run src/model/calc.test.ts`. Expected: PASS. (`storage.test.ts` and components will not typecheck yet; Task 2 and 3 fix them. Run only this file.)

---

### Task 2: Storage and migration

**Files:**
- Modify: `src/model/storage.ts`, `src/model/types.ts`
- Test: `src/model/storage.test.ts`

**Interfaces:**
- Consumes: Task 1 types and `rates.ts`.
- Produces: `SavedState` gains `paymentRates: PaymentRates`; `LoadedState` gains `rates: PaymentRates`; `fromSaved(saved)` returns `{ programs, schedule, fixed, rates }`; `toSaved(programs, schedule, fixed, rates): SavedState` writes `paymentRates` last; `FIXED_COST_KEYS` loses `"processingFee"`.

- [ ] **Step 1: Write the failing tests** in `storage.test.ts`:
  - No save: `fromSaved(null).rates` equals `DEFAULT_RATES`.
  - Legacy save (the existing pre-#5 save with `processingFee: 3`): `rates` is `{ stripe: {3, 0}, leagueApps: {3, 0}, arbiterPerPayout: 0 }`; `fixed` equals the old object without `processingFee`; with an Open Play program, `totals(...)` gives `feeOnRevenue` 240 on revenue 8000 and `payoutFees` 0. A legacy program has `paymentSystem` `"stripe"`, `payoutsPerSeason` 4, `peoplePaidPerSlot` 0.
  - Idempotent: `fromSaved(JSON.parse(JSON.stringify(toSaved(...fromSaved(legacy)))))` gives the same `totals()` as `fromSaved(legacy)`.
  - A save with `paymentRates: { stripe: { percent: "2.9" }, arbiterPerPayout: "x" }` loads with numbers: stripe `{2.9, 0}`, leagueApps `{0, 0}`, arbiter 0, no NaN.
  - Round-trip key order becomes `["programs","schedule","equipment","insurance","otherFixed","reserve","partyMembers","partyCost","paymentRates"]`, and `fromSaved(raw)` equals the original state.
  - `ratesUnset`: true for the migrated legacy rates, false for `DEFAULT_RATES`.

- [ ] **Step 2: Run** `npx vitest run src/model/storage.test.ts`. Expected: FAIL.

- [ ] **Step 3: Implement.** In `fromSaved`: if `saved` is null, `rates = defaultRates()`; if `saved.paymentRates` is undefined, rates come from the old `processingFee` as above; otherwise read each rate field with `parseFloat(x) || 0`. Programs already get the new fields from `migrateProgram()` via `newProgram()` defaults (so legacy programs get people 0); do not change those migration branches.

- [ ] **Step 4: Run** `npx vitest run` (all model tests). Expected: PASS.

---

### Task 3: Payment systems in Settings, program fields, definitions

**Files:**
- Create: `src/components/PaymentSystemsCard.tsx`
- Modify: `src/App.tsx`, `src/components/SettingsView.tsx`, `src/definitions.ts`, `src/styles.css` (only if needed)

**Interfaces:**
- Consumes: Task 1 and 2 (`PaymentRates`, `Program` fields, `ratesUnset`, `fromSaved().rates`, `toSaved(..., rates)`, `totals(..., rates)`).
- Produces: `PaymentSystemsCard({ rates, editing, onChange })` where `onChange(system: "stripe" | "leagueApps", field: "percent" | "flat", value: number)` and a second callback `onArbiter(value: number)`. `SettingsNumberField` gains `"payoutsPerSeason" | "peoplePaidPerSlot"`; `onSelect` field union gains `"paymentSystem"`.

- [ ] **Step 1: Implement App state.** `const [rates, setRates] = useState(initial.rates)`. Pass `rates` into `computeTotals` and `toSaved`, and add it to the autosave and `useMemo` dependency lists. Handlers update rates with `Math.max(0, parseFloat(text) || 0)`.

- [ ] **Step 2: Implement `PaymentSystemsCard`.** A table with rows Stripe, LeagueApps (columns `% of payment`, `$ per transaction`) and Arbiter (`$ per person per payout`). Read-only text when not editing, `NumberInput` when editing (same pattern as `SettingsView`). Under the table: a note that Stripe's 2.9% + $0.30 is the base rate and some payments cost more, so enter an effective rate; LeagueApps is an average. When `ratesUnset(rates)` is true, show a notice that flat fees and Arbiter are $0 until entered.

- [ ] **Step 3: Implement program columns in `SettingsView`.** Revenue group gets `Payment system` (select: Stripe, LeagueApps); Costs group gets `Payouts / season` and `People paid / slot`. Update `colSpan`s, the edit row and the read-only row. Render `PaymentSystemsCard` above the program table card.

- [ ] **Step 4: Update `definitions.ts`.** Add definitions with keys `paymentSystem`, `payoutsPerSeason`, `peoplePaidPerSlot`, and add "Processing fee" and "Arbiter fee" lines to "How it adds up" matching the formulas in the spec. Wire `def=` on the new `Th`s.

- [ ] **Step 5: Verify.** `npm run build` (typecheck must pass; this also needs Task 4's `ProgramTable` and `FixedCostsCard` changes to compile, so do Task 4 Step 1 first if the build fails on those). Then in the browser at `#settings`: Edit, change a program to LeagueApps, change a rate, and see the calculator page results move. Check the console for errors.

---

### Task 4: Move fixed costs and safety margin to Settings; clean up the calculator

**Files:**
- Modify: `src/components/FixedCostsCard.tsx`, `src/components/ProgramTable.tsx`, `src/components/SettingsView.tsx`, `src/components/Results.tsx`, `src/App.tsx`

**Interfaces:**
- Consumes: Task 1 `Totals.payoutFees`.
- Produces: `FixedCostsCard` gains `editing: boolean`; read-only shows each value as text. `ProgramTable` loses `processingFee` and `onProcessingFee` props.

- [ ] **Step 1: Update `ProgramTable`.** Remove the percentage input. The footer "Fees" row becomes "Fees (set in Settings)": revenue column `"-" + fmt(totals.feeOnRevenue)`, cost column `fmt(totals.payoutFees)`. "Net total" cost column becomes `fmt(totals.grossNonVenue + totals.payoutFees)`. Update the note below the table to say fees live in Settings.

- [ ] **Step 2: Move the Fixed costs card.** Remove the "Fixed costs" section from the calculator view in `App.tsx`; render `FixedCostsCard` in `SettingsView` (new `Fixed costs` heading and card, below Payment systems) with the `editing` flag. Fixed-cost state stays in `App.tsx`; pass `fixedText`, `fixed`, `totals` and `onChange` through `SettingsView`. Update the card's footer note (the processing-fee sentence now points to Payment systems).

- [ ] **Step 3: Update `Results`.** The "Net revenue after processing fees" tile stays. Make the "Total non-venue costs" tile read `totals.totalNonVenue` (now including Arbiter fees); add a `metric-sub` line "includes Arbiter fees: $X" when `payoutFees > 0`.

- [ ] **Step 4: Verify.** `npm test` and `npm run build` pass. In the browser: the calculator page has no Fees input and no Fixed costs section; Settings shows both, locked until Edit; editing a fixed cost updates the results; leaving Settings re-locks it.

---

### Task 5: Docs and final verification

**Files:**
- Modify: `docs/ARCHITECTURE.md`, `README.md` (only if it describes the Fees row or fixed costs)

- [ ] **Step 1: Update `docs/ARCHITECTURE.md`.** Add `rates.ts` to "Where things live", fix the `ProgramTable.tsx` and `FixedCostsCard.tsx` descriptions, add `PaymentSystemsCard.tsx`, mention `rates` in "How data flows" and the migration in "Saved data". Update "Add a program setting" if the steps changed.

- [ ] **Step 2: Run** `npm test` and `npm run build`. Expected: both pass.

- [ ] **Step 3: Browser checks** at desktop and ~400px: reproduce the worked example (set the four programs per the spec) and confirm net revenue $82,085 and breakeven $75,856 on the calculator page. Load an old save by pasting a legacy-shaped value into `localStorage` under `gotham-gym-budget-v6` (with `processingFee: 3`, no `paymentRates`) and confirm the same breakeven as before the change and the "$0 until entered" notice. Check the console.

- [ ] **Step 4: Report** to the user what was and was not verified, for the PR description. Do not commit, push or open a PR until asked.
