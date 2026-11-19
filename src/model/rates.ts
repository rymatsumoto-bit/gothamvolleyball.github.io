import type { PaymentRates } from "./types";

// Estimates, not contract terms. Stripe's base card rate (some payments cost more) and a LeagueApps average.
export const DEFAULT_RATES: PaymentRates = {
  stripe: { percent: 2.9, flat: 0.3 },
  leagueApps: { percent: 4.2, flat: 0.3 },
  arbiterPerPayout: 3.85,
};

export function defaultRates(): PaymentRates {
  return { stripe: { ...DEFAULT_RATES.stripe }, leagueApps: { ...DEFAULT_RATES.leagueApps }, arbiterPerPayout: DEFAULT_RATES.arbiterPerPayout };
}

/** True when no flat fee and no Arbiter rate has been entered, as in a save migrated from before #8. */
export function ratesUnset(r: PaymentRates): boolean {
  return r.arbiterPerPayout === 0 && r.stripe.flat === 0 && r.leagueApps.flat === 0;
}
