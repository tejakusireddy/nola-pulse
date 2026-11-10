# Financial planning cases

The default brief is a portfolio planning scenario. It does not report or estimate either franchise's actual ticket yield, acquisition cost, margins, campaign conversion or return. The two editable input sets are authored examples stored in `web/data/campaign-plans.json`. They are not calibrated from attendance, Census data or private records.

Both cases use the same media budget to make their different campaign economics visible. Different outputs follow from different inputs, not a franchise-name multiplier.

| Input | Pelicans group-ticket pilot | Saints regional ticket pilot |
| --- | ---: | ---: |
| Media budget | $25,000 | $25,000 |
| Cost per attributed order | $40 | $75 |
| Incremental share of attributed orders | 60% | 50% |
| Tickets per incremental order | 2.0 | 2.4 |
| Ticket yield after discounts | $55 | $125 |
| Variable cost per ticket | $10 | $25 |
| Other campaign costs | $1,200 | $2,500 |

## Calculations

The financial extension reuses `evaluate()` from the existing scenario engine. Ticket contribution equals modeled ticket yield less modeled variable cost. Variable cost may not be negative.

```
Attributed orders = media budget / cost per attributed order
Incremental orders = attributed orders * incremental share
Incremental tickets = incremental orders * tickets per order
Incremental ticket revenue = incremental tickets * ticket yield
Variable costs = incremental tickets * variable cost per ticket
Campaign costs = media budget + other campaign costs
Net contribution = revenue - variable costs - campaign costs
Contribution ROI = net contribution / campaign costs
```

Contribution ROI is a marketing contribution ratio; its denominator excludes the variable ticket costs already deducted in the numerator. It is undefined when campaign costs are zero. Net contribution is not a full franchise profit measure and excludes non-incremental overhead.

| Calculated outcome | Pelicans | Saints |
| --- | ---: | ---: |
| Incremental ticket revenue | $41,250 | $50,000 |
| Variable ticket costs | $7,500 | $10,000 |
| Campaign costs | $26,200 | $27,500 |
| Net contribution | $7,550 | $12,500 |
| Contribution ROI | 28.8% | 45.5% |
| Incrementality reversal | 46.58% | 34.38% |
| Net contribution at 40% incrementality | −$3,700 | $4,500 |

## Decision reversal

`Break-even incremental share = campaign costs / (attributed orders * tickets per order * contribution per ticket)`

Other inputs are held fixed. Equality is break-even; a lower share makes contribution negative. Thresholds above 100% are retained as infeasible, rather than clipped. Zero activity has no finite reversal threshold. Tests calculate net contribution at each exact threshold and verify opposite signs on either side. Display rounding is not used in calculations.

The brief's recommendation is to evaluate a bounded pilot under the stated inputs. It does not claim an optimized market allocation, observed causal lift or an estimated probability of success. A measured recommendation would additionally require authorized inventory, contribution-margin and campaign/holdout evidence.

## Product and handoff

- Each franchise has independent editable state and pinned comparisons.
- The input drawer declares the planning origin once. Attendance evidence is separate and does not alter financial coefficients.
- JSON and CSV exports preserve inputs, money calculations, formulas and the assumed-data classification.
- Power BI exports use the same cases and financial extension. DAX mirrors the equations, but native execution still requires Windows verification.
- The former $1,500 reference remains only as a mathematical unit-test fixture; it is not a default product or report scenario.
