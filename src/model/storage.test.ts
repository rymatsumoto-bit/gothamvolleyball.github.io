import { describe, expect, it } from "vitest";
import { programFigures, totals } from "./calc";
import { DEFAULT_PROGRAMS } from "./program";
import { DEFAULT_RATES, ratesUnset } from "./rates";
import { defaultSchedule } from "./schedule";
import { STORAGE_KEY, fromSaved, readSaved, toSaved, writeSaved } from "./storage";

function memoryStorage(initial: Record<string, string> = {}): Storage {
  const data = { ...initial };
  return {
    get length() { return Object.keys(data).length; },
    clear: () => { Object.keys(data).forEach((k) => delete data[k]); },
    getItem: (k) => (k in data ? data[k] : null),
    key: (i) => Object.keys(data)[i] ?? null,
    removeItem: (k) => { delete data[k]; },
    setItem: (k, v) => { data[k] = String(v); },
  };
}

describe("storage key", () => {
  it("is unchanged", () => expect(STORAGE_KEY).toBe("gotham-gym-budget-v6"));
});

describe("no save", () => {
  it("loads the default programs, an empty schedule and zero fixed costs", () => {
    const s = fromSaved(null);
    expect(s.programs).toEqual(DEFAULT_PROGRAMS);
    expect(s.schedule).toEqual(defaultSchedule());
    expect(Object.values(s.fixed).every((v) => v === 0)).toBe(true);
  });

  it("loads the default payment rates", () => {
    expect(fromSaved(null).rates).toEqual(DEFAULT_RATES);
    expect(ratesUnset(fromSaved(null).rates)).toBe(false);
  });
});

// The original (pre-#5) shape: per-slot weekly billing with ref/coach/security per session.
// Old formulas: revenue = slots × weeks × players × fee; cost = slots × weeks × (ref + coach + security).
describe("pre-#5 save", () => {
  const schedule = { ...defaultSchedule(), "Mon-Evening": "Open Play", "Wed-Evening": "Open Play", "Sat-Morning": "Training" };
  const saved = {
    programs: [
      { name: "Open Play", weeks: 20, players: 25, fee: 8, ref: 10, coach: 5, security: 30 },
      { name: "Training", weeks: 12, players: 18, fee: 20, ref: 0, coach: 60, security: 15 },
      { name: "", weeks: 0, players: 0, fee: 0, ref: 0, coach: 0, security: 0 },
    ],
    schedule, equipment: 1200, insurance: 800, otherFixed: 0, reserve: 10, processingFee: 3, partyMembers: 0, partyCost: 0,
  };

  it("keeps every program's revenue and cost", () => {
    const s = fromSaved(saved);
    expect(s.programs.map((p) => p.name)).toEqual(["Open Play", "Training"]); // the unnamed row is dropped
    const open = programFigures(s.programs[0], s.schedule);
    expect(open.revenue).toBe(2 * 20 * 25 * 8);
    expect(open.nonVenueCost).toBe(2 * 20 * (10 + 5 + 30));
    const training = programFigures(s.programs[1], s.schedule);
    expect(training.revenue).toBe(1 * 12 * 18 * 20);
    expect(training.nonVenueCost).toBe(1 * 12 * (0 + 60 + 15));
  });

  it("keeps the fixed costs", () => {
    expect(fromSaved(saved).fixed).toEqual({ equipment: 1200, insurance: 800, otherFixed: 0, reserve: 10, partyMembers: 0, partyCost: 0 });
  });

  // #8: the single global processing fee becomes both systems' percentage, with no flat fee and no Arbiter,
  // so every saved result stays exactly the same.
  it("turns the old processing fee into both systems' percentage, with no flat fee or Arbiter", () => {
    const s = fromSaved(saved);
    expect(s.rates).toEqual({ stripe: { percent: 3, flat: 0 }, leagueApps: { percent: 3, flat: 0 }, arbiterPerPayout: 0 });
    expect(ratesUnset(s.rates)).toBe(true);
    const open = s.programs[0];
    expect(open).toMatchObject({ paymentSystem: "stripe", payoutsPerSeason: 4, peoplePaidPerSlot: 0 });
    const t = totals(s.programs, s.schedule, s.fixed, s.rates);
    expect(t.feeOnRevenue).toBeCloseTo((t.grossRevenue * 3) / 100);
    expect(t.payoutFees).toBe(0);
  });

  it("is idempotent: loading, writing and loading again gives the same totals", () => {
    const first = fromSaved(saved);
    const again = fromSaved(JSON.parse(JSON.stringify(toSaved(first.programs, first.schedule, first.fixed, first.rates))));
    expect(again.rates).toEqual(first.rates);
    expect(totals(again.programs, again.schedule, again.fixed, again.rates))
      .toEqual(totals(first.programs, first.schedule, first.fixed, first.rates));
  });

  it("drops the legacy fields after migration", () => {
    const p = fromSaved(saved).programs[0] as unknown as Record<string, unknown>;
    ["weeks", "players", "ref", "coach", "security"].forEach((k) => expect(p).not.toHaveProperty(k));
  });
});

describe("round trip", () => {
  it("writes the same shape the single-file version wrote, and reads it back unchanged", () => {
    const storage = memoryStorage();
    const s = fromSaved(null);
    expect(writeSaved(toSaved(s.programs, s.schedule, s.fixed, s.rates), storage)).toBe(true);
    const raw = readSaved(storage);
    expect(Object.keys(raw)).toEqual(["programs", "schedule", "equipment", "insurance", "otherFixed", "reserve", "partyMembers", "partyCost", "paymentRates"]);
    expect(fromSaved(raw)).toEqual(s);
  });

  it("a malformed paymentRates loads as numbers, never NaN", () => {
    const s = fromSaved({ programs: [], schedule: {}, paymentRates: { stripe: { percent: "2.9" }, arbiterPerPayout: "x" } });
    expect(s.rates).toEqual({ stripe: { percent: 2.9, flat: 0 }, leagueApps: { percent: 0, flat: 0 }, arbiterPerPayout: 0 });
  });

  it("a corrupt save falls back to defaults", () => {
    expect(readSaved(memoryStorage({ [STORAGE_KEY]: "{not json" }))).toBeNull();
  });
});
