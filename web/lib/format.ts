export const integer = (v: number) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(v);
export const money = (v: number, decimals = 0) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(v);
export const percent = (v: number, decimals = 1) =>
  `${(v * 100).toFixed(decimals)}%`;
export const signed = (v: number, suffix = "") =>
  `${v > 0 ? "+" : ""}${v.toFixed(1)}${suffix}`;
export const gameDate = (date: string, compact = false) =>
  new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    month: "short",
    day: "numeric",
    ...(compact ? {} : { weekday: "short" }),
  }).format(new Date(date));
export const gameTime = (date: string) =>
  new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(new Date(date));
