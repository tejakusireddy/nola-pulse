# Attendance evidence

The performance overview is based on 109 completed regular-season New Orleans home games across six franchise-season snapshots, retrieved November 10, 2026. It does not estimate commercial return from attendance.

| Franchise | Season | Home dates | Reported attendance | Average, rounded |
| --- | --- | ---: | ---: | ---: |
| Pelicans | 2024–25 | 41 | 689,400 | 16,815 |
| Pelicans | 2025–26 | 41 | 675,507 | 16,476 |
| Pelicans | 2026–27 to date | 6 | 99,016 | 16,503 |
| Saints | 2024 | 9 | 630,113 | 70,013 |
| Saints | 2025 | 8 | 560,290 | 70,036 |
| Saints | 2026 to date | 4 | 280,201 | 70,050 |

## Source and transformations

ESPN's public team schedule feed supplies event attendance, opponent, venue, home designation, completion status and season. The six exact query URLs, retrieval timestamps, provider update timestamps and payload SHA-256 digests are in `data/attendance/sources.json`. Each retained observation links to its provider game page. The feed's top-level season envelope can describe the current season even for historical requests: normalization checks each **event's** season and regular-season type.

Normalization keeps completed home events played in New Orleans, excludes neutral venues, and requires a positive integer attendance. Missing or zero attendance stops ingestion; it is not silently averaged, interpolated or treated as an empty stadium. Event IDs are unique primary keys in SQLite.

Two source records are excluded:

- The Saints' October 25, 2026 home designation at Stade de France is outside New Orleans. Its 78,488 attendance is not included in local-market totals.
- The January 22, 2025 Bucks–Pelicans postponed placeholder is not a completed game. The completed rescheduled event remains in the season.

One field is corrected: ESPN event `401704635`, Chicago at New Orleans on October 23, 2024, reports attendance 0. The [official NBA Game Info](https://www.nba.com/game/0022400069) directly reports 18,581. This value was visually reviewed in the official game page and is stored with its own source identity and correction flag. The resulting 2024–25 season total, 689,400, also agrees with the [official Pelicans media guide's attendance table](https://cdn.nba.com/teams/uploads/sites/1610612740/2025/10/2025-26-Pelicans-Media-Guide-v2.pdf). The original feeds are not modified.

`sql/attendance.sql` computes season counts, sums, means, minimums and maximums from the reviewed rows. `scripts/build_attendance.py` creates the validated website JSON, SQLite database, and Power BI CSV. The web calculation retains full precision and rounds only for display.

## Comparisons

For a selected season, let N be the smaller number of available home games in that season and its prior season. Compare the first N games in both years:

`matched change = mean(current first N attendance) / mean(prior first N attendance) - 1`

The current Pelicans comparison uses six games per season: 16,502.67 versus 17,179.33, or −3.93884%. The Saints use four per season: 70,050.25 versus 70,033.50, or +0.023917%. These are descriptive changes with equal game counts. Opponent strength, calendar placement, ticket policy and other causes are not controlled. A partial season's total is never presented as a year-over-year decline against a full-season total.

The chart aligns completed home-game number, not calendar date, and labels its nonzero attendance-axis baseline. The three-season table labels the current season as partial. Weekday/weekend groups use America/Chicago local dates and display sample sizes. Opponent history is an average of matching home observations across the reviewed interval, not a forecast or willingness-to-pay estimate.

Attendance can count the same person at multiple games. Published figures are not gate scans, unique customers, realized revenue, inventory, or a causal campaign outcome. The separate official Saints single-game observation is explicitly labeled paid attendance; the multi-season provider series retains the broader reported-attendance definition.

## Refresh and reproduce

```sh
python3 scripts/refresh_attendance.py
python3 scripts/build_attendance.py
python3 -m unittest discover -s tests
npm --prefix web test
```

Refreshing queries six fixed public endpoints and retains local raw payloads under ignored `data/raw/attendance`. Review changed normalized rows, exclusions and source corrections before committing a new snapshot. CI builds from the reviewed CSV without network access and checks that generated website/report sources are reproducible. The UI shows the snapshot date; this is not represented as continuously live attendance.

The Power BI attendance page imports the same 109 observations and exposes total, average and count by franchise/season. Native DAX execution and report rendering still require Windows verification; the website's matched comparison is not implemented as a native DAX measure.
