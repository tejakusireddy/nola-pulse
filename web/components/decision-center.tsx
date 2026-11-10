"use client";

import { useEffect, useRef, useState } from "react";
import LiveContext from "./live-context";
import FranchiseSwitch, { useSelectedFranchise } from "./franchise-switch";
import Image from "next/image";
import type { Franchise } from "./franchise-switch";
import MetricLibrary from "./metric-library";
import saintsSchedule from "../data/saints-schedule.json";
import type { ScheduleGame } from "../lib/live-normalize";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Check,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Download,
  ExternalLink,
  FileText,
  MapPin,
  RotateCcw,
  ShieldCheck,
  SlidersHorizontal,
  Target,
  X,
} from "lucide-react";
import intelligence from "../data/intelligence.json";
import geography from "../data/geography.json";
import {
  ASSUMPTIONS,
  DEFAULT_SCENARIO,
  MODEL_VERSION,
  combinedDownside,
  contributionCurve,
  evaluate,
  sensitivity,
} from "../lib/scenario";
import type { Scenario } from "../lib/scenario";
import { assertEvidence, createBrief, download } from "../lib/brief";
import type { Game, Market } from "../lib/brief";
import {
  gameDate,
  gameTime,
  integer,
  money,
  percent,
  signed,
} from "../lib/format";

type View = "decision" | "markets" | "metrics" | "evidence";
const MARKET_POSITIONS: Record<string, [number, number]> = {
  "22071": [-90.07, 29.95],
  "22051": [-90.18, 29.99],
  "22103": [-90.0, 30.45],
  "22033": [-91.14, 30.45],
  "28047": [-89.08, 30.4],
  "01097": [-88.04, 30.69],
};
const project = ([lon, lat]: [number, number]) => [
  (lon + 93.9) * 130,
  (33.25 - lat) * 145,
];
const INITIAL_GAME =
  intelligence.games.find((g) => g.opponent === "Nuggets") ||
  intelligence.games[0];
const chartLabel = (v: number) =>
  `${v < 0 ? "−" : ""}$${Math.abs(v / 1000).toFixed(0)}k`;

function Tag({ kind }: { kind: string }) {
  return <span className={`tag tag-${kind.toLowerCase()}`}>{kind}</span>;
}

