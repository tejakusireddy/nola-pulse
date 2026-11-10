import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import {
  DEFAULT_SCENARIO,
  evaluate,
  contributionCurve,
} from "../lib/scenario.ts";

const output = fileURLToPath(new URL("../../data/processed/", import.meta.url));
await mkdir(output, { recursive: true });
const scenarios = [
  {
    scenario_id: "reference",
    label: "Reference assumptions",
    ...DEFAULT_SCENARIO,
  },
  {
    scenario_id: "lower-incrementality",
    label: "40% incrementality stress",
    ...DEFAULT_SCENARIO,
    incrementality: 0.4,
  },
  {
    scenario_id: "no-campaign",
    label: "No campaign",
    ...DEFAULT_SCENARIO,
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
const outputs = scenarios.map((s) => ({ ...s, ...evaluate(s) }));
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
