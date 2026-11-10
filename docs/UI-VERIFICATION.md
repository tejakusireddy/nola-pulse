# UI verification

## v0.3.0 — November 10, 2026

- At 390 CSS pixels, the document had no horizontal overflow and the mobile layout supplied a compact decision summary before the map.
- The overview gives the regional map and a neighboring decision brief the primary space. Public score feeds are in a supporting disclosure.
- Population change and household income layers expose the source values for all six counties. Selecting Baton Rouge updated the market facts, Census source and recommendation together; scenario economics did not silently change.
- Zoom changed the SVG geographic viewport from `255 235 620 365` to `317 271.5 496 292`. Map reset restores the initial extent.
- At 40% incrementality, the simulator showed −$1,500 contribution and a −$3,000 change from the reference comparison. Pinning that case and restoring 65% preserved the pinned −$1,500 and displayed a +$3,000 current-case difference.
- County SVG titles were made single text nodes after development testing exposed a server/client hydration mismatch. A fresh reload rendered without that overlay.
- Source and license links accompany the authentic venue photographs. Input geometry and image files retain checksums.

Validation includes three Python tests (snapshot integrity and TopoJSON ring/arc handling), 14 model/feed/export tests, TypeScript, ESLint, formatting, and production build. Native Power BI Desktop verification remains pending.

## v0.2.0 — November 10, 2026

The franchise redesign was checked in the local in-app browser before publication.

- Pointer hover previewed Saints while Pelicans remained selected; the theme, heading, and selected game changed together.
- Keyboard focus previewed the other edition. Leaving focus restored the committed selection.
- Selecting Saints persisted across reload and retained the Saints home-game context.
- At 390 and approximately 1440 CSS pixels, the document had no horizontal overflow. The mobile navigation scrolls within its own strip.
- Incrementality at 40% changed net contribution from +$1,500 to −$1,500 and changed the recommendation to revise before launch. The calculated reversal stayed 52.5%.
- Metric search found the incrementality reversal measure; expanding it displayed its formula, model origin and decision use.
- Authentic team SVG files are byte-preserved in Git. Licensed font distributions retain their notices.

Automated checks: Python snapshot integrity, 13 model/feed/export tests, TypeScript, ESLint, formatting, production build, and 12 Power BI report files checked against Microsoft schemas. Native Power BI Desktop rendering remains unverified.

Scenario outputs are not observed team performance. Eleven commercial measure groups require additional data connections. These are visible requirements, not implemented feeds.

## Public evidence and franchise scenario isolation · November 10, 2026

- Verified Pelicans attendance directly in NBA Game Info and Saints paid attendance on official gamebook page 2. Dates, definitions, source links and single-game coverage remain visible.
- Changed Pelicans incrementality to 40%: net contribution became −$1,500. Pinned those assumptions. Switched to Saints: incrementality stayed at 65%, current and pinned contribution remained $1,500. Switched back to confirm Pelicans retained its own scenario and comparison.
- Reference result is calculated from the shared demonstration defaults and explained as illustrative. Attendance does not feed acquisition cost, contribution margin or incrementality.

## Remove default campaign results · November 10, 2026

The overview now contains franchise attendance and the selected team's home calendar; campaign results and the explanatory banner have been removed. Simulator starts with six blank inputs. Entered an $8,000 budget, $40 acquisition cost, 0.6 incrementality, 2 tickets/order, $45 contribution/ticket and $400 additional costs for Pelicans: calculation produced $2,400 and 46.7% reversal. Switched to Saints and verified its setup remained blank with export disabled. The metric library masks campaign values until user inputs are supplied. Overview exports contain public evidence rather than unrelated scenario defaults.
