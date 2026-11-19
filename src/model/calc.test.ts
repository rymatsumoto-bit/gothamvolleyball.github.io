import { describe, expect, it } from "vitest";
import { programFees, programFigures, totals } from "./calc";
import { newProgram } from "./program";
import { defaultSchedule } from "./schedule";
import type { FixedCosts, PaymentRates, Schedule } from "./types";

const NO_FIXED: FixedCosts = { equipment: 0, insurance: 0, otherFixed: 0, reserve: 0, partyMembers: 0, partyCost: 0 };
const NO_RATES: PaymentRates = { stripe: { percent: 0, flat: 0 }, leagueApps: { percent: 0, flat: 0 }, arbiterPerPayout: 0 };

function scheduleWith(slots: Record<string, number>): Schedule {
  const s = defaultSchedule();
  const keys = Object.keys(s);
  let k = 0;
  for (const [name, n] of Object.entries(slots)) for (let i = 0; i < n; i++) s[keys[k++]] = name;
  return s;
}

// Worked example from issue #5 ("How to verify").
describe("issue #5 worked example", () => {
  const programs = [
    newProgram("Division Play", { paymentType: "once", unitType: "team", payingUnits: 8, teams: 8, fee: 120, seasons: 2, weeksPerSeason: 10, extraDays: 1, refPerSeason: 60, securityPerSession: 40 }),
    newProgram("Power Class", { paymentType: "once", unitType: "individual", payingUnits: 30, fee: 150, seasons: 2, weeksPerSeason: 10, coachPerSeason: 50, securityPerSession: 20 }),
    newProgram("Open Play", { paymentType: "session", unitType: "individual", payingUnits: 25, fee: 8, seasons: 2, weeksPerSeason: 20, securityPerSession: 30 }),
    newProgram("Friendship Tournaments", { paymentType: "session", unitType: "team", payingUnits: 0, teams: 10, fee: 200, seasons: 2, weeksPerSeason: 3, refPerSeason: 20 }),
  ];
  const schedule = scheduleWith({ "Division Play": 2, "Power Class": 3, "Open Play": 2, "Friendship Tournaments": 1 });

  it.each([
    ["Division Play", 42, 30720, 1920],
    ["Power Class", 60, 27000, 1500],
    ["Open Play", 80, 16000, 2400],
    ["Friendship Tournaments", 6, 12000, 40],
  ])("%s: %i sessions, $%i revenue, $%i cost", (name, sessions, revenue, cost) => {
    const f = programFigures(programs.find((p) => p.name === name)!, schedule);
    expect(f).toMatchObject({ sessions, revenue, nonVenueCost: cost });
  });

  it("gross totals are $85,720 revenue and $5,860 non-venue cost", () => {
    const t = totals(programs, schedule, NO_FIXED, NO_RATES);
    expect(t.grossRevenue).toBe(85720);
    expect(t.grossNonVenue).toBe(5860);
  });

  it("applies fees, other costs and the safety margin", () => {
    // A flat 3% on both systems and no flat fee or Arbiter reproduces the single global fee of #5.
    const threePercent: PaymentRates = { ...NO_RATES, stripe: { percent: 3, flat: 0 }, leagueApps: { percent: 3, flat: 0 } };
    const t = totals(programs, schedule, { ...NO_FIXED, equipment: 1000, insurance: 500, otherFixed: 250, reserve: 10, partyMembers: 20, partyCost: 15 }, threePercent);
    expect(t.feeOnRevenue).toBeCloseTo(2571.6);
    expect(t.netRevenue).toBeCloseTo(83148.4);
    expect(t.totalNonVenue).toBe(5860 + 1000 + 500 + 250 + 300);
    expect(t.maxVenue).toBeCloseTo((83148.4 - 7910) * 0.9);
  });

  it("a deficit gives a $0 venue budget", () => {
    const t = totals(programs, schedule, { ...NO_FIXED, otherFixed: 1_000_000 }, NO_RATES);
    expect(t.rawBreakeven).toBeLessThan(0);
    expect(t.maxVenue).toBe(0);
  });
});

