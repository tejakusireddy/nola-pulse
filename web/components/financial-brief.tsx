"use client";

import { ArrowRight, ArrowUpRight, SlidersHorizontal } from "lucide-react";
import {
  campaignFinance,
  campaignPlans,
  initialCampaign,
} from "../lib/campaign-finance";
import type { CampaignScenario } from "../lib/campaign-finance";
import type { Franchise } from "./franchise-switch";
import type { Game } from "../lib/brief";
import { seasonAnalysis, seasonOptions } from "../lib/attendance";
import { gameDate, integer, money, percent } from "../lib/format";

function CashBridge({ scenario }: { scenario: CampaignScenario }) {
  const result = campaignFinance(scenario);
  const contributions = [
    result.incrementalTicketRevenue,
    -result.variableCosts,
    -scenario.budget,
    -scenario.fixedCosts,
  ];
  let running = 0;
  const bars = contributions.map((value, index) => {
    const start = running;
    running += value;
    return {
      label: ["Ticket revenue", "Variable costs", "Media spend", "Other costs"][
        index
      ],
      value,
      start,
      end: running,
    };
  });
  bars.push({
    label: "Net contribution",
    value: result.netContribution,
    start: 0,
    end: result.netContribution,
  });
  const low = Math.min(0, ...bars.flatMap((bar) => [bar.start, bar.end]));
  const high = Math.max(1, ...bars.flatMap((bar) => [bar.start, bar.end]));
  const padding = (high - low) * 0.17;
  const y = (value: number) =>
    234 - ((value - low + padding) / (high - low + 2 * padding)) * 204;
  return (
    <svg
      className="cash-bridge"
      viewBox="0 0 720 290"
      role="img"
      aria-label={`Modeled incremental revenue ${money(result.incrementalTicketRevenue)} less variable costs ${money(result.variableCosts)}, media ${money(scenario.budget)}, and other costs ${money(scenario.fixedCosts)} equals net contribution ${money(result.netContribution)}.`}
    >
      <line x1="35" x2="695" y1={y(0)} y2={y(0)} className="zero-line" />
      {bars.map((bar, index) => {
        const x = 46 + index * 132;
        return (
          <g key={bar.label}>
            <rect
              x={x}
              y={Math.min(y(bar.start), y(bar.end))}
              width="91"
              height={Math.max(1, Math.abs(y(bar.start) - y(bar.end)))}
              className={
                index === 0
                  ? "bridge-revenue"
                  : index === 4
                    ? bar.value >= 0
                      ? "bridge-net"
                      : "bridge-loss"
                    : "bridge-cost"
              }
            >
              <title>{`${bar.label}: ${money(bar.value, 2)}`}</title>
            </rect>
            {index < 4 && (
              <line
                x1={x + 91}
                x2={x + 132}
                y1={y(bar.end)}
                y2={y(bar.end)}
                className="bridge-connector"
              />
            )}
            <text
              x={x + 45.5}
              y={Math.min(y(bar.start), y(bar.end)) - 12}
              textAnchor="middle"
              className="bridge-amount"
            >
              {money(bar.value)}
            </text>
            <text
              x={x + 45.5}
              y="268"
              textAnchor="middle"
              className="bridge-label"
            >
              {["Revenue", "Variable", "Media", "Other", "Net"][index]}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export default function FinancialBrief({
  franchise,
  scenario,
  onChange,
  game,
  games,
  onGameChange,
  onSimulator,
  onAttendance,
}: {
  franchise: Franchise;
  scenario: CampaignScenario;
  onChange: (scenario: CampaignScenario) => void;
  game: Game;
  games: Game[];
  onGameChange: (game: Game) => void;
  onSimulator: () => void;
  onAttendance: () => void;
}) {
  const result = campaignFinance(scenario);
  const observed = seasonAnalysis(
    franchise,
    seasonOptions(franchise)[0].season,
  );
  const stress = campaignFinance({ ...scenario, incrementality: 0.4 });
  const fields = [
    {
      key: "budget",
      label: "Media budget",
      value: scenario.budget,
      min: 0,
      max: 100000,
      step: 500,
      unit: "money",
    },
    {
      key: "costPerOrder",
      label: "Cost per attributed order",
      value: scenario.costPerOrder,
      min: 1,
      max: 200,
      step: 1,
      unit: "money",
    },
    {
      key: "incrementality",
      label: "Incremental share of orders",
      value: scenario.incrementality,
      min: 0,
      max: 1,
      step: 0.01,
      unit: "share",
    },
    {
      key: "ticketsPerOrder",
      label: "Tickets per incremental order",
      value: scenario.ticketsPerOrder,
      min: 0.5,
      max: 6,
      step: 0.1,
      unit: "count",
    },
    {
      key: "ticketPrice",
      label: "Ticket yield after discounts",
      value: scenario.ticketPrice,
      min: Math.max(1, result.variableCostPerTicket),
      max: Math.max(300, scenario.ticketPrice),
      step: 1,
      unit: "money",
    },
    {
      key: "variableCostPerTicket",
      label: "Variable cost per ticket",
      value: result.variableCostPerTicket,
      min: 0,
      max: scenario.ticketPrice,
      step: 1,
      unit: "money",
    },
    {
      key: "fixedCosts",
      label: "Other campaign costs",
      value: scenario.fixedCosts,
      min: 0,
      max: 10000,
      step: 50,
      unit: "money",
    },
  ];
  const change = (key: string, value: number) => {
    if (key === "ticketPrice")
      onChange({
        ...scenario,
        ticketPrice: value,
        contributionPerTicket: value - result.variableCostPerTicket,
      });
    else if (key === "variableCostPerTicket")
      onChange({
        ...scenario,
        contributionPerTicket: scenario.ticketPrice - value,
      });
    else onChange({ ...scenario, [key]: value });
  };
  return (
    <div className="financial-brief">
      <div className="finance-context">
        <div>
          <span className="eyebrow">
            {franchise.toUpperCase()} /{" "}
            {campaignPlans.plans[franchise].name.toUpperCase()}
          </span>
          <span className="planning-badge" title={campaignPlans.origin}>
            Planning scenario · editable inputs
          </span>
        </div>
        <label>
          Home game
          <select
            aria-label="Campaign home game"
            value={game.game_id}
            onChange={(event) =>
              onGameChange(
                games.find(
                  (fixture) => fixture.game_id === event.target.value,
                )!,
              )
            }
          >
            {games.map((fixture) => (
              <option key={fixture.game_id} value={fixture.game_id}>
                vs. {fixture.opponent} · {gameDate(fixture.starts_at)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <section
        className="finance-kpis"
        aria-label={`${franchise} campaign economics`}
      >
        {[
          [
            "Media budget",
            money(scenario.budget),
            `${money(scenario.fixedCosts)} additional campaign costs`,
          ],
          [
            "Incremental ticket revenue",
            money(result.incrementalTicketRevenue),
            `${integer(result.incrementalTickets)} modeled incremental tickets`,
          ],
          [
            "Net incremental contribution",
            money(result.netContribution),
            "After variable costs and campaign costs",
          ],
          [
            "Contribution ROI",
            result.contributionROI === null
              ? "—"
              : percent(result.contributionROI, 1),
            "Net contribution ÷ campaign costs",
          ],
        ].map(([label, value, note], index) => (
          <article key={label}>
            <span>{label}</span>
            <strong
              className={
                index === 2
                  ? result.netContribution >= 0
                    ? "analytical-up"
                    : "analytical-down"
                  : ""
              }
            >
              {value}
            </strong>
            <small>{note}</small>
          </article>
        ))}
      </section>

      <div className="finance-main-grid">
        <section className="panel financial-recommendation">
          <div className="finance-recommendation-heading">
            <span className="eyebrow">PROPOSED DECISION</span>
            <span className="finance-status">
              {result.status === "positive"
                ? "PILOT CANDIDATE"
                : result.status === "inactive"
                  ? "NO CAMPAIGN"
                  : "REVISE ECONOMICS"}
            </span>
          </div>
          <h2>
            {result.status === "positive"
              ? `Evaluate a ${money(scenario.budget)} pilot.`
              : result.status === "inactive"
                ? "Keep the no-campaign option."
                : "Hold the spend at these inputs."}
          </h2>
          <p>
            {franchise} vs. {game.opponent} · {gameDate(game.starts_at)}
          </p>
          <p className="finance-recommendation-note">
            {result.status === "positive"
              ? `The planning case generates ${money(result.netContribution)} after all modeled costs. Validate primary inventory and campaign economics before release.`
              : "The current case does not produce a positive incremental contribution. Adjust the economics before committing spend."}
          </p>
          <div className="finance-thresholds">
            <div>
              <span>Break-even incremental orders</span>
              <strong>
                {result.breakEvenOrders === null
                  ? "—"
                  : result.breakEvenOrders.toFixed(1)}
              </strong>
            </div>
            <div>
              <span>Maximum acquisition cost</span>
              <strong>
                {result.maxCostPerOrder === null
                  ? "—"
                  : money(result.maxCostPerOrder, 2)}
              </strong>
            </div>
          </div>
          <button className="button button-dark" onClick={onSimulator}>
            Inspect sensitivity <ArrowRight size={15} />
          </button>
        </section>
        <section className="panel finance-bridge-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">REVENUE → CONTRIBUTION</span>
              <h2>Where the money goes</h2>
            </div>
          </div>
          <CashBridge scenario={scenario} />
          <small>
            Incremental revenue less variable costs, media, and other campaign
            costs. Every bar uses the inputs below.
          </small>
        </section>
      </div>

      <section
        className="finance-reversal"
        aria-label="Financial decision reversal"
      >
        <div>
          <span className="eyebrow">WHAT CHANGES THE DECISION?</span>
          <h2>
            {result.breakEvenShare === null
              ? "No finite break-even threshold"
              : result.breakEvenShare > 1
                ? "The case cannot break even at feasible incrementality"
                : `Below ${percent(result.breakEvenShare, 2)} incrementality, the case loses money.`}
          </h2>
          <p>
            Other inputs held fixed. At the threshold, contribution is zero.
          </p>
        </div>
        <div className="reversal-stress">
          <span>At 40% incrementality</span>
          <strong
            className={
              stress.netContribution >= 0 ? "analytical-up" : "analytical-down"
            }
          >
            {money(stress.netContribution)}
          </strong>
          <small>Calculated stress case</small>
        </div>
      </section>

      <details className="panel finance-inputs">
        <summary>
          <span>
            <SlidersHorizontal size={16} /> Edit campaign inputs
          </span>
          <span>{franchise} · separate planning case</span>
        </summary>
        <div className="finance-input-header">
          <p>
            Illustrative inputs, not franchise sales or margin estimates. Ticket
            yield is after discounts; variable cost includes per-ticket fees and
            fulfillment. Attribution and incrementality are separate.
          </p>
          <button
            className="button button-quiet"
            onClick={() => onChange(initialCampaign(franchise))}
          >
            Restore {franchise} case
          </button>
        </div>
        <div className="finance-input-grid">
          {fields.map((field) => (
            <label key={field.key} htmlFor={`finance-${field.key}`}>
              <span>
                {field.label}
                <output>
                  {field.unit === "share"
                    ? percent(field.value, 0)
                    : field.unit === "money"
                      ? money(field.value)
                      : field.value.toFixed(1)}
                </output>
              </span>
              <input
                id={`finance-${field.key}`}
                type="range"
                min={field.min}
                max={Math.max(field.max, field.value)}
                step={field.step}
                value={field.value}
                onChange={(event) =>
                  change(field.key, Number(event.target.value))
                }
              />
            </label>
          ))}
        </div>
      </details>

      <div className="finance-observed-context">
        <div>
          <span className="eyebrow">OBSERVED CONTEXT</span>
          <p>
            {integer(observed.rollup.average_attendance)} average reported home
            crowd across {observed.games.length} New Orleans games this season.{" "}
            {observed.change !== null &&
              `${observed.change >= 0 ? "+" : ""}${percent(observed.change, 2)} versus the same number of prior-season home dates.`}
          </p>
          <small>
            Attendance is supporting context; it does not set the financial
            inputs.
          </small>
        </div>
        <button className="text-link" onClick={onAttendance}>
          Attendance evidence <ArrowUpRight size={15} />
        </button>
      </div>
    </div>
  );
}
