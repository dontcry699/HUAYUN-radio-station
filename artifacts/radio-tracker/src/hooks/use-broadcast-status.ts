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

  if (t < SCHOOL_START) {
    status = "school-not-started";
    label = "School Not Started Yet";
  } else if (t < BROADCAST_START) {
    status = "preparing";
    label = "Preparing Broadcast";
  } else if (t < BROADCAST_END) {
    status = "live";
    label = "Music Broadcasting Live";
  } else if (t < SCHOOL_END) {
    status = "study-session";
    label = "Evening Study Session";
  } else {
    status = "ended";
    label = "Broadcast Ended";
  }

  const remainingMinutes =
    status === "live" ? BROADCAST_END - t : null;

  return { status, label, isLive: status === "live", remainingMinutes };
}

export function useBroadcastStatus() {
  const [info, setInfo] = useState(() => compute(new Date()));

  useEffect(() => {
    const interval = setInterval(() => setInfo(compute(new Date())), 30000);
    return () => clearInterval(interval);
  }, []);

  return info;
}

export const SCHEDULE_ITEMS = [
  { time: "17:30", minutes: SCHOOL_START, label: "School Begins", description: "Students arrive for evening classes" },
  { time: "18:00", minutes: 18 * 60, label: "Pre-Broadcast Prep", description: "Radio club prepares the song queue" },
  { time: "18:15", minutes: BROADCAST_START, label: "Music Broadcast Starts", description: "Student song requests and dedications air" },
  { time: "18:35", minutes: BROADCAST_END, label: "Music Broadcast Ends", description: "Evening study session begins" },
  { time: "20:10", minutes: SCHOOL_END, label: "School Ends", description: "Students dismissed for the day" },
] as const;
