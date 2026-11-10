import {
  ASSUMPTIONS,
  MODEL_VERSION,
  evaluate,
  sensitivity,
  combinedDownside,
} from "./scenario.ts";
import type { Scenario } from "./scenario.ts";
import intelligence from "../data/intelligence.json" with { type: "json" };

import franchiseEvidence from "../data/franchise-evidence.json" with { type: "json" };

export type Market = (typeof intelligence.markets)[number];
export type Game = (typeof intelligence.games)[number];

export function assertEvidence(market: Market, game: Game) {
  if (
    !market.source_url.startsWith("https://www.census.gov/quickfacts/") ||
    !market.reviewed_on ||
    !(
      game.source_url.startsWith("https://www.nba.com/") ||
      game.source_url.startsWith("https://www.neworleanssaints.com/")
    ) ||
    !game.retrieved_at
  ) {
    throw new Error(
      "The recommendation is blocked: source provenance is incomplete.",
    );
  }
  for (const key of ["population", "households", "median_income"] as const) {
    if (!Number.isFinite(market[key]) || market[key] <= 0)
      throw new Error(`Missing evidence: ${key}`);
  }
}

export function createBrief(
  market: Market,
  game: Game,
  scenario: Scenario,
  comparison?: Scenario,
) {
  assertEvidence(market, game);
  const result = evaluate(scenario);
  const threshold = result.breakEvenShare;
  const comparisonResult = comparison ? evaluate(comparison) : null;
  const recommendation =
    result.status === "positive"
      ? "Prepare a bounded test, conditional on validating acquisition cost, incrementality, and available primary inventory."
      : result.status === "inactive"
        ? "No media campaign is active in this scenario."
        : "Do not scale this scenario; revise its economics or retain the no-campaign alternative.";
  return {
    title: `${game.franchise} vs. ${game.opponent} · ${market.name}`,
    model_version: MODEL_VERSION,
    snapshot_date: intelligence.snapshot_date,
    exported_at: new Date().toISOString(),
    recommendation,
    recommendation_scope:
      "Conditional campaign economics, not an optimized market allocation or a measured return forecast.",
    game,
    market,
    public_team_observation:
      franchiseEvidence[game.franchise as keyof typeof franchiseEvidence] ??
      null,
    scenario_disclosure:
      "Editable planning inputs, including illustrative franchise-specific presets, are not measured team performance and are not estimated from attendance or demographics. Scenario edits and pinned comparisons are independent for each franchise.",
    inputs: ASSUMPTIONS.map((a) => ({
      key: a.key,
      value: scenario[a.key],
      unit: a.unit,
      kind: "Assumed",
      rationale: a.rationale,
      origin: "User-editable demonstration scenario",
      source_id: "scenario",
    })),
    derived: {
      ...result,
      source_id: "scenario",
      formula: "N = (B / C) × i × T × M − B − F",
    },
    comparison:
      comparison && comparisonResult
        ? {
            kind: "Assumed",
            source_id: "scenario",
            origin: "Pinned user-editable assumptions, not a measured baseline",
            inputs: ASSUMPTIONS.map((a) => ({
              key: a.key,
              value: comparison[a.key],
              unit: a.unit,
              kind: "Assumed",
              source_id: "scenario",
            })),
            derived: comparisonResult,
            delta: {
              net_contribution:
                result.netContribution - comparisonResult.netContribution,
              incremental_tickets:
                result.incrementalTickets - comparisonResult.incrementalTickets,
              incrementality_threshold:
                threshold === null || comparisonResult.breakEvenShare === null
                  ? null
                  : threshold - comparisonResult.breakEvenShare,
            },
            transformation:
              "Current scenario minus pinned comparison; identical evaluate() model for both cases. Threshold delta is a share, not a percent change.",
          }
        : null,
    reversal: {
      incrementality_threshold: threshold,
      feasible: result.feasible,
      condition:
        threshold === null
          ? "No finite incrementality threshold in this scenario."
          : threshold > 1
            ? "Cannot break even at any feasible incremental share under the other assumptions."
            : `Below ${(threshold * 100).toFixed(2)}% incrementality, contribution is negative; equality is break-even. Other inputs held fixed.`,
      sensitivity: sensitivity(scenario),
      combined_downside: combinedDownside(scenario),
      range_origin:
        "Exploratory demonstration bounds; not estimated confidence intervals or empirical market ranges.",
    },
    evidence: intelligence.sources,
    limitations: intelligence.limitations,
    experiment: {
      design:
        "Within the selected market, randomize eligible audiences or matched geographic clusters into treatment and holdout. Exclude existing buyers where appropriate and account for campaign spillover.",
      primary_outcome:
        "Incremental contribution after discounts, variable costs, and campaign costs, relative to holdout.",
      before_launch:
        "Supply first-party primary inventory, baseline conversion, eligible audience size, contribution margins, attribution windows, and privacy-approved audience definitions. Size the experiment before launch.",
      decision_rule:
        "Scale only if measured incremental contribution clears zero with an agreed uncertainty standard; otherwise stop or revise. Do not infer incrementality from attribution alone.",
    },
  };
}

export function download(filename: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
