import type { FixedCosts, Program, Schedule } from "./types";

export function fmt(n: number): string {
  return "$" + Math.round(n).toLocaleString();
}

export function slotsPerWeek(schedule: Schedule, name: string): number {
  if (!name || name.trim() === "") return 0;
  return Object.values(schedule).filter((v) => v === name).length;
}

export interface ProgramFigures {
  slots: number;
  sessions: number;
  isTeam: boolean;
  /** Paying units per slot. */
  units: number;
  revenue: number;
  nonVenueCost: number;
}

// Everything the calculation needs for one program. Each schedule slot is one division or level.
// Keep in step with DEFINITIONS (src/definitions.ts).
export function programFigures(p: Program, schedule: Schedule): ProgramFigures {
  const slots = slotsPerWeek(schedule, p.name);
  const seasons = p.seasons || 0;
  const sessions = slots > 0 ? slots * p.weeksPerSeason * seasons + p.extraDays * seasons : 0;
  // Paying units per slot. An individual program has them set directly. A team program has teams per slot,
  // and pays per paying unit when paying units per team are set, otherwise each team is the paying unit.
  const isTeam = p.unitType === "team";
  const units = isTeam ? p.teams * (p.payingUnits > 0 ? p.payingUnits : 1) : p.payingUnits;
  const payments = p.paymentType === "once" ? 1 : p.weeksPerSeason;
  const revenue = seasons * slots * payments * units * p.fee;
  const nonVenueCost = seasons * slots * (p.refPerSeason + p.coachPerSeason) + sessions * p.securityPerSession;
  return { slots, sessions, isTeam, units, revenue, nonVenueCost };
}

export interface Totals {
  grossRevenue: number;
  grossNonVenue: number;
  feeOnRevenue: number;
  netRevenue: number;
  partyAmt: number;
  totalNonVenue: number;
  /** Net revenue minus non-venue costs, before the safety margin. Negative means a deficit. */
  rawBreakeven: number;
  maxVenue: number;
  reserveAmt: number;
}

export function totals(programs: Program[], schedule: Schedule, fixed: FixedCosts): Totals {
  let grossRevenue = 0, grossNonVenue = 0;
  programs.forEach((p) => {
    const f = programFigures(p, schedule);
    grossRevenue += f.revenue;
    grossNonVenue += f.nonVenueCost;
  });
  const partyAmt = fixed.partyMembers * fixed.partyCost;
  const feeOnRevenue = grossRevenue * (fixed.processingFee / 100);
  const netRevenue = grossRevenue - feeOnRevenue;
  const totalNonVenue = grossNonVenue + fixed.equipment + fixed.insurance + fixed.otherFixed + partyAmt;
  const rawBreakeven = netRevenue - totalNonVenue;
  const maxVenue = Math.max(0, rawBreakeven * (1 - fixed.reserve / 100));
  const reserveAmt = rawBreakeven - maxVenue;
  return { grossRevenue, grossNonVenue, feeOnRevenue, netRevenue, partyAmt, totalNonVenue, rawBreakeven, maxVenue, reserveAmt };
}
