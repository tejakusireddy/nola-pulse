"use client";
import { useState } from "react";
import { ArrowUpRight, ChevronDown, Database, Search } from "lucide-react";
import franchiseEvidence from "../data/franchise-evidence.json";
import type { Market } from "../lib/brief";
import { ASSUMPTIONS, evaluate } from "../lib/scenario";
import type { Scenario } from "../lib/scenario";
import { integer, money, percent, signed } from "../lib/format";

type Metric = {
  name: string;
  value: string;
  kind: "Observed" | "Derived" | "Assumed" | "Required";
  category: string;
  definition: string;
  source: string;
  url?: string;
  use: string;
};

export default function MetricLibrary({
  market,
  scenario,
  franchise,
}: {
  market: Market;
  scenario: Scenario;
  franchise: string;
}) {
  const [filter, setFilter] = useState("All measures");
  const [query, setQuery] = useState("");
  const r = evaluate(scenario);
  const model =
    "lib/scenario.ts · evaluate() · model 1.0.0. Derived from the six editable assumptions; not measured performance.";
  const observation =
    franchiseEvidence[franchise as keyof typeof franchiseEvidence];
  const metrics: Metric[] = [
    {
      name: observation.label,
      value: integer(observation.value),
      kind: "Observed",
      category: "Team context",
      definition: `${observation.definition} ${observation.coverage}`,
      source: `${observation.source_name} · ${observation.source_locator} · ${observation.game_date} · reviewed ${observation.reviewed_on}`,
      url: observation.source_url,
      use: "Describe a specific home game. Do not compare cross-sport attendance totals as utilization or use attendance to infer campaign returns.",
    },
    ...[
      [
        "Net incremental contribution",
        money(r.netContribution),
        "Incremental tickets × contribution per ticket − media spend − additional costs.",
        "Decide whether the campaign clears its cost.",
      ],
      [
        "Conditional contribution ROI",
        r.totalCosts > 0
          ? percent(r.netContribution / r.totalCosts)
          : "Undefined",
        "Net incremental contribution ÷ total campaign cost. Undefined when cost is zero.",
        "Compare conditional economics on an equal cost basis.",
      ],
      [
        "Attributed orders",
        r.attributedOrders.toFixed(1),
        "Media spend ÷ cost per attributed order.",
        "Separate platform attribution from causal impact.",
      ],
      [
        "Incremental orders",
        r.incrementalOrders.toFixed(1),
        "Attributed orders × incremental share.",
        "Estimate orders caused by the campaign under the stated assumptions.",
      ],
      [
        "Incremental tickets",
        r.incrementalTickets.toFixed(1),
        "Incremental orders × tickets per incremental order.",
        "Compare expected ticket volume with available inventory.",
      ],
      [
        "Contribution before campaign costs",
        money(r.grossContribution),
        "Incremental tickets × net contribution per ticket.",
        "Show contribution available to cover campaign cost.",
      ],
      [
        "Total campaign costs",
        money(r.totalCosts),
        "Media spend + additional campaign costs.",
        "Include non-media costs in the decision.",
      ],
      [
        "Incrementality reversal",
        r.breakEvenShare === null ? "Undefined" : percent(r.breakEvenShare),
        "Total cost ÷ (attributed orders × tickets per order × contribution per ticket). Above 100% is infeasible.",
        "Identify the causal lift required to break even.",
      ],
      [
        "Incrementality headroom",
        r.marginOfSafety === null
          ? "Undefined"
          : signed(r.marginOfSafety * 100, " pp"),
        "Assumed incremental share minus break-even share, in percentage points.",
        "Show how far assumptions can deteriorate before the decision reverses.",
      ],
      [
        "Break-even incremental orders",
        r.breakEvenOrders === null ? "Undefined" : r.breakEvenOrders.toFixed(1),
        "Total cost ÷ (tickets per incremental order × contribution per ticket).",
        "Set the incremental order hurdle.",
      ],
      [
        "Maximum acquisition cost",
        r.maxCostPerOrder === null ? "Undefined" : money(r.maxCostPerOrder, 2),
        "Incremental share × media spend × tickets per order × contribution per ticket ÷ total cost.",
        "Set a conditional cost ceiling per attributed order.",
      ],
      [
        "Minimum contribution per ticket",
        r.minContributionPerTicket === null
          ? "Undefined"
          : money(r.minContributionPerTicket, 2),
        "Total campaign costs ÷ incremental tickets.",
        "Evaluate discount and fulfillment economics.",
      ],
    ].map(([name, value, definition, use]) => ({
      name,
      value,
      definition,
      use,
      kind: "Derived" as const,
      category: "Campaign economics",
      source: model,
    })),
    ...ASSUMPTIONS.map((a) => ({
      name: a.label,
      value:
        a.key === "incrementality"
          ? percent(scenario[a.key])
          : a.unit.startsWith("USD")
            ? money(scenario[a.key])
            : scenario[a.key].toFixed(1),
      definition: a.rationale,
      use: "Replace the demonstration input with validated evidence before allocating money.",
      kind: "Assumed" as const,
      category: "Campaign economics",
      source:
        "User-editable scenario · declared demonstration assumption, not a team record.",
    })),
    ...[
      [
        "Resident population",
        integer(market.population),
        "July 2025 county population estimate; not the reachable fan audience.",
      ],
      [
        "Population change",
        signed(market.population_change_pct, "%"),
        "Percent change from the 2020 estimates base to July 2025.",
      ],
      [
        "Households",
        integer(market.households),
        "ACS 2020–2024 estimate of households; not buyer accounts.",
      ],
      [
        "Median household income",
        money(market.median_income),
        "ACS 2020–2024 household income in 2024 dollars; not willingness to pay.",
      ],
    ].map(([name, value, definition]) => ({
      name,
      value,
      definition,
      use: `Describe ${market.name} before designing a test. Demographics alone do not prove demand.`,
      kind: "Observed" as const,
      category: "Market context",
      source: `U.S. Census QuickFacts · ${market.name} · reviewed ${market.reviewed_on}`,
      url: market.source_url,
    })),
    {
      name: "Income difference vs. Orleans",
      value: signed(market.income_difference_vs_orleans_pct, "%"),
      kind: "Derived",
      category: "Market context",
      definition:
        "(Selected county median income ÷ Orleans median income − 1) × 100. Both use ACS 2020–2024.",
      source: "sql/schema.sql · market_comparison view · Census QuickFacts",
      url: market.source_url,
      use: "Compare local economic context; do not infer conversion or price elasticity.",
    },
    ...[
      [
        "Paid attendance & utilization",
        "Ticketing + gate scans; paid tickets, scans, sellable capacity, game ID.",
        "Report paid seats and actual scans separately; divide each by its matching capacity definition.",
      ],
      [
        "Primary sell-through & inventory",
        "Primary ticketing snapshot by game, section, price tier and timestamp.",
        "Track sold primary inventory ÷ released sellable inventory; distinguish holds and comps.",
      ],
      [
        "Net ticket revenue & yield",
        "Settled primary sales, refunds, fees, discounts and variable costs.",
        "Measure realized team revenue and contribution per paid ticket.",
      ],
      [
        "Campaign conversion & incremental lift",
        "Eligible audience, exposure, orders, treatment/holdout assignment and timestamps.",
        "Compare randomized treatment and holdout; attribution alone is not causal lift.",
      ],
      [
        "Buyer penetration & retention",
        "Consented CRM geography, deduplicated accounts, purchases and eligible household base.",
        "Measure actual buyer reach, repeat purchase and renewal by comparable cohorts.",
      ],
      [
        "Resale price & liquidity",
        "Licensed listing/transaction feed with section, quantity, fees and observation time.",
        "Separate asking prices from completed sales and team revenue.",
      ],
      [
        "Price elasticity & demand forecast",
        "Historical primary prices, inventory, sales pace, game controls and out-of-time validation.",
        "Estimate response with identified price variation; report forecast error against a baseline.",
      ],
      [
        "Merchandise & concession contribution",
        "POS transactions, costs, attendance and campaign linkage with consistent time windows.",
        "Compare net ancillary contribution per attendee without double-counting ticket margin.",
      ],
      [
        "Fan interest & engagement",
        "Dated search indices and permitted platform engagement, geography and impressions.",
        "Compare consistent indices and engagement denominators; do not equate searches with buyers.",
      ],
      [
        "Tourism, employment & affordability",
        "Dated official tourism/BLS series and a consistent all-in ticket, travel and parking basket.",
        "Measure the economic backdrop and total outing cost at the correct geography and vintage.",
      ],
      [
        "Competing entertainment pressure",
        "Dated event calendar, venue, time, public price and licensed attendance where available.",
        "Identify overlapping events; estimate substitution only with supporting purchase evidence.",
      ],
    ].map(([name, source, definition]) => ({
      name,
      source,
      definition,
      value: "Connection required",
      kind: "Required" as const,
      category: "Data connections",
      use: `Required to turn ${franchise} market investigation into measured commercial performance.`,
    })),
  ];
  const shown = metrics.filter(
    (m) =>
      (filter === "All measures" || m.category === filter) &&
      `${m.name} ${m.definition}`.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <section className="metric-library">
      <div className="metric-summary">
        <Database size={23} />
        <div>
          <strong>
            {metrics.length} defined measures. One evidence standard.
          </strong>
          <p>
            {metrics.filter((m) => m.kind !== "Required").length} measures
            available from the selected market and explicit scenario.{" "}
            {metrics.filter((m) => m.kind === "Required").length} need
            additional data connections. Open a measure to inspect its
            definition.
          </p>
        </div>
      </div>
      <div className="metric-toolbar">
        <div role="group" aria-label="Filter metrics">
          {[
            "All measures",
            "Campaign economics",
            "Market context",
            "Data connections",
          ].map((f) => (
            <button
              key={f}
              aria-pressed={filter === f}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
        <label>
          <Search size={16} />
          <input
            aria-label="Search metrics"
            placeholder="Find a measure…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
      </div>
      <div className="metric-cards">
        {shown.map((m) => (
          <details className="metric-card" key={m.name}>
            <summary>
              <span className={`tag tag-${m.kind.toLowerCase()}`}>
                {m.kind}
              </span>
              <ChevronDown size={15} />
              <h3>{m.name}</h3>
              <strong className={m.kind === "Required" ? "required-value" : ""}>
                {m.value}
              </strong>
              <p>{m.definition}</p>
              <span className="metric-inspect">Definition & provenance</span>
            </summary>
            <div className="metric-provenance">
              <span>SOURCE / TRANSFORMATION</span>
              <p>{m.source}</p>
              <span>DECISION USE</span>
              <p>{m.use}</p>
              {m.url && (
                <a href={m.url} target="_blank" rel="noreferrer">
                  Inspect original source <ArrowUpRight size={14} />
                </a>
              )}
            </div>
          </details>
        ))}
      </div>
      {!shown.length && <p className="panel">No measures match this search.</p>}
    </section>
  );
}
