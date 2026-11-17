import { defaultPrograms, migrateProgram } from "./program";
import { defaultSchedule } from "./schedule";
import type { FixedCostKey, FixedCosts, Program, SavedState, Schedule } from "./types";

// Saved data is sacred: do not rename this key or change the saved shape without a migration (see CLAUDE.md).
export const STORAGE_KEY = "gotham-gym-budget-v6";

export const FIXED_COST_KEYS: readonly FixedCostKey[] = [
  "equipment", "insurance", "otherFixed", "reserve", "processingFee", "partyMembers", "partyCost",
];

export interface LoadedState {
  programs: Program[];
  schedule: Schedule;
  fixed: FixedCosts;
}

export function readSaved(storage: Storage = localStorage): any | null {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/** Turns whatever was saved (any older shape, or nothing) into the current state. */
export function fromSaved(saved: any | null): LoadedState {
  // Unnamed rows from older saves never had slots, so they contributed nothing and are dropped.
  const programs: Program[] = saved && saved.programs
    ? saved.programs.filter((p: any) => (p.name || "").trim() !== "").map(migrateProgram)
    : defaultPrograms();
  const schedule: Schedule = saved && saved.schedule ? saved.schedule : defaultSchedule();
  const fixed = {} as FixedCosts;
  // The single-file version put `saved.x || 0` into each input and read it back with parseFloat.
  FIXED_COST_KEYS.forEach((k) => { fixed[k] = parseFloat(saved?.[k]) || 0; });
  return { programs, schedule, fixed };
}

export function toSaved(programs: Program[], schedule: Schedule, fixed: FixedCosts): SavedState {
  return {
    programs, schedule,
    equipment: fixed.equipment, insurance: fixed.insurance, otherFixed: fixed.otherFixed, reserve: fixed.reserve,
    processingFee: fixed.processingFee, partyMembers: fixed.partyMembers, partyCost: fixed.partyCost,
  };
}

/** Returns false when the browser refuses to store (private mode, storage full). */
export function writeSaved(state: SavedState, storage: Storage = localStorage): boolean {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}
