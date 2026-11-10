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
