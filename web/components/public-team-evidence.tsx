import { ArrowUpRight } from "lucide-react";
import observations from "../data/franchise-evidence.json";
import type { Franchise } from "./franchise-switch";
import { integer, money } from "../lib/format";
import { DEFAULT_SCENARIO, evaluate } from "../lib/scenario";

export default function PublicTeamEvidence({
  franchise,
}: {
  franchise: Franchise;
}) {
  const observation = observations[franchise];
  return (
    <section
      className="public-team-evidence"
      aria-label={`${franchise} public evidence and scenario boundary`}
    >
      <div className="public-attendance">
        <span className="eyebrow">OBSERVED / {franchise.toUpperCase()}</span>
        <strong>
          {integer(observation.value)} <small>{observation.label}</small>
        </strong>
        <p>
          vs. {observation.opponent} · {observation.game_date} ·{" "}
          {observation.venue}
        </p>
        <a href={observation.source_url} target="_blank" rel="noreferrer">
          {observation.source_name} <ArrowUpRight size={13} />
        </a>
        <small>
          One reviewed game · checked {observation.reviewed_on}.{" "}
          {observation.definition}
        </small>
      </div>
      <div className="scenario-boundary">
        <span className="eyebrow">ILLUSTRATIVE / CAMPAIGN ECONOMICS</span>
        <h2>Real context. Editable assumptions.</h2>
        <p>
          Both teams start with the same example inputs, producing the same{" "}
          {money(evaluate(DEFAULT_SCENARIO).netContribution)} reference result.
          This is a calculation, not measured team performance. Each team’s
          edits and pinned comparison are independent.
        </p>
        <small>
          Attendance does not determine acquisition cost, margin, or
          incrementality. County demographics are shared market facts. Sales,
          inventory, CRM, and campaign records are not connected.
        </small>
      </div>
    </section>
  );
}
