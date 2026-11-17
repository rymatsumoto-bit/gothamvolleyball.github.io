export type PaymentType = "once" | "session";
export type UnitType = "individual" | "team";

// Program shape.
// Revenue (Settings): paymentType, unitType, payingUnits (per slot for "individual" programs; per team for
// "team" programs, where 0 = each team is the paying unit), fee (dollars per paying unit), seasons.
// Scheduling (Settings): weeksPerSeason, extraDays.
// Costs (Settings): refPerSeason and coachPerSeason (per slot, per season), securityPerSession (per session).
// Scenario inputs (calculator): `teams` per slot (for "team" programs).
export interface Program {
  name: string;
  paymentType: PaymentType;
  unitType: UnitType;
  payingUnits: number;
  fee: number;
  seasons: number;
  weeksPerSeason: number;
  extraDays: number;
  refPerSeason: number;
  coachPerSeason: number;
  securityPerSession: number;
  teams: number;
}

/** Slot key ("Mon-Morning") → program name, or "" for an empty slot. */
export type Schedule = Record<string, string>;

export interface FixedCosts {
  equipment: number;
  insurance: number;
  otherFixed: number;
  /** Safety margin, percent. */
  reserve: number;
  /** Payment processing fee, percent. */
  processingFee: number;
  partyMembers: number;
  partyCost: number;
}

export type FixedCostKey = keyof FixedCosts;

/**
 * What is stored under STORAGE_KEY. Do not change this shape without a migration
 * that reads the old data and writes the new (see CLAUDE.md).
 */
export interface SavedState extends FixedCosts {
  programs: Program[];
  schedule: Schedule;
}
