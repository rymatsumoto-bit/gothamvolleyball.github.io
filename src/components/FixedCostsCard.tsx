import { fmt, type Totals } from "../model/calc";
import type { FixedCostKey, FixedCosts } from "../model/types";

interface Props {
  text: Record<FixedCostKey, string>;
  fixed: FixedCosts;
  totals: Totals;
  /** Settings are read-only until Edit is pressed. */
  editing: boolean;
  onChange: (key: FixedCostKey, text: string) => void;
}

const nowrapNote = { margin: 0, whiteSpace: "nowrap" } as const;

export function FixedCostsCard({ text, fixed, totals, editing, onChange }: Props) {
  // Read-only, the fields show nothing because the amount on the right already says it.
  const field = (key: FixedCostKey, props: { id: string; step: string }) =>
    editing
      ? <input type="number" min="0" {...props} value={text[key]} onChange={(e) => onChange(key, e.target.value)} />
      : <span />;
  return (
    <div className="card">
      <div className="cost-line">
        <label>End of season party</label>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flex: "none" }}>
          {editing
            ? <input type="number" id="party-members" min="0" step="1" style={{ width: 80 }} title="Net new members"
                value={text.partyMembers} onChange={(e) => onChange("partyMembers", e.target.value)} />
            : <span id="party-members">{fixed.partyMembers}</span>}
          <span className="note" style={nowrapNote}>members ×</span>
          {editing
            ? <input type="number" id="party-cost" min="0" step="1" style={{ width: 80 }} title="Cost per member ($)"
                value={text.partyCost} onChange={(e) => onChange("partyCost", e.target.value)} />
            : <span id="party-cost">{fmt(fixed.partyCost)}</span>}
          <span className="note" style={nowrapNote}>$/member</span>
        </div>
        <span className="cost-amt" id="party-amt">{fmt(totals.partyAmt)}</span>
      </div>
      <div className="cost-line">
        <label htmlFor="equipment">Equipment ($)</label>
        {field("equipment", { id: "equipment", step: "100" })}
        <span className="cost-amt" id="equipment-amt">{fmt(fixed.equipment)}</span>
      </div>
      <div className="cost-line">
        <label htmlFor="insurance">Incremental annual insurance for this venue ($)</label>
        {field("insurance", { id: "insurance", step: "100" })}
        <span className="cost-amt" id="insurance-amt">{fmt(fixed.insurance)}</span>
      </div>
      <div className="cost-line">
        <label htmlFor="other-fixed">Other fixed annual costs ($)</label>
        {field("otherFixed", { id: "other-fixed", step: "100" })}
        <span className="cost-amt" id="other-fixed-amt">{fmt(fixed.otherFixed)}</span>
      </div>
      <p className="note">
        Payment processing and Arbiter fees are set in Payment systems above. The safety margin is on the calculator page.
      </p>
    </div>
  );
}
