import type { Program, Schedule } from "./types";

export const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
export const PARTS = ["Morning", "Afternoon", "Evening"] as const;
export const COLORS = ["#378ADD", "#1D9E75", "#D85A30", "#D4537E", "#BA7517", "#7F77DD", "#639922"];
export const EMPTY_COLOR = "#e0ded8";
const UNKNOWN_COLOR = "#b4b2a9";

export function slotKey(day: string, part: string): string {
  return day + "-" + part;
}

export function defaultSchedule(): Schedule {
  const s: Schedule = {};
  DAYS.forEach((d) => PARTS.forEach((p) => { s[slotKey(d, p)] = ""; }));
  return s;
}

/** A program's colour follows its position in the program list. */
export function programColor(programs: Program[], name: string): string {
  const i = programs.findIndex((p) => p.name === name);
  return i === -1 ? UNKNOWN_COLOR : COLORS[i % COLORS.length];
}

/** Replace every slot holding `from` with `to` ("" clears it). */
export function reassignSlots(schedule: Schedule, from: string, to: string): Schedule {
  const next: Schedule = { ...schedule };
  Object.keys(next).forEach((k) => { if (next[k] === from) next[k] = to; });
  return next;
}
