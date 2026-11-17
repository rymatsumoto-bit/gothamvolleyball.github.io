// One source for the hover text on the Settings headers and the Definitions block below the table.
// Keep these in step with programFigures() in src/model/calc.ts.

export interface Definition {
  key?: string;
  term: string;
  text: string;
}

export const DEFINITIONS: { group: string; items: Definition[] }[] = [
  { group: "Revenue", items: [
    { key: "paymentType", term: "Payment type", text: "How often each payer pays. One time: once per season. Per session: once for each week in Weeks / season." },
    { key: "unitType", term: "Unit type", text: "Who pays. Individual: each person is a paying unit. Team: you enter the number of teams per slot in the calculator." },
    { key: "payingUnits", term: "Paying units", text: "Individual: the number of paying units in each slot (for example 30 players). Team: the number in each team (for example 8). If a Team program has 0, each team is the paying unit." },
    { key: "fee", term: "Fee per unit ($)", text: "Dollars charged per paying unit for each payment. For a Team program with 0 paying units, this is the fee per team." },
    { key: "seasons", term: "Seasons / year", text: "How many seasons the program runs in a year (1 or 2)." },
  ]},
  { group: "Scheduling", items: [
    { key: "weeksPerSeason", term: "Weeks / season", text: "Weeks the program runs in a season. Sets the number of sessions, and the number of payments for Per session programs." },
    { key: "extraDays", term: "Extra days / season", text: "Sessions outside the weekly rhythm, such as a tournament day. They add sessions, and so security cost, but not payments, and are not on the weekly schedule." },
  ]},
  { group: "Costs", items: [
    { key: "refPerSeason", term: "Referee ($) / season", text: "Dollars per season for each slot, since each slot is one division or level." },
    { key: "coachPerSeason", term: "Coach ($) / season", text: "Dollars per season for each slot, since each slot is one division or level." },
    { key: "securityPerSession", term: "Security ($) / session", text: "Dollars for every session of the program." },
  ]},
  { group: "How it adds up", items: [
    { term: "Slots", text: "Each slot on the weekly schedule is one division or level. A program with no slots has no sessions, revenue or cost." },
    { term: "Sessions per year", text: "slots/week × weeks per season × seasons + extra days × seasons" },
    { term: "Revenue", text: "seasons × slots/week × payments per season × paying units per slot × fee per unit" },
    { term: "Cost", text: "seasons × slots/week × (referee + coach) + sessions per year × security" },
  ]},
];

/** Hover text for a Settings column header, e.g. "Payment type: How often…". */
export function definitionTitle(key: string): string | undefined {
  for (const section of DEFINITIONS) {
    const d = section.items.find((i) => i.key === key);
    if (d) return d.term + ": " + d.text;
  }
  return undefined;
}
