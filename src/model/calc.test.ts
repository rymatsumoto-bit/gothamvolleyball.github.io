import { describe, expect, it } from "vitest";
import { programFigures, totals } from "./calc";
import { newProgram } from "./program";
import { defaultSchedule } from "./schedule";
import type { FixedCosts, Schedule } from "./types";

const NO_FIXED: FixedCosts = { equipment: 0, insurance: 0, otherFixed: 0, reserve: 0, processingFee: 0, partyMembers: 0, partyCost: 0 };

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
    const t = totals(programs, schedule, NO_FIXED);
    expect(t.grossRevenue).toBe(85720);
    expect(t.grossNonVenue).toBe(5860);
  });

  it("applies fees, fixed costs and the safety margin", () => {
    const t = totals(programs, schedule, { ...NO_FIXED, processingFee: 3, equipment: 1000, insurance: 500, otherFixed: 250, reserve: 10, partyMembers: 20, partyCost: 15 });
    expect(t.feeOnRevenue).toBeCloseTo(2571.6);
    expect(t.netRevenue).toBeCloseTo(83148.4);
    expect(t.totalNonVenue).toBe(5860 + 1000 + 500 + 250 + 300);
    expect(t.maxVenue).toBeCloseTo((83148.4 - 7910) * 0.9);
  });

  it("a deficit gives a $0 venue budget", () => {
    const t = totals(programs, schedule, { ...NO_FIXED, otherFixed: 1_000_000 });
    expect(t.rawBreakeven).toBeLessThan(0);
    expect(t.maxVenue).toBe(0);
  });
});
