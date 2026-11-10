# Public evidence and commercial data access

NOLA PULSE can demonstrate a sourced decision process without privileged access. It cannot measure private commercial performance from public schedules, scores, population figures, or announced attendance.

## Available evidence

- Census QuickFacts: six counties/parishes, household income, household counts, and population change. These describe residents, not buyers or fans.
- Official franchise schedules: upcoming New Orleans home games, opponents, venue and timing; dated fallbacks and live refresh remain distinct.
- NBA game summary: Pelicans reported attendance, 17,767 against Minnesota on November 6, 2026. Reviewed directly in the NBA page's Game Info section on November 10.
- Official Saints/NFL gamebook: 70,182 **paid attendance** against Cleveland on November 8, 2026, PDF page 2. The source calls this paid attendance; it does not provide transactions, realized yield, scans, or sellable capacity.

These two game observations are deliberately scoped to one reviewed game per franchise. They are not season averages, live attendance feeds, comparable utilization rates, or estimates of campaign demand. Definitions, dates, transformations, and source links are stored in `web/data/franchise-evidence.json` and retained in JSON decision briefs. The original PDF is not redistributed.

TicketData requires express permission for scraping or redistribution in its [terms](https://www.ticketdata.com/terms). Its quotes are not copied into this product and there is no TicketData scraper. A licensed feed or explicit provider permission would be needed for that integration.

The performance overview additionally uses 109 reviewed ESPN game-level attendance records across three seasons per franchise, with a documented NBA correction and explicit venue/postponement exclusions. See [attendance methodology](ATTENDANCE.md).

## What closes the remaining commercial gaps

| Decision measure | Authorized aggregate export needed | Why public evidence cannot replace it |
| --- | --- | --- |
| Realized ticket yield | Franchise, game ID, period, paid ticket count, settled revenue, refunds, fees, discounts | Attendance contains no realized price or settlement information. |
| Available inventory | Game ID, section/tier, snapshot time, sellable capacity, sold seats, holds, comps | A public listing is only one channel's offer, not the team's inventory ledger. |
| Buyer penetration and retention | Privacy-approved geographic/cohort counts, eligible population, distinct buyer counts, repeat counts | Residents are not verified customers; public engagement is not a CRM. |
| Campaign contribution | Campaign/game ID, spend, treatment/holdout counts, outcomes, variable contribution and measurement window | Attributed orders do not establish incrementality. |

Aggregated exports can avoid customer names, emails and other identifiers. An organization or authorized provider must approve and supply them. No credentials or customer files should be committed to Git or uploaded to the demonstration site. An internal connector requires its own access controls and deployment review before introducing non-public records.

The financial decision brief starts from two explicitly illustrative planning examples. Each uses $25,000 in media spend for comparison; every other input remains independent. Pelicans inputs produce $41,250 in modeled incremental ticket revenue and $7,550 net contribution; Saints inputs produce $50,000 and $12,500. These are not estimates of actual team revenue, margins or campaign outcomes. `web/data/campaign-plans.json` documents the input origin and `web/lib/campaign-finance.ts` derives the results from the tested scenario engine. Revenue minus variable costs, media and other campaign costs reconciles exactly to net contribution. The calculated incrementality reversals are 46.58% and 34.38%; the threshold is not typed into the interface.

Observed attendance remains in a separate view. Campaign and Census evidence stay distinct in exports. The decision brief contains no population tiles or repeated attendance table. Regional facts remain available in Markets.

## Power BI verification

Run `python3 scripts/package_powerbi.py` to produce `artifacts/NolaPulse-Windows.zip`. The handoff includes precomputed files and the exact numerical acceptance checks in `powerbi/WINDOWS-CHECK.md`. A Windows Power BI Desktop session must still open, refresh, execute DAX and render the report. There is no substitute for that check on the current Mac.
