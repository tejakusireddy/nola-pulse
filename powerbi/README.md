# Power BI project

`NolaPulse.pbip` opens a source-controlled semantic model and two report pages with sixteen visuals. The opening attendance page includes franchise and season selectors, source scope, reported attendance total and average, completed home-game count, game-number trend, and source ledger. The separate planning page includes: a scenario selector, decision, net contribution, reversal threshold, campaign costs, reversal curve, regional comparison table, and assumption table.

**Verification status:** report definitions are generated against Microsoft's published PBIR schemas. Power BI Desktop opening, DAX execution, and visual rendering still require a Windows verification pass. Do not present this as a Desktop-validated PBIX.

## Open on Windows

1. Clone the repository into a short path such as `C:\NolaPulse`.
2. Run from the repository root:

   ```sh
   python scripts/build_data.py --web
   node --experimental-strip-types web/scripts/export-analytics.mjs
   python scripts/build_attendance.py
   python scripts/build_powerbi.py
   ```

3. Open `powerbi/NolaPulse.pbip` in a current Power BI Desktop that supports PBIP/PBIR. Enable the project/enhanced report format feature if your release requires it.
4. Change the `DataFolder` Power Query parameter to the absolute `data\processed\` directory on that computer, retaining the trailing slash. Refresh the model.
5. On **Reported attendance**, select Pelicans and 2026-27: total **99,016**, average **16,503** (display rounded), completed home dates **6**. Select Saints and 2026: total **280,201**, average **70,050**, home dates **4**. Source records cover New Orleans only; the Paris game is excluded. Multiple franchises or seasons leave single-scope measures blank.
6. On the separate **Decision economics** page, select **Reference assumptions** in the scenario slicer. The disconnected market table describes context; choosing a market does not invent a market-specific conversion rate.
7. Verify net contribution **$1,500**, reversal **52.5%**, campaign costs **$6,300**. Select the 40% incrementality stress: contribution must be **−$1,500**. The no-campaign scenario must have zero campaign costs and contribution and a blank reversal threshold.
8. Verify the curve and assumption table respond to scenario selection. Selecting multiple scenarios intentionally leaves single-scenario measures blank and asks for one selection.
9. Install the included OFL Montserrat/Roboto fonts if desired. Otherwise use the documented Arial fallback consistently. Check text fit and accessibility in Desktop.

The custom theme is registered in the report and separately available as `theme.json`. If your Desktop version does not load the registered theme, use View → Themes → Browse for themes and select that file.

## Reproducibility

`Attendance.pq`, `Markets.pq`, `Games.pq`, `Scenarios.pq`, and `Curves.pq` expose the import queries; `measures.dax` contains the campaign measures. `scripts/build_powerbi.py` generates the native model and report source. Scenario and curve CSVs are exported from the application's tested TypeScript model, so data exports do not duplicate the financial implementation in Python.

DAX is a separate execution engine. Its formulas mirror the shared economics; the Desktop checks above are necessary to confirm execution parity. The model relates `Scenarios[scenario_id]` (one) to `Curves[scenario_id]` (many). Markets and Games are independent contextual tables; no unsupported revenue relationship is inferred.

[Microsoft PBIP documentation](https://learn.microsoft.com/en-us/power-bi/developer/projects/projects-overview) · [Semantic model files](https://learn.microsoft.com/en-us/power-bi/developer/projects/projects-dataset) · [Report definitions](https://learn.microsoft.com/en-us/power-bi/developer/projects/projects-report)

## Franchise themes

`theme.json` and `theme-pelicans.json` match the navy Pelicans edition; `theme-saints.json` matches the black and gold Saints edition. Install the licensed fonts from `web/public/fonts` on the Desktop computer, then use View → Themes → Browse for themes to select an edition. Saira is used for Saints; Montserrat and Roboto for Pelicans. Typography and chart semantics match the site; Power BI has no hover-based franchise switching. Desktop rendering remains unverified.

## Ready-to-open Windows bundle

Run `python3 scripts/package_powerbi.py` on the development machine. The ignored `artifacts/NolaPulse-Windows.zip` includes the report project, precomputed CSVs for both franchises, licensed fonts, themes, checksums, and [Windows acceptance checks](WINDOWS-CHECK.md). The Windows reviewer does not need Python or Node. This packaging step does not perform Desktop verification.

The attendance table is generated from the same 109 reviewed records as the website. Its four measures use simple DAX sum, average and count with a single-franchise/single-season guard. The website additionally computes matched prior-season comparisons; those are not claimed to be implemented in the native report. Windows execution remains unverified.
