import { useGetStats, getGetStatsQueryKey, useListRecentPlays, getListRecentPlaysQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Music, Disc3, Inbox, Clock, Radio, Mic2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useBroadcastStatus, SCHEDULE_ITEMS, toMinutes } from "@/hooks/use-broadcast-status";

function getArtColors(str: string): [string, string] {
  const hash = str.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const palettes: [string, string][] = [
    ["#F59E0B", "#EF4444"],
    ["#3B82F6", "#8B5CF6"],
    ["#10B981", "#3B82F6"],
    ["#F97316", "#EC4899"],
    ["#6366F1", "#A78BFA"],
    ["#14B8A6", "#3B82F6"],
    ["#F43F5E", "#F97316"],
    ["#8B5CF6", "#06B6D4"],
  ];
  return palettes[hash % palettes.length];
}

function StatusBadge({ status, label }: { status: string; label: string }) {
  const styles: Record<string, string> = {
    "school-not-started": "bg-gray-100 text-gray-600 border-gray-200",
    "preparing": "bg-amber-100 text-amber-700 border-amber-200",
    "live": "bg-green-100 text-green-700 border-green-300 font-bold",
    "study-session": "bg-blue-100 text-blue-700 border-blue-200",
    "ended": "bg-gray-100 text-gray-500 border-gray-200",
  };

  return (
    <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm ${styles[status] ?? ""}`}>
      {status === "live" && <span className="w-2 h-2 rounded-full bg-green-500 live-dot shrink-0" />}
      {label}
    </span>
  );
}

export default function Dashboard() {
  const { status, label, isLive, remainingMinutes } = useBroadcastStatus();

  const { data: stats, isLoading: statsLoading } = useGetStats({
    query: { queryKey: getGetStatsQueryKey() },
  });

  const { data: recentPlays, isLoading: recentLoading } = useListRecentPlays(
    { limit: 10 },
    { query: { queryKey: getListRecentPlaysQueryKey({ limit: 10 }) } }
  );

  const nowSong = recentPlays?.[0] ?? null;
  const nowMinutes = toMinutes(new Date());

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Broadcast Center</h1>
        <p className="text-muted-foreground mt-1">Campus Radio — live broadcast status and today's schedule.</p>
      </div>

      {/* NOW PLAYING */}
      <Card className="overflow-hidden border-2 shadow-md">
        <div className="flex flex-col md:flex-row">
          {/* Album art */}
          <div
            className="w-full md:w-48 h-40 md:h-auto shrink-0 flex items-center justify-center"
            style={{
              background: nowSong
                ? `linear-gradient(135deg, ${getArtColors(nowSong.title)[0]}, ${getArtColors(nowSong.title)[1]})`
                : "linear-gradient(135deg, #e5e7eb, #d1d5db)",
            }}
          >
            {nowSong ? (
              <div className="text-center px-4">
                <div className="text-white text-5xl font-black opacity-30 leading-none">
                  {nowSong.title.charAt(0).toUpperCase()}
                </div>
              </div>
            ) : (
              <Disc3 className="h-16 w-16 text-white/40" />
            )}
          </div>

          {/* Info */}
          <div className="flex-1 p-5 md:p-6 flex flex-col justify-between gap-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1">
                  {isLive ? "Now Playing" : "Last Played"}
                </div>
                {recentLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-7 w-48" />
                    <Skeleton className="h-5 w-32" />
                  </div>
                ) : nowSong ? (
                  <>
                    <h2 className="text-2xl font-extrabold leading-tight truncate">{nowSong.title}</h2>
                    <p className="text-muted-foreground font-medium">{nowSong.artist}</p>
                    {nowSong.album && <p className="text-sm text-muted-foreground/70 italic">{nowSong.album}</p>}
                  </>
                ) : (
                  <p className="text-lg text-muted-foreground italic">No songs played today</p>
                )}
              </div>
              <StatusBadge status={status} label={label} />
            </div>

            {/* Progress bar */}
            <div className="space-y-1.5">
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${isLive ? "bg-green-500" : "bg-primary/40"}`}
                  style={{ width: isLive ? `${Math.min(100, ((20 - (remainingMinutes ?? 20)) / 20) * 100)}%` : "60%" }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>18:15</span>
                {isLive && remainingMinutes !== null ? (
                  <span className="text-green-600 font-semibold">{remainingMinutes} min remaining</span>
                ) : (
                  <span>—</span>
                )}
                <span>18:35</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 md:grid-cols-3">
        {/* TODAY'S SCHEDULE */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Today's Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="relative border-l border-border ml-2 space-y-4">
              {SCHEDULE_ITEMS.map((item) => {
                const isPast = nowMinutes > item.minutes;
                const isCurrent =
                  (item.label === "Music Broadcast Starts" && status === "live") ||
                  (item.label === "Pre-Broadcast Prep" && status === "preparing") ||
                  (item.label === "School Begins" && status === "school-not-started" && nowMinutes >= item.minutes);

                return (
                  <li key={item.time} className="ml-4 relative">
                    <span
                      className={`absolute -left-[22px] w-3.5 h-3.5 rounded-full border-2 border-background ${
                        isCurrent
                          ? "bg-primary live-dot"
                          : isPast
                          ? "bg-muted-foreground/40"
                          : "bg-muted border-border"
                      }`}
                    />
                    <div className={`text-sm leading-tight ${isPast && !isCurrent ? "opacity-50" : ""}`}>
                      <span className={`font-mono font-bold text-xs ${isCurrent ? "text-primary" : "text-muted-foreground"}`}>
                        {item.time}
                      </span>
                      <p className={`font-semibold leading-snug ${isCurrent ? "text-primary" : ""}`}>{item.label}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </CardContent>
        </Card>

        {/* STATS */}
        <div className="md:col-span-2 grid grid-cols-2 gap-4 content-start">
          <Card className="border-t-4 border-t-primary shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-semibold">Music Library</CardTitle>
              <Music className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? <Skeleton className="h-8 w-16" /> : (
                <div className="text-3xl font-extrabold">{stats?.totalSongs}</div>
              )}
              <p className="text-xs text-muted-foreground mt-1">Songs in rotation</p>
            </CardContent>
          </Card>

          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-semibold">Weekly Broadcasts</CardTitle>
              <Disc3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? <Skeleton className="h-8 w-16" /> : (
                <div className="text-3xl font-extrabold">{stats?.playedSongs}</div>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                {stats ? Math.round((stats.playedSongs / (stats.totalSongs || 1)) * 100) : 0}% of library aired
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-semibold">Total Broadcast Count</CardTitle>
              <Radio className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? <Skeleton className="h-8 w-16" /> : (
                <div className="text-3xl font-extrabold">{stats?.totalPlays}</div>
              )}
              <p className="text-xs text-muted-foreground mt-1">All-time airings</p>
            </CardContent>
          </Card>

          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className={`text-sm font-semibold ${(stats?.pendingSubmissions ?? 0) > 0 ? "text-primary" : ""}`}>
                Pending Song Requests
              </CardTitle>
              <Inbox className={`h-4 w-4 ${(stats?.pendingSubmissions ?? 0) > 0 ? "text-primary" : "text-muted-foreground"}`} />
            </CardHeader>
            <CardContent>
              {statsLoading ? <Skeleton className="h-8 w-16" /> : (
                <div className={`text-3xl font-extrabold ${(stats?.pendingSubmissions ?? 0) > 0 ? "text-primary" : ""}`}>
                  {stats?.pendingSubmissions}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">Awaiting review</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* RECENT BROADCAST LOG */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Recent Broadcast Log</CardTitle>
          <CardDescription>The last 10 songs aired on campus.</CardDescription>
        </CardHeader>
        <CardContent>
          {recentLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : !recentPlays?.length ? (
            <div className="text-center py-10 text-muted-foreground border border-dashed rounded-xl">
              <Mic2 className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No songs aired yet today.</p>
              <p className="text-sm mt-1">Broadcast starts at 18:15.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {recentPlays.map((song) => {
                const [c1, c2] = getArtColors(song.title);
                return (
                  <div key={song.id} className="flex items-center gap-4 py-3 hover:bg-accent/40 px-2 rounded-lg transition-colors group">
                    <div
                      className="w-10 h-10 rounded-lg shrink-0 flex items-center justify-center text-white font-black text-sm"
                      style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}
                    >
                      {song.playedCount}x
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm leading-none truncate">{song.title}</p>
                      <p className="text-sm text-muted-foreground truncate mt-1">
                        {song.artist}{song.album && <span className="opacity-60"> · {song.album}</span>}
                      </p>
                    </div>
                    <div className="text-right text-xs text-muted-foreground shrink-0 flex flex-col items-end gap-1">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {song.lastPlayedAt
                          ? formatDistanceToNow(new Date(song.lastPlayedAt), { addSuffix: true })
                          : "Never"}
                      </span>
                      {song.lastPlayedBy && (
                        <span className="bg-muted px-1.5 py-0.5 rounded font-mono text-[10px] uppercase">
                          {song.lastPlayedBy}
                        </span>
                      )}
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
