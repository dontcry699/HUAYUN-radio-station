import { useState, useEffect, useRef } from "react";
import { bangkokParts, timeToSeconds, timeToMinutes, formatCountdown } from "@/lib/time";

export interface ScheduleConfig {
  schoolStart: string;      // "HH:mm"
  broadcastStart: string;
  broadcastEnd: string;
  schoolEnd: string;
}

export const DEFAULT_SCHEDULE: ScheduleConfig = {
  schoolStart: "17:30",
  broadcastStart: "18:15",
  broadcastEnd: "18:35",
  schoolEnd: "20:10",
};

export type BroadcastStatus =
  | "school-not-started"
  | "preparing"
  | "live"
  | "study-session"
  | "ended";

export interface BroadcastInfo {
  status: BroadcastStatus;
  label: string;
  sublabel: string;
  isLive: boolean;
  /** Seconds until broadcast starts (if preparing/not-started) or null */
  countdownSeconds: number | null;
  /** Label for the countdown */
  countdownLabel: string;
  cfg: ScheduleConfig;
}

const BASE = () => (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");

export function computeStatus(date: Date, cfg: ScheduleConfig): BroadcastInfo {
  const { totalMinutes: t, totalSeconds: ts } = bangkokParts(date);
  const SCHOOL_START = timeToMinutes(cfg.schoolStart);
  const BROADCAST_START = timeToMinutes(cfg.broadcastStart);
  const BROADCAST_END = timeToMinutes(cfg.broadcastEnd);
  const SCHOOL_END = timeToMinutes(cfg.schoolEnd);

  const BROADCAST_START_S = timeToSeconds(cfg.broadcastStart);
  const BROADCAST_END_S = timeToSeconds(cfg.broadcastEnd);

  let status: BroadcastStatus;
  let label: string;
  let sublabel: string;
  let countdownSeconds: number | null = null;
  let countdownLabel = "";

  if (t < SCHOOL_START) {
    status = "school-not-started";
    label = "广播未开始";
    sublabel = `广播时间：${cfg.broadcastStart}–${cfg.broadcastEnd}`;
    countdownSeconds = BROADCAST_START_S - ts;
    countdownLabel = "距离广播开始";
  } else if (t < BROADCAST_START) {
    status = "preparing";
    label = "广播准备中";
    sublabel = `广播将于 ${cfg.broadcastStart} 开始`;
    countdownSeconds = BROADCAST_START_S - ts;
    countdownLabel = "距离广播开始";
  } else if (t < BROADCAST_END) {
    status = "live";
    label = "音乐广播进行中";
    sublabel = "校园之声正在播出";
    countdownSeconds = BROADCAST_END_S - ts;
    countdownLabel = "距离广播结束";
  } else if (t < SCHOOL_END) {
    status = "study-session";
    label = "课程进行中";
    sublabel = "音乐广播已结束";
    countdownSeconds = null;
    countdownLabel = "感谢收听校园广播";
  } else {
    status = "ended";
    label = "今日广播已结束";
    sublabel = "感谢收听校园广播";
    countdownSeconds = null;
    countdownLabel = "感谢收听校园广播";
  }

  return {
    status, label, sublabel,
    isLive: status === "live",
    countdownSeconds,
    countdownLabel,
    cfg,
  };
}

/** Fetch and cache schedule config from API */
let _cachedConfig: ScheduleConfig | null = null;
let _fetchPromise: Promise<ScheduleConfig> | null = null;

async function fetchScheduleConfig(): Promise<ScheduleConfig> {
  if (_cachedConfig) return _cachedConfig;
  if (_fetchPromise) return _fetchPromise;
  _fetchPromise = fetch(`${BASE()}/api/config/schedule`)
    .then(r => r.ok ? r.json() : DEFAULT_SCHEDULE)
    .catch(() => DEFAULT_SCHEDULE)
    .then(data => {
      _cachedConfig = { ...DEFAULT_SCHEDULE, ...data };
      return _cachedConfig!;
    });
  return _fetchPromise;
}

export function invalidateScheduleCache() {
  _cachedConfig = null;
  _fetchPromise = null;
}

/** Main hook — updates every second, uses Bangkok time */
export function useBroadcastStatus(): BroadcastInfo {
  const [cfg, setCfg] = useState<ScheduleConfig>(DEFAULT_SCHEDULE);
  const [info, setInfo] = useState<BroadcastInfo>(() => computeStatus(new Date(), DEFAULT_SCHEDULE));

  const cfgRef = useRef(cfg);
  cfgRef.current = cfg;

  useEffect(() => {
    fetchScheduleConfig().then(c => {
      setCfg(c);
      setInfo(computeStatus(new Date(), c));
    });
  }, []);

  useEffect(() => {
    const iv = setInterval(() => {
      setInfo(computeStatus(new Date(), cfgRef.current));
    }, 1000);
    return () => clearInterval(iv);
  }, []);

  return info;
}

/** Hook to get/reload the schedule config */
export function useScheduleConfig() {
  const [cfg, setCfg] = useState<ScheduleConfig>(DEFAULT_SCHEDULE);
  const [loading, setLoading] = useState(true);

  const reload = () => {
    invalidateScheduleCache();
    setLoading(true);
    fetchScheduleConfig().then(c => { setCfg(c); setLoading(false); });
  };

  useEffect(() => {
    fetchScheduleConfig().then(c => { setCfg(c); setLoading(false); });
  }, []);

  return { cfg, loading, reload };
}

/** Build schedule items from config */
export function getScheduleItems(cfg: ScheduleConfig) {
  return [
    { time: cfg.schoolStart, label: "上课时间开始", minutes: timeToMinutes(cfg.schoolStart) },
    { time: "18:00", label: "广播前准备", minutes: timeToMinutes("18:00") },
    { time: cfg.broadcastStart, label: "音乐广播开始", minutes: timeToMinutes(cfg.broadcastStart) },
    { time: cfg.broadcastEnd, label: "音乐广播结束", minutes: timeToMinutes(cfg.broadcastEnd) },
    { time: cfg.schoolEnd, label: "放学", minutes: timeToMinutes(cfg.schoolEnd) },
  ];
}

export { formatCountdown };