function MarketMap({
  selected,
  onSelect,
}: {
  selected: Market;
  onSelect: (m: Market) => void;
}) {
  return (
    <div className="market-map">
      <svg
        viewBox="0 0 850 610"
        role="group"
        aria-label="Interactive Gulf Coast candidate markets. Points show approximate representative city locations, not catchment boundaries."
      >
        <defs>
          <pattern
            id="map-grid"
            width="25"
            height="25"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="1" cy="1" r="0.7" fill="var(--map-dot)" />
          </pattern>
        </defs>
        <rect width="850" height="610" fill="url(#map-grid)" />
        {geography.states.map((s) => (
          <path key={s.name} d={s.path} className="state-shape" />
        ))}
        <text x="145" y="225" className="state-label">
          LOUISIANA
        </text>
        <text x="515" y="175" className="state-label">
          MISSISSIPPI
        </text>
        <text x="735" y="150" className="state-label">
          ALABAMA
        </text>
        <text x="600" y="555" className="water-label">
          GULF COAST
        </text>
        {intelligence.markets.map((m) => {
          const [x, y] = project(MARKET_POSITIONS[m.market_id]);
          const active = m.market_id === selected.market_id;
          const local = m.market_id === "22071" || m.market_id === "22051";
          const labelX = m.market_id === "22051" ? x - 100 : x + 17;
          const labelY =
            m.market_id === "22071"
              ? y + 36
              : m.market_id === "22051"
                ? y - 12
                : y - 16;
          return (
            <g
              key={m.market_id}
              role="button"
              tabIndex={0}
              aria-label={`Select ${m.name}`}
              aria-pressed={active}
              onClick={() => onSelect(m)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelect(m);
                }
              }}
              className={`map-marker ${active ? "is-selected" : ""}`}
            >
              <circle
                cx={x}
                cy={y}
                r={active ? 21 : 15}
                className="marker-halo"
              />
              <circle
                cx={x}
                cy={y}
                r={active ? 7 : 5}
                className={local ? "marker-local" : "marker-region"}
              />
              <text x={labelX} y={labelY} className="marker-label">
                {m.short_name}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="map-legend">
        <span>
          <i className="legend-dot local" />
          Local reference
        </span>
        <span>
          <i className="legend-dot regional" />
          Regional candidate
        </span>
      </div>
      <p className="map-note">
        City anchors are approximate. Census figures cover the named parish or
        county.
      </p>
    </div>
  );
}

function ReversalChart({ scenario }: { scenario: Scenario }) {
  const points = contributionCurve(scenario);
  const current = evaluate(scenario);
  const low = Math.min(points[0].net, -1000),
    high = Math.max(points[100].net, 1000);
  const x = (share: number) => 64 + share * 610;
  const y = (net: number) => 220 - ((net - low) / (high - low)) * 178;
  const line = points
    .map((p, i) => `${i ? "L" : "M"}${x(p.share)},${y(p.net)}`)
    .join(" ");
  const threshold = current.breakEvenShare;
  return (
    <svg
      className="reversal-chart"
      viewBox="0 0 710 275"
      role="img"
      aria-label={`Net contribution by incremental share. Current result ${money(current.netContribution)}. Break-even ${threshold === null ? "unavailable" : percent(threshold)}.`}
    >
      {[low, 0, high].map((v, i) => (
        <g key={i}>
          <line
            x1="64"
            y1={y(v)}
            x2="674"
            y2={y(v)}
            className={v === 0 ? "zero-line" : "chart-grid"}
          />
          <text x="52" y={y(v) + 4} textAnchor="end" className="chart-tick">
            {chartLabel(v)}
          </text>
        </g>
      ))}
      <path
        d={`${line} L${x(1)},${y(0)} L${x(0)},${y(0)} Z`}
        className="chart-area"
      />
      <path d={line} className="contribution-line" />
      {threshold !== null && threshold <= 1 && (
        <g>
          <line
            x1={x(threshold)}
            x2={x(threshold)}
            y1="30"
            y2="225"
            className="threshold-line"
          />
          <rect
            x={Math.max(64, Math.min(550, x(threshold) - 52))}
            y="8"
            width="116"
            height="24"
            rx="5"
            className="threshold-box"
          />
          <text
            x={Math.max(64, Math.min(550, x(threshold) - 52)) + 58}
            y="24"
            textAnchor="middle"
            className="threshold-text"
          >
            {percent(threshold)} break-even
          </text>
        </g>
      )}
      <circle
        cx={x(scenario.incrementality)}
        cy={y(current.netContribution)}
        r="7"
        className="current-point"
      />
      {[0, 0.25, 0.5, 0.75, 1].map((v) => (
        <text
          key={v}
          x={x(v)}
          y="245"
          textAnchor="middle"
          className="chart-tick"
        >
          {percent(v, 0)}
        </text>
      ))}
      <text x="370" y="269" textAnchor="middle" className="chart-caption">
        Incremental share of attributed orders · all other inputs held fixed
      </text>
    </svg>
  );
}

function Sources({
  market,
  franchise,
}: {
  market: Market;
  franchise: Franchise;
}) {
  return (
    <div className="evidence-content">
      <div className="section-heading">
        <div>
          <span className="eyebrow">EVIDENCE & METHODS</span>
          <h2>Every number has a trail.</h2>
        </div>
        <ShieldCheck size={26} />
      </div>
      <p className="section-intro">
        Observed facts, explicit calculations, and editable assumptions stay
        distinguishable from the opening decision to the exported brief.
      </p>
      <div className="source-grid">
        {intelligence.sources.map((source) => (
          <article className="panel source-card" key={source.id}>
            <Tag kind={source.kind} />
            <h3>{source.name}</h3>
            <p>{source.method}</p>
            <dl>
              <dt>Period / version</dt>
              <dd>{source.vintage}</dd>
              <dt>Reviewed</dt>
              <dd>{source.reviewed_on}</dd>
              <dt>Usage</dt>
              <dd>{source.rights}</dd>
            </dl>
            <a
              href={source.id === "census" ? market.source_url : source.url}
              target="_blank"
              rel="noreferrer"
            >
              Inspect source <ExternalLink size={14} />
            </a>
          </article>
        ))}
      </div>
      <article className="panel limitations">
        <h3>What this evidence cannot establish</h3>
        <ul>
          {intelligence.limitations.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p>
          There is no validated geographic conversion model. Selecting a market
          does not silently change its acquisition cost or expected return. The
          same explicit scenario applies until you edit it.
        </p>
      </article>
      <article className="panel">
        <h3>From snapshot to decision</h3>
        <div className="lineage">
          <span>Census + official schedule</span>
          <ChevronRight />
          <span>Python validation</span>
          <ChevronRight />
          <span>SQL comparisons</span>
          <ChevronRight />
          <span>Campaign scenario</span>
          <ChevronRight />
          <span>Decision brief</span>
        </div>
        <p className="muted">
          Population change compares the 2020 estimates base with July 2025.
          Income and households are ACS 2020–2024 estimates. The growth
          comparison is in percentage points; the income comparison is a percent
          difference from Orleans. These periods are not treated as daily demand
          signals.
        </p>
      </article>
      <article className="panel">
        <h3>Power BI analytical handoff</h3>
        <p>
          A native PBIP report source, curated CSVs, DAX measures, and the
          matching report theme are supplied in the repository. Native report
          assembly and Desktop rendering have not been validated.
        </p>
        <a
          href={`/downloads/powerbi-theme-${franchise.toLowerCase()}.json`}
          download
          className="text-link"
        >
          Download {franchise} report theme <Download size={14} />
        </a>
      </article>
    </div>
  );
}

export default function DecisionCenter() {
  const [view, setView] = useState<View>("decision");
  const [market, setMarket] = useState(
    intelligence.markets.find((m) => m.market_id === "22103")!,
  );
  const [franchise, setFranchise] = useSelectedFranchise();
  const [preview, setPreview] = useState<Franchise | null>(null);
  const activeFranchise = preview ?? franchise;
  const [chosenGame, setChosenGame] = useState<Game>(INITIAL_GAME);
  const [games, setGames] = useState<Game[]>([
    ...intelligence.games,
    ...saintsSchedule,
  ]);
  const franchiseGames = games.filter((g) => g.franchise === activeFranchise);
  const game =
    chosenGame.franchise === activeFranchise
      ? chosenGame
      : (franchiseGames[0] ??
        (activeFranchise === "Saints" ? saintsSchedule[0] : INITIAL_GAME));
  const commitFranchise = (team: Franchise) => {
    setFranchise(team);
    setPreview(null);
  };
  const setGame = (next: Game) => {
    setChosenGame(next);
    commitFranchise(next.franchise as Franchise);
  };
  useEffect(() => {
    document.documentElement.dataset.franchise = activeFranchise.toLowerCase();
  }, [activeFranchise]);
  const [scenario, setScenario] = useState<Scenario>({ ...DEFAULT_SCENARIO });
  const [exportOpen, setExportOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [experimentOpen, setExperimentOpen] = useState(false);
  const [tableSort, setTableSort] = useState<
    "population" | "median_income" | "population_change_pct"
  >("population_change_pct");
  const exportRef = useRef<HTMLDivElement>(null);
  const result = evaluate(scenario);
  const risks = sensitivity(scenario);
  const stress = combinedDownside(scenario);
  const threshold = result.breakEvenShare;
  let evidenceError = "";
  try {
    assertEvidence(market, game);
  } catch (error) {
    evidenceError = (error as Error).message;
  }

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node))
        setExportOpen(false);
    };
    const escape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setExportOpen(false);
        setExperimentOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", escape);
    };
  }, []);
  useEffect(() => {
    if (notice) {
      const timer = setTimeout(() => setNotice(""), 4000);
      return () => clearTimeout(timer);
    }
  }, [notice]);

  const receiveSchedule = (incoming: ScheduleGame[]) => {
    setGames((previous) => {
      const refreshedTeams = new Set(incoming.map((g) => g.franchise));
      return [
        ...incoming,
        ...previous.filter((g) => !refreshedTeams.has(g.franchise)),
      ].sort((a, b) => Date.parse(a.starts_at) - Date.parse(b.starts_at));
    });
  };
  const selectGame = (selected: ScheduleGame) => {
    setGame(selected);
    setView("decision");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const selectView = (v: View) => {
    setView(v);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const exportBrief = () => {
    const brief = createBrief(market, game, scenario);
    download(
      `nola-pulse-${market.market_id}-${game.game_id}.json`,
      JSON.stringify(brief, null, 2),
      "application/json",
    );
    setExportOpen(false);
    setNotice("Brief exported with assumptions, evidence, and reversal tests.");
  };
  const exportCsv = () => {
    const columns = [
      "market_id",
      "name",
      "population",
      "population_change_pct",
      "households",
      "median_income",
      "source_url",
      "population_vintage",
      "income_vintage",
    ] as const;
    const rows = [
      columns.join(","),
      ...intelligence.markets.map((m) =>
        columns.map((k) => JSON.stringify(m[k])).join(","),
      ),
    ];
    download("nola-pulse-markets.csv", rows.join("\n"), "text/csv");
    setExportOpen(false);
  };

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to decision
      </a>
      <header className="masthead">
        <div className="masthead-inner">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              selectView("decision");
            }}
            className="wordmark"
            aria-label="NOLA PULSE decision center"
          >
            <Activity size={32} strokeWidth={1.6} />
            <span>
              NOLA<span className="gold">PULSE</span>
              <small>MARKET INTELLIGENCE</small>
            </span>
          </a>
          <FranchiseSwitch
            selected={franchise}
            preview={preview}
            onPreview={setPreview}
            onSelect={commitFranchise}
          />
          <div className="workspace-status">
            <span className="status-dot" /> PUBLIC EVIDENCE
            <small>Independent strategy workspace</small>
          </div>
        </div>
        <div className="nav-bar">
          <nav aria-label="Primary navigation">
            {(
              [
                ["decision", "Decision room", Target],
                ["markets", "Market landscape", MapPin],
                ["metrics", "Metric library", BarChart3],
                ["evidence", "Evidence & methods", ShieldCheck],
              ] as const
            ).map(([key, label, Icon]) => (
              <button
                key={key}
                className={view === key ? "nav-item active" : "nav-item"}
                aria-current={view === key ? "page" : undefined}
                onClick={() => selectView(key)}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </nav>
          <span className="nav-edition">
            {activeFranchise.toUpperCase()} EDITION <span>/</span> MODEL{" "}
            {MODEL_VERSION}
          </span>
        </div>
      </header>
      <div className="workspace">
        <main id="main-content" className="main-content">
          <div className="page-header">
            <div>
              <div className="eyebrow">
                <span className="eyebrow-line" />
                NEW ORLEANS {activeFranchise.toUpperCase()} · STRATEGY &
                ANALYTICS
              </div>
              <h1>
                {view === "decision"
                  ? "The next move starts here."
                  : view === "markets"
                    ? "A market is more than a number."
                    : view === "metrics"
                      ? "The numbers behind the move."
                      : "Built to be questioned."}
              </h1>
              <p>
                {view === "decision"
                  ? "One campaign. Traceable evidence. A decision you can challenge."
                  : view === "markets"
                    ? "Compare regional context before making a commercial commitment."
                    : view === "metrics"
                      ? "Commercial measures, their definitions, and the evidence needed to use them."
                      : "Inspect the facts, assumptions, and limits behind the recommendation."}
              </p>
            </div>
            <div className="export-control" ref={exportRef}>
              <button
                className="button button-dark"
                onClick={() => setExportOpen(!exportOpen)}
                aria-expanded={exportOpen}
                disabled={!!evidenceError}
              >
                <Download size={16} />
                Export brief
                <ChevronDown size={14} />
              </button>
              {exportOpen && (
                <div className="export-menu">
                  <button onClick={exportBrief}>
                    <FileText size={16} />
                    Decision brief · JSON
                  </button>
                  <button
                    onClick={() => {
                      setView("decision");
                      setExportOpen(false);
                      setTimeout(() => window.print(), 100);
                    }}
                  >
                    <FileText size={16} />
                    Print / save PDF
                  </button>
                  <button onClick={exportCsv}>
                    <BarChart3 size={16} />
                    Market data · CSV
                  </button>
                </div>
              )}
            </div>
          </div>
          {evidenceError && (
            <div role="alert" className="error-banner">
              {evidenceError}
            </div>
          )}
          {view === "markets" && (
            <LiveContext onSelect={selectGame} onRefresh={receiveSchedule} />
          )}
          {view === "evidence" ? (
            <Sources market={market} franchise={activeFranchise} />
          ) : view === "metrics" ? (
            <MetricLibrary
              market={market}
              scenario={scenario}
              franchise={activeFranchise}
            />
          ) : (
            <>
              {view === "decision" && (
                <>
                  <div className="context-bar">
                    <span className="context-label">INVESTIGATE</span>
                    <label>
                      <span className="sr-only">Select home game</span>
                      <select
                        aria-label="Select home game"
                        value={game.game_id}
                        onChange={(e) =>
                          setGame(
                            games.find((g) => g.game_id === e.target.value)!,
                          )
                        }
                      >
                        {(franchiseGames.some((g) => g.game_id === game.game_id)
                          ? franchiseGames
                          : [game, ...franchiseGames]
                        ).map((g) => (
                          <option key={g.game_id} value={g.game_id}>
                            {g.franchise} vs. {g.opponent} ·{" "}
                            {gameDate(g.starts_at)}
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={14} />
                    </label>
                    <span className="context-separator" />
                    <label>
                      <MapPin size={14} />
                      <span className="sr-only">Select candidate market</span>
                      <select
                        aria-label="Select candidate market"
                        value={market.market_id}
                        onChange={(e) =>
                          setMarket(
                            intelligence.markets.find(
                              (m) => m.market_id === e.target.value,
                            )!,
                          )
                        }
                      >
                        {intelligence.markets.map((m) => (
                          <option key={m.market_id} value={m.market_id}>
                            {m.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={14} />
                    </label>
                    <span className="tag snapshot-tag">
                      Schedule checked {gameDate(game.retrieved_at)}
                    </span>
                  </div>
                  <section
                    className="decision-hero"
                    aria-labelledby="recommendation-title"
                  >
                    <div className="hero-main">
                      <Image
                        unoptimized
                        width={300}
                        height={300}
                        className="hero-team-mark"
                        src={`/brand/${activeFranchise.toLowerCase()}.svg`}
                        alt=""
                        aria-hidden="true"
                      />
                      <div className="hero-topline">
                        <span className="hero-kicker">
                          <Target size={14} />
                          CAMPAIGN DECISION
                        </span>
                        <span className="hero-status">
                          {result.status === "positive"
                            ? "CONDITIONAL TEST"
                            : result.status === "inactive"
                              ? "NO MEDIA SPEND"
                              : "REVISE BEFORE LAUNCH"}
                        </span>
                      </div>
                      <h2 id="recommendation-title">
                        {result.status === "positive" ? (
                          <>
                            Test {market.short_name}.
                            <br />
                            Earn the right to scale.
                          </>
                        ) : result.status === "inactive" ? (
                          <>
                            Keep the no-campaign
                            <br />
                            alternative on the table.
                          </>
                        ) : (
                          <>
                            The current economics
                            <br />
                            don’t clear the bar.
                          </>
                        )}
                      </h2>
                      <p>
                        Evaluate a bounded <strong>{market.short_name}</strong>{" "}
                        ticket campaign for{" "}
                        <strong>
                          {game.franchise} vs. {game.opponent}
                        </strong>
                        .{" "}
                        {result.status === "positive"
                          ? "The scenario clears break-even; validate the assumptions before committing."
                          : "Revise the assumptions or retain the no-campaign alternative."}
                      </p>
                      <div className="hero-footer">
                        <span>
                          <span className="team-dot" />
                          {gameDate(game.starts_at)} ·{" "}
                          {gameTime(game.starts_at)}
                        </span>
                        <span>{game.venue}</span>
                      </div>
                    </div>
                    <div className="hero-economics">
                      <span className="hero-metric-label">
                        CONDITIONAL NET CONTRIBUTION
                      </span>
                      <strong className="hero-value">
                        {money(result.netContribution)}
                      </strong>
                      <span className="hero-metric-note">
                        after {money(result.totalCosts)} in campaign costs
                      </span>
                      <div className="hero-rule" />
                      <div className="reversal-preview">
                        <span>WHAT CHANGES THE DECISION?</span>
                        <p>
                          {threshold === null ? (
                            "No finite break-even threshold at these inputs."
                          ) : threshold > 1 ? (
                            <>
                              Even <strong>100%</strong> incrementality cannot
                              break even.
                            </>
                          ) : (
                            <>
                              Below <strong>{percent(threshold)}</strong>{" "}
                              incrementality, this campaign loses money.
                            </>
                          )}
                        </p>
                      </div>
                      <a href="#scenario-lab">
                        Challenge the assumptions <ArrowRight size={16} />
                      </a>
                    </div>
                  </section>
                  <div
                    className="decision-kpis"
                    aria-label="Campaign decision metrics"
                  >
                    {[
                      [
                        "Incremental tickets",
                        result.incrementalTickets.toFixed(1),
                        "Modeled average · not tickets sold",
                      ],
                      [
                        "Break-even incremental orders",
                        result.breakEvenOrders === null
                          ? "—"
                          : result.breakEvenOrders.toFixed(1),
                        "Total campaign cost ÷ contribution per order",
                      ],
                      [
                        "Maximum acquisition cost",
                        result.maxCostPerOrder === null
                          ? "—"
                          : money(result.maxCostPerOrder, 2),
                        "Per attributed order at break-even",
                      ],
                      [
                        "Incrementality headroom",
                        result.marginOfSafety === null
                          ? "—"
                          : signed(result.marginOfSafety * 100, " pp"),
                        "Assumed share minus reversal threshold",
                      ],
                    ].map(([label, value, note]) => (
                      <article key={label}>
                        <span>
                          {label}
                          <Tag kind="Derived" />
                        </span>
                        <strong>{value}</strong>
                        <small>{note}</small>
                      </article>
                    ))}
                  </div>
                  <div className="evidence-strip">
                    <ShieldCheck size={16} />
                    <span>
                      <strong>Evidence boundary</strong> · Regional facts are
                      observed. Campaign economics are assumed. Inventory and
                      conversion must be supplied before launch.
                    </span>
                    <button onClick={() => selectView("evidence")}>
                      Inspect sources
                      <ArrowUpRight size={14} />
                    </button>
                  </div>
                </>
              )}
              {view === "decision" && (
                <LiveContext
                  onSelect={selectGame}
                  onRefresh={receiveSchedule}
                />
              )}
              <div className="landscape-grid">
                <section className="panel map-panel">
                  <div className="panel-heading">
                    <div>
                      <span className="eyebrow">01 / WHERE TO INVESTIGATE</span>
                      <h2>The Gulf Coast landscape</h2>
                    </div>
                    <Tag kind="Observed" />
                  </div>
                  <MarketMap selected={market} onSelect={setMarket} />
                </section>
                <section className="panel market-detail">
                  <div className="market-detail-heading">
                    <span className="eyebrow">SELECTED MARKET</span>
                    <MapPin size={18} />
                  </div>
                  <h2>{market.name}</h2>
                  <p className="muted">
                    {market.state} · County-level evidence
                  </p>
                  <div className="market-stat">
                    <span>
                      Residents <Tag kind="Observed" />
                    </span>
                    <strong>{integer(market.population)}</strong>
                    <small>July 2025 population estimate</small>
                  </div>
                  <div className="market-stat-row">
                    <div>
                      <span>Population change</span>
                      <strong
                        className={
                          market.population_change_pct >= 0
                            ? "positive-text"
                            : "negative-text"
                        }
                      >
                        {signed(market.population_change_pct, "%")}
                      </strong>
                      <small>2020 base → July 2025</small>
                    </div>
                    <div>
                      <span>Median household income</span>
                      <strong>{money(market.median_income)}</strong>
                      <small>2020–2024 · 2024 dollars</small>
                    </div>
                  </div>
                  <div className="market-observation">
                    <span className="tiny-label">
                      READ THE SIGNAL CORRECTLY
                    </span>
                    <p>
                      {market.market_id === "22071" ? (
                        "Orleans is the local reference. Its demographics describe residents, not existing buyers or campaign reach."
                      ) : (
                        <>
                          Income is{" "}
                          <strong>
                            {Math.abs(
                              market.income_difference_vs_orleans_pct,
                            ).toFixed(1)}
                            %{" "}
                            {market.income_difference_vs_orleans_pct >= 0
                              ? "above"
                              : "below"}
                          </strong>{" "}
                          Orleans. That describes market context; it does not
                          establish purchase intent or an acquisition advantage.
                        </>
                      )}
                    </p>
                  </div>
                  <a
                    href={market.source_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-link"
                  >
                    Census QuickFacts <ExternalLink size={13} />
                  </a>
                </section>
              </div>
              {view === "markets" && (
                <section className="panel comparison-table">
                  <div className="panel-heading">
                    <div>
                      <span className="eyebrow">COMPARE THE CONTEXT</span>
                      <h2>Six markets. No invented opportunity score.</h2>
                    </div>
                    <label className="sort-control">
                      Sort by{" "}
                      <select
                        value={tableSort}
                        onChange={(e) =>
                          setTableSort(e.target.value as typeof tableSort)
                        }
                      >
                        <option value="population_change_pct">
                          Population change
                        </option>
                        <option value="population">Population</option>
                        <option value="median_income">Median income</option>
                      </select>
                    </label>
                  </div>
                  <div className="table-scroll">
                    <table>
                      <thead>
                        <tr>
                          <th>Market</th>
                          <th>Population</th>
                          <th>Change</th>
                          <th>Households</th>
                          <th>Median income</th>
                          <th>Source</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...intelligence.markets]
                          .sort((a, b) => b[tableSort] - a[tableSort])
                          .map((m) => (
                            <tr
                              key={m.market_id}
                              className={
                                m.market_id === market.market_id
                                  ? "selected-row"
                                  : ""
                              }
                            >
                              <td>
                                <button onClick={() => setMarket(m)}>
                                  {m.name}
                                  <span>
                                    {m.state} · {m.market_id}
                                  </span>
                                </button>
                              </td>
                              <td>{integer(m.population)}</td>
                              <td>{signed(m.population_change_pct, "%")}</td>
                              <td>{integer(m.households)}</td>
                              <td>{money(m.median_income)}</td>
                              <td>
                                <a
                                  href={m.source_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  aria-label={`Census source for ${m.name}`}
                                >
                                  <ExternalLink size={14} />
                                </a>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="muted table-footnote">
                    Population: July 2025. Households and income: ACS 2020–2024.
                    County figures are not equivalent to metro-area audiences.
                  </p>
                </section>
              )}
              {view === "decision" && (
                <>
                  <section id="scenario-lab" className="scenario-section">
                    <div className="section-heading">
                      <div>
                        <span className="eyebrow">
                          02 / UNDER WHAT CONDITIONS
                        </span>
                        <h2>The assumption is the decision.</h2>
                        <p>
                          Move an input. Watch the recommendation and reversal
                          point change together.
                        </p>
                      </div>
                      <button
                        className="button button-quiet"
                        onClick={() => {
                          setScenario({ ...DEFAULT_SCENARIO });
                          setNotice("Reference scenario restored.");
                        }}
                      >
                        <RotateCcw size={14} />
                        Reset scenario
                      </button>
                    </div>
                    <div className="scenario-grid">
                      <div className="panel assumptions-panel">
                        <div className="panel-heading">
                          <h3>
                            <SlidersHorizontal size={17} />
                            Campaign assumptions
                          </h3>
                          <Tag kind="Assumed" />
                        </div>
                        <div className="assumption-fields">
                          {ASSUMPTIONS.map((a) => (
                            <div className="assumption-field" key={a.key}>
                              <div className="assumption-label">
                                <label htmlFor={`input-${a.key}`}>
                                  {a.label}
                                </label>
                                <output htmlFor={`input-${a.key}`}>
                                  {a.key === "incrementality"
                                    ? percent(scenario[a.key], 0)
                                    : a.unit.startsWith("USD")
                                      ? money(scenario[a.key])
                                      : scenario[a.key].toFixed(1)}
                                </output>
                              </div>
                              <input
                                id={`input-${a.key}`}
                                type="range"
                                min={a.min}
                                max={a.max}
                                step={a.step}
                                value={scenario[a.key]}
                                onChange={(e) =>
                                  setScenario((s) => ({
                                    ...s,
                                    [a.key]: Number(e.target.value),
                                  }))
                                }
                                aria-describedby={`hint-${a.key}`}
                              />
                              <p id={`hint-${a.key}`}>{a.rationale}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="panel reversal-panel">
                        <div className="panel-heading">
                          <div>
                            <span className="eyebrow">
                              DECISION REVERSAL TEST
                            </span>
                            <h3>Know where the case breaks.</h3>
                          </div>
                          <Tag kind="Derived" />
                        </div>
                        <div className="reversal-numbers">
                          <div>
                            <span>Assumed incremental share</span>
                            <strong>{percent(scenario.incrementality)}</strong>
                          </div>
                          <ArrowRight size={18} />
                          <div>
                            <span>Break-even share</span>
                            <strong>
                              {threshold === null
                                ? "Unavailable"
                                : percent(threshold)}
                            </strong>
                          </div>
                          <div className="safety-metric">
                            <span>Headroom</span>
                            <strong>
                              {result.marginOfSafety === null
                                ? "—"
                                : signed(result.marginOfSafety * 100, " pp")}
                            </strong>
                          </div>
                        </div>
                        <ReversalChart scenario={scenario} />
                        <div
                          className={`reversal-callout ${result.status === "positive" ? "positive" : "negative"}`}
                        >
                          <CircleHelp size={18} />
                          <p>
                            {threshold === null ? (
                              "This scenario has no finite incrementality reversal point. Zero activity or contribution cannot support the campaign."
                            ) : threshold > 1 ? (
                              `The calculated threshold is ${percent(threshold)}. No feasible incremental share clears break-even under these assumptions.`
                            ) : (
                              <>
                                At <strong>{percent(threshold)}</strong>, the
                                campaign breaks even. Below it, contribution is
                                negative. Current scenario:{" "}
                                <strong>{money(result.netContribution)}</strong>
                                . Other inputs held fixed.
                              </>
                            )}
                          </p>
                        </div>
                        <div className="economics-ledger">
                          <div>
                            <span>Attributed orders</span>
                            <strong>
                              {result.attributedOrders.toFixed(1)}
                            </strong>
                          </div>
                          <div>
                            <span>Incremental orders</span>
                            <strong>
                              {result.incrementalOrders.toFixed(1)}
                            </strong>
                          </div>
                          <div>
                            <span>Contribution before campaign costs</span>
                            <strong>{money(result.grossContribution)}</strong>
                          </div>
                          <div>
                            <span>Campaign costs</span>
                            <strong>−{money(result.totalCosts)}</strong>
                          </div>
                          <div className="ledger-total">
                            <span>Net incremental contribution</span>
                            <strong>{money(result.netContribution)}</strong>
                          </div>
                        </div>
                        <p className="small-note">
                          Scenario output, not a measured return forecast.
                          Fractional orders represent modeled averages. Equality
                          is break-even; display values are rounded.
                        </p>
                      </div>
                    </div>
                  </section>
                  <section className="panel sensitivity-panel">
                    <div className="panel-heading">
                      <div>
                        <span className="eyebrow">
                          03 / WHAT TO LEARN FIRST
                        </span>
                        <h2>Which uncertainty can hurt the most?</h2>
                      </div>
                      <span className="small-note">
                        Exploratory bounds · not confidence intervals
                      </span>
                    </div>
                    <div className="sensitivity-grid">
                      <div className="risk-list">
                        {risks.map((risk, index) => (
                          <div className="risk-row" key={risk.key}>
                            <span className="risk-rank">0{index + 1}</span>
                            <div>
                              <strong>{risk.label}</strong>
                              <span>
                                {risk.key === "incrementality"
                                  ? `${percent(risk.range[0], 0)}–${percent(risk.range[1], 0)}`
                                  : risk.key === "ticketsPerOrder"
                                    ? `${risk.range[0]}–${risk.range[1]} tickets`
                                    : `${money(risk.range[0])}–${money(risk.range[1])}`}{" "}
                                ·{" "}
                                {risk.crossesZero
                                  ? "crosses break-even"
                                  : "no sign reversal in this range"}
                              </span>
                            </div>
                            <div className="risk-bar-track">
                              <div
                                style={{
                                  width: `${Math.max(2, (risk.downside / Math.max(1, risks[0].downside)) * 100)}%`,
                                }}
                              />
                            </div>
                            <strong className="risk-amount">
                              −{money(risk.downside)}
                            </strong>
                          </div>
                        ))}
                      </div>
                      <div className="stress-card">
                        <span className="tiny-label">COMBINED DOWNSIDE</span>
                        <strong>{money(stress.netContribution)}</strong>
                        <p>
                          Lower incrementality, smaller orders and margins, and
                          higher acquisition cost together. Bounds expand to
                          include any more adverse current input.
                        </p>
                        <span>
                          Illustrative stress, not a likelihood estimate.
                        </span>
                      </div>
                    </div>
                    <p className="small-note">
                      Ranked by the adverse swing from the current contribution
                      over declared ranges, one input at a time. Range selection
                      affects the ranking; dependencies are not estimated.
                    </p>
                  </section>
                  <section className="next-step">
                    <div className="next-step-icon">
                      <Target size={23} />
                    </div>
                    <div>
                      <span className="eyebrow">
                        FROM RECOMMENDATION TO MEASUREMENT
                      </span>
                      <h2>Make the next dollar accountable.</h2>
                      <p>
                        Validate primary inventory and margins. Design a
                        holdout. Measure incremental contribution before
                        scaling.
                      </p>
                    </div>
                    <button
                      className="button button-dark"
                      onClick={() => setExperimentOpen(!experimentOpen)}
                      aria-expanded={experimentOpen}
                    >
                      Review the test plan
                      <ArrowRight size={16} />
                    </button>
                  </section>
                  {experimentOpen && (
                    <section className="panel experiment-panel">
                      <div className="panel-heading">
                        <h3>A test that can disprove the case</h3>
                        <button
                          className="icon-button"
                          onClick={() => setExperimentOpen(false)}
                          aria-label="Close test plan"
                        >
                          <X size={18} />
                        </button>
                      </div>
                      <ol>
                        <li>
                          <strong>Confirm feasibility.</strong> Supply available
                          primary inventory, net margins, eligible audience, and
                          baseline purchase rates. Do not use resale listings as
                          team inventory.
                        </li>
                        <li>
                          <strong>Set treatment and holdout.</strong> Randomize
                          eligible audiences within {market.name}, or use
                          matched clusters if audience randomization is not
                          feasible. Account for spillover and existing buyers.
                        </li>
                        <li>
                          <strong>Size the test.</strong> Use baseline
                          conversion and a decision-relevant minimum effect to
                          calculate sample size. This demo has no baseline
                          conversion data.
                        </li>
                        <li>
                          <strong>Measure the right outcome.</strong> Compare
                          incremental contribution after campaign costs with
                          holdout. Attribution alone does not establish
                          incrementality.
                        </li>
                        <li>
                          <strong>Decide.</strong> Scale only when measured
                          economics clear the agreed uncertainty standard.
                          Otherwise stop or revise.
                        </li>
                      </ol>
                    </section>
                  )}
                </>
              )}
            </>
          )}
          <footer className="footer">
            <span>
              <Activity size={15} />
              NOLA PULSE <span className="footer-divider">/</span> Evidence
              before conviction.
            </span>
            <span>
              Independent prototype · No team affiliation or endorsement.
            </span>
          </footer>
        </main>
      </div>
      {notice && (
        <div role="status" className="toast">
          <Check size={17} />
          {notice}
        </div>
      )}
      <section className="print-appendix">
        <h2>Evidence and assumptions</h2>
        <p>
          Research snapshot: {intelligence.snapshot_date}. Model {MODEL_VERSION}
          . {market.name}. {game.franchise} vs. {game.opponent},{" "}
          {gameDate(game.starts_at)}.
        </p>
        <p>
          Market source: {market.source_url}. Population vintage:{" "}
          {market.population_vintage}. Income/households vintage:{" "}
          {market.income_vintage}. Schedule: {game.source_url}, retrieved{" "}
          {game.retrieved_at}.
        </p>
        <p>
          Formula: N = (budget / cost per attributed order) × incremental share
          × tickets per order × net contribution per ticket − budget − fixed
          costs.
        </p>
        {ASSUMPTIONS.map((a) => (
          <p key={a.key}>
            {a.label}: {scenario[a.key]} {a.unit}. Assumed. {a.rationale}
          </p>
        ))}
        <p>
          Incrementality reversal:{" "}
          {threshold === null ? "unavailable" : percent(threshold, 2)}.
          Conditional net contribution: {money(result.netContribution)}.
        </p>
        {intelligence.limitations.map((item) => (
          <p key={item}>{item}</p>
        ))}
        <p>
          Test plan: randomize treatment and holdout within the selected market;
          validate primary inventory and margin, size the test using baseline
          conversion, and measure incremental contribution. No revenue lift is
          claimed before measurement.
        </p>
      </section>
    </div>
  );
}