// Worked example from issue #8: the #5 programs with payment systems, Arbiter payouts and people paid.
describe("issue #8 worked example", () => {
  const rates: PaymentRates = { stripe: { percent: 2.9, flat: 0.3 }, leagueApps: { percent: 4.2, flat: 0.3 }, arbiterPerPayout: 3.85 };
  const programs = [
    newProgram("Division Play", { paymentSystem: "leagueApps", peoplePaidPerSlot: 2, paymentType: "once", unitType: "team", payingUnits: 8, teams: 8, fee: 120, seasons: 2, weeksPerSeason: 10, extraDays: 1, refPerSeason: 60, securityPerSession: 40 }),
    newProgram("Power Class", { peoplePaidPerSlot: 2, paymentType: "once", unitType: "individual", payingUnits: 30, fee: 150, seasons: 2, weeksPerSeason: 10, coachPerSeason: 50, securityPerSession: 20 }),
    newProgram("Open Play", { peoplePaidPerSlot: 0, paymentType: "session", unitType: "individual", payingUnits: 25, fee: 8, seasons: 2, weeksPerSeason: 20, securityPerSession: 30 }),
    newProgram("Friendship Tournaments", { peoplePaidPerSlot: 2, paymentType: "session", unitType: "team", payingUnits: 0, teams: 10, fee: 200, seasons: 2, weeksPerSeason: 3, refPerSeason: 20 }),
  ];
  const schedule = scheduleWith({ "Division Play": 2, "Power Class": 3, "Open Play": 2, "Friendship Tournaments": 1 });

  it.each([
    ["Division Play", 256, 1367.04, 123.2],
    ["Power Class", 180, 837, 184.8],
    ["Open Play", 2000, 1064, 0],
    ["Friendship Tournaments", 60, 366, 61.6],
  ])("%s: %i transactions, $%d processing fee, $%d Arbiter fee", (name, transactions, processingFee, payoutFee) => {
    const p = programs.find((x) => x.name === name)!;
    const f = programFigures(p, schedule);
    expect(f.transactions).toBe(transactions);
    const fees = programFees(p, f, rates);
    expect(fees.processingFee).toBeCloseTo(processingFee);
    expect(fees.payoutFee).toBeCloseTo(payoutFee);
  });

  it("totals: $3,634.04 processing, $369.60 Arbiter, breakeven $75,856.36", () => {
    const t = totals(programs, schedule, NO_FIXED, rates);
    expect(t.feeOnRevenue).toBeCloseTo(3634.04);
    expect(t.payoutFees).toBeCloseTo(369.6);
    expect(t.netRevenue).toBeCloseTo(82085.96);
    expect(t.totalNonVenue).toBeCloseTo(6229.6);
    expect(t.rawBreakeven).toBeCloseTo(75856.36);
    expect(t.maxVenue).toBeCloseTo(75856.36);
  });

  it("a program with no slots has no transactions and no fees", () => {
    const p = newProgram("Unscheduled", { peoplePaidPerSlot: 2, payingUnits: 10, fee: 20, weeksPerSeason: 10 });
    const f = programFigures(p, schedule);
    expect(f.transactions).toBe(0);
    expect(programFees(p, f, rates)).toEqual({ processingFee: 0, payoutFee: 0 });
  });

  it("a Team program with 0 paying units per team counts each team as one transaction", () => {
    const f = programFigures(programs[3], schedule);
    expect(f.units).toBe(10);
    expect(f.transactions).toBe(2 * 1 * 3 * 10);
  });

  it("an unknown payment system is charged the Stripe rate", () => {
    const p = { ...programs[1], paymentSystem: "bogus" } as unknown as typeof programs[1];
    const f = programFigures(p, schedule);
    expect(programFees(p, f, rates).processingFee).toBeCloseTo(837);
  });

  it("a deficit with fees still gives a $0 venue budget", () => {
    const t = totals(programs, schedule, { ...NO_FIXED, otherFixed: 1_000_000 }, rates);
    expect(t.maxVenue).toBe(0);
  });
});
