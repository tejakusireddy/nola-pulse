import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { evaluate, contributionCurve } from "../lib/scenario.ts";

import { initialCampaign, campaignFinance } from "../lib/campaign-finance.ts";

const output = fileURLToPath(new URL("../../data/processed/", import.meta.url));
await mkdir(output, { recursive: true });
const scenarios = [
  {
    scenario_id: "pelicans-pilot",
    label: "Pelicans · group-ticket planning case",
    franchise: "Pelicans",
    ...initialCampaign("Pelicans"),
  },
  {
    scenario_id: "saints-pilot",
    label: "Saints · regional ticket planning case",
    franchise: "Saints",
    ...initialCampaign("Saints"),
  },
  {
    scenario_id: "pelicans-stress",
    label: "Pelicans · 40% incrementality stress",
    franchise: "Pelicans",
    ...initialCampaign("Pelicans"),
    incrementality: 0.4,
  },
  {
    scenario_id: "no-campaign",
    label: "No campaign",
    franchise: "Pelicans",
    ...initialCampaign("Pelicans"),
    budget: 0,
    fixedCosts: 0,
  },
];
function csv(rows) {
  const columns = Object.keys(rows[0]);
  return (
    [
      columns.join(","),
      ...rows.map((row) =>
        columns
          .map((c) =>
            row[c] === null || row[c] === undefined
              ? ""
              : JSON.stringify(row[c]),
          )
          .join(","),
      ),
    ].join("\n") + "\n"
  );
}
const outputs = scenarios.map((s) => {
  const financials = campaignFinance(s);
  return {
    ...s,
    ...evaluate(s),
    incrementalTicketRevenue: financials.incrementalTicketRevenue,
    variableCosts: financials.variableCosts,
    totalCashCosts: financials.totalCashCosts,
    contributionROI: financials.contributionROI,
  };
});
await writeFile(`${output}/scenarios.csv`, csv(outputs));
const curves = scenarios.flatMap((s) =>
  contributionCurve(s).map((p) => ({
    scenario_id: s.scenario_id,
    incremental_share: p.share,
    net_contribution: p.net,
  })),
);
await writeFile(`${output}/curves.csv`, csv(curves));
console.log(
  `Exported ${outputs.length} scenarios and ${curves.length} curve observations from the application model.`,
);
