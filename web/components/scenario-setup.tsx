"use client";
import { useState } from "react";
import { ASSUMPTIONS, evaluate } from "../lib/scenario";
import type { Scenario } from "../lib/scenario";

export default function ScenarioSetup({
  franchise,
  onRun,
}: {
  franchise: string;
  onRun: (scenario: Scenario) => void;
}) {
  const [error, setError] = useState("");
  return (
    <section className="panel scenario-setup">
      <span className="eyebrow">
        {franchise.toUpperCase()} / CAMPAIGN PLANNING
      </span>
      <h2>Enter your campaign inputs</h2>
      <p>
        Calculate contribution and the break-even threshold for a campaign you
        define.
      </p>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          const scenario = Object.fromEntries(
            ASSUMPTIONS.map((input) => [
              input.key,
              Number(data.get(input.key)),
            ]),
          ) as Scenario;
          try {
            evaluate(scenario);
            onRun(scenario);
          } catch (failure) {
            setError((failure as Error).message);
          }
        }}
      >
        <div className="setup-fields">
          {ASSUMPTIONS.map((input) => (
            <label key={input.key}>
              <span>
                {input.label}{" "}
                <small>
                  {input.key === "incrementality" ? "0–1 share" : input.unit}
                </small>
              </span>
              <input
                name={input.key}
                type="number"
                required
                step="any"
                min={input.key === "costPerOrder" ? 0.01 : 0}
                max={input.key === "incrementality" ? 1 : undefined}
              />
            </label>
          ))}
        </div>
        {error && <p role="alert">{error}</p>}
        <button className="button button-dark" type="submit">
          Calculate scenario
        </button>
      </form>
    </section>
  );
}
