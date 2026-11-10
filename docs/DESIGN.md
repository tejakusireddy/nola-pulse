# Visual identity

The product uses verified franchise colors for identity and a separate accessible palette for analytical meaning. Brand colors are never used as an unexplained profit/loss scale.

## Primary references

| Token | Value | Evidence |
| --- | --- | --- |
| Pelicans navy | `#0A2340` | 2024–25 official media guide, printed p.224: RGB 10/35/64 |
| Pelicans gold | `#B9975B` | Same page: RGB 185/151/91 |
| Pelicans red | `#CE0E2D` | Same page: RGB 206/14/45 |
| Saints gold | `#D3BC8D` | Official website theme CSS, inspected November 9, 2026 |
| Saints black | `#000000` | Same stylesheet, expanded from `#000` |

The supplied visual reference listed Pelicans gold as `#B99C5B`. The primary media guide specifies `#B9975B`; the implementation follows the guide. The current NBA uniform feed also uses a different navy for some uniform metadata (`#0A2240`); the application uses the media-guide brand palette rather than treating uniform metadata as a universal website token.

- [Pelicans official media guide](https://cdn.nba.com/teams/uploads/sites/1610612740/2024/10/2024-25-Pelicans-Media-Guide-v2.pdf), p.224.
- [Saints website](https://www.neworleanssaints.com/), theme stylesheet `/compiledassets/theming/81e2bd6f4904c44cd4393c900977e536`.
- [Pelicans website](https://www.nba.com/pelicans/), font stylesheet references and inline family declarations inspected November 9, 2026.

## Typography and assets

Montserrat and Roboto are confirmed website families on the Pelicans homepage. The project self-hosts their Google Fonts distributions under the accompanying SIL Open Font License files. This does not claim they are the proprietary jersey wordmark typefaces. Saints website preloads All-Pro Display, All-Pro Sans, All-Pro Stats, Druk, and Saira. No license to redistribute the proprietary files was established, so the interface retains its documented Montserrat/Roboto UI system. Power BI uses these families where installed and Arial as an explicit supported fallback; rendering must be checked in Desktop.

All UI icons use Lucide with its ISC notice in `docs/licenses/`. The NOLA PULSE favicon is a project pulse symbol, not a team logo. No team logo or game photograph is redistributed: the first release uses names, factual metadata, geography, and analytical visuals. Licensed original media can be added without replacing it with generated team marks or synthetic game photography.

State paths come from Census cartographic boundaries distributed through `us-atlas` 3.0.1. The map uses an equirectangular projection. Representative city anchors are approximate layout references, not measured drive times, county centroids, or market catchment boundaries.

## Analytical semantics

Teal (`#16766B`) represents favorable contribution; rust (`#A74E2A`) represents adverse contribution. Labels and signs carry the same meaning independently of color. Pelicans red stays a franchise token. Gold marks identity and the calculated reversal boundary, not statistical confidence. Neutral surfaces and text are chosen for readability. Full token values, including supporting borders and tints, are registered in `design-tokens.json`.

No shadow, tint, or fallback is described as an official team color. Team colors retain distinct gold tokens across franchise contexts. The independent-project identification is part of every page and export.
