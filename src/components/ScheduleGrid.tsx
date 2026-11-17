import { DAYS, EMPTY_COLOR, PARTS, programColor, slotKey } from "../model/schedule";
import type { Program, Schedule } from "../model/types";

interface Props {
  programs: Program[];
  schedule: Schedule;
  onAssign: (key: string, name: string) => void;
}

export function ScheduleGrid({ programs, schedule, onAssign }: Props) {
  const named = programs.filter((p) => p.name.trim() !== "");
  return (
    <>
      <div className="schedule-grid">
        <div className="head" />
        {DAYS.map((d) => <div key={d} className="head">{d}</div>)}
        {PARTS.map((part) => [
          <div key={part} className="rowlabel">{part}</div>,
          ...DAYS.map((day) => {
            const key = slotKey(day, part);
            const val = schedule[key] || "";
            const color = val ? programColor(programs, val) : EMPTY_COLOR;
            return (
              <select
                key={key}
                value={val}
                onChange={(e) => onAssign(key, e.target.value)}
                style={{
                  background: val ? color + "26" : "#fff",
                  borderColor: val ? color : "var(--border)",
                  color: val ? color : "var(--text)",
                }}
              >
                <option value="">—</option>
                {named.map((p, i) => <option key={i} value={p.name}>{p.name}</option>)}
              </select>
            );
          }),
        ])}
      </div>
      <div className="legend">
        {named.map((p, i) => (
          <span key={i}><span className="swatch" style={{ background: programColor(programs, p.name) }} />{p.name}</span>
        ))}
        <span><span className="swatch" style={{ background: EMPTY_COLOR }} />Empty</span>
      </div>
    </>
  );
}
