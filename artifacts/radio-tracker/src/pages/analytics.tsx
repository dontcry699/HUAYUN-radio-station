import { useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { BarChart3, Music, Users, Trophy, TrendingUp, Disc3 } from "lucide-react";

interface Analytics {
  topSongs: { id: number; title: string; artist: string; plays: number }[];
  topArtists: { artist: string; plays: number }[];
  submissionStats: { total: number; pending: number; approved: number; rejected: number };
  genreBreakdown: { genre: string; count: number }[];
  dailyTrend: { date: string; count: number }[];
  broadcasterActivity: { name: string; count: number }[];
  libStats: { total: number; played: number; unplayed: number; studentSubmissions: number; totalPlays: number };
}

const COLORS = ["#7C3AED", "#2563EB", "#059669", "#DC2626", "#D97706", "#DB2777", "#0891B2", "#65A30D"];

const StatCard = ({ title, value, sub, icon: Icon, accent }: { title: string; value: number | string; sub: string; icon: typeof Music; accent?: boolean }) => (
  <Card className={`shadow-sm ${accent ? "border-t-4 border-t-primary" : ""}`}>
    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 pt-4 px-4">
      <CardTitle className="text-sm font-semibold text-muted-foreground">{title}</CardTitle>
      <Icon className={`h-4 w-4 ${accent ? "text-primary" : "text-muted-foreground"}`} />
    </CardHeader>
    <CardContent className="px-4 pb-4">
      <div className={`text-3xl font-bold ${accent ? "text-primary" : ""}`}>{value}</div>
      <p className="text-xs text-muted-foreground mt-1">{sub}</p>
    </CardContent>
  </Card>
);

export default function AnalyticsPage() {
  const { authFetch } = useAuth();
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const BASE = (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");

  useEffect(() => {
    authFetch(`${BASE}/api/analytics`)
      .then(r => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const submissionPie = data ? [
    { name: "已通过", value: data.submissionStats.approved, color: "#059669" },
    { name: "待审核", value: data.submissionStats.pending, color: "#D97706" },
    { name: "已拒绝", value: data.submissionStats.rejected, color: "#DC2626" },
  ].filter(d => d.value > 0) : [];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><BarChart3 className="h-6 w-6 text-primary" />数据统计</h1>
        <p className="text-muted-foreground text-sm mt-0.5">校园广播站运营数据分析</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {loading ? Array.from({ length: 4 }).map((_, i) => <Card key={i}><CardContent className="p-4"><Skeleton className="h-8 w-16" /><Skeleton className="h-3 w-20 mt-2" /></CardContent></Card>) : (
          <>
            <StatCard title="曲库总数" value={data?.libStats.total ?? 0} sub="已收录歌曲" icon={Music} accent />
            <StatCard title="累计播放" value={data?.libStats.totalPlays ?? 0} sub="总播放次数" icon={Disc3} />
            <StatCard title="点歌申请" value={data?.submissionStats.total ?? 0} sub="历史总申请" icon={Trophy} />
            <StatCard title="已播比例" value={data ? `${Math.round((data.libStats.played / Math.max(data.libStats.total, 1)) * 100)}%` : "—"} sub="曲库覆盖率" icon={TrendingUp} />
          </>
        )}
      </div>

      {/* Daily trend + Submission pie */}
      <div className="grid md:grid-cols-2 gap-5">
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" />近14天播放趋势</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-48 w-full" /> : (
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={data?.dailyTrend ?? []} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: "8px" }} />
                  <Line type="monotone" dataKey="count" stroke="#7C3AED" strokeWidth={2} dot={false} name="播放次数" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2"><Trophy className="h-4 w-4 text-amber-500" />点歌申请状态</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-48 w-full" /> : submissionPie.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">暂无数据</div>
            ) : (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="50%" height={160}>
                  <PieChart>
                    <Pie data={submissionPie} cx="50%" cy="50%" outerRadius={60} dataKey="value">
                      {submissionPie.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: "8px" }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2">
                  {submissionPie.map(d => (
                    <div key={d.name} className="flex items-center gap-2 text-sm">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ background: d.color }} />
                      <span className="flex-1 text-muted-foreground">{d.name}</span>
                      <span className="font-bold">{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Songs */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2"><Music className="h-4 w-4 text-primary" />播放最多的歌曲 Top 10</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? <Skeleton className="h-52 w-full" /> : !data?.topSongs.length ? (
            <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">暂无播放记录</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.topSongs.slice(0, 8)} layout="vertical" margin={{ top: 0, right: 20, left: 4, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                <YAxis type="category" dataKey="title" tick={{ fontSize: 11 }} width={90} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: "8px" }} formatter={(v) => [v, "播放次数"]} />
                <Bar dataKey="plays" fill="#7C3AED" radius={[0, 4, 4, 0]} name="播放次数" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Top Artists + Broadcaster Activity */}
      <div className="grid md:grid-cols-2 gap-5">
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4 text-blue-500" />热门歌手 Top 8</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-48 w-full" /> : !data?.topArtists.filter(a => a.plays > 0).length ? (
              <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">暂无数据</div>
            ) : (
              <ResponsiveContainer width="100%" height={190}>
                <BarChart data={data.topArtists.filter(a => a.plays > 0).slice(0, 8)} layout="vertical" margin={{ top: 0, right: 20, left: 4, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                  <YAxis type="category" dataKey="artist" tick={{ fontSize: 11 }} width={80} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: "8px" }} formatter={(v) => [v, "播放次数"]} />
                  <Bar dataKey="plays" fill="#2563EB" radius={[0, 4, 4, 0]} name="播放次数" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2"><Disc3 className="h-4 w-4 text-green-500" />播音员活跃度</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-48 w-full" /> : !data?.broadcasterActivity.length ? (
              <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">暂无播放记录</div>
            ) : (
              <div className="space-y-2.5">
                {data.broadcasterActivity.slice(0, 8).map((b, i) => (
                  <div key={b.name} className="flex items-center gap-2.5">
                    <span className={`w-6 h-6 rounded-full text-xs font-black flex items-center justify-center shrink-0 ${i < 3 ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}>{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <span className="text-sm font-medium truncate">{b.name}</span>
                        <span className="text-xs text-muted-foreground shrink-0">{b.count} 次</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${(b.count / (data.broadcasterActivity[0]?.count || 1)) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Genre Breakdown */}
      {!loading && (data?.genreBreakdown.length ?? 0) > 1 && (
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">曲库风格分布</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {data!.genreBreakdown.slice(0, 12).map((g, i) => (
                <div key={g.genre} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-white" style={{ background: COLORS[i % COLORS.length] }}>
                  {g.genre} <span className="opacity-80">({g.count})</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
