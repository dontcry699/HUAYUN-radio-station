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

const SCHOOL_START = 17 * 60 + 30;
const BROADCAST_START = 18 * 60 + 15;
const BROADCAST_END = 18 * 60 + 35;
const SCHOOL_END = 20 * 60 + 10;

export function toMinutes(date: Date) {
  return date.getHours() * 60 + date.getMinutes();
}

function compute(now: Date): BroadcastStatusInfo {
  const t = toMinutes(now);
  let status: BroadcastStatus;
  let label: string;
  let sublabel: string;

  if (t < SCHOOL_START) {
    status = "school-not-started";
    label = "广播未开始";
    sublabel = "下一次广播时间：18:15";
  } else if (t < BROADCAST_START) {
    status = "preparing";
    label = "广播准备中";
    sublabel = "下一次广播时间：18:15";
  } else if (t < BROADCAST_END) {
    status = "live";
    label = "音乐广播进行中";
    sublabel = "正在播放歌曲";
  } else if (t < SCHOOL_END) {
    status = "study-session";
    label = "晚自习进行中";
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
  const [info, setInfo] = useState(() => compute(new Date()));
  useEffect(() => {
    const iv = setInterval(() => setInfo(compute(new Date())), 30000);
    return () => clearInterval(iv);
  }, []);
  return info;
}

export const SCHEDULE_ITEMS = [
  { time: "17:30", minutes: SCHOOL_START, label: "晚自习开始", description: "同学们进入教室开始晚自习" },
  { time: "18:00", minutes: 18 * 60, label: "广播前准备", description: "广播站成员准备今晚的歌曲单" },
  { time: "18:15", minutes: BROADCAST_START, label: "音乐广播开始", description: "校园之声正式开播，播放同学点歌与寄语" },
  { time: "18:35", minutes: BROADCAST_END, label: "音乐广播结束", description: "晚自习安静学习时段" },
  { time: "20:10", minutes: SCHOOL_END, label: "放学", description: "同学们有序放学离校" },
] as const;
