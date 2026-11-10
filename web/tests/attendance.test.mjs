import test from "node:test";
import assert from "node:assert/strict";
import attendance from "../data/attendance.json" with { type: "json" };
import { seasonAnalysis, historicalOpponent } from "../lib/attendance.ts";

test("current attendance reconciles to source observations and SQL totals for each franchise", () => {
  for (const [team, year, count, total] of [
    ["Pelicans", 2027, 6, 99016],
    ["Saints", 2026, 4, 280201],
  ]) {
    const result = seasonAnalysis(team, year);
    assert.equal(result.games.length, count);
    assert.equal(result.rollup.total_attendance, total);
    assert.equal(result.rollup.average_attendance, total / count);
    assert.equal(
      result.games.reduce((sum, game) => sum + game.attendance, 0),
      total,
    );
    assert.equal(result.matchedPrior.length, count);
    assert.ok(result.games.every((game) => game.franchise === team));
  }
});

test("comparisons use equal game counts, preserve precision, and never compare a partial season with a full-season total", () => {
  const result = seasonAnalysis("Saints", 2026);
  assert.equal(result.matchedCount, 4);
  assert.equal(result.prior.length, 8);
  const expected =
    result.matchedPrior.reduce((sum, game) => sum + game.attendance, 0) / 4;
  assert.equal(result.priorMean, expected);
  assert.equal(result.change, 280201 / 4 / expected - 1);
  assert.equal(seasonAnalysis("Saints", 2024).change, null);
  assert.throws(() => seasonAnalysis("Saints", 2027));
});

test("every historical row has valid provenance; zero placeholders, Paris and postponed duplicates are absent", () => {
  assert.equal(attendance.games.length, 109);
  assert.equal(
    new Set(attendance.games.map((game) => game.event_id)).size,
    109,
  );
  const sources = new Set(attendance.sources.map((source) => source.id));
  for (const game of attendance.games) {
    assert.ok(game.attendance > 0 && Number.isInteger(game.attendance));
    assert.ok(sources.has(game.source_id));
    assert.ok(game.source_url.startsWith("https://"));
    assert.notEqual(game.venue, "Stade de France");
  }
  const correction = attendance.games.find(
    (game) => game.event_id === "401704635",
  );
  assert.equal(correction.attendance, 18581);
  assert.equal(correction.source_url, "https://www.nba.com/game/0022400069");
  assert.equal(
    seasonAnalysis("Pelicans", 2025).rollup.total_attendance,
    689400,
  );
  assert.equal(attendance.excluded.length, 2);
});

test("opponent history is scoped to its franchise and does not invent a value for absent opponents", () => {
  const found = historicalOpponent("Pelicans", "Nets");
  assert.ok(found.games > 0);
  assert.ok(
    found.observations.every(
      (game) =>
        game.franchise === "Pelicans" && game.opponent === "Brooklyn Nets",
    ),
  );
  assert.equal(historicalOpponent("Saints", "Nets"), null);
});
