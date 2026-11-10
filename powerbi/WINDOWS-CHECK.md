# Windows verification handoff

Status: not yet opened or executed in Power BI Desktop. Schema checks and exported scenario calculations do not prove DAX execution or visual rendering.

The archive contains the report project, semantic model, precomputed CSVs, both franchise themes, licensed fonts, and file checksums. Python and Node are not needed on the Windows computer. The dated Games CSV includes both franchises' reviewed home schedules. It is not a live schedule connection. `Attendance` is the fifth model table, with 109 reviewed home-game records and four DAX measures. `public-observations.json` preserves the separately reviewed official single-game observations.

1. Extract the archive so this file is `C:\NolaPulse\START-HERE.md`.
2. Optionally install the `.ttf` files in `fonts`; their OFL licenses are alongside them.
3. Open `C:\NolaPulse\powerbi\NolaPulse.pbip` in current Power BI Desktop. Enable PBIP/PBIR preview features if that release requires it. Use standard Desktop, not Power BI Report Server Desktop.
4. In Transform data → Manage parameters, set `DataFolder` to `C:\NolaPulse\data\processed\`, including the final slash. Refresh and apply. If extracted elsewhere, use that absolute folder instead.
5. On **Reported attendance**, select Pelicans / 2026-27: total 99,016, rounded average 16,503, home dates 6. Then select Saints / 2026: total 280,201, rounded average 70,050, home dates 4. Check game-number chart and source ledger. Multiple teams or seasons must leave the single-scope cards blank. The website's matched prior-season change is not a native DAX measure in this report.
6. The opening **Decision economics** page contains separate illustrative franchise planning cases, not actual team returns. Verify the following cases. A failure means verification is incomplete; record the exact Desktop version and error.

| Scenario | Net contribution | Total campaign costs | Incrementality reversal |
| --- | ---: | ---: | ---: |
| Pelicans planning case | $7,550 | $26,200 | 46.58% |
| Saints planning case | $12,500 | $27,500 | 34.38% |
| Pelicans 40% incrementality stress | −$3,700 | $26,200 | 46.58% |
| No campaign | $0 | $0 | Blank |

The incremental ticket revenue card should show $41,250 for the Pelicans case, $50,000 for Saints, $27,500 for the Pelicans stress and $0 for no campaign. Variable costs are $7,500 and $10,000 in the two franchise presets; the contribution measure already subtracts those costs through net margin and must not subtract them twice.

7. Confirm that the curve and input table change with the scenario slicer. Multiple selected scenarios should leave single-scenario measures blank and request one selection. Markets and Games are contextual tables; selecting a county does not produce an estimated conversion rate.
8. Inspect all sixteen visuals across both pages for errors, clipping, font fallback, tooltips, and reading order. Apply `theme-pelicans.json` and `theme-saints.json` through View → Themes → Browse for themes. Save a screenshot for each edition.
9. Save a local PBIX after successful refresh. PBIX files and Desktop local state are excluded from Git.

Record Desktop version, Windows version, refresh result, each numerical check, visual check, and screenshot paths. Only after those checks pass can this report be described as Desktop verified.

`campaign-plans.json` supplies the authored input origin and distinct franchise planning values used in this handoff. Neither ticket yield nor variable cost is an observed team figure.

The campaign inputs remain illustrative. No private sales, inventory, customer, or campaign records are included. Announced attendance does not establish revenue or causal campaign performance.

[Microsoft PBIP documentation](https://learn.microsoft.com/en-us/power-bi/developer/projects/projects-overview)
