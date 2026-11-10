# NOLA PULSE

**A commercial decision you can question.** Market intelligence and campaign economics for the New Orleans Saints and Pelicans.

NOLA PULSE connects Gulf Coast market context with upcoming home games and a transparent campaign model. The opening brief answers three questions: what action is being considered, why the evidence is credible, and what would reverse the decision.

## Working experience

- Live public game context for both franchises, with provider attribution, last-checked times, and stale/unavailable states.
- Upcoming New Orleans home schedules refreshed from the official team websites.
- Six Census-backed market profiles on an interactive regional map and sortable comparison table.
- Editable campaign assumptions, calculated break-even thresholds, sensitivity ranking, and combined downside stress.
- A JSON decision brief and a printable PDF view preserving assumptions and source references.
- Reproducible Python/SQL data preparation and a native Power BI project source with matching design tokens.

The campaign outputs are conditional scenarios. Demographics are observed facts; acquisition cost, incrementality, and contribution margins are explicit assumptions. A market profile does not establish fan penetration or marketing performance.

## Run locally

Requires Node.js 22.13+ and Python 3.9+.

```sh
npm --prefix web ci
npm --prefix web run dev
```

Use the local URL printed by Vite. The application ships with its reviewed research snapshot. Live scores and official schedules require outbound network access. A failed live source does not replace missing values with fabricated observations.

## Rebuild the analytical snapshot

```sh
python3 scripts/build_data.py --web
node --experimental-strip-types web/scripts/export-analytics.mjs
python3 scripts/build_powerbi.py
```

CSV exports and the SQLite database are written to the ignored `data/processed/` directory. `data/reference/` contains the reviewed public facts and provenance. The optional `python3 scripts/refresh_schedule.py` updates the offline Pelicans homepage snapshot; review changes before committing a new evidence vintage.

## Validate

```sh
python3 -m unittest discover -s tests
npm --prefix web test
npm --prefix web run typecheck
npm --prefix web run format:check
npm --prefix web run build
node web/scripts/validate-powerbi.mjs
```

The final command retrieves Microsoft's report schemas. Opening, refreshing, and rendering the Power BI project still requires Power BI Desktop on Windows; it has not been Desktop-validated. See [Power BI setup](powerbi/README.md).

## Reference case

Under the explicitly assumed $6,000 spend, $32 cost per attributed order, two tickets per incremental order, $32 contribution per ticket, 65% incrementality, and $300 additional costs:

| Result | Scenario output |
| --- | ---: |
| Net incremental contribution | $1,500 |
| Break-even incremental share | 52.5% |
| Contribution at 40% incrementality | −$1,500 |

These are model outputs, not observed team revenue or a prediction of campaign lift.

## Documentation

[Methodology and limits](docs/METHODOLOGY.md) · [Architecture](docs/ARCHITECTURE.md) · [Brand and asset provenance](docs/DESIGN.md) · [Power BI project](powerbi/README.md)

No ticket-sales records, customer information, historical resale feed, causal elasticity estimate, or validated demand forecast is included. The interface makes these evidence boundaries explicit.

Independent portfolio project. Not affiliated with or endorsed by the New Orleans Saints, New Orleans Pelicans, NFL, or NBA. Team names and marks belong to their respective owners.
