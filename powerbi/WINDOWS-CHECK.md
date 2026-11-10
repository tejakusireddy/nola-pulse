# Windows verification handoff

Status: not yet opened or executed in Power BI Desktop. Schema checks and exported scenario calculations do not prove DAX execution or visual rendering.

The archive contains the report project, semantic model, precomputed CSVs, both franchise themes, licensed fonts, and file checksums. Python and Node are not needed on the Windows computer. The dated Games CSV includes both franchises' reviewed home schedules. It is not a live schedule connection. `public-observations.json` is supporting evidence from the website; it is not a fifth table or visual in this report.

1. Extract the archive so this file is `C:\NolaPulse\START-HERE.md`.
2. Optionally install the `.ttf` files in `fonts`; their OFL licenses are alongside them.
3. Open `C:\NolaPulse\powerbi\NolaPulse.pbip` in current Power BI Desktop. Enable PBIP/PBIR preview features if that release requires it. Use standard Desktop, not Power BI Report Server Desktop.
4. In Transform data → Manage parameters, set `DataFolder` to `C:\NolaPulse\data\processed\`, including the final slash. Refresh and apply. If extracted elsewhere, use that absolute folder instead.
5. Verify the following cases. A failure means verification is incomplete; record the exact Desktop version and error.

| Scenario | Net contribution | Total campaign costs | Incrementality reversal |
| --- | ---: | ---: | ---: |
| Reference assumptions | $1,500 | $6,300 | 52.5% |
| 40% incrementality stress | −$1,500 | $6,300 | 52.5% |
| No campaign | $0 | $0 | Blank |

6. Confirm that the curve and input table change with the scenario slicer. Multiple selected scenarios should leave single-scenario measures blank and request one selection. Markets and Games are contextual tables; selecting a county does not produce an estimated conversion rate.
7. Inspect all eight visuals for errors, clipping, font fallback, tooltips, and reading order. Apply `theme-pelicans.json` and `theme-saints.json` through View → Themes → Browse for themes. Save a screenshot for each edition.
8. Save a local PBIX after successful refresh. PBIX files and Desktop local state are excluded from Git.

Record Desktop version, Windows version, refresh result, each numerical check, visual check, and screenshot paths. Only after those checks pass can this report be described as Desktop verified.

The campaign inputs remain illustrative. No private sales, inventory, customer, or campaign records are included. Announced attendance does not establish revenue or causal campaign performance.

[Microsoft PBIP documentation](https://learn.microsoft.com/en-us/power-bi/developer/projects/projects-overview)
