import { useListSongs, getListSongsQueryKey } from "@workspace/api-client-react";
import { Trophy, Flame, Star, TrendingUp, Music } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const ART_PALETTES: [string, string][] = [
  ["#F59E0B","#EF4444"],["#3B82F6","#8B5CF6"],["#10B981","#3B82F6"],
  ["#F97316","#EC4899"],["#6366F1","#A78BFA"],["#14B8A6","#3B82F6"],
  ["#F43F5E","#F97316"],["#8B5CF6","#06B6D4"],
];
function artColors(s: string): [string, string] {
  const h = s.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return ART_PALETTES[h % ART_PALETTES.length];
}

const RANK_BADGE = ["🥇", "🥈", "🥉"];
const RANK_BG = [
  "bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200",
  "bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200",
  "bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200",
];

function RankItem({ rank, title, artist, album, count, highlight }: {
  rank: number; title: string; artist: string; album?: string | null; count: number; highlight?: boolean;
}) {
  const [c1, c2] = artColors(title);
  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl border transition-all hover:shadow-sm ${rank <= 3 ? RANK_BG[rank - 1] : "bg-card border-border hover:bg-muted/30"}`}>
      <div className="w-8 text-center shrink-0">
        {rank <= 3 ? (
          <span className="text-xl">{RANK_BADGE[rank - 1]}</span>
        ) : (
          <span className="text-sm font-bold text-muted-foreground">{rank}</span>
        )}
      </div>
      <div className="w-10 h-10 rounded-lg shrink-0 flex items-center justify-center text-white font-black text-sm" style={{ background: `linear-gradient(135deg,${c1},${c2})` }}>
        {title.charAt(0)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate">{title}</p>
        <p className="text-xs text-muted-foreground truncate">{artist}{album && ` · ${album}`}</p>
      </div>
      <div className="shrink-0 text-right">
        <div className={`font-bold text-sm ${rank <= 3 ? "text-primary" : "text-foreground"}`}>{count}</div>
        <div className="text-[10px] text-muted-foreground">次播放</div>
      </div>
    </div>
  );
}

export default function Charts() {
  const { data: allSongs, isLoading } = useListSongs(
    { status: "all" },
    { query: { queryKey: getListSongsQueryKey({ status: "all" }) } }
  );

  const playedSongs = (allSongs ?? []).filter(s => s.playedCount > 0).sort((a, b) => b.playedCount - a.playedCount);
  const unplayedSongs = (allSongs ?? []).filter(s => s.playedCount === 0);

  // Artist leaderboard
  const artistCounts: Record<string, number> = {};
  for (const s of allSongs ?? []) {
    if (s.playedCount > 0) {
      artistCounts[s.artist] = (artistCounts[s.artist] ?? 0) + s.playedCount;
    }
  }
  const topArtists = Object.entries(artistCounts).sort(([, a], [, b]) => b - a).slice(0, 5);

  // Student submitted songs
  const studentSongs = (allSongs ?? []).filter(s => s.isStudentSubmission).sort((a, b) => b.playedCount - a.playedCount);

  const totalPlays = playedSongs.reduce((acc, s) => acc + s.playedCount, 0);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Trophy className="h-6 w-6 text-yellow-500" />热门榜单
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">最受欢迎的校园歌曲排行榜</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "累计播放", value: totalPlays, icon: TrendingUp, cls: "text-primary" },
          { label: "已播歌曲", value: playedSongs.length, icon: Music, cls: "text-blue-600" },
          { label: "未播歌曲", value: unplayedSongs.length, icon: Star, cls: "text-amber-600" },
        ].map(({ label, value, icon: Icon, cls }) => (
          <Card key={label} className="shadow-sm text-center">
            <CardContent className="pt-4 pb-4">
              <Icon className={`h-5 w-5 mx-auto mb-1.5 ${cls}`} />
              <p className={`text-2xl font-bold ${cls}`}>{isLoading ? "—" : value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Top songs */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Flame className="h-4 w-4 text-orange-500" />本周热播排行
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)
            ) : !playedSongs.length ? (
              <div className="text-center py-8 text-muted-foreground text-sm">暂无播放记录</div>
            ) : (
              playedSongs.slice(0, 8).map((song, i) => (
                <RankItem key={song.id} rank={i + 1} title={song.title} artist={song.artist} album={song.album} count={song.playedCount} />
              ))
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          {/* Top Artists */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Star className="h-4 w-4 text-yellow-500" />最受欢迎歌手
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full rounded-lg" />)
              ) : !topArtists.length ? (
                <div className="text-center py-6 text-muted-foreground text-sm">暂无数据</div>
              ) : (
                topArtists.map(([artist, count], i) => {
                  const [c1, c2] = artColors(artist);
                  const maxCount = topArtists[0][1];
                  return (
                    <div key={artist} className="flex items-center gap-3">
                      <div className="w-6 text-center shrink-0">
                        <span className="text-sm font-bold text-muted-foreground">{i + 1}</span>
                      </div>
                      <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-white font-bold text-xs" style={{ background: `linear-gradient(135deg,${c1},${c2})` }}>
                        {artist.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-sm font-semibold truncate">{artist}</span>
                          <span className="text-xs text-primary font-bold shrink-0 ml-2">{count}次</span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-primary/60 transition-all" style={{ width: `${(count / maxCount) * 100}%` }} />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* Student recommendations */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-500" />同学推荐榜
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)
              ) : !studentSongs.length ? (
                <div className="text-center py-6 text-muted-foreground text-sm">暂无同学推荐</div>
              ) : (
                studentSongs.slice(0, 5).map((song, i) => (
                  <RankItem key={song.id} rank={i + 1} title={song.title} artist={song.artist} count={song.playedCount} />
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
