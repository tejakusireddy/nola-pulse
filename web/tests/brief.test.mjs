import test from "node:test";
import assert from "node:assert/strict";
import intelligence from "../data/intelligence.json" with { type: "json" };
import { createBrief } from "../lib/brief.ts";
import { DEFAULT_SCENARIO, evaluate } from "../lib/scenario.ts";
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
  const saints = {
    ...game,
    franchise: "Saints",
    opponent: "Carolina Panthers",
    source_url: "https://www.neworleanssaints.com/schedule/",
  };
  const brief = createBrief(market, saints, DEFAULT_SCENARIO);
  assert.ok(brief.title.startsWith("Saints vs. Carolina Panthers"));
  assert.equal(brief.game.source_url, saints.source_url);
});
