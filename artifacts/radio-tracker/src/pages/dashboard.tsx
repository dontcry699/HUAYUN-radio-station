import { useGetStats, getGetStatsQueryKey, useListRecentPlays, getListRecentPlaysQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Music, Disc3, Radio, Clock, Inbox } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useBroadcastStatus, SCHEDULE_ITEMS, toMinutes } from "@/hooks/use-broadcast-status";

const ART_PALETTES: [string, string][] = [
  ["#F59E0B", "#EF4444"], ["#3B82F6", "#8B5CF6"], ["#10B981", "#3B82F6"],
  ["#F97316", "#EC4899"], ["#6366F1", "#A78BFA"], ["#14B8A6", "#3B82F6"],
  ["#F43F5E", "#F97316"], ["#8B5CF6", "#06B6D4"],
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

export default function Dashboard() {
  const { status, label, sublabel, isLive, remainingMinutes } = useBroadcastStatus();
  const nowMinutes = toMinutes(new Date());

  const { data: stats, isLoading: statsLoading } = useGetStats({ query: { queryKey: getGetStatsQueryKey() } });
  const { data: recent, isLoading: recentLoading } = useListRecentPlays(
    { limit: 10 },
    { query: { queryKey: getListRecentPlaysQueryKey({ limit: 10 }) } }
  );

  const nowSong = recent?.[0] ?? null;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-2xl font-bold">广播中心</h1>
        <p className="text-muted-foreground text-sm mt-0.5">校园之声 — 实时广播状态与今日安排</p>
      </div>

      {/* NOW PLAYING HERO */}
      <Card className="overflow-hidden border-2 shadow-md">
        <div className="flex flex-col sm:flex-row">
          {/* Album art */}
          <div
            className="w-full sm:w-40 h-36 sm:h-auto shrink-0 flex items-center justify-center relative"
            style={{ background: nowSong ? `linear-gradient(135deg,${artColors(nowSong.title)[0]},${artColors(nowSong.title)[1]})` : "linear-gradient(135deg,#e5e7eb,#d1d5db)" }}
          >
            {nowSong ? (
              <div className="text-white font-black text-5xl opacity-25 select-none">{nowSong.title.charAt(0)}</div>
            ) : (
              <Disc3 className="h-14 w-14 text-white/30" />
            )}
            {isLive && (
              <div className="absolute top-2 left-2 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-white live-dot" />
                直播中
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 p-4 sm:p-5 flex flex-col justify-between gap-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-1">
                  {isLive ? "正在播放" : "最近播放"}
                </p>
                {recentLoading ? (
                  <div className="space-y-1.5"><Skeleton className="h-7 w-40" /><Skeleton className="h-4 w-28" /></div>
                ) : nowSong ? (
                  <>
                    <h2 className="text-2xl font-bold leading-tight">{nowSong.title}</h2>
                    <p className="text-muted-foreground">{nowSong.artist}</p>
                    {nowSong.album && <p className="text-xs text-muted-foreground/60 italic">{nowSong.album}</p>}
                  </>
                ) : (
                  <p className="text-lg text-muted-foreground italic">今日暂无播放记录</p>
                )}
              </div>
              <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm ${STATUS_BADGE[status]}`}>
                {isLive && <span className="w-2 h-2 rounded-full bg-green-500 live-dot" />}
                {label}
              </div>
            </div>

            <div>
              <div className="h-2 bg-muted rounded-full overflow-hidden mb-1.5">
                <div
                  className={`h-full rounded-full transition-all ${isLive ? "bg-green-500" : "bg-primary/40"}`}
                  style={{ width: isLive ? `${Math.min(100, ((20 - (remainingMinutes ?? 20)) / 20) * 100)}%` : "55%" }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>18:15</span>
                <span className={isLive ? "text-green-600 font-semibold" : ""}>
                  {isLive && remainingMinutes !== null ? `还剩 ${remainingMinutes} 分钟` : sublabel}
                </span>
                <span>18:35</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-5 md:grid-cols-3">
        {/* SCHEDULE */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">今日广播安排</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="relative border-l border-border ml-2 space-y-4">
              {SCHEDULE_ITEMS.map((item) => {
                const isPast = nowMinutes > item.minutes;
                const isCurrent = !isPast && (SCHEDULE_ITEMS.indexOf(item) === 0 || nowMinutes > SCHEDULE_ITEMS[SCHEDULE_ITEMS.indexOf(item) - 1].minutes);
                return (
                  <li key={item.time} className="ml-4 relative">
                    <span className={`absolute -left-[22px] w-3.5 h-3.5 rounded-full border-2 border-background ${isCurrent ? "bg-primary live-dot" : isPast ? "bg-muted-foreground/40" : "bg-muted border-border"}`} />
                    <div className={isPast && !isCurrent ? "opacity-50" : ""}>
                      <span className={`font-mono text-xs font-bold ${isCurrent ? "text-primary" : "text-muted-foreground"}`}>{item.time}</span>
                      <p className={`text-sm font-semibold leading-tight ${isCurrent ? "text-primary" : ""}`}>{item.label}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </CardContent>
        </Card>

        {/* STATS */}
        <div className="md:col-span-2 grid grid-cols-2 gap-4 content-start">
          {[
            { title: "曲库总数", sub: "已收录歌曲数量", icon: Music, value: stats?.totalSongs, accent: true },
            { title: "本周播放", sub: "本周已播放歌曲", icon: Disc3, value: stats?.playedSongs, accent: false },
            { title: "累计播放", sub: "广播总播放次数", icon: Radio, value: stats?.totalPlays, accent: false },
            { title: "待审核点歌", sub: "等待广播站审核", icon: Inbox, value: stats?.pendingSubmissions, accent: (stats?.pendingSubmissions ?? 0) > 0 },
          ].map(({ title, sub, icon: Icon, value, accent }) => (
            <Card key={title} className={`shadow-sm hover:shadow-md transition-shadow ${accent ? "border-t-4 border-t-primary" : ""}`}>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className={`text-sm font-semibold ${accent && title === "待审核点歌" && (stats?.pendingSubmissions ?? 0) > 0 ? "text-primary" : ""}`}>{title}</CardTitle>
                <Icon className={`h-4 w-4 ${accent && title === "待审核点歌" && (stats?.pendingSubmissions ?? 0) > 0 ? "text-primary" : "text-muted-foreground"}`} />
              </CardHeader>
              <CardContent>
                {statsLoading ? <Skeleton className="h-8 w-14" /> : (
                  <div className={`text-3xl font-bold ${accent && title === "待审核点歌" && (stats?.pendingSubmissions ?? 0) > 0 ? "text-primary" : ""}`}>{value}</div>
                )}
                <p className="text-xs text-muted-foreground mt-1">{sub}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* RECENT LOG */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">最近播放记录</CardTitle>
          <p className="text-sm text-muted-foreground">最近在校园广播中播放的歌曲</p>
        </CardHeader>
        <CardContent>
          {recentLoading ? (
            <div className="space-y-3">{[1,2,3,4].map(i => (
              <div key={i} className="flex gap-3"><Skeleton className="h-10 w-10 rounded-lg" /><div className="flex-1 space-y-2"><Skeleton className="h-4 w-1/3" /><Skeleton className="h-3 w-1/4" /></div></div>
            ))}</div>
          ) : !recent?.length ? (
            <div className="text-center py-10 border border-dashed rounded-xl text-muted-foreground">
              <Radio className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">今日暂无播放记录</p>
              <p className="text-sm mt-1">广播从 18:15 开始</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {recent.map((song) => {
                const [c1, c2] = artColors(song.title);
                return (
                  <div key={song.id} className="flex items-center gap-3 py-2.5 hover:bg-accent/40 px-2 rounded-lg transition-colors">
                    <div className="w-10 h-10 rounded-lg shrink-0 flex items-center justify-center text-white font-bold text-xs" style={{ background: `linear-gradient(135deg,${c1},${c2})` }}>
                      {song.playedCount}次
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{song.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{song.artist}{song.album && ` · ${song.album}`}</p>
                    </div>
                    <div className="text-right text-xs text-muted-foreground shrink-0 space-y-0.5">
                      <div className="flex items-center gap-1"><Clock className="h-3 w-3" />{song.lastPlayedAt ? formatDistanceToNow(new Date(song.lastPlayedAt), { addSuffix: true }) : "—"}</div>
                      {song.lastPlayedBy && <div className="bg-muted px-1.5 py-0.5 rounded text-[10px]">{song.lastPlayedBy}</div>}
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
