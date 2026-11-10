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

Montserrat and Roboto are confirmed website families on the Pelicans homepage. The project self-hosts their Google Fonts distributions under the accompanying SIL Open Font License files. Saints website preloads All-Pro Display, All-Pro Sans, All-Pro Stats, Druk, and Saira. The Saints edition now uses Saira, distributed by Omnibus-Type under the SIL Open Font License. The proprietary All-Pro and Druk files are not redistributed. These are verified website families, not a claim to reproduce proprietary jersey wordmark typography.

Authentic, unmodified SVG files from the NBA CDN and NFL club-logo endpoint identify the teams. Their source URLs, byte checksums, and rights notes are recorded in `BRAND-ASSETS.json`. Team trademarks remain with their owners; no team endorsement or general asset license is implied. Authentic venue photographs now provide supporting context: Smoothie King Center by ajay_suresh (CC BY 4.0) and Caesars Superdome by Glimmergloss (CC0). The interface links each photographer/source and license, and identifies the display crop. `web/data/venue-assets.json` records source URLs, dates, licenses, display changes and file checksums. No generated marks or synthetic game photography are used. All UI icons use Lucide with its ISC notice in `docs/licenses/`. The NOLA PULSE favicon is a project pulse symbol.

- [Saira foundry page](https://www.omnibus-type.com/fonts/saira/).
- [Google Fonts Saira source and OFL](https://github.com/google/fonts/tree/main/ofl/saira).

## Franchise interaction

The header previews each franchise on pointer hover or keyboard focus. Selecting with a click, tap, Enter, or Space persists the franchise when browser storage is available. Leaving an uncommitted preview returns to the selected franchise. The effective franchise controls typography, surface colors, gold, active navigation, map, and game context. It does not invent different conversion assumptions for each team. The official Saints schedule is retained as a dated fallback; live source freshness remains visible.

State and county paths come from Census cartographic boundaries distributed through `us-atlas` 3.0.1. `scripts/build_geography.py` decodes the source arcs, preserves ring direction and projects all three states plus the six candidate counties. The generated geography records the input SHA-256 and immutable package URL. Demographic shading linearly scales the selected observed measure across those six candidates; it is not a demand or opportunity score. The map uses an equirectangular projection. Representative city anchors are approximate layout references, not measured drive times, county centroids, or market catchment boundaries.

## Analytical semantics

Teal (`#70D9C0`) represents favorable contribution and apricot (`#FFB18D`) adverse contribution on dark surfaces. Labels and signs carry the same meaning independently of color. Pelicans red stays a franchise token. Gold marks identity and the calculated reversal boundary, not statistical confidence. Supporting navy and charcoal tints are project UI choices, not additional official brand colors. Full values are registered in `design-tokens.json`.

Power BI themes use the same franchise families, surfaces, analytical colors and hierarchy where the fonts are installed. Power BI Desktop does not support the website's hover preview: import the desired franchise theme explicitly. Native rendering must still be verified on Windows.
