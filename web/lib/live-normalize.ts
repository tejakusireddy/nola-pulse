export type LiveScore = {
  id: string;
  franchise: "Pelicans" | "Saints";
  state: "pre" | "in" | "post";
  detail: string;
  starts_at: string;
  home: { name: string; score: number | null };
  away: { name: string; score: number | null };
  venue: string;
  source_url: string;
};
export type ScheduleGame = {
  game_id: string;
  franchise: string;
  opponent: string;
  starts_at: string;
  venue: string;
  source_url: string;
  retrieved_at: string;
};

type EspnEvent = {
  id: string;
  date: string;
  links?: { href: string }[];
  status: { type: { state: string; shortDetail?: string; detail?: string } };
  competitions: {
    venue?: { fullName: string };
    competitors: {
      homeAway: string;
      team: { name: string; id: string };
      score?: string;
    }[];
  }[];
};

export function normalizeScoreboard(
  payload: unknown,
  franchise: "Pelicans" | "Saints",
): LiveScore | null {
  if (
    !payload ||
    typeof payload !== "object" ||
    !Array.isArray((payload as { events?: unknown }).events)
  ) {
    throw new Error("Scoreboard payload is missing events");
  }
  const teamId = franchise === "Pelicans" ? "3" : "18";
  const events = (payload as { events: EspnEvent[] }).events;
  const matches = events.filter((e) =>
    e.competitions?.[0]?.competitors?.some((c) => c.team?.id === teamId),
  );
  const event =
    matches.find((e) => e.status?.type?.state === "in") ||
    matches[matches.length - 1];
  if (!event) return null;
  const competition = event.competitions[0];
  const home = competition.competitors.find((c) => c.homeAway === "home");
  const away = competition.competitors.find((c) => c.homeAway === "away");
  const state = event.status?.type?.state;
  if (
    !home ||
    !away ||
    !["pre", "in", "post"].includes(state) ||
    !Number.isFinite(Date.parse(event.date))
  ) {
    throw new Error("Scoreboard event failed validation");
  }
  const score = (v: string | undefined) =>
    v === undefined || v.trim() === "" || !Number.isFinite(Number(v))
      ? null
      : Number(v);
  return {
    id: event.id,
    franchise,
    state: state as LiveScore["state"],
    detail: event.status.type.shortDetail || event.status.type.detail || state,
    starts_at: event.date,
    home: {
      name: home.team.name,
      score: state === "pre" ? null : score(home.score),
    },
    away: {
      name: away.team.name,
      score: state === "pre" ? null : score(away.score),
    },
    venue: competition.venue?.fullName || "Venue not supplied",
    source_url: `https://www.espn.com/${franchise === "Pelicans" ? "nba" : "nfl"}/game/_/gameId/${event.id}`,
  };
}

export function normalizePelicansSchedule(
  html: string,
  retrievedAt: string,
): ScheduleGame[] {
  const match = html.match(
    /<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/,
  );
  if (!match) throw new Error("Official NBA schedule structure changed");
  const raw = JSON.parse(match[1]).props.pageProps.scheduleData;
  const games = Array.isArray(raw) ? raw : raw?.schedule;
  if (!Array.isArray(games))
    throw new Error("Official NBA schedule is missing games");
  return games
    .filter(
      (g) =>
        g.homeTeam?.teamId === 1610612740 &&
        g.arenaCity === "New Orleans" &&
        String(g.gameId).startsWith("002") &&
        g.gameStatus === 1 &&
        Date.parse(g.gameDateUTC) > Date.parse(retrievedAt),
    )
    .map((g) => ({
      game_id: String(g.gameId),
      franchise: "Pelicans",
      opponent: g.awayTeam.teamName,
      starts_at: g.gameDateUTC,
      venue: g.arenaName,
      source_url: "https://www.nba.com/pelicans/schedule",
      retrieved_at: retrievedAt,
    }));
}

export function normalizeSaintsSchedule(
  html: string,
  retrievedAt: string,
): ScheduleGame[] {
  const games: ScheduleGame[] = [];
  for (const match of html.matchAll(
    /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g,
  )) {
    const event = JSON.parse(match[1]);
    if (
      event["@type"] !== "SportsEvent" ||
      event.homeTeam?.name !== "New Orleans Saints" ||
      event.location?.address?.addressLocality !== "New Orleans"
    )
      continue;
    const rawDate = event.startDate;
    if (typeof rawDate !== "string") continue;
    const startsAt = /(?:Z|[+-]\d{2}:?\d{2})$/.test(rawDate)
      ? rawDate
      : `${rawDate}Z`;
    if (
      !Number.isFinite(Date.parse(startsAt)) ||
      Date.parse(startsAt) <= Date.parse(retrievedAt)
    )
      continue;
    games.push({
      game_id: event["@id"]?.split("#")[1] || event.url,
      franchise: "Saints",
      opponent: event.awayTeam?.name || "TBD",
      starts_at: startsAt,
      venue: event.location.name,
      source_url: event.url || "https://www.neworleanssaints.com/schedule/",
      retrieved_at: retrievedAt,
    });
  }
  if (!html.includes('"SportsEvent"'))
    throw new Error("Official Saints schedule structure changed");
  return games;
}
