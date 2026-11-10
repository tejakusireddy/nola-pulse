"use client";
import { useEffect, useState } from "react";
import { ArrowUpRight, ChevronDown, Radio, RefreshCw } from "lucide-react";
import type { LiveScore, ScheduleGame } from "../lib/live-normalize";
import { gameDate, gameTime } from "../lib/format";

type Feed<T> = {
  data: T | null;
  checked_at: string;
  stale: boolean;
  error?: string;
};
type Context = {
  scores: Record<"Pelicans" | "Saints", Feed<LiveScore>>;
  schedules: Record<"Pelicans" | "Saints", Feed<ScheduleGame[]>>;
  served_at: string;
};
export default function LiveContext({
  onSelect,
  onRefresh,
}: {
  onSelect: (g: ScheduleGame) => void;
  onRefresh: (g: ScheduleGame[]) => void;
}) {
  const [context, setContext] = useState<Context | null>(null);
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [now, setNow] = useState(Date.now());
  async function refresh() {
    setLoading(true);
    try {
      const response = await fetch("/api/live", {
        signal: AbortSignal.timeout(16_000),
      });
      if (!response.ok) throw new Error("Live context unavailable");
      const data = (await response.json()) as Context;
      if (!data.scores || !data.schedules)
        throw new Error("Invalid live context");
      setContext(data);
      setFailed(false);
      const games = Object.values(data.schedules)
        .filter((f) => !f.stale && Array.isArray(f.data))
        .flatMap((f) => f.data || []);
      if (games.length) onRefresh(games);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
      setNow(Date.now());
    }
  }
  useEffect(() => {
    void refresh();
    const timer = setInterval(() => {
      if (!document.hidden) void refresh();
    }, 60_000);
    const clock = setInterval(() => setNow(Date.now()), 15_000);
    return () => {
      clearInterval(timer);
      clearInterval(clock);
    };
  }, []);
  const time = (date: string) =>
    date
      ? new Intl.DateTimeFormat("en-US", {
          timeZone: "America/Chicago",
          hour: "numeric",
          minute: "2-digit",
          second: "2-digit",
          timeZoneName: "short",
        }).format(new Date(date))
      : "not yet verified";
  return (
    <section
      className="live-context"
      aria-label="Current franchise game context"
    >
      <div className="live-context-heading">
        <span>
          <Radio size={13} />
          FRANCHISE GAME CONTEXT
        </span>
        <button onClick={() => void refresh()} disabled={loading}>
          <RefreshCw size={11} className={loading ? "refreshing" : ""} />
          {loading ? "Checking sources" : "Refresh"}
        </button>
      </div>
      <div className="live-cards">
        {(["Pelicans", "Saints"] as const).map((team) => {
          const feed = context?.scores[team],
            score = feed?.data;
          const stale =
            failed ||
            !!feed?.stale ||
            (!!feed?.checked_at && now - Date.parse(feed.checked_at) > 150_000);
          return (
            <article className={`live-card ${team.toLowerCase()}`} key={team}>
              <div className="live-team-heading">
                <strong>New Orleans {team}</strong>
                <span
                  className={
                    score?.state === "in" && !stale ? "live-pill" : "feed-label"
                  }
                >
                  {stale
                    ? "STALE / UNAVAILABLE"
                    : score?.state === "in"
                      ? "IN PROGRESS"
                      : score?.state === "post"
                        ? "LATEST IN FEED"
                        : score
                          ? "SCHEDULED"
                          : loading
                            ? "CHECKING"
                            : "NO GAME IN FEED"}
                </span>
              </div>
              {score ? (
                <>
                  <div className="live-matchup">
                    <span>
                      {score.away.name}
                      <b>{score.away.score ?? "—"}</b>
                    </span>
                    <span className="matchup-at">@</span>
                    <span>
                      {score.home.name}
                      <b>{score.home.score ?? "—"}</b>
                    </span>
                    <span className="live-detail">{score.detail}</span>
                  </div>
                  <div className="live-source">
                    <a href={score.source_url} target="_blank" rel="noreferrer">
                      ESPN game feed
                      <ArrowUpRight size={11} />
                    </a>
                    <span>Checked {time(feed!.checked_at)}</span>
                  </div>
                </>
              ) : (
                <p className="live-unavailable">
                  {stale
                    ? "Source could not be refreshed. Research snapshot remains available below."
                    : loading
                      ? "Retrieving the source’s current observation…"
                      : "The current scoreboard window contains no game for this team."}
                </p>
              )}
            </article>
          );
        })}
      </div>
      <button
        className="schedule-toggle"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
      >
        Official home schedules <ChevronDown size={13} />
        <span>
          Refreshes every 60 seconds while visible · public sources may lag
        </span>
      </button>
      {expanded && (
        <div className="live-schedules">
          {(["Pelicans", "Saints"] as const).map((team) => {
            const feed = context?.schedules[team];
            return (
              <div key={team}>
                <h3>{team} · upcoming New Orleans home games</h3>
                <p>
                  Official team site ·{" "}
                  {feed?.stale ? "stale / unavailable" : "checked"}{" "}
                  {time(feed?.checked_at || "")}
                </p>
                {feed?.data?.length ? (
                  feed.data.map((g) => (
                    <button
                      key={g.game_id}
                      onClick={() => onSelect(g)}
                      disabled={feed.stale || Date.parse(g.starts_at) <= now}
                    >
                      <span>
                        {team} vs. {g.opponent}
                      </span>
                      <span>
                        {gameDate(g.starts_at)} · {gameTime(g.starts_at)}
                      </span>
                      <ArrowUpRight size={13} />
                    </button>
                  ))
                ) : (
                  <p>Schedule unavailable. No games have been invented.</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
