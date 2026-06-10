import { useState, useEffect } from "react";

export type BroadcastStatus =
  | "school-not-started"
  | "preparing"
  | "live"
  | "study-session"
  | "ended";

export interface BroadcastStatusInfo {
  status: BroadcastStatus;
  label: string;
  sublabel: string;
  isLive: boolean;
  remainingMinutes: number | null;
}

const DEFAULT_SCHEDULE = {
  schoolStart: "17:30",
  broadcastStart: "18:15",
  broadcastEnd: "18:35",
  schoolEnd: "20:10",
};

export type ScheduleConfig = typeof DEFAULT_SCHEDULE;

export function loadScheduleConfig(): ScheduleConfig {
  try {
    const raw = localStorage.getItem("cr-schedule");
    if (raw) return { ...DEFAULT_SCHEDULE, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return DEFAULT_SCHEDULE;
}

export function saveScheduleConfig(cfg: ScheduleConfig) {
  localStorage.setItem("cr-schedule", JSON.stringify(cfg));
}

function parseTime(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function toMinutes(date: Date) {
  return date.getHours() * 60 + date.getMinutes();
}

function compute(now: Date, cfg: ScheduleConfig): BroadcastStatusInfo {
  const t = toMinutes(now);
  const SCHOOL_START = parseTime(cfg.schoolStart);
  const BROADCAST_START = parseTime(cfg.broadcastStart);
  const BROADCAST_END = parseTime(cfg.broadcastEnd);
  const SCHOOL_END = parseTime(cfg.schoolEnd);

  let status: BroadcastStatus;
  let label: string;
  let sublabel: string;

  if (t < SCHOOL_START) {
    status = "school-not-started";
    label = "广播未开始";
    sublabel = `下一次广播时间：${cfg.broadcastStart}`;
  } else if (t < BROADCAST_START) {
    status = "preparing";
    label = "广播准备中";
    sublabel = `下一次广播时间：${cfg.broadcastStart}`;
  } else if (t < BROADCAST_END) {
    status = "live";
    label = "音乐广播进行中";
    sublabel = "正在播放歌曲";
  } else if (t < SCHOOL_END) {
    status = "study-session";
    label = "课程进行中";
    sublabel = "音乐广播已结束";
  } else {
    status = "ended";
    label = "今日广播已结束";
    sublabel = "感谢收听校园广播";
  }

  const remainingMinutes = status === "live" ? BROADCAST_END - t : null;
  return { status, label, sublabel, isLive: status === "live", remainingMinutes };
}

export function useBroadcastStatus() {
  const [cfg, setCfg] = useState<ScheduleConfig>(loadScheduleConfig);
  const [info, setInfo] = useState(() => compute(new Date(), loadScheduleConfig()));

  useEffect(() => {
    const update = () => {
      const c = loadScheduleConfig();
      setCfg(c);
      setInfo(compute(new Date(), c));
    };
    update();
    const iv = setInterval(update, 30000);
    const onStorage = (e: StorageEvent) => { if (e.key === "cr-schedule") update(); };
    window.addEventListener("storage", onStorage);
    return () => { clearInterval(iv); window.removeEventListener("storage", onStorage); };
  }, []);

  return { ...info, cfg };
}

export function getScheduleItems(cfg: ScheduleConfig) {
  return [
    { time: cfg.schoolStart, label: "上课时间开始", description: "同学们进入教室，课程正式开始" },
    { time: "18:00", label: "广播前准备", description: "广播站成员整理点歌单，调试设备" },
    { time: cfg.broadcastStart, label: "音乐广播开始", description: "校园之声正式开播，播放点歌与寄语" },
    { time: cfg.broadcastEnd, label: "音乐广播结束", description: "继续安静学习时段" },
    { time: cfg.schoolEnd, label: "放学", description: "课程结束，同学们有序离校" },
  ] as const;
}

export const SCHEDULE_ITEMS = getScheduleItems(DEFAULT_SCHEDULE);
