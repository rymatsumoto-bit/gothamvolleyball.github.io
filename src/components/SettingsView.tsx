import { useEffect, useRef, type ReactNode } from "react";
import { DEFINITIONS, definitionTitle } from "../definitions";
import { fmt } from "../model/calc";
import type { Totals } from "../model/calc";
import type { FixedCostKey, FixedCosts, PaymentRates, Program } from "../model/types";
import { FixedCostsCard } from "./FixedCostsCard";
import { NumberInput } from "./NumberInput";
import { PaymentSystemsCard, type ProcessingField, type ProcessingSystem } from "./PaymentSystemsCard";

const PAYMENT_SYSTEMS: [string, string][] = [["stripe", "Stripe"], ["leagueApps", "LeagueApps"]];
const PAYMENT_TYPES: [string, string][] = [["once", "One time"], ["session", "Per session"]];
const UNIT_TYPES: [string, string][] = [["individual", "Individual"], ["team", "Team"]];
const SEASONS: [string, string][] = [["1", "1"], ["2", "2"]];

/** Numeric Settings fields, edited with NumberInput and clamped at 0. */
export type SettingsNumberField =
  "payingUnits" | "fee" | "weeksPerSeason" | "extraDays" | "refPerSeason" | "coachPerSeason" | "securityPerSession"
  | "payoutsPerSeason" | "peoplePaidPerSlot";

interface Props {
  programs: Program[];
  rates: PaymentRates;
  fixedText: Record<FixedCostKey, string>;
  fixed: FixedCosts;
  totals: Totals;
  editing: boolean;
  onToggleEdit: () => void;
  onProcessing: (system: ProcessingSystem, field: ProcessingField, text: string) => void;
  onArbiter: (text: string) => void;
  onFixed: (key: FixedCostKey, text: string) => void;
  onRename: (index: number, name: string) => void;
  onSelect: (index: number, field: "paymentSystem" | "paymentType" | "unitType" | "seasons", value: string) => void;
  onNumber: (index: number, field: SettingsNumberField, text: string) => void;
  onRemove: (index: number) => void;
  onAdd: () => void;
}

function label(options: [string, string][], v: unknown): string {
  return (options.find((o) => o[0] === String(v)) || [0, String(v)])[1];
}

