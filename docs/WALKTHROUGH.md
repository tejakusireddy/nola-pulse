# Three-minute product walkthrough

## 0:00 — State the decision

Open the reference Pelicans home-game case and St. Tammany Parish. The proposed action is to prepare a bounded campaign test, conditional on validating primary inventory and campaign assumptions. The model shows $1,500 net contribution under the stated inputs. This is a testable scenario, not a measured revenue forecast.

## 0:30 — Establish the evidence

Open Evidence & methods. Census facts, official event metadata, derived comparisons, and assumed campaign inputs have separate labels. Follow the Census link for the selected parish. Explain that population and household income describe residents; they do not identify proven underserved fans.

## 1:00 — Reverse the recommendation

Return to the decision center and lower incrementality from 65% to 40%. Net contribution changes from $1,500 to −$1,500. The recommendation changes to revise before launch. The calculated break-even share remains 52.5%, because all other inputs are unchanged.

Point to the sensitivity ranking. Under the reference scenario's declared exploratory bounds, incrementality produces the largest adverse swing. Under changed assumptions, the ranking can change. This identifies what the test needs to learn, not a probability of success.

## 1:40 — Compare regional context

Choose a different market on the map or in the comparison table. Observe the demographic differences and their source links. The model does not secretly lower acquisition cost in a higher-income market. A market-specific response claim needs campaign evidence.

## 2:05 — Connect both franchises

Inspect the current game-context cards and source timestamps. Expand the official home schedules and select a Saints home game. The selected franchise, venue, date, and exported brief update together. The commercial assumptions remain explicit across both franchises.

## 2:30 — Show how the decision becomes measurable

Open the test plan: confirm inventory and net margin, define eligible audiences, randomize a treatment and holdout, size the experiment using baseline conversion, and measure incremental contribution. Export the JSON brief or use Print / save PDF. The brief retains the scenario, source references, reversal threshold, stress ranges, and measurement plan.

## Technical follow-up

The same TypeScript financial implementation drives the web interface, exported brief, and scenario/curve CSVs. Python and SQL validate the public-data snapshot. Power BI report source is generated and schema-checked; Desktop execution and rendering remain a separate verification step. Automated tests cover threshold equality and sign changes, invalid inputs, missing provenance, franchise identity, and public-feed normalization.
