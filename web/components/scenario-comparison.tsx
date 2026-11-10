import { Pin, RotateCcw } from "lucide-react";
import { evaluate } from "../lib/scenario";
import type { Scenario } from "../lib/scenario";
import { money, percent, signed } from "../lib/format";

export default function ScenarioComparison({
  scenario,
  baseline,
  onPin,
  onReset,
}: {
  scenario: Scenario;
  baseline: Scenario;
  onPin: () => void;
  onReset: () => void;
}) {
  const current = evaluate(scenario),
    comparison = evaluate(baseline);
  const delta = current.netContribution - comparison.netContribution;
  return (
    <section
      className="scenario-comparison"
      aria-label="Current scenario compared with pinned assumptions"
    >
      <div className="comparison-heading">
        <div className="comparison-status">
          <span className="eyebrow">LIVE SCENARIO / PINNED COMPARISON</span>
          <strong
            className={
              current.status === "positive"
                ? "positive-text"
                : current.status === "negative"
                  ? "negative-text"
                  : "muted"
            }
          >
            {current.status === "positive"
              ? "Conditional test"
              : current.status === "inactive"
                ? "No active campaign"
                : current.status === "break-even"
                  ? "Break-even"
                  : "Revise before launch"}
          </strong>
        </div>
        <div>
          <button onClick={onPin}>
            <Pin size={13} />
            Pin current assumptions
          </button>
          <button onClick={onReset}>
            <RotateCcw size={13} />
            Reset comparison
          </button>
        </div>
      </div>
      <div className="scenario-outcomes">
        <article>
          <span>
            Net incremental contribution <i>Derived</i>
          </span>
          <strong
            className={
              current.netContribution >= 0 ? "positive-text" : "negative-text"
            }
          >
            {money(current.netContribution)}
          </strong>
          <p>
            Comparison: {money(comparison.netContribution)}{" "}
            <b>
              {delta > 0 ? "+" : ""}
              {money(delta)} change
            </b>
          </p>
        </article>
        <article>
          <span>
            Incremental ticket volume <i>Derived</i>
          </span>
          <strong>{current.incrementalTickets.toFixed(1)}</strong>
          <p>
            Comparison: {comparison.incrementalTickets.toFixed(1)}{" "}
            <b>
              {signed(
                current.incrementalTickets - comparison.incrementalTickets,
              )}{" "}
              tickets
            </b>
          </p>
        </article>
        <article>
          <span>
            Incrementality reversal <i>Derived</i>
          </span>
          <strong>
            {current.breakEvenShare === null
              ? "Undefined"
              : percent(current.breakEvenShare)}
          </strong>
          <p>
            Comparison:{" "}
            {comparison.breakEvenShare === null
              ? "undefined"
              : percent(comparison.breakEvenShare)}{" "}
            <b>
              {current.breakEvenShare === null ||
              comparison.breakEvenShare === null
                ? "No finite delta"
                : signed(
                    (current.breakEvenShare - comparison.breakEvenShare) * 100,
                    " pp",
                  )}
            </b>
          </p>
        </article>
      </div>
      <p className="comparison-note">
        Both cases use explicit assumptions. Pinning preserves the current
        inputs for comparison while you edit; it does not establish measured
        performance. Fractional tickets are modeled averages.
      </p>
    </section>
  );
}
