import attendance from "../data/attendance.json" with { type: "json" };

export type AttendanceGame = (typeof attendance.games)[number];
export type AttendanceFranchise = AttendanceGame["franchise"];
const mean = (games: AttendanceGame[]) =>
  games.reduce((total, game) => total + game.attendance, 0) / games.length;

export function seasonAnalysis(franchise: string, season: number) {
  const games = attendance.games.filter(
    (game) => game.franchise === franchise && game.season === season,
  );
  if (!games.length) throw new Error("No reviewed attendance for this season.");
  const prior = attendance.games.filter(
    (game) => game.franchise === franchise && game.season === season - 1,
  );
  const rollup = attendance.seasons.find(
    (row) => row.franchise === franchise && row.season === season,
  )!;
  const matchedCount = Math.min(games.length, prior.length);
  const matchedCurrent = games.slice(0, matchedCount);
  const matchedPrior = prior.slice(0, matchedCount);
  const currentMean = matchedCount ? mean(matchedCurrent) : null;
  const priorMean = matchedCount ? mean(matchedPrior) : null;
  const change =
    currentMean !== null && priorMean !== null
      ? currentMean / priorMean - 1
      : null;
  const ordered = [...games].sort((a, b) => b.attendance - a.attendance);
  const weekday = (game: AttendanceGame) =>
    new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      timeZone: "America/Chicago",
    }).format(new Date(game.starts_at));
  const weekend = games.filter((game) =>
    ["Sat", "Sun"].includes(weekday(game)),
  );
  const weeknight = games.filter(
    (game) => !["Sat", "Sun"].includes(weekday(game)),
  );
  return {
    games,
    prior,
    rollup,
    matchedCount,
    matchedCurrent,
    matchedPrior,
    currentMean,
    priorMean,
    change,
    highest: ordered[0],
    lowest: ordered[ordered.length - 1],
    spread: ordered[0].attendance - ordered[ordered.length - 1].attendance,
    latest: games[games.length - 1],
    weekend: {
      count: weekend.length,
      mean: weekend.length ? mean(weekend) : null,
    },
    weeknight: {
      count: weeknight.length,
      mean: weeknight.length ? mean(weeknight) : null,
    },
  };
}

export function seasonOptions(franchise: string) {
  return attendance.seasons
    .filter((season) => season.franchise === franchise)
    .sort((a, b) => b.season - a.season);
}

export function historicalOpponent(franchise: string, opponent: string) {
  const matching = attendance.games.filter(
    (game) =>
      game.franchise === franchise &&
      (game.opponent === opponent || game.opponent.endsWith(` ${opponent}`)),
  );
  return matching.length
    ? {
        games: matching.length,
        average: mean(matching),
        observations: matching,
      }
    : null;
}
