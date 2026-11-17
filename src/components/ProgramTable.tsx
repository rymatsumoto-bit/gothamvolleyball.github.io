import { fmt, programFigures, type Totals } from "../model/calc";
import type { Program, Schedule } from "../model/types";
import { NumberInput } from "./NumberInput";

interface Props {
  programs: Program[];
  schedule: Schedule;
  totals: Totals;
  processingFee: string;
  onProcessingFee: (text: string) => void;
  onTeams: (index: number, text: string) => void;
}

const footRowStyle = { fontWeight: 500, borderTop: "1px solid var(--border-strong)" };

export function ProgramTable({ programs, schedule, totals, processingFee, onProcessingFee, onTeams }: Props) {
  return (
    <div className="card">
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th style={{ width: "16%" }}>Program</th>
              <th>Slots / week<br /><span style={{ fontWeight: 400, textTransform: "none" }}>(from schedule)</span></th>
              <th>Sessions<br />/ year</th>
              <th>Paying units<br />or teams<br />per slot</th>
              <th className="col-rev">Annual<br />revenue</th>
              <th className="col-cost">Annual<br />non-venue cost</th>
            </tr>
          </thead>
          <tbody>
            {programs.map((p, i) => {
              const f = programFigures(p, schedule);
              return (
                <tr key={i}>
                  <td className="col-name">{p.name}</td>
                  <td style={{ textAlign: "center" }}>{f.slots}</td>
                  <td style={{ textAlign: "center" }}>{f.sessions}</td>
                  <td>
                    {f.isTeam ? (
                      <>
                        <NumberInput value={p.teams} min="0" step="1" onChange={(t) => onTeams(i, t)} aria-label={`Teams per slot for ${p.name}`} />
                        <span className="unit-tag">{p.payingUnits > 0 ? `teams × ${p.payingUnits} = ${f.units} paying units` : "teams"}</span>
                      </>
                    ) : (
                      <span className="unit-tag" style={{ margin: 0 }}>{f.units} paying units (Settings)</span>
                    )}
                  </td>
                  <td className="col-rev">{fmt(f.revenue)}</td>
                  <td className="col-cost">{fmt(f.nonVenueCost)}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={footRowStyle}>
              <td>Gross total</td>
              <td /><td /><td />
              <td className="col-rev" id="total-revenue-row">{fmt(totals.grossRevenue)}</td>
              <td className="col-cost" id="total-nonvenue-row">{fmt(totals.grossNonVenue)}</td>
            </tr>
            <tr>
              <td style={{ whiteSpace: "nowrap" }}>
                Fees
                <input
                  type="number" id="processing-fee" min="0" max="20" step="0.1"
                  value={processingFee} onChange={(e) => onProcessingFee(e.target.value)}
                  style={{ width: 60, display: "inline-block", marginLeft: 6 }}
                />%
              </td>
              <td /><td /><td />
              <td className="col-rev" id="fees-revenue-row">{"-" + fmt(totals.feeOnRevenue)}</td>
              <td className="col-cost" id="fees-cost-row">{fmt(0)}</td>
            </tr>
            <tr style={footRowStyle}>
              <td>Net total</td>
              <td /><td /><td />
              <td className="col-rev" id="net-total-revenue-row">{fmt(totals.netRevenue)}</td>
              <td className="col-cost" id="net-total-cost-row">{fmt(totals.grossNonVenue)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
      <p className="note">
        Add, remove or rename programs, and set their payments, paying units, fee per unit, schedule and costs, in{" "}
        <a href="#settings">Settings</a>. Only the number of teams is entered here, per slot: each slot on the schedule is one division or level.
      </p>
    </div>
  );
}
