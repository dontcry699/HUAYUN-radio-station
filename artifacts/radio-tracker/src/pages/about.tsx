import { RadioTower, CheckCircle, Clock, Zap, Star, Github, Heart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const CHANGELOG = [
  {
    version: "V2.2 Beta",
    date: "2026-06-11",
    tag: "current",
    changes: [
      "新增活动模式：教师节、校庆、毕业季等特别横幅",
      "新增数据统计页：播放趋势、热门歌曲、歌手榜单、播音员活跃度",
      "新增意见反馈系统（Beta 内测工具）",
      "新增播放历史记录表，支持按广播员/日期筛选",
      "新增数据备份导出（JSON / CSV）",
      "广播状态实时倒计时精确到秒",
      "所有时间统一使用泰国时间（UTC+7 / Asia/Bangkok）",
    ],
  },
  {
    version: "V2.1",
    date: "2026-06-10",
    tag: "stable",
    changes: [
      "P1 权限系统重构：学生无法操作审核、公告管理",
      "P3 实时时钟组件：秒级更新，泰国时区显示",
      "P4 广播时间配置存入数据库，管理员可修改",
      "P5 广播状态自动更新，状态机完整实现",
      "P6 倒计时精确到秒（HH:mm:ss）",
      "P7 广播安排页：✓ ● ○ 高亮当前时段",
      "P8 学生端首页去除管理信息，聚焦广播内容",
    ],
  },
  {
    version: "V2.0",
    date: "2026-06-08",
    tag: "stable",
    changes: [
      "用户系统（admin / broadcaster 角色）",
      "登录页面与身份认证（Node.js crypto）",
      "角色访问控制（RBAC）",
      "歌曲库管理、点歌审核、公告系统",
      "播放历史与最近播放记录",
      "校园排行榜与校园寄语",
    ],
  },
  {
    version: "V1.0",
    date: "2026-06-05",
    tag: "legacy",
    changes: [
      "基础广播管理系统",
      "歌曲数据库 CRUD",
      "PostgreSQL + Drizzle ORM",
      "React + Vite 前端",
      "Express 5 后端 API",
    ],
  },
];

const UPCOMING = [
  { title: "QR Code 点歌", desc: "学生扫二维码直接提交点歌申请" },
  { title: "LINE 通知推送", desc: "广播开始时向关注者推送通知" },
  { title: "公告大屏幕模式", desc: "适合教室/走廊展示的全屏公告模式" },
  { title: "广播脚本管理", desc: "播音员可预先准备并保存广播稿" },
  { title: "听众投票", desc: "学生为下一首歌曲投票" },
];

const TAG_STYLE: Record<string, string> = {
  current: "bg-green-500 text-white",
  stable:  "bg-blue-100 text-blue-700",
  legacy:  "bg-gray-100 text-gray-500",
};
const TAG_LABEL: Record<string, string> = { current: "当前", stable: "稳定", legacy: "旧版" };

export default function AboutPage() {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-3xl">
      {/* Hero */}
      <Card className="overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-primary via-blue-500 to-purple-500" />
        <CardContent className="py-8 flex flex-col items-center text-center gap-3">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-lg">
            <RadioTower className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black">校园之声广播站</h1>
            <p className="text-muted-foreground text-sm mt-0.5">Voice of Campus Radio · 让音乐连接校园生活</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-center">
            <Badge className="bg-green-500 text-white px-3 py-1 text-sm font-bold">V2.2 Beta</Badge>
            <Badge variant="outline">2026-06-11</Badge>
            <Badge variant="secondary">泰中学校专用系统</Badge>
          </div>
          <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
            专为泰国华人中小学打造的校园广播管理平台，支持点歌审核、实时广播状态、校园公告、播音员管理等全套功能。
          </p>
        </CardContent>
      </Card>

      {/* Tech Stack */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2"><Zap className="h-4 w-4 text-amber-500" />技术规格</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              ["前端", "React 18 + Vite 7"],
              ["后端", "Express 5 + Node 24"],
              ["数据库", "PostgreSQL + Drizzle ORM"],
              ["验证", "Zod v4 + OpenAPI"],
              ["图表", "Recharts 2.15"],
              ["时区", "Asia/Bangkok (UTC+7)"],
              ["认证", "Node.js crypto (scrypt)"],
              ["UI", "shadcn/ui + Tailwind CSS"],
              ["权限", "RBAC 角色访问控制"],
            ].map(([k, v]) => (
              <div key={k} className="bg-muted/50 rounded-lg p-2.5">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">{k}</p>
                <p className="text-sm font-medium mt-0.5">{v}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2"><Star className="h-4 w-4 text-amber-500" />即将推出</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2.5">
            {UPCOMING.map(u => (
              <li key={u.title} className="flex items-start gap-3">
                <Clock className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold">{u.title}</p>
                  <p className="text-xs text-muted-foreground">{u.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Changelog */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold flex items-center gap-2"><CheckCircle className="h-5 w-5 text-primary" />更新日志</h2>
        {CHANGELOG.map(v => (
          <Card key={v.version} className="shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${TAG_STYLE[v.tag]}`}>{TAG_LABEL[v.tag]}</span>
                <CardTitle className="text-base">{v.version}</CardTitle>
                <span className="text-xs text-muted-foreground">{v.date}</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1.5">
                {v.changes.map(c => (
                  <li key={c} className="flex items-start gap-2 text-sm">
                    <CheckCircle className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-center text-xs text-muted-foreground pb-4 flex items-center justify-center gap-1">
        <Heart className="h-3 w-3 text-red-400" /> 用心构建，为校园广播而生
      </div>
    </div>
  );
}
