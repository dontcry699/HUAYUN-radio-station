import { useState, useEffect } from "react";
import { Clock } from "lucide-react";
import { formatBangkokDate, formatBangkokTime, formatBangkokWeekday } from "@/lib/time";

export function ClockWidget({ compact = false }: { compact?: boolean }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const iv = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(iv);
  }, []);

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-sm font-mono">
        <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        <span className="font-bold tabular-nums">{formatBangkokTime(now)}</span>
        <span className="text-muted-foreground hidden sm:inline">{formatBangkokDate(now)}</span>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border bg-card shadow-sm p-5 text-center space-y-1">
      <div className="flex items-center justify-center gap-2 text-muted-foreground text-xs font-semibold uppercase tracking-widest mb-2">
        <Clock className="h-3.5 w-3.5" />
        当前时间
      </div>
      <div className="font-mono text-4xl font-black tabular-nums tracking-tight leading-none text-foreground">
        {formatBangkokTime(now)}
      </div>
      <div className="text-base font-semibold text-muted-foreground tabular-nums">
        {formatBangkokDate(now)}
      </div>
      <div className="text-sm text-muted-foreground">
        {formatBangkokWeekday(now)}
      </div>
      <div className="inline-block mt-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary">
        泰国时间（UTC+7）
      </div>
    </div>
  );
}
