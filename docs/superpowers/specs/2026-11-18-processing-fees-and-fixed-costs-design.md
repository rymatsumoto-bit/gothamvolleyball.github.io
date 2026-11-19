# Processing fees and fixed costs in Settings (issue #8)

Status: draft for approval. Nothing is built.

## Intent and why

Gotham pays fees on both sides of the money, and the calculator models only one blunt percentage:

- **Money in:** payments arrive through **Stripe** (2.9% + $0.30\*) or **LeagueApps** (about 4.2% + $0.30, an average over payment types). \*Some Stripe payments cost more than the base rate.
- **Money out:** coaches and referees are paid through **Arbiter**, at **$3.85 per person per payout**, with 4 payouts per season.

Today one global percentage is taken off all revenue, there is no flat per-transaction amount, and Arbiter is not counted at all, so breakeven is optimistic. The inputs also sit on the calculator page instead of in Settings with the rest.

## Goals

- Each program picks one payment system (Stripe or LeagueApps). Its fee is revenue × % plus transactions × flat amount.
- Arbiter fees are counted per program from payouts per season and people paid per slot.
- Processing fees, fixed costs and the safety margin are all edited in Settings. The calculator page only shows results.
- Rates are editable settings, because they are estimates and change.
- Existing saved inputs load with **identical results**.

## Non-goals

- Making fixed costs per season, or a list that can be added to (deferred; the lines stay as they are).
- Splitting one program's payments across both systems (every program uses exactly one).
- Modeling Stripe's surcharges (international, currency conversion, manual entry) separately. The rate is an editable effective rate.
- Any change to revenue, scheduling or program costs (#5), the season calendar (#6) or the stack (#7).

## Anti-goals

- Silently changing any existing user's breakeven.
- Any network call, for example to look up live rates.

## Approaches considered

- **A. Rates in one place, programs choose (picked).** A "Payment systems" table in Settings holds the rates. Each program picks a system. Change a rate once and every program follows.
- **B. Rates on every program row.** Most flexible, but repeats the same numbers on every row, and a rate change means editing each one. Rejected: Gotham has two systems.
- **C. One global fee, add a flat amount and Arbiter globally.** Smallest change. Rejected: it ignores that the systems charge differently and that programs differ in personnel.

## Design

### Settings

- **Payment systems card.** Rows: Stripe (% and $ per transaction), LeagueApps (% and $ per transaction), Arbiter ($ per person per payout). Edited in Edit mode like the other Settings.
- **Program table** (Revenue and Costs sections) gains three fields per program: **Payment system** (Stripe or LeagueApps), **Payouts per season** (default 4) and **People paid per slot**.
- **Fixed costs card and Safety margin** move from the calculator page into Settings, unchanged in meaning: party (members × $/member), equipment, incremental annual insurance, other fixed annual costs, and a safety margin % of the breakeven.
- The Fees row leaves the program table on the calculator page. Results show the fee totals.

### Calculation (in `src/model/calc.ts`)

Per program, from the existing `programFigures()`:

- `transactions` = seasons × slots × payments × paying units. This is the same product as revenue without the fee per unit. Payments is 1 for "once" and weeks per season for "session".
- `processingFee` = revenue × system % ÷ 100 + transactions × system flat.
- `payoutFee` = Arbiter rate × people per slot × slots × payouts per season × seasons.

Totals:

- `netRevenue` = gross revenue − Σ `processingFee`.
- `rawBreakeven` = net revenue − (non-venue costs + Σ `payoutFee` + fixed costs). Safety margin is applied to the breakeven afterwards, as today.
- Arbiter fees are shown as their own line, separate from referee and coach costs.

Defaults: Stripe 2.9% + $0.30, LeagueApps 4.2% + $0.30, Arbiter $3.85, payouts 4. People per slot is 2 for Power Class and Division Play, 0 for the other default programs and for new programs. New programs default to Stripe.

### Saved data and migration

The key `gotham-gym-budget-v6` stays. `SavedState` gains the payment-system rates and the Arbiter rate, and each `Program` gains `paymentSystem`, `payoutsPerSeason` and `peoplePaidPerSlot`. `processingFee` leaves `FixedCosts` and is only read from old saves.

Migration, so results do not change: if a save has no payment-system rates, it is an old save. Then both systems get the old `processingFee` % with $0 flat, Arbiter is $0, and every program is set to Stripe, payouts 4, people paid per slot 0. The calculation then reproduces the old result exactly. A new visitor with no save gets the real defaults. Settings shows a note on migrated saves that Arbiter and the flat fees start at $0 until entered, and the user can dismiss it once the rates are entered.

## Worked example (extends the #5 example)

Same four programs and schedule as the #5 test. Add: Division Play on LeagueApps, the other three on Stripe. Rates: Stripe 2.9% + $0.30, LeagueApps 4.2% + $0.30, Arbiter $3.85, payouts 4. People paid per slot: Division Play 2, Power Class 2, Friendship Tournaments 2, Open Play 0. No fixed costs, safety margin 0.

| Program | System | Transactions | Revenue | Processing fee | Arbiter fee |
|---|---|---|---|---|---|
| Division Play | LeagueApps | 256 | $30,720 | $1,290.24 + $76.80 = $1,367.04 | 3.85 × 2 × 2 × 4 × 2 = $123.20 |
| Power Class | Stripe | 180 | $27,000 | $783.00 + $54.00 = $837.00 | 3.85 × 2 × 3 × 4 × 2 = $184.80 |
| Open Play | Stripe | 2,000 | $16,000 | $464.00 + $600.00 = $1,064.00 | $0 |
| Friendship Tournaments | Stripe | 60 | $12,000 | $348.00 + $18.00 = $366.00 | 3.85 × 2 × 1 × 4 × 2 = $61.60 |
| **Total** | | | **$85,720** | **$3,634.04** | **$369.60** |

- Net revenue = 85,720 − 3,634.04 = **$82,085.96**.
- Raw breakeven = 82,085.96 − 5,860 (non-venue costs) − 369.60 = **$75,856.36**. With a 0% margin the maximum venue budget is the same.

This goes into `calc.test.ts`. Open Play shows why the flat amount matters: $8 payments lose 3.75% to the $0.30 alone.

Migration test (`storage.test.ts`): a save with `processingFee: 3` and no payment-system fields loads, and `totals()` gives the same fee ($2,571.60 on $85,720) and the same breakeven as before the change.

## Constraints

- Logic in `src/model/` with tests, display in components. `src/definitions.ts` stays in step with `calc.ts` (new definitions, and the "How it adds up" formulas). Update `docs/ARCHITECTURE.md` in the same branch.
- No renamed key, no network calls, no new dependencies.

## Left to the builder

- Exact layout of the Payment systems card and the migration note.
- Field names beyond those given, and how the results display the fee lines.
- Rounding display (money shown to whole dollars, as `fmt()` does now; calculations keep cents).

## My calls (to check)

- One combined "people paid per slot" number rather than separate referee and coach counts.
- Payouts per season is per program (default 4), not global.
- Migrated saves get Arbiter $0 and flat fees $0 so results do not change.
- Default people per slot is 2 for Power Class and Division Play, 0 for the others; new programs default to Stripe.
- Each paying unit counts as one transaction.
