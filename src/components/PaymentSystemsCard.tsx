import { ratesUnset } from "../model/rates";
import type { PaymentRates } from "../model/types";
import { NumberInput } from "./NumberInput";

export type ProcessingSystem = "stripe" | "leagueApps";
export type ProcessingField = "percent" | "flat";

interface Props {
  rates: PaymentRates;
  editing: boolean;
  onProcessing: (system: ProcessingSystem, field: ProcessingField, text: string) => void;
  onArbiter: (text: string) => void;
}

const money = (n: number) => "$" + n.toFixed(2);

export function PaymentSystemsCard({ rates, editing, onProcessing, onArbiter }: Props) {
  const processingRow = (system: ProcessingSystem, name: string, what: string) => (
    <tr>
      <td>{name}</td>
      <td className="note" style={{ margin: 0 }}>{what}</td>
      <td>
        {editing
          ? <NumberInput value={rates[system].percent} min="0" max="20" step="0.1" aria-label={`${name} percent of each payment`} onChange={(t) => onProcessing(system, "percent", t)} />
          : rates[system].percent + "%"}
      </td>
      <td>
        {editing
          ? <NumberInput value={rates[system].flat} min="0" step="0.01" aria-label={`${name} dollars per transaction`} onChange={(t) => onProcessing(system, "flat", t)} />
          : money(rates[system].flat)}
      </td>
    </tr>
  );
  return (
    <div id="payment-systems">
      <h2>Payment systems</h2>
      <div className="card">
        <p className="note" style={{ marginTop: 0 }}>
          Each program takes its payments through one system, set in the program settings below. These rates are estimates,
          so update them as your statements show what you really pay.
        </p>
        {ratesUnset(rates) && (
          <div className="banner warn">
            Flat fees and the Arbiter rate are $0 until you enter them, so the breakeven is a little optimistic.
          </div>
        )}
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>System</th>
                <th>Used for</th>
                <th>% of each payment</th>
                <th>$ per transaction</th>
              </tr>
            </thead>
            <tbody>
              {processingRow("stripe", "Stripe", "Money in. Base card rate; some payments cost more, so use an effective rate.")}
              {processingRow("leagueApps", "LeagueApps", "Money in. An average over payment types.")}
              <tr>
                <td>Arbiter</td>
                <td className="note" style={{ margin: 0 }}>Money out. Charged for each person paid, at each payout.</td>
                <td>—</td>
                <td>
                  {editing
                    ? <NumberInput value={rates.arbiterPerPayout} min="0" step="0.01" aria-label="Arbiter dollars per person per payout" onChange={onArbiter} />
                    : money(rates.arbiterPerPayout)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
