import test from "node:test";
import assert from "node:assert/strict";
import intelligence from "../data/intelligence.json" with { type: "json" };
import { createBrief } from "../lib/brief.ts";
import { DEFAULT_SCENARIO, evaluate } from "../lib/scenario.ts";
import saintsSchedule from "../data/saints-schedule.json" with { type: "json" };
const market = intelligence.markets.find((m) => m.market_id === "22103");
const game = intelligence.games[0];

test("export preserves model parity, source references, and the exact reversal threshold", () => {
  const brief = createBrief(market, game, DEFAULT_SCENARIO);
  assert.equal(
    brief.derived.netContribution,
    evaluate(DEFAULT_SCENARIO).netContribution,
  );
  assert.equal(brief.reversal.incrementality_threshold, 0.525);
  assert.equal(brief.inputs.length, 6);
  assert.ok(
    brief.inputs.every(
      (i) =>
        i.kind === "Assumed" &&
        i.unit &&
        i.rationale &&
        brief.evidence.some((s) => s.id === i.source_id),
    ),
  );
  assert.equal(brief.market.source_url, market.source_url);
  assert.equal(brief.game.retrieved_at, game.retrieved_at);
  assert.ok(brief.limitations.length);
});

test("a recommendation cannot be exported with missing market or game provenance", () => {
  for (const patch of [
    { source_url: "" },
    { reviewed_on: "" },
    { median_income: NaN },
    { population: 0 },
  ]) {
    assert.throws(() =>
      createBrief({ ...market, ...patch }, game, DEFAULT_SCENARIO),
    );
  }
  assert.throws(() =>
    createBrief(market, { ...game, retrieved_at: "" }, DEFAULT_SCENARIO),
  );
});

test("Saints source and identity survive export without inheriting a Pelicans label", () => {
  const saints = saintsSchedule[0];
  const brief = createBrief(market, saints, DEFAULT_SCENARIO);
  assert.ok(brief.title.startsWith("Saints vs. Carolina Panthers"));
  assert.equal(brief.game.source_url, saints.source_url);
  assert.equal(brief.game.venue, saints.venue);
  assert.equal(brief.game.starts_at, saints.starts_at);
});

test("pinned comparisons preserve assumptions and exact scenario deltas in the exported brief", () => {
  const pinned = { ...DEFAULT_SCENARIO };
  const current = { ...pinned, incrementality: 0.4 };
  const brief = createBrief(market, game, current, pinned);
  assert.equal(brief.comparison.kind, "Assumed");
  assert.equal(brief.comparison.derived.netContribution, 1500);
  assert.equal(brief.comparison.delta.net_contribution, -3000);
  assert.equal(brief.comparison.delta.incremental_tickets, -93.75);
  assert.equal(brief.comparison.delta.incrementality_threshold, 0);
  pinned.budget = 0;
  assert.equal(
    brief.comparison.inputs.find((i) => i.key === "budget").value,
    6000,
  );
  assert.throws(() =>
    createBrief(market, game, current, { ...current, incrementality: 2 }),
  );
});

test("public observations retain franchise, measurement definition, date, and source without replacing assumed economics", () => {
  const pelicans = createBrief(market, game, DEFAULT_SCENARIO);
  const saints = createBrief(market, saintsSchedule[0], DEFAULT_SCENARIO);
  assert.equal(pelicans.public_team_observation.value, 17767);
  assert.equal(saints.public_team_observation.value, 70182);
  assert.equal(pelicans.public_team_observation.label, "Reported attendance");
  assert.equal(
    saints.public_team_observation.label,
    "Reported paid attendance",
  );
  assert.equal(saints.public_team_observation.game_date, "2026-11-08");
  assert.match(saints.public_team_observation.source_url, /#page=2$/);
  for (const brief of [pelicans, saints]) {
    assert.equal(brief.derived.netContribution, 1500);
    assert.ok(brief.public_team_observation.reviewed_on);
    assert.ok(brief.public_team_observation.transformation);
    assert.ok(brief.inputs.every((input) => input.kind === "Assumed"));
    assert.match(brief.scenario_disclosure, /not estimated from attendance/);
  }
});
