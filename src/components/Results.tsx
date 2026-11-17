import { fmt, type Totals } from "../model/calc";

export function Results({ totals }: { totals: Totals }) {
  const deficit = totals.rawBreakeven < 0;
  return (
    <>
      <div className="summary-grid">
        <div className="metric">
          <p className="metric-label">Total programming revenue</p>
          <p className="metric-value" id="total-revenue">{fmt(totals.grossRevenue)}</p>
        </div>
        <div className="metric">
          <p className="metric-label">Net revenue after processing fees</p>
          <p className="metric-value" id="net-revenue">{fmt(totals.netRevenue)}</p>
        </div>
        <div className="metric">
          <p className="metric-label">Total non-venue costs</p>
          <p className="metric-value" id="total-nonvenue">{fmt(totals.totalNonVenue)}</p>
        </div>
        <div className="metric highlight">
          <p className="metric-label">Max annual venue budget (breakeven)</p>
          <p className="metric-value" id="max-venue">{fmt(totals.maxVenue)}</p>
          <p className="metric-sub" id="max-venue-monthly">{fmt(totals.maxVenue / 12) + " / month"}</p>
        </div>
      </div>
      <div className={"banner " + (deficit ? "warn" : "ok")} id="banner">
        {deficit
          ? "Programming revenue doesn't cover non-venue costs alone — the venue budget is $0 and this combination of programs runs a deficit before rent is even considered."
          : "Breakeven venue budget is " + fmt(totals.maxVenue) + "/year (" + fmt(totals.maxVenue / 12) + "/month)."}
      </div>
    </>
  );
}
