# NOLA PULSE

**Saints and Pelicans market intelligence.** Measured attendance performance, Gulf Coast market context, and campaign planning.

The opening decision brief shows media budget, incremental ticket revenue, net contribution, contribution ROI, and a calculated decision-reversal threshold. Pelicans and Saints use separate editable planning examples. These are authored scenarios, not estimates of team financial performance. A revenue-to-contribution chart reconciles every modeled cost.

Supporting attendance analysis covers 109 reviewed home-game records across three seasons per franchise. Markets and attendance are separate research views. Source records remain available on demand rather than repeated as an overview table.

## Working experience

- Full Pelicans and Saints editions: hover or focus to preview; select to keep the franchise, typography, and game context.
- Three-season attendance totals, average crowds, matched prior-season change, game-level trend, crowd range, weekday/weekend groups, and opponent history.
- Searchable library of defined commercial measures, separating observed facts, calculations, assumptions, and missing connections.
- Supporting public game context for both franchises, with provider attribution, last-checked times, and stale/unavailable states.
- Upcoming New Orleans home schedules refreshed from the official team websites.
- A large Census-backed county map with population and income layers, selectable markets, pan, zoom, and a sortable comparison table.
- A dedicated simulator with editable assumptions, pinned scenario comparison, calculated break-even thresholds, sensitivity ranking, and combined downside stress.
- Verified team logos, colors and licensed website fonts. Licensed venue photographs are retained with source credits.
- Overview JSON and observation CSV exports preserving actual data, calculation scope, and source references; separate simulator briefs retain campaign inputs and reversal tests.
- Reproducible Python/SQL data preparation and a native Power BI project source with matching design tokens.

Attendance sources, correction and exclusion rules, and comparison definitions are documented in [Attendance evidence](docs/ATTENDANCE.md).

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
python3 scripts/build_attendance.py
python3 scripts/build_powerbi.py
```

CSV exports and the SQLite database are written to the ignored `data/processed/` directory. `data/reference/` contains the reviewed public facts and provenance. The optional `python3 scripts/refresh_schedule.py` updates the offline Pelicans homepage snapshot; review changes before committing a new evidence vintage.

## Validate

```sh
python3 -m unittest discover -s tests
npm --prefix web test
npm --prefix web run typecheck
npm --prefix web run lint
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

## Regional geometry

The map uses geographic county boundaries, not estimated fan catchments. To reproduce the geometry, download the exact us-atlas 3.0.1 `counties-10m.json` URL recorded in `web/data/geography.json`, verify its recorded SHA-256, and run `python3 scripts/build_geography.py /path/to/counties-10m.json`. Layer shading scales the selected observed measure across the six candidate counties. Venue source and license details are recorded in `web/data/venue-assets.json`.
