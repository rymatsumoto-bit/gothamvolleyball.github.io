import { fmt, type Totals } from "../model/calc";

interface Props {
  text: string;
  totals: Totals;
  onChange: (text: string) => void;
}

// Not a cost: it shaves the breakeven down, so it sits with the result and is tuned per scenario.
export function SafetyMarginCard({ text, totals, onChange }: Props) {
  return (
    <div className="card">
      <div className="cost-line">
        <label htmlFor="reserve">Safety margin (%)</label>
        <input type="number" id="reserve" min="0" max="50" step="1" value={text} onChange={(e) => onChange(e.target.value)} />
        <span className="cost-amt" id="reserve-amt">{fmt(totals.reserveAmt)}</span>
      </div>
      <p className="note">
        Shaves the breakeven venue budget down by this percentage, so the number isn't razor-thin against a $0 surplus.
      </p>
    </div>
  );
}
