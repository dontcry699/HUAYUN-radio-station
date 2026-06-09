import { useGetStats, getGetStatsQueryKey, useListRecentPlays, getListRecentPlaysQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Music, Disc3, Inbox, Clock, Radio } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetStats({
    query: { queryKey: getGetStatsQueryKey() }
  });

  const { data: recentPlays, isLoading: recentLoading } = useListRecentPlays(
    { limit: 10 },
    { query: { queryKey: getListRecentPlaysQueryKey({ limit: 10 }) } }
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Station overview and live broadcast status.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-t-4 border-t-primary shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Library</CardTitle>
            <Music className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-3xl font-bold">{stats?.totalSongs}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1 text-balance">Tracked songs in rotation</p>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Played Songs</CardTitle>
            <Disc3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-3xl font-bold">{stats?.playedSongs}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1 text-balance">
              {stats ? Math.round((stats.playedSongs / stats.totalSongs) * 100) : 0}% of total library
            </p>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Plays</CardTitle>
            <Radio className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-3xl font-bold">{stats?.totalPlays}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1 text-balance">All-time broadcast count</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-destructive">Pending Submissions</CardTitle>
            <Inbox className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-3xl font-bold text-destructive">{stats?.pendingSubmissions}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1 text-balance">Awaiting DJ review</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Recent Broadcast Log</CardTitle>
          <CardDescription>The last 10 songs played on air.</CardDescription>
        </CardHeader>
        <CardContent>
          {recentLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-10 w-10 rounded" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : !recentPlays?.length ? (
            <div className="text-center py-8 text-muted-foreground border border-dashed rounded-md">
              <Radio className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No songs played yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentPlays.map((song) => (
                <div key={song.id} className="flex items-center space-x-4 p-3 rounded-md hover:bg-accent/50 transition-colors group border border-transparent hover:border-border">
                  <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 bg-secondary rounded text-secondary-foreground font-mono text-xs">
                    {song.playedCount}x
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-none truncate group-hover:text-primary transition-colors">
                      {song.title}
                    </p>
                    <p className="text-sm text-muted-foreground truncate mt-1">
                      {song.artist} {song.album && <span className="opacity-70 mx-1">•</span>} {song.album && <span className="italic">{song.album}</span>}
                    </p>
                  </div>
                  <div className="text-right text-xs text-muted-foreground flex flex-col items-end gap-1">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {song.lastPlayedAt ? formatDistanceToNow(new Date(song.lastPlayedAt), { addSuffix: true }) : 'Never'}
                    </div>
                    {song.lastPlayedBy && (
                      <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-[10px] uppercase">
                        DJ {song.lastPlayedBy}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
