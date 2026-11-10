import {
  normalizePelicansSchedule,
  normalizeSaintsSchedule,
  normalizeScoreboard,
} from "../../../lib/live-normalize";

export const dynamic = "force-dynamic";

type CachedFeed = {
  data: unknown;
  checked_at: string;
  stale: boolean;
  error?: string;
};
const cache = new Map<string, CachedFeed>();
const pending = new Map<string, Promise<CachedFeed>>();

async function load(
  url: string,
  parse: (text: string, checkedAt: string) => unknown,
): Promise<CachedFeed> {
  const previous = cache.get(url);
  if (previous && Date.now() - Date.parse(previous.checked_at) < 30_000)
    return previous;
  const active = pending.get(url);
  if (active) return active;
  const request = (async () => {
    try {
      const response = await fetch(url, {
        headers: { "User-Agent": "NOLA-PULSE/0.1 (public-sports-context)" },
        signal: AbortSignal.timeout(12_000),
      });
      if (!response.ok) throw new Error(`Upstream HTTP ${response.status}`);
      const text = await response.text();
      const checkedAt = new Date().toISOString();
      const result = {
        data: parse(text, checkedAt),
        checked_at: checkedAt,
        stale: false,
      };
      cache.set(url, result);
      return result;
    } catch {
      return {
        data: previous?.data ?? null,
        checked_at: previous?.checked_at ?? "",
        stale: true,
        error:
          "Source refresh unavailable. Any retained observation is explicitly stale.",
      };
    }
  })();
  pending.set(url, request);
  try {
    return await request;
  } finally {
    pending.delete(url);
  }
}

export async function GET() {
  const [pelicansScore, saintsScore, pelicansSchedule, saintsSchedule] =
    await Promise.all([
      load(
        "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard",
        (text) => normalizeScoreboard(JSON.parse(text), "Pelicans"),
      ),
      load(
        "https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard",
        (text) => normalizeScoreboard(JSON.parse(text), "Saints"),
      ),
      load("https://www.nba.com/pelicans/schedule", normalizePelicansSchedule),
      load(
        "https://www.neworleanssaints.com/schedule/",
        normalizeSaintsSchedule,
      ),
    ]);
  return Response.json(
    {
      served_at: new Date().toISOString(),
      refresh_seconds: 60,
      scores: { Pelicans: pelicansScore, Saints: saintsScore },
      schedules: { Pelicans: pelicansSchedule, Saints: saintsSchedule },
      providers: {
        scores: "ESPN public scoreboard; third-party coverage",
        schedules: "Official team websites",
      },
    },
    {
      headers: {
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    },
  );
}
