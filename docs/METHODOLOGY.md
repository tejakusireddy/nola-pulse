# Evidence and campaign economics

The application supports a conditional campaign decision. It does not estimate customer penetration, causal price elasticity, or realized revenue from public listing prices.

## Observations

Six parish/county records were manually reviewed against U.S. Census Bureau QuickFacts on November 9, 2026. Each row retains its FIPS identifier, page URL, observation vintage, and review date. Population estimates and 2020-base population change use V2025; household counts and median household income use the 2020–2024 ACS, with income in 2024 dollars. The public snapshot preserves exactly which values were used. This is a reviewed snapshot, not an automated Census refresh. The direct API required a key in this environment. QuickFacts margins of error are not available in this extract, so income differences are descriptive and not significance-tested.

Five upcoming Pelicans home games are retained in the offline reference snapshot. The running application separately refreshes upcoming New Orleans home schedules from the official Pelicans and Saints pages. Live scoreboard context comes from ESPN's public NBA/NFL scoreboard feeds and is labeled as third-party coverage. These are public factual observations, not licensed ticket-market or first-party team sales feeds.

The official Pelicans page returned a live status with zero scores during development while ESPN returned a nonzero halftime score. Therefore the app uses the explicitly attributed ESPN scoreboard for scores and the official pages for home schedules. It does not silently blend conflicting score sources. A failed refresh exposes stale/unavailable status; retained observations keep their original checked time. A missing team event means no game in the source window, not a team bye or a zero score. No availability SLA is claimed for these public endpoints.

The Saints site's offset-free JSON-LD start timestamps are interpreted as UTC, consistent with its November 15, 2026 noon CST / 18:00 UTC kickoff. Preserve offsets when supplied. Dates and times are displayed in America/Chicago, with daylight saving handled by Intl, rather than assuming a fixed UTC offset. A page format change fails the adapter visibly rather than yielding fabricated records.

## Transformations

`sql/schema.sql` defines source tables, constraints, and the market comparison view. Income comparison is `100 × (market income − Orleans income) / Orleans income`. Population growth comparison is a percentage-point difference from Orleans. Neither measure is a probability of buying a ticket. Approximate city anchors place markets on the map; they do not measure travel time or establish geographic audience boundaries.

## Scenario model

Let B be media spend, C cost per attributed order, i incremental share of attributed orders, T tickets per incremental order, M contribution per incremental ticket after discounts and variable costs, and F additional campaign costs.

```
Attributed orders Q = B / C
Net contribution N = Q × i × T × M − B − F
Break-even incremental share i* = (B + F) / (Q × T × M)
```

All six inputs are explicit assumptions. No observed response curve supports extrapolating the same acquisition cost to larger budgets. Inventory feasibility must be confirmed from primary inventory. Campaign effects on nonincremental buyers, such as discount leakage, require additional explicit costs if relevant. This simple model does not estimate those effects.

A scenario is positive above its calculated threshold, neutral at equality, and negative below it. Thresholds above one remain visible as infeasible. Zero activity or zero contribution produces an unavailable threshold. Calculations use unrounded numbers with a small numerical tolerance for equality. UI currency and percentages are rounded for display.

The product starts with separate authored franchise planning cases. Pelicans uses B=25000, C=40, i=0.60, T=2, M=45, F=1200; Saints uses B=25000, C=75, i=0.50, T=2.4, M=100, F=2500. These calculate $7,550 and $12,500 net contribution respectively. Ticket yield and variable costs are recorded separately in the financial extension. [Financial model](FINANCIAL-MODEL.md) gives the complete input/output table. The former $1,500 reference remains only as a mathematical test fixture.

Sensitivity evaluates declared exploratory bounds: incrementality 0.30–0.85, acquisition cost $24–$50, contribution $24–$45, and tickets/order 1.5–3. Rank by adverse contribution swing from the current scenario. These bounds are not empirical estimates or confidence intervals. Combined stress uses the more adverse of each declared bound and the current value; dependency probabilities are not estimated. The only financial alternative evaluated is no campaign; no claim of an optimal allocation among markets is made.

## Measurement plan

Before launch, obtain eligible audience size, baseline purchase rates, primary inventory, contribution margins, channel attribution windows, and compliant audience definitions. Randomize treatment and holdout within the candidate market or use matched geographic clusters where appropriate. Size the test using a decision-relevant minimum effect and baseline conversion. Measure incremental contribution relative to holdout, accounting for spillover and discount leakage. Scale only against a prespecified economic and uncertainty criterion.

## Missing capabilities

Historical ticket observations, primary sales, market-specific campaign response, fan search geography, BLS context, competing-event coverage, and a validated demand forecast are not included in this release. No synthetic observations fill these gaps. Native Power BI rendering and DAX execution require a Windows verification pass. The working web application remains independently reviewable.
