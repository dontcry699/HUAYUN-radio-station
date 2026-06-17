import { useState, useEffect } from "react";
import { useGetStats, getGetStatsQueryKey, useListRecentPlays, getListRecentPlaysQueryKey, useListAnnouncements, getListAnnouncementsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Music, Disc3, Radio, Inbox, Trophy, Megaphone } from "lucide-react";
import { ClockWidget } from "@/components/clock-widget";
import { useBroadcastStatus, getScheduleItems, formatCountdown } from "@/hooks/use-broadcast-status";
import { bangkokParts } from "@/lib/time";
import { useAuth } from "@/context/auth-context";
import { formatDistanceToNow } from "date-fns";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

const ART_PALETTES: [string, string][] = [
  ["#F59E0B","#EF4444"],["#3B82F6","#8B5CF6"],["#10B981","#3B82F6"],
  ["#F97316","#EC4899"],["#6366F1","#A78BFA"],["#14B8A6","#3B82F6"],
  ["#F43F5E","#F97316"],["#8B5CF6","#06B6D4"],
];
function artColors(s: string): [string, string] {
  const h = s.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return ART_PALETTES[h % ART_PALETTES.length];
}

const STATUS_BADGE: Record<string, string> = {
  "school-not-started": "bg-gray-100 text-gray-600 border-gray-200",
  "preparing": "bg-amber-100 text-amber-700 border-amber-200",
  "live": "bg-green-100 text-green-700 border-green-200 font-bold",
  "study-session": "bg-blue-100 text-blue-700 border-blue-200",
  "ended": "bg-gray-100 text-gray-500 border-gray-200",
};

const STATUS_DOT: Record<string, string> = {
  "school-not-started": "bg-gray-400",
  "preparing": "bg-amber-400",
  "live": "bg-green-500",
  "study-session": "bg-blue-400",
  "ended": "bg-gray-400",
};

interface ActiveEvent {
  id: number; name: string; description: string | null;
  bannerColor: string; emoji: string; startDate: string; endDate: string;
}