function Select({ options, value, onChange }: { options: [string, string][]; value: unknown; onChange: (v: string) => void }) {
  return (
    <select value={String(value)} onChange={(e) => onChange(e.target.value)}>
      {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </select>
  );
}

function Th({ def, children }: { def: string; children: ReactNode }) {
  return <th className="has-def" title={definitionTitle(def)}>{children}</th>;
}

export function SettingsView(props: Props) {
  const { programs, rates, fixedText, fixed, totals, editing, onToggleEdit, onProcessing, onArbiter, onFixed, onRename, onSelect, onNumber, onRemove, onAdd } = props;
  const tbodyRef = useRef<HTMLTableSectionElement>(null);
  const focusNewName = useRef(false);

  // After "+ Add program", focus and select the new row's name so it can be typed over.
  useEffect(() => {
    if (!focusNewName.current) return;
    focusNewName.current = false;
    const inputs = tbodyRef.current?.querySelectorAll<HTMLInputElement>('input[type="text"]');
    const last = inputs?.[inputs.length - 1];
    if (last) { last.focus(); last.select(); }
  }, [programs.length]);

  const num = (i: number, field: SettingsNumberField, p: Program, extra: { step: string; max?: string }) => (
    <NumberInput value={p[field]} min="0" {...extra} onChange={(t) => onNumber(i, field, t)} />
  );
  const dash = (v: number) => (v > 0 ? v : "—");

  return (
    <div id="settings-view">
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
        <h2>Settings</h2>
        <button className={"btn" + (editing ? " active" : "")} onClick={onToggleEdit}>{editing ? "Done" : "Edit"}</button>
      </div>
      <PaymentSystemsCard rates={rates} editing={editing} onProcessing={onProcessing} onArbiter={onArbiter} />
      <h2>Program settings</h2>
      <div className="card">
        <p className="note" style={{ marginTop: 0 }}>
          Define how each program earns revenue and how it is scheduled. Each slot on the weekly schedule is one division or level.
        </p>
        <div className="table-scroll">
          <table id="settings-table">
            <thead>
              <tr className="group-head">
                <th />
                <th colSpan={6}><span>Revenue</span></th>
                <th colSpan={2}><span>Scheduling</span></th>
                <th colSpan={5}><span>Costs</span></th>
                <th />
              </tr>
              <tr>
                <th>Program</th>
                <Th def="paymentSystem">Payment<br />system</Th>
                <Th def="paymentType">Payment<br />type</Th>
                <Th def="unitType">Unit<br />type</Th>
                <Th def="payingUnits">Paying<br />units<br /><span style={{ fontWeight: 400, textTransform: "none" }}>(per team if Team)</span></Th>
                <Th def="fee">Fee per<br />unit ($)</Th>
                <Th def="seasons">Seasons<br />/ year</Th>
                <Th def="weeksPerSeason">Weeks<br />/ season</Th>
                <Th def="extraDays">Extra days<br />/ season</Th>
                <Th def="refPerSeason">Referee ($)<br />/ season</Th>
                <Th def="coachPerSeason">Coach ($)<br />/ season</Th>
                <Th def="securityPerSession">Security ($)<br />/ session</Th>
                <Th def="payoutsPerSeason">Payouts<br />/ season</Th>
                <Th def="peoplePaidPerSlot">People paid<br />/ slot</Th>
                <th />
              </tr>
            </thead>
            <tbody ref={tbodyRef}>
              {programs.map((p, i) =>
                editing ? (
                  <tr key={i}>
                    <td><input type="text" value={p.name} onChange={(e) => onRename(i, e.target.value)} /></td>
                    <td><Select options={PAYMENT_SYSTEMS} value={p.paymentSystem} onChange={(v) => onSelect(i, "paymentSystem", v)} /></td>
                    <td><Select options={PAYMENT_TYPES} value={p.paymentType} onChange={(v) => onSelect(i, "paymentType", v)} /></td>
                    <td><Select options={UNIT_TYPES} value={p.unitType} onChange={(v) => onSelect(i, "unitType", v)} /></td>
                    <td>{num(i, "payingUnits", p, { step: "1" })}</td>
                    <td>{num(i, "fee", p, { step: "0.01" })}</td>
                    <td><Select options={SEASONS} value={p.seasons} onChange={(v) => onSelect(i, "seasons", v)} /></td>
                    <td>{num(i, "weeksPerSeason", p, { step: "1", max: "52" })}</td>
                    <td>{num(i, "extraDays", p, { step: "1" })}</td>
                    <td>{num(i, "refPerSeason", p, { step: "1" })}</td>
                    <td>{num(i, "coachPerSeason", p, { step: "1" })}</td>
                    <td>{num(i, "securityPerSession", p, { step: "1" })}</td>
                    <td>{num(i, "payoutsPerSeason", p, { step: "1" })}</td>
                    <td>{num(i, "peoplePaidPerSlot", p, { step: "1" })}</td>
                    <td>
                      <button className="row-remove" title="Remove program" aria-label={`Remove ${p.name}`} onClick={() => onRemove(i)}>✕</button>
                    </td>
                  </tr>
                ) : (
                  <tr key={i}>
                    <td>{p.name}</td>
                    <td>{label(PAYMENT_SYSTEMS, p.paymentSystem)}</td>
                    <td>{label(PAYMENT_TYPES, p.paymentType)}</td>
                    <td>{label(UNIT_TYPES, p.unitType)}</td>
                    <td>{p.unitType === "team" ? dash(p.payingUnits) : p.payingUnits}</td>
                    <td>{fmt(p.fee)}</td>
                    <td>{p.seasons}</td>
                    <td>{p.weeksPerSeason}</td>
                    <td>{p.extraDays}</td>
                    <td>{fmt(p.refPerSeason)}</td>
                    <td>{fmt(p.coachPerSeason)}</td>
                    <td>{fmt(p.securityPerSession)}</td>
                    <td>{p.payoutsPerSeason}</td>
                    <td>{p.peoplePaidPerSlot}</td>
                    <td />
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
        {editing && (
          <p style={{ margin: "12px 0 0" }}>
            <button className="btn" onClick={() => { focusNewName.current = true; onAdd(); }}>+ Add program</button>
          </p>
        )}
        <div className="defs">
          <h3>Definitions</h3>
          {DEFINITIONS.map((section) => [
            <h3 key={section.group + "-h"}>{section.group}</h3>,
            <dl key={section.group}>
              {section.items.map((item) => [
                <dt key={item.term + "-t"}>{item.term}</dt>,
                <dd key={item.term}>{item.text}</dd>,
              ])}
            </dl>,
          ])}
        </div>
      </div>
      <h2>Other costs</h2>
      <FixedCostsCard text={fixedText} fixed={fixed} totals={totals} editing={editing} onChange={onFixed} />
    </div>
  );
}
