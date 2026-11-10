"use client";

import { useRef, useState } from "react";
import { ArrowUpRight, Crosshair, Minus, Plus } from "lucide-react";
import geography from "../data/geography.json";
import intelligence from "../data/intelligence.json";
import type { Market } from "../lib/brief";
import { integer, money, signed } from "../lib/format";

type Layer = "footprint" | "growth" | "income";
const POSITIONS: Record<string, [number, number]> = {
  "22071": [498, 478.5],
  "22051": [483.6, 472.7],
  "22103": [507, 406],
  "22033": [358.8, 406],
  "28047": [626.6, 413.3],
  "01097": [761.8, 371.2],
};
const INITIAL = { x: 255, y: 235, width: 620, height: 365 };
const LAYERS = {
  footprint: "Market footprint",
  growth: "Population change",
  income: "Household income",
};

export default function RegionalMap({
  selected,
  onSelect,
}: {
  selected: Market;
  onSelect: (market: Market) => void;
}) {
  const [layer, setLayer] = useState<Layer>("growth");
  const [viewport, setViewport] = useState(INITIAL);
  const [hover, setHover] = useState<string | null>(null);
  const drag = useRef<{ x: number; y: number; origin: typeof INITIAL } | null>(
    null,
  );
  const values = intelligence.markets.map((m) =>
    layer === "income" ? m.median_income : m.population_change_pct,
  );
  const low = Math.min(...values),
    high = Math.max(...values);
  const value = (m: Market) =>
    layer === "income"
      ? money(m.median_income)
      : layer === "growth"
        ? signed(m.population_change_pct, "%")
        : integer(m.population) + " residents";
  const opacity = (m: Market) =>
    layer === "footprint"
      ? 0.15
      : 0.1 +
        (0.5 *
          ((layer === "income" ? m.median_income : m.population_change_pct) -
            low)) /
          (high - low || 1);
  const zoom = (factor: number) =>
    setViewport((v) => {
      const width = Math.min(
        INITIAL.width * 1.4,
        Math.max(INITIAL.width / 3, v.width * factor),
      );
      const height = (width * INITIAL.height) / INITIAL.width;
      return {
        x: v.x + (v.width - width) / 2,
        y: v.y + (v.height - height) / 2,
        width,
        height,
      };
    });
  const active =
    intelligence.markets.find((m) => m.market_id === hover) ?? selected;
  return (
    <section className="regional-explorer" aria-labelledby="regional-map-title">
      <header className="explorer-heading">
        <div>
          <span className="eyebrow">MARKET INTELLIGENCE / GULF COAST</span>
          <h2 id="regional-map-title">Where the next opportunity begins.</h2>
        </div>
        <span className="tag tag-observed">Census evidence</span>
      </header>
      <div
        className="map-layer-control"
        role="group"
        aria-label="Map data layer"
      >
        {(Object.keys(LAYERS) as Layer[]).map((key) => (
          <button
            key={key}
            aria-pressed={layer === key}
            onClick={() => setLayer(key)}
          >
            {LAYERS[key]}
          </button>
        ))}
      </div>
      <div className="regional-map-canvas">
        <svg
          viewBox={`${viewport.x} ${viewport.y} ${viewport.width} ${viewport.height}`}
          role="group"
          aria-label={`Gulf Coast map. Layer: ${LAYERS[layer]}. Select a county or a labeled city to inspect its evidence. Drag the background to pan.`}
          onPointerDown={(e) => {
            if ((e.target as Element).closest("[data-market]")) return;
            e.currentTarget.setPointerCapture(e.pointerId);
            drag.current = { x: e.clientX, y: e.clientY, origin: viewport };
          }}
          onPointerMove={(e) => {
            if (!drag.current) return;
            const d = drag.current,
              rect = e.currentTarget.getBoundingClientRect();
            const scale = Math.max(
              d.origin.width / rect.width,
              d.origin.height / rect.height,
            );
            setViewport({
              ...d.origin,
              x: d.origin.x - (e.clientX - d.x) * scale,
              y: d.origin.y - (e.clientY - d.y) * scale,
            });
          }}
          onPointerUp={() => {
            drag.current = null;
          }}
          onPointerCancel={() => {
            drag.current = null;
          }}
        >
          <defs>
            <pattern
              id="regional-grid"
              width="18"
              height="18"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="1" cy="1" r=".4" fill="var(--map-dot)" />
            </pattern>
          </defs>
          <rect
            x="-500"
            y="-500"
            width="2500"
            height="2000"
            fill="url(#regional-grid)"
          />
          {geography.states.map((s) => (
            <path key={s.id} d={s.path} className="region-state" />
          ))}
          <text x="330" y="320" className="region-state-label">
            LOUISIANA
          </text>
          <text x="600" y="300" className="region-state-label">
            MISSISSIPPI
          </text>
          <text x="790" y="280" className="region-state-label">
            ALABAMA
          </text>
          <text x="705" y="560" className="region-water-label">
            GULF OF MEXICO
          </text>
          {geography.counties.map((c) => {
            const m = intelligence.markets.find((m) => m.market_id === c.id)!;
            return (
              <path
                key={c.id}
                d={c.path}
                data-market={c.id}
                className={`region-county ${selected.market_id === c.id ? "selected" : ""}`}
                style={{ fillOpacity: opacity(m) }}
                onClick={() => onSelect(m)}
                onPointerEnter={() => setHover(c.id)}
                onPointerLeave={() => setHover(null)}
              >
                <title>{`${m.name}: ${value(m)}. ${LAYERS[layer]}.`}</title>
              </path>
            );
          })}
          {intelligence.markets.map((m) => {
            const [x, y] = POSITIONS[m.market_id],
              selectedPoint = m.market_id === selected.market_id;
            const labelX = m.market_id === "22051" ? x - 88 : x + 12;
            const labelY = m.market_id === "22071" ? y + 28 : y - 10;
            return (
              <g
                key={m.market_id}
                data-market={m.market_id}
                role="button"
                tabIndex={0}
                aria-label={`Inspect ${m.name}: ${value(m)}`}
                aria-pressed={selectedPoint}
                className="region-point"
                onClick={() => onSelect(m)}
                onFocus={() => setHover(m.market_id)}
                onBlur={() => setHover(null)}
                onPointerEnter={() => setHover(m.market_id)}
                onPointerLeave={() => setHover(null)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelect(m);
                  }
                }}
              >
                <circle
                  cx={x}
                  cy={y}
                  r={selectedPoint ? 11 : 7}
                  className="region-point-ring"
                />
                <circle
                  cx={x}
                  cy={y}
                  r={selectedPoint ? 3.5 : 2.5}
                  className="region-point-core"
                />
                <text x={labelX} y={labelY} className="region-city-name">
                  {m.short_name}
                </text>
              </g>
            );
          })}
        </svg>
        <div
          className="map-zoom-control"
          role="group"
          aria-label="Map controls"
        >
          <button aria-label="Zoom in on map" onClick={() => zoom(0.8)}>
            <Plus size={17} />
          </button>
          <button aria-label="Zoom out on map" onClick={() => zoom(1.25)}>
            <Minus size={17} />
          </button>
          <button
            aria-label="Reset map view"
            onClick={() => setViewport(INITIAL)}
          >
            <Crosshair size={17} />
          </button>
        </div>
        <div className="map-readout" aria-live="polite">
          <span>{hover ? "INSPECTING" : "SELECTED MARKET"}</span>
          <strong>{active.name}</strong>
          <p>
            {value(active)}{" "}
            <span>
              · {layer === "footprint" ? "July 2025 population" : LAYERS[layer]}
            </span>
          </p>
        </div>
        <div className="map-scale-legend">
          <span>
            {layer === "footprint"
              ? "Candidate counties"
              : layer === "income"
                ? "Median household income"
                : "2020 base → July 2025"}
          </span>
          {layer !== "footprint" && (
            <>
              <i />
              <div>
                <span>
                  {layer === "income" ? money(low) : signed(low, "%")}
                </span>
                <span>
                  {layer === "income" ? money(high) : signed(high, "%")}
                </span>
              </div>
            </>
          )}
        </div>
      </div>
      <div
        className="market-selector-strip"
        role="group"
        aria-label="Select candidate market"
      >
        {intelligence.markets.map((m) => (
          <button
            key={m.market_id}
            aria-pressed={selected.market_id === m.market_id}
            onClick={() => onSelect(m)}
          >
            <span />
            {m.short_name}
          </button>
        ))}
      </div>
      <div className="selected-market-evidence">
        <div>
          <span>SELECTED MARKET</span>
          <h3>{selected.name}</h3>
          <a href={selected.source_url} target="_blank" rel="noreferrer">
            Census QuickFacts <ArrowUpRight size={12} />
          </a>
        </div>
        <div>
          <span>Residents · Jul 2025</span>
          <strong>{integer(selected.population)}</strong>
        </div>
        <div>
          <span>Population change</span>
          <strong>{signed(selected.population_change_pct, "%")}</strong>
        </div>
        <div>
          <span>Household income</span>
          <strong>{money(selected.median_income)}</strong>
          <small>ACS 2020–24 · 2024 dollars</small>
        </div>
      </div>
      <p className="regional-map-note">
        County boundaries show geography, not fan catchments. City anchors are
        approximate. Shading describes the selected Census measure; it does not
        estimate demand, sales, or campaign return.
      </p>
    </section>
  );
}
