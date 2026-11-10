import test from "node:test";
import assert from "node:assert/strict";
import {
  normalizeScoreboard,
  normalizePelicansSchedule,
  normalizeSaintsSchedule,
} from "../lib/live-normalize.ts";

const event = (state = "in") => ({
  id: "123",
  date: "2026-11-10T03:00:00Z",
  status: { type: { state, shortDetail: "Halftime" } },
  competitions: [
    {
      venue: { fullName: "Chase Center" },
      competitors: [
        { homeAway: "home", team: { id: "9", name: "Warriors" }, score: "72" },
        { homeAway: "away", team: { id: "3", name: "Pelicans" }, score: "43" },
      ],
    },
  ],
});

test("scoreboard preserves source scores and separates scheduled placeholders from actual zero", () => {
  const score = normalizeScoreboard({ events: [event()] }, "Pelicans");
  assert.equal(score.home.score, 72);
  assert.equal(score.away.score, 43);
  assert.equal(score.state, "in");
  assert.equal(
    normalizeScoreboard({ events: [event("pre")] }, "Pelicans").home.score,
    null,
  );
  const zero = event();
  zero.competitions[0].competitors[0].score = "0";
  assert.equal(
    normalizeScoreboard({ events: [zero] }, "Pelicans").home.score,
    0,
  );
});

test("missing scores are not fabricated and unrelated teams are excluded", () => {
  const missing = event();
  delete missing.competitions[0].competitors[0].score;
  assert.equal(
    normalizeScoreboard({ events: [missing] }, "Pelicans").home.score,
    null,
  );
  assert.equal(normalizeScoreboard({ events: [event()] }, "Saints"), null);
  assert.throws(() => normalizeScoreboard({}, "Pelicans"));
});

test("official Pelicans schedule excludes away, past, summer, and international home games", () => {
  const g = {
    gameId: "0022600001",
    homeTeam: { teamId: 1610612740 },
    awayTeam: { teamName: "Nuggets" },
    arenaCity: "New Orleans",
    arenaName: "Smoothie King Center",
    gameStatus: 1,
    gameDateUTC: "2026-11-15T00:00:00Z",
  };
  const games = [
    g,
    { ...g, gameId: "1522600001" },
    { ...g, arenaCity: "Paris" },
    { ...g, gameStatus: 3 },
  ];
  const html = `<script id="__NEXT_DATA__">${JSON.stringify({ props: { pageProps: { scheduleData: { schedule: games } } } })}</script>`;
  const result = normalizePelicansSchedule(html, "2026-11-10T00:00:00Z");
  assert.equal(result.length, 1);
  assert.equal(result[0].opponent, "Nuggets");
  assert.throws(() =>
    normalizePelicansSchedule("<html/>", "2026-11-10T00:00:00Z"),
  );
});

test("Saints JSON-LD uses official event metadata and filters to future New Orleans home games", () => {
  const g = {
    "@type": "SportsEvent",
    "@id": "https://www.neworleanssaints.com/schedule/#test",
    startDate: "2026-11-15T18:00:00",
    homeTeam: { name: "New Orleans Saints" },
    awayTeam: { name: "Carolina Panthers" },
    location: {
      name: "Caesars Superdome",
      address: { addressLocality: "New Orleans" },
    },
  };
  const html = `<script type="application/ld+json">${JSON.stringify(g)}</script>`;
  const games = normalizeSaintsSchedule(html, "2026-11-10T00:00:00Z");
  assert.equal(games.length, 1);
  assert.equal(games[0].starts_at, "2026-11-15T18:00:00Z");
  assert.equal(normalizeSaintsSchedule(html, "2026-11-16T00:00:00Z").length, 0);
});
