import { useEffect, useMemo, useRef, useState } from "react";
import { FixedCostsCard } from "./components/FixedCostsCard";
import { ProgramTable } from "./components/ProgramTable";
import { Results } from "./components/Results";
import { ScheduleGrid } from "./components/ScheduleGrid";
import { SettingsView, type SettingsNumberField } from "./components/SettingsView";
import { totals as computeTotals, slotsPerWeek } from "./model/calc";
import { newProgram } from "./model/program";
import { reassignSlots } from "./model/schedule";
import { FIXED_COST_KEYS, fromSaved, readSaved, toSaved, writeSaved } from "./model/storage";
import type { FixedCostKey, FixedCosts, Program, Schedule } from "./model/types";

type View = "calc" | "settings";

function viewFromHash(): View {
  return location.hash === "#settings" ? "settings" : "calc";
}

const initial = fromSaved(readSaved());

export function App() {
  const [programs, setPrograms] = useState<Program[]>(initial.programs);
  const [schedule, setSchedule] = useState<Schedule>(initial.schedule);
  // Fixed-cost fields keep the typed text; the calculation and the save use the parsed numbers.
  const [fixedText, setFixedText] = useState(() => {
    const t = {} as Record<FixedCostKey, string>;
    FIXED_COST_KEYS.forEach((k) => { t[k] = String(initial.fixed[k]); });
    return t;
  });
  const [view, setView] = useState<View>(viewFromHash);
  // Settings open read-only; Edit unlocks them, and leaving Settings locks them again.
  const [editing, setEditing] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");
  const statusTimer = useRef<number | undefined>(undefined);

  const fixed = useMemo(() => {
    const f = {} as FixedCosts;
    FIXED_COST_KEYS.forEach((k) => { f[k] = parseFloat(fixedText[k]) || 0; });
    return f;
  }, [fixedText]);

  const totals = useMemo(() => computeTotals(programs, schedule, fixed), [programs, schedule, fixed]);

  useEffect(() => {
    const onHash = () => { setView(viewFromHash()); setEditing(false); };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const persist = () => {
    const ok = writeSaved(toSaved(programs, schedule, fixed));
    setSaveStatus(ok ? "Saved " + new Date().toLocaleTimeString() : "Couldn't save in this browser");
    clearTimeout(statusTimer.current);
    statusTimer.current = window.setTimeout(() => setSaveStatus(""), 2500);
  };

  // Autosave on every change, as the single-file version did. This also rewrites older saves in the current shape.
  useEffect(persist, [programs, schedule, fixed]);

  const updateProgram = (i: number, patch: Partial<Program>) =>
    setPrograms((ps) => ps.map((p, j) => (j === i ? { ...p, ...patch } : p)));

  const rename = (i: number, name: string) => {
    setSchedule((s) => reassignSlots(s, programs[i].name, name));
    updateProgram(i, { name });
  };

  const selectSetting = (i: number, field: "paymentType" | "unitType" | "seasons", value: string) => {
    if (field === "seasons") updateProgram(i, { seasons: parseInt(value, 10) || 1 });
    else updateProgram(i, { [field]: value } as Partial<Program>);
  };

  const numberSetting = (i: number, field: SettingsNumberField, text: string) =>
    updateProgram(i, { [field]: Math.max(0, parseFloat(text) || 0) });

  const remove = (i: number) => {
    const p = programs[i];
    const used = slotsPerWeek(schedule, p.name);
    if (used > 0 && !confirm(`"${p.name}" is on ${used} slot(s) of the weekly schedule. Remove it and clear those slots?`)) return;
    setSchedule((s) => reassignSlots(s, p.name, ""));
    setPrograms((ps) => ps.filter((_, j) => j !== i));
  };

  const add = () => {
    let name = "New program", n = 2;
    while (programs.some((p) => p.name === name)) name = "New program " + n++;
    setPrograms((ps) => [...ps, newProgram(name)]);
  };

  return (
    <div className="wrap">
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
        <div>
          <h1>Gotham Volleyball — new gym breakeven calculator</h1>
          <p className="subtitle">
            Full-year gym lease, shared across all programming. Set the weekly schedule, tune each program's assumptions,
            and the breakeven venue budget updates live.
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <button className={"btn" + (view === "calc" ? " active" : "")} onClick={() => { location.hash = ""; }}>Calculator</button>
          <button className={"btn" + (view === "settings" ? " active" : "")} onClick={() => { location.hash = "settings"; }}>Settings</button>
          <span className="note" style={{ margin: 0 }}>{saveStatus}</span>
          <button className="btn" onClick={persist}>Save</button>
        </div>
      </div>

      {view === "calc" ? (
        <div id="calc-view">
          <h2>Weekly gym schedule</h2>
          <div className="card">
            <p className="note" style={{ marginTop: 0 }}>
              Assign a program to each day/time slot. This is a typical week — the number of slots/week per program drives the calculation below.
            </p>
            <ScheduleGrid programs={programs} schedule={schedule} onAssign={(k, name) => setSchedule((s) => ({ ...s, [k]: name }))} />
          </div>

          <h2>Program revenues and costs</h2>
          <ProgramTable
            programs={programs} schedule={schedule} totals={totals}
            processingFee={fixedText.processingFee}
            onProcessingFee={(t) => setFixedText((f) => ({ ...f, processingFee: t }))}
            onTeams={(i, t) => updateProgram(i, { teams: parseFloat(t) || 0 })}
          />

          <h2>Fixed costs</h2>
          <FixedCostsCard text={fixedText} fixed={fixed} totals={totals} onChange={(k, t) => setFixedText((f) => ({ ...f, [k]: t }))} />

          <h2>Result</h2>
          <Results totals={totals} />
        </div>
      ) : (
        <SettingsView
          programs={programs} editing={editing} onToggleEdit={() => setEditing((e) => !e)}
          onRename={rename} onSelect={selectSetting} onNumber={numberSetting} onRemove={remove} onAdd={add}
        />
      )}

      <footer>Gotham Volleyball League Treasurer's Wiki — venue budget model.</footer>
    </div>
  );
}
