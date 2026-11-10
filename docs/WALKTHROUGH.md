# Three-minute product walkthrough

## 0:00 — State the financial decision

Open **Decision brief** in the Pelicans edition. The group-ticket planning case shows a $25,000 media budget, $41,250 incremental ticket revenue and $7,550 net incremental contribution. The revenue-to-contribution chart reconciles variable costs, media and other campaign costs.

The proposed action is to evaluate a bounded pilot. The case is an editable planning example, not a forecast of team revenue. Open **Edit campaign inputs** to show the origin and exact coefficients.

## 0:30 — Show what would reverse it

The calculated incrementality reversal is 46.58%, with other inputs fixed. At 40% incrementality, net contribution is −$3,700. Change the incremental share to 40% to reproduce that downside. The threshold does not move because the other coefficients are unchanged.

Open **Simulator** to inspect the reversal curve, sensitivity ranking and a pinned comparison. The sensitivity bounds are exploratory inputs, not estimated probabilities or confidence intervals. The model identifies what the pilot needs to learn; it does not establish that the pilot will succeed.

## 1:00 — Compare the franchises

Hover or focus Saints to preview the black and gold edition; select it to keep the edition. The Saints regional ticket case uses its own acquisition cost, incremental share, order size, ticket yield and costs. At the same $25,000 media budget, it calculates $50,000 revenue, $12,500 net contribution and a 34.38% reversal threshold. Its 40% stress remains positive at $4,500.

Switch back to Pelicans. Its edited inputs remain separate. Use **Restore franchise case** in the input drawer to recover the original Pelicans planning inputs.

## 1:30 — Establish the evidence

Open **Attendance**. The reviewed snapshot contains 109 New Orleans home-game observations across three seasons per franchise. The current Pelicans series has six home dates and the Saints series four; current seasons are labeled partial. Compare equal counts of home dates rather than partial and full season totals. Inspect the source ledger and correction notes when needed.

Open **Evidence & methods** to distinguish observed public records, explicit transformations and assumed campaign inputs. Published attendance is not unique customers, realized ticket revenue or available inventory.

## 2:00 — Inspect regional context

Open **Markets**. The map uses county boundaries and reviewed Census population/income data. Select a county and inspect its source and vintage. These are resident characteristics, not an estimate of team fans or proven campaign response. Changing the county does not silently change acquisition cost or margin.

Current game context uses attributed third-party scores and official team schedules with timestamps and stale/unavailable states. It is supporting context, not a sales feed.

## 2:30 — Make the case reviewable

Return to **Decision brief** and export JSON/CSV or use Print / save PDF. The financial export retains input assumptions, financial outputs and formulas; the printable brief includes provenance. Open **Metric library** to inspect a measure's definition and required connections.

For a real campaign, first confirm inventory, contribution margins and eligible audiences. Use a treatment/holdout design to measure incremental orders and contribution. The key outcome is whether measured incrementality clears the economic threshold with adequate uncertainty control, not whether attributed orders look large.

## Technical follow-up

The browser and scenario/curve exporter use the same TypeScript financial engine. Python and SQL validate the public-data snapshots. Report/model definitions are generated as Power BI project source and schema-checked. Native opening, refresh, DAX execution and rendering still require the Windows acceptance pass. There is no trained ML forecasting model in this release.