/** Student/public view — clock, status, countdown, schedule, announcements */
function StudentDashboard() {
  const { status, label, sublabel, isLive, countdownSeconds, countdownLabel, cfg } = useBroadcastStatus();
  const scheduleItems = getScheduleItems(cfg);
  const { totalMinutes: nowMin } = bangkokParts();
  const [activeEvent, setActiveEvent] = useState<ActiveEvent | null>(null);

  const { data: announcements } = useListAnnouncements({}, { query: { queryKey: getListAnnouncementsQueryKey({}) } });
  const { data: topSongs } = useListRecentPlays({ limit: 5 }, { query: { queryKey: getListRecentPlaysQueryKey({ limit: 5 }) } });

  const activeAnnouncements = announcements?.filter(a => a.isActive).slice(0, 4) ?? [];

  const BASE = (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");
  useEffect(() => {
    fetch(`${BASE}/api/events/active`).then(r => r.json()).then(d => setActiveEvent(d)).catch(() => {});
  }, []);

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Event Banner */}
      {activeEvent && (
        <div className="rounded-2xl overflow-hidden shadow-md border" style={{ borderColor: activeEvent.bannerColor + "40" }}>
          <div className="px-5 py-4 flex items-center gap-3" style={{ background: `linear-gradient(135deg, ${activeEvent.bannerColor}20, ${activeEvent.bannerColor}08)` }}>
            <span className="text-3xl shrink-0">{activeEvent.emoji}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ background: activeEvent.bannerColor }}>特别活动</span>
                <h2 className="font-bold text-base" style={{ color: activeEvent.bannerColor }}>{activeEvent.name}</h2>
              </div>
              {activeEvent.description && <p className="text-sm text-muted-foreground mt-0.5 leading-snug line-clamp-1">{activeEvent.description}</p>}
              <p className="text-xs text-muted-foreground mt-0.5">{activeEvent.startDate} — {activeEvent.endDate}</p>
            </div>
          </div>
        </div>
      )}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">广播中心</h1>
          <p className="text-muted-foreground text-sm mt-0.5">校园之声 — 实时广播状态</p>
        </div>
      </div>

      {/* Top row: clock + status + countdown */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <ClockWidget />

        {/* Broadcast Status */}
        <Card className="shadow-sm sm:col-span-2">
          <CardContent className="flex flex-col justify-between h-full py-5 px-5 gap-4">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full shrink-0 ${STATUS_DOT[status]} ${isLive ? "live-dot" : ""}`} />
              <div>
                <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-semibold ${STATUS_BADGE[status]}`}>
                  {isLive && <span className="w-2 h-2 rounded-full bg-green-500 live-dot" />}
                  {label}
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">{sublabel}</p>
              </div>
            </div>

            {/* Countdown */}
            {countdownSeconds !== null && countdownSeconds > 0 ? (
              <div className="text-center bg-muted/40 rounded-xl py-3 px-4">
                <p className="text-xs font-semibold text-muted-foreground mb-1">{countdownLabel}</p>
                <p className="font-mono text-3xl font-black tabular-nums tracking-tight text-primary">
                  {formatCountdown(countdownSeconds)}
                </p>
              </div>
            ) : countdownSeconds === null ? (
              <div className="text-center bg-muted/40 rounded-xl py-3 px-4">
                <p className="text-sm font-semibold text-muted-foreground">{countdownLabel}</p>
              </div>
            ) : null}

            {/* 点歌 CTA */}
            <Link href="/submissions">
              <Button className="w-full font-semibold" variant="outline">
                🎵 我要点歌
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Schedule */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2"><CardTitle className="text-base">今日广播安排</CardTitle></CardHeader>
        <CardContent>
          <ol className="space-y-2">
            {scheduleItems.map((item, idx) => {
              const isPast = nowMin > item.minutes;
              const isCurrent = !isPast && (idx === 0 || nowMin >= scheduleItems[idx - 1].minutes);
              const marker = isPast ? "✓" : isCurrent ? "●" : "○";
              return (
                <li key={item.time} className={`flex items-center gap-3 py-1.5 ${isPast ? "opacity-50" : ""}`}>
                  <span className={`w-6 text-center font-bold text-sm shrink-0 ${isCurrent ? "text-primary" : isPast ? "text-muted-foreground" : "text-muted-foreground/50"}`}>
                    {marker}
                  </span>
                  <span className={`font-mono text-sm font-bold w-12 shrink-0 ${isCurrent ? "text-primary" : "text-muted-foreground"}`}>{item.time}</span>
                  <span className={`text-sm ${isCurrent ? "text-primary font-semibold" : ""}`}>{item.label}</span>
                  {isCurrent && <span className="text-[10px] bg-primary text-white px-1.5 py-0.5 rounded-full font-bold ml-auto">现在</span>}
                </li>
              );
            })}
          </ol>
        </CardContent>
      </Card>

      {/* Announcements + Charts */}
      <div className="grid md:grid-cols-2 gap-5">
        {/* Announcements */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2"><Megaphone className="h-4 w-4 text-primary" />校园公告</CardTitle>
            <Link href="/announcements"><span className="text-xs text-primary hover:underline cursor-pointer">全部</span></Link>
          </CardHeader>
          <CardContent>
            {!activeAnnouncements.length ? (
              <p className="text-sm text-muted-foreground py-4 text-center">暂无公告</p>
            ) : (
              <ul className="space-y-2">
                {activeAnnouncements.map(a => (
                  <li key={a.id} className="border rounded-lg p-2.5 text-sm">
                    <p className="font-semibold truncate">{a.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{a.content}</p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Charts preview */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2"><Trophy className="h-4 w-4 text-amber-500" />最近播放</CardTitle>
            <Link href="/charts"><span className="text-xs text-primary hover:underline cursor-pointer">全部</span></Link>
          </CardHeader>
          <CardContent>
            {!topSongs?.length ? (
              <p className="text-sm text-muted-foreground py-4 text-center">暂无播放记录</p>
            ) : (
              <ul className="space-y-2">
                {topSongs.slice(0, 5).map((s, i) => {
                  const [c1, c2] = artColors(s.title);
                  return (
                    <li key={s.id} className="flex items-center gap-2.5 text-sm">
                      <span className={`w-5 h-5 rounded-full text-[11px] font-black flex items-center justify-center shrink-0 ${i < 3 ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}>{i + 1}</span>
                      <div className="w-7 h-7 rounded-md shrink-0 flex items-center justify-center text-white font-bold text-xs" style={{ background: `linear-gradient(135deg,${c1},${c2})` }}>{s.title.charAt(0)}</div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate leading-tight">{s.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{s.artist}</p>
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">{s.playedCount}次</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/** Staff (broadcaster/admin) view — full dashboard */
function StaffDashboard() {
  const { status, label, sublabel, isLive, countdownSeconds, countdownLabel, cfg } = useBroadcastStatus();
  const scheduleItems = getScheduleItems(cfg);
  const { totalMinutes: nowMin } = bangkokParts();

  const { data: stats, isLoading: statsLoading } = useGetStats({ query: { queryKey: getGetStatsQueryKey() } });
  const { data: recent, isLoading: recentLoading } = useListRecentPlays({ limit: 8 }, { query: { queryKey: getListRecentPlaysQueryKey({ limit: 8 }) } });
  const nowSong = recent?.[0] ?? null;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">广播中心</h1>
          <p className="text-muted-foreground text-sm mt-0.5">校园之声 — 实时广播状态与今日安排</p>
        </div>
        <ClockWidget compact />
      </div>

      {/* NOW PLAYING HERO */}
      <Card className="overflow-hidden border-2 shadow-md">
        <div className="flex flex-col sm:flex-row">
          <div className="w-full sm:w-36 h-32 sm:h-auto shrink-0 flex items-center justify-center relative"
            style={{ background: nowSong ? `linear-gradient(135deg,${artColors(nowSong.title)[0]},${artColors(nowSong.title)[1]})` : "linear-gradient(135deg,#e5e7eb,#d1d5db)" }}>
            {nowSong ? <div className="text-white font-black text-5xl opacity-25 select-none">{nowSong.title.charAt(0)}</div> : <Disc3 className="h-12 w-12 text-white/30" />}
            {isLive && <div className="absolute top-2 left-2 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-white live-dot" />直播中</div>}
          </div>
          <div className="flex-1 p-4 flex flex-col justify-between gap-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-1">{isLive ? "正在播放" : "最近播放"}</p>
                {recentLoading ? <div className="space-y-1.5"><Skeleton className="h-7 w-40" /><Skeleton className="h-4 w-28" /></div>
                  : nowSong ? <><h2 className="text-xl font-bold leading-tight">{nowSong.title}</h2><p className="text-muted-foreground text-sm">{nowSong.artist}</p></> : <p className="text-lg text-muted-foreground italic">今日暂无播放记录</p>}
              </div>
              <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm ${STATUS_BADGE[status]}`}>
                {isLive && <span className="w-2 h-2 rounded-full bg-green-500 live-dot" />}{label}
              </div>
            </div>
            {/* Countdown inline */}
            {countdownSeconds !== null && countdownSeconds > 0 ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{countdownLabel}：</span>
                <span className="font-mono font-bold text-primary tabular-nums">{formatCountdown(countdownSeconds)}</span>
              </div>
            ) : <p className="text-xs text-muted-foreground">{countdownLabel || sublabel}</p>}
          </div>
        </div>
      </Card>

      <div className="grid gap-5 md:grid-cols-3">
        {/* SCHEDULE */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-base">今日广播安排</CardTitle></CardHeader>
          <CardContent>
            <ol className="space-y-2">
              {scheduleItems.map((item, idx) => {
                const isPast = nowMin > item.minutes;
                const isCurrent = !isPast && (idx === 0 || nowMin >= scheduleItems[idx - 1].minutes);
                const marker = isPast ? "✓" : isCurrent ? "●" : "○";
                return (
                  <li key={item.time} className={`flex items-center gap-2 py-1 ${isPast ? "opacity-50" : ""}`}>
                    <span className={`w-5 text-center font-bold text-sm shrink-0 ${isCurrent ? "text-primary" : "text-muted-foreground/50"}`}>{marker}</span>
                    <span className={`font-mono text-xs font-bold w-11 shrink-0 ${isCurrent ? "text-primary" : "text-muted-foreground"}`}>{item.time}</span>
                    <span className={`text-sm leading-tight ${isCurrent ? "text-primary font-semibold" : ""}`}>{item.label}</span>
                  </li>
                );
              })}
            </ol>
          </CardContent>
        </Card>

        {/* STATS */}
        <div className="md:col-span-2 grid grid-cols-2 gap-3 content-start">
          {[
            { title: "曲库总数", sub: "已收录歌曲", icon: Music, value: stats?.totalSongs, accent: true },
            { title: "本周播放", sub: "本周已播放", icon: Disc3, value: stats?.playedSongs },
            { title: "累计播放", sub: "广播总次数", icon: Radio, value: stats?.totalPlays },
            { title: "待审核点歌", sub: "等待审核", icon: Inbox, value: stats?.pendingSubmissions, accent: (stats?.pendingSubmissions ?? 0) > 0 },
          ].map(({ title, sub, icon: Icon, value, accent }) => (
            <Card key={title} className={`shadow-sm hover:shadow-md transition-shadow ${accent ? "border-t-4 border-t-primary" : ""}`}>
              <CardHeader className="flex flex-row items-center justify-between pb-1 space-y-0 pt-4 px-4">
                <CardTitle className={`text-sm font-semibold ${accent ? "text-primary" : ""}`}>{title}</CardTitle>
                <Icon className={`h-4 w-4 ${accent ? "text-primary" : "text-muted-foreground"}`} />
              </CardHeader>
              <CardContent className="px-4 pb-4">
                {statsLoading ? <Skeleton className="h-8 w-14" /> : <div className={`text-3xl font-bold ${accent ? "text-primary" : ""}`}>{value ?? 0}</div>}
                <p className="text-xs text-muted-foreground mt-1">{sub}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* RECENT LOG */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">最近播放记录</CardTitle>
          <p className="text-sm text-muted-foreground">最近在校园广播中播放的歌曲</p>
        </CardHeader>
        <CardContent>
          {recentLoading ? (
            <div className="space-y-3">{[1,2,3,4].map(i => <div key={i} className="flex gap-3"><Skeleton className="h-10 w-10 rounded-lg" /><div className="flex-1 space-y-2"><Skeleton className="h-4 w-1/3" /><Skeleton className="h-3 w-1/4" /></div></div>)}</div>
          ) : !recent?.length ? (
            <div className="text-center py-10 border border-dashed rounded-xl text-muted-foreground">
              <Radio className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">今日暂无播放记录</p>
              <p className="text-sm mt-1">广播从 {cfg.broadcastStart} 开始</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {recent.map(song => {
                const [c1, c2] = artColors(song.title);
                return (
                  <div key={song.id} className="flex items-center gap-3 py-2.5 hover:bg-accent/40 px-2 rounded-lg transition-colors">
                    <div className="w-10 h-10 rounded-lg shrink-0 flex items-center justify-center text-white font-bold text-xs" style={{ background: `linear-gradient(135deg,${c1},${c2})` }}>{song.playedCount}次</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{song.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{song.artist}{song.album && ` · ${song.album}`}</p>
                    </div>
                    <div className="text-xs text-muted-foreground text-right shrink-0">
                      {song.lastPlayedAt ? formatDistanceToNow(new Date(song.lastPlayedAt), { addSuffix: true }) : "—"}
                      {song.lastPlayedBy && <div className="bg-muted px-1.5 py-0.5 rounded text-[10px] mt-0.5">{song.lastPlayedBy}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function Dashboard() {
  const { isBroadcaster } = useAuth();
  return isBroadcaster ? <StaffDashboard /> : <StudentDashboard />;
}
