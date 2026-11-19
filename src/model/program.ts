import type { Program } from "./types";

export function newProgram(name: string, overrides: Partial<Program> = {}): Program {
  return Object.assign(
    {
      name, paymentSystem: "stripe", paymentType: "session", unitType: "individual", payingUnits: 0, fee: 0,
      seasons: 2, weeksPerSeason: 0, extraDays: 0,
      refPerSeason: 0, coachPerSeason: 0, securityPerSession: 0,
      payoutsPerSeason: 4, peoplePaidPerSlot: 0,
      teams: 0,
    } satisfies Program,
    overrides,
  );
}

export const DEFAULT_PROGRAMS: readonly Program[] = [
  newProgram("Open Play", { payingUnits: 30 }),
  newProgram("Power Class", { paymentType: "once", weeksPerSeason: 10, payingUnits: 30, peoplePaidPerSlot: 2 }),
  newProgram("Division Play", { paymentType: "once", unitType: "team", payingUnits: 8, weeksPerSeason: 10, extraDays: 1, teams: 8, peoplePaidPerSlot: 2 }),
  newProgram("Friendship Tournaments", { unitType: "team" }),
];

export function defaultPrograms(): Program[] {
  return DEFAULT_PROGRAMS.map((p) => ({ ...p }));
}

const LEGACY_KEYS = [
  "weeks", "billing", "unit", "playersPerTeam", "maxPerSlot", "playersPerGroup", "groupType", "unitsPerGroup",
  "feeBasis", "paymentsPerSeason", "players", "unitsPerTeam", "ref", "coach", "security",
];

// Reads a saved program of any older shape and fills in the new fields.
// Original saves: `weeks` of play in one season, paid every week by `players` individuals. That is
// 1 season, `weeks` payments per season, no groups, which reproduces the old revenue and cost exactly.
// Shapes from earlier in development (`billing`, `unit`, `playersPerTeam`, `maxPerSlot`, `groupType` "none" or "class",
// `playersPerGroup`, `unitsPerGroup`, fee basis "player") are converted too.
//
// Ported line for line from the single-file version. Saved data is untyped, so this works on `any`.
export function migrateProgram(p: any): Program {
  const m: any = Object.assign(newProgram(p.name || ""), p);
  if (p.weeksPerSeason === undefined) {
    m.seasons = 1;
    m.weeksPerSeason = parseFloat(p.weeks) || 0;
    m.paymentsPerSeason = m.weeksPerSeason;
  } else if (p.billing !== undefined) {
    m.paymentsPerSeason = p.billing === "season" ? 1 : m.weeksPerSeason;
    if (p.playersPerTeam > 0) { m.unitType = "team"; m.unitsPerTeam = p.playersPerTeam; }
    else if (p.unit === "teams") { m.unitType = "team"; m.feeBasis = "group"; m.teams = p.players || 0; }
  }
  // Earlier versions stored a number of payments per season. One payment is a one-time fee; anything else
  // was paid every week, which is what "per session" now means.
  if (p.paymentType === undefined) m.paymentType = m.paymentsPerSeason === 1 ? "once" : "session";
  if (p.groupType === "team") m.unitType = "team";
  if (p.unitsPerGroup !== undefined) m.unitsPerTeam = p.unitsPerGroup;
  else if (p.playersPerGroup !== undefined) m.unitsPerTeam = p.playersPerGroup;
  if (m.unitType !== "team") { m.unitType = "individual"; m.unitsPerTeam = 0; }
  else if (m.feeBasis === "group") m.unitsPerTeam = 0; // the fee was per team, so each team is the paying unit
  // Paying units moved into Settings: individuals were entered per slot as `players`, teams as `unitsPerTeam`.
  // A number typed into an individual program's Settings field (which was ignored then) is kept and wins.
  if (p.payingUnits === undefined) {
    m.payingUnits = m.unitType === "team"
      ? (parseFloat(m.unitsPerTeam) || 0)
      : (parseFloat(p.unitsPerTeam) || parseFloat(p.players) || 0);
  }
  // Costs moved into Settings. Referee and coach were dollars per session; they are now per season per slot, so
  // multiply by the sessions each slot has in a season. That keeps every saved cost total exactly the same.
  if (p.refPerSeason === undefined) m.refPerSeason = (parseFloat(p.ref) || 0) * (m.weeksPerSeason + m.extraDays);
  if (p.coachPerSeason === undefined) m.coachPerSeason = (parseFloat(p.coach) || 0) * (m.weeksPerSeason + m.extraDays);
  if (p.securityPerSession === undefined) m.securityPerSession = parseFloat(p.security) || 0;
  LEGACY_KEYS.forEach((k) => delete m[k]);
  return m as Program;
}
