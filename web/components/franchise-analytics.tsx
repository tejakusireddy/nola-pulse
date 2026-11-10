"use client";

import { useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  Download,
  ExternalLink,
} from "lucide-react";
import attendance from "../data/attendance.json";
import {
  historicalOpponent,
  seasonAnalysis,
  seasonOptions,
} from "../lib/attendance";
import type { AttendanceGame } from "../lib/attendance";
import type { Franchise } from "./franchise-switch";
import type { Game, Market } from "../lib/brief";
import { download } from "../lib/brief";
import { gameDate, gameTime, integer, money, percent } from "../lib/format";
import RegionalMap from "./regional-map";

function AttendanceChart({
  analysis,
}: {
  analysis: ReturnType<typeof seasonAnalysis>;
}) {
  const [point, setPoint] = useState<number | null>(null);
  const { games, matchedPrior } = analysis;
  const values = [...games, ...matchedPrior].map((game) => game.attendance);
  const step = Math.max(
    500,
    Math.ceil((Math.max(...values) - Math.min(...values)) / 2000) * 500,
  );
  const low = Math.max(0, Math.floor(Math.min(...values) / step) * step - step);
  const high = Math.ceil(Math.max(...values) / step) * step + step;
  const x = (index: number) =>
    68 + (index / Math.max(games.length - 1, 1)) * 632;
  const y = (value: number) => 224 - ((value - low) / (high - low)) * 180;
  const line = (rows: AttendanceGame[]) =>
    rows
      .map(
        (game, index) =>
          `${index ? "L" : "M"}${x(index)},${y(game.attendance)}`,
      )
      .join(" ");
  const focused = games[Math.min(point ?? games.length - 1, games.length - 1)];
  const focusedIndex = games.indexOf(focused);
  return (
    <div className="attendance-chart">
      <div className="attendance-legend">
        <span>
          <i />
          {analysis.rollup.season_label}
        </span>
        {matchedPrior.length > 0 && (
          <span className="prior-legend">
            <i />
            Prior season · first {matchedPrior.length} home dates
          </span>
        )}
      </div>
      <svg
        viewBox="0 0 740 272"
        role="img"
        aria-label={`${analysis.rollup.season_label} reported attendance by completed home game. ${games.length} games; average ${integer(analysis.rollup.average_attendance)}. Prior-season comparison aligns home-game number.`}
      >
        {[0, 1, 2, 3, 4].map((tick) => {
          const value = low + ((high - low) * tick) / 4;
          return (
            <g key={tick}>
              <line
                x1="68"
                x2="700"
                y1={y(value)}
                y2={y(value)}
                className="chart-grid"
              />
              <text x="54" y={y(value) + 4} textAnchor="end">
                {integer(value)}
              </text>
            </g>
          );
        })}
        {matchedPrior.length > 0 && (
          <path d={line(matchedPrior)} className="attendance-prior-line" />
        )}
        <path
          d={`${line(games)} L${x(games.length - 1)},224 L68,224 Z`}
          className="attendance-area"
        />
        <path d={line(games)} className="attendance-current-line" />
        {games.map((game, index) => (
          <g key={game.event_id}>
            <circle
              cx={x(index)}
              cy={y(game.attendance)}
              r={games.length > 15 ? 3 : 5}
              tabIndex={0}
              className={
                focusedIndex === index
                  ? "attendance-point active"
                  : "attendance-point"
              }
              onMouseEnter={() => setPoint(index)}
              onFocus={() => setPoint(index)}
              onClick={() => setPoint(index)}
              aria-label={`${gameDate(game.starts_at)} vs. ${game.opponent}: ${integer(game.attendance)}`}
            >
              <title>{`${gameDate(game.starts_at)} · ${game.opponent} · ${integer(game.attendance)}`}</title>
            </circle>
            {(games.length <= 9 ||
              index % 5 === 0 ||
              index === games.length - 1) && (
              <text x={x(index)} y="247" textAnchor="middle">
                {index + 1}
              </text>
            )}
          </g>
        ))}
        <text x="384" y="268" textAnchor="middle">
          Completed New Orleans home game
        </text>
      </svg>
      <div className="attendance-focus">
        <span>
          HOME DATE {focusedIndex + 1}
          <strong>
            {gameDate(focused.starts_at)} · {focused.opponent}
          </strong>
        </span>
        <a href={focused.source_url} target="_blank" rel="noreferrer">
          {integer(focused.attendance)} <ExternalLink size={13} />
        </a>
      </div>
      <small className="chart-scale-note">
        Attendance axis starts at {integer(low)}. Prior seasons align by game
        number, not calendar date.
      </small>
    </div>
  );
}

