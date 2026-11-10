import { ArrowUpRight } from "lucide-react";
import observations from "../data/franchise-evidence.json";
import type { Franchise } from "./franchise-switch";
import { integer } from "../lib/format";

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
    </section>
  );
}
