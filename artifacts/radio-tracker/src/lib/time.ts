export const TZ = "Asia/Bangkok";

/** Get Bangkok date/time parts from a JS Date */
export function bangkokParts(date: Date = new Date()) {
  const fmt = (opts: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat("en-US", { timeZone: TZ, ...opts }).formatToParts(date);

  const dt = fmt({
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hour12: false,
  });
  const get = (type: string) => {
    const val = dt.find(p => p.type === type)?.value ?? "0";
    return Number(val === "24" ? "0" : val);
  };
  const hours = get("hour");
  const minutes = get("minute");
  const seconds = get("second");
  return {
    year: get("year"), month: get("month"), day: get("day"),
    hours, minutes, seconds,
    totalMinutes: hours * 60 + minutes,
    totalSeconds: hours * 3600 + minutes * 60 + seconds,
  };
}

/** Format Bangkok date as YYYY-MM-DD */
export function formatBangkokDate(date: Date = new Date()): string {
  const { year, month, day } = bangkokParts(date);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** Format Bangkok time as HH:mm:ss */
export function formatBangkokTime(date: Date = new Date()): string {
  const { hours, minutes, seconds } = bangkokParts(date);
  return [hours, minutes, seconds].map(n => String(n).padStart(2, "0")).join(":");
}

/** Format Bangkok time as HH:mm */
export function formatBangkokHHMM(date: Date = new Date()): string {
  const { hours, minutes } = bangkokParts(date);
  return [hours, minutes].map(n => String(n).padStart(2, "0")).join(":");
}

/** Format a week-day name in Chinese */
export function formatBangkokWeekday(date: Date = new Date()): string {
  return new Intl.DateTimeFormat("zh-CN", { timeZone: TZ, weekday: "long" }).format(date);
}

/** Convert HH:mm string to total seconds */
export function timeToSeconds(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return (h || 0) * 3600 + (m || 0) * 60;
}

/** Convert HH:mm string to total minutes */
export function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

/** Format total seconds as HH:mm:ss */
export function formatCountdown(totalSec: number): string {
  if (totalSec <= 0) return "00:00:00";
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return [h, m, s].map(n => String(n).padStart(2, "0")).join(":");
}