export default function FranchiseAnalytics({
  franchise,
  season,
  onSeasonChange,
  market,
  onMarketChange,
  nextGame,
}: {
  franchise: Franchise;
  season: number;
  onSeasonChange: (season: number) => void;
  market: Market;
  onMarketChange: (market: Market) => void;
  nextGame: Game;
}) {
  const analysis = seasonAnalysis(franchise, season);
  const options = seasonOptions(franchise);
  const [showGames, setShowGames] = useState(false);
  const {
    rollup,
    change,
    matchedCount,
    priorMean,
    currentMean,
    highest,
    lowest,
    spread,
  } = analysis;
  const delta =
    currentMean !== null && priorMean !== null ? currentMean - priorMean : null;
  const current = season === options[0].season;
  const opponent = historicalOpponent(franchise, nextGame.opponent);
  const changeLabel =
    change === null
      ? "—"
      : `${change >= 0 ? "+" : "−"}${percent(Math.abs(change), 2)}`;
  const period = current ? "SEASON TO DATE" : "COMPLETED SEASON";
  const exportGames = () => {
    const columns = [
      "event_id",
      "franchise",
      "season_label",
      "starts_at",
      "opponent",
      "attendance",
      "venue",
      "source_url",
      "corrected",
    ] as const;
    const csv =
      [
        columns.join(","),
        ...analysis.games.map((game) =>
          columns.map((column) => JSON.stringify(game[column])).join(","),
        ),
      ].join("\n") + "\n";
    download(
      `nola-pulse-${franchise.toLowerCase()}-${rollup.season_label}-attendance.csv`,
      csv,
      "text/csv",
    );
  };
  return (
    <div className="franchise-analytics">
      <div className="performance-toolbar">
        <span className="eyebrow">
          {period} / {rollup.season_label}{" "}
          <span className="performance-snapshot">
            Snapshot {attendance.as_of}
          </span>
        </span>
        <label>
          Season
          <select
            aria-label="Attendance season"
            value={season}
            onChange={(event) => onSeasonChange(Number(event.target.value))}
          >
            {options.map((option) => (
              <option key={option.season} value={option.season}>
                {option.season_label}
                {option.season === options[0].season ? " · to date" : ""}
              </option>
            ))}
          </select>
        </label>
      </div>
      <section
        className="performance-kpis"
        aria-label={`${franchise} attendance performance`}
      >
        {[
          [
            "Average home crowd",
            integer(rollup.average_attendance),
            `${rollup.home_games} completed home dates`,
          ],
          [
            "Total home attendance",
            integer(rollup.total_attendance),
            `${rollup.season_label} · New Orleans only`,
          ],
          [
            "Matched prior-season change",
            changeLabel,
            matchedCount
              ? `First ${matchedCount} home dates in each season`
              : "No prior season in this dataset",
          ],
          [
            "Home attendance range",
            integer(spread),
            `${integer(lowest.attendance)} low · ${integer(highest.attendance)} high`,
          ],
        ].map(([label, value, note], index) => (
          <article key={label}>
            <span>{label}</span>
            <strong
              className={
                index === 2 && change !== null
                  ? change < 0
                    ? "analytical-down"
                    : "analytical-up"
                  : ""
              }
            >
              {value}
            </strong>
            <small>{note}</small>
          </article>
        ))}
      </section>

      <div className="performance-main-grid">
        <section className="panel attendance-trend-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">REPORTED ATTENDANCE</span>
              <h2>Home attendance trend</h2>
            </div>
            <button
              className="button button-quiet"
              onClick={exportGames}
              aria-label="Download attendance observations"
            >
              <Download size={15} />
              CSV
            </button>
          </div>
          <AttendanceChart key={`${franchise}-${season}`} analysis={analysis} />
        </section>
        <aside
          className="panel attendance-findings"
          aria-label="Attendance findings"
        >
          <span className="eyebrow">WHAT CHANGED</span>
          <div className="finding-lead">
            {change === null ? (
              <h2>{rollup.season_label} baseline</h2>
            ) : (
              <>
                {change < 0 ? (
                  <ArrowDownRight size={25} className="analytical-down" />
                ) : (
                  <ArrowUpRight size={25} className="analytical-up" />
                )}
                <h2>
                  {integer(Math.abs(delta!))} {delta! < 0 ? "fewer" : "more"}{" "}
                  per home date
                </h2>
                <p>
                  Average reported attendance is {changeLabel} versus the first{" "}
                  {matchedCount} home dates of {analysis.prior[0].season_label}.
                </p>
                <div className="finding-reference">
                  <span>
                    Matched prior average<strong>{integer(priorMean!)}</strong>
                  </span>
                  <span>
                    Current matched average
                    <strong>{integer(currentMean!)}</strong>
                  </span>
                </div>
              </>
            )}
          </div>
          <div className="attendance-extremes">
            <a href={highest.source_url} target="_blank" rel="noreferrer">
              <span>Largest reported crowd</span>
              <strong>{integer(highest.attendance)}</strong>
              <small>
                {highest.opponent} · {gameDate(highest.starts_at)}{" "}
                <ExternalLink size={11} />
              </small>
            </a>
            <a href={lowest.source_url} target="_blank" rel="noreferrer">
              <span>Smallest reported crowd</span>
              <strong>{integer(lowest.attendance)}</strong>
              <small>
                {lowest.opponent} · {gameDate(lowest.starts_at)}{" "}
                <ExternalLink size={11} />
              </small>
            </a>
          </div>
          <small className="finding-context">
            Same number of home dates; opponent and calendar mix can differ.
            Published attendance does not measure campaign lift.
          </small>
        </aside>
      </div>

      <div className="performance-secondary-grid">
        <section className="panel season-history">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">THREE-SEASON VIEW</span>
              <h2>Season totals and averages</h2>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Season</th>
                <th>Home dates</th>
                <th>Total</th>
                <th>Average</th>
              </tr>
            </thead>
            <tbody>
              {options.map((option) => (
                <tr
                  key={option.season}
                  className={option.season === season ? "selected-season" : ""}
                >
                  <th scope="row">
                    <button onClick={() => onSeasonChange(option.season)}>
                      {option.season_label}
                      {option.season === options[0].season && (
                        <small>To date</small>
                      )}
                    </button>
                  </th>
                  <td>{option.home_games}</td>
                  <td>{integer(option.total_attendance)}</td>
                  <td>{integer(option.average_attendance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
        <section className="panel attendance-day-mix">
          <span className="eyebrow">GAME-DAY MIX / {rollup.season_label}</span>
          <h2>Weekday and weekend crowds</h2>
          <div>
            {[
              ["Mon–Fri", analysis.weeknight],
              ["Sat–Sun", analysis.weekend],
            ].map(([label, value]) => {
              const group = value as { count: number; mean: number | null };
              return (
                <article key={label as string}>
                  <span>{label as string}</span>
                  <strong>
                    {group.mean === null ? "—" : integer(group.mean)}
                  </strong>
                  <small>{group.count} home dates · average attendance</small>
                </article>
              );
            })}
          </div>
          <small>
            Descriptive groups; no adjustment for opponent or start time.
          </small>
        </section>
      </div>

      <section className="next-game-context" aria-label="Upcoming game context">
        <div>
          <span className="eyebrow">NEXT NEW ORLEANS HOME GAME</span>
          <strong>
            {franchise} vs. {nextGame.opponent}
          </strong>
          <span>
            {gameDate(nextGame.starts_at)} · {gameTime(nextGame.starts_at)} ·{" "}
            {nextGame.venue}
          </span>
        </div>
        <div>
          <span className="eyebrow">OPPONENT ATTENDANCE HISTORY</span>
          <strong>
            {opponent ? integer(opponent.average) : "No recorded matchup"}
          </strong>
          <span>
            {opponent
              ? `Average across ${opponent.games} reviewed home meetings · 2024–2026`
              : "No comparable home meeting in the reviewed data"}
          </span>
          <small>Historical context; not a forecast for this game.</small>
          {opponent && (
            <details className="opponent-history-sources">
              <summary>Inspect matchup history</summary>
              <ul>
                {opponent.observations.map((observation) => (
                  <li key={observation.event_id}>
                    <a
                      href={observation.source_url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {observation.starts_at.slice(0, 10)} ·{" "}
                      {integer(observation.attendance)}{" "}
                      <ExternalLink size={11} />
                    </a>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      </section>

      <section className="regional-performance">
        <div className="section-heading">
          <div>
            <span className="eyebrow">REGIONAL CONTEXT</span>
            <h2>Regional household profile</h2>
          </div>
        </div>
        <div className="regional-performance-grid">
          <RegionalMap selected={market} onSelect={onMarketChange} />
          <aside className="panel regional-profile">
            <span className="eyebrow">{market.name.toUpperCase()}</span>
            <h3>{integer(market.households)} households</h3>
            <dl>
              <div>
                <dt>Median household income</dt>
                <dd>{money(market.median_income)}</dd>
              </div>
              <div>
                <dt>Population change</dt>
                <dd>
                  {market.population_change_pct > 0 ? "+" : ""}
                  {market.population_change_pct}%
                </dd>
              </div>
            </dl>
            <p>
              Use household counts and income to frame audience research
              alongside the attendance trend.
            </p>
            <a
              className="text-link"
              href={market.source_url}
              target="_blank"
              rel="noreferrer"
            >
              Census QuickFacts <ExternalLink size={13} />
            </a>
            <small>
              Households are ACS 2020–24 estimates; population change is 2020
              base to July 2025. These are residents, not identified fans.
            </small>
          </aside>
        </div>
      </section>

      <section className="panel attendance-observations">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">EVIDENCE LEDGER</span>
            <h2>{rollup.home_games} sourced home-game records</h2>
          </div>
          <button
            className="button button-quiet"
            aria-expanded={showGames}
            onClick={() => setShowGames(!showGames)}
          >
            {showGames ? "Hide records" : "Inspect records"}
          </button>
        </div>
        {showGames && (
          <div className="attendance-table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Opponent</th>
                  <th>Attendance</th>
                  <th>Source</th>
                </tr>
              </thead>
              <tbody>
                {analysis.games.map((game) => (
                  <tr key={game.event_id}>
                    <td>{gameDate(game.starts_at)}</td>
                    <th scope="row">{game.opponent}</th>
                    <td>{integer(game.attendance)}</td>
                    <td>
                      <a
                        href={game.source_url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {game.corrected ? "NBA correction" : "ESPN game"}{" "}
                        <ExternalLink size={12} />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <details className="attendance-methods">
          <summary>Sources, scope, and calculations</summary>
          <p>{attendance.definition}</p>
          <p>{attendance.method}</p>
          <p>
            Totals, means, minima and maxima are computed in SQL. Matched change
            = (mean of first N current home games ÷ mean of first N prior home
            games) − 1, where N is the smaller available game count. Rounding is
            for display only.
          </p>
          <p>
            {attendance.games.length} validated games across{" "}
            {attendance.seasons.length} franchise-season snapshots. One
            NBA-verified correction replaces a zero placeholder. A postponed
            event and the Saints’ Paris home designation are excluded from New
            Orleans totals.
          </p>
          <ul>
            {attendance.sources
              .filter(
                (source) =>
                  ("franchise" in source && source.franchise === franchise) ||
                  (franchise === "Pelicans" &&
                    source.id === "nba-20241023-chinop"),
              )
              .map((source) => (
                <li key={source.id}>
                  <a href={source.url} target="_blank" rel="noreferrer">
                    {source.provider} · {source.id}
                  </a>{" "}
                  · retrieved {source.retrieved_at.slice(0, 10)}
                </li>
              ))}
          </ul>
        </details>
      </section>
    </div>
  );
}
