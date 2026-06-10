import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useBroadcastStatus, SCHEDULE_ITEMS, toMinutes } from "@/hooks/use-broadcast-status";
import { Calendar, BookOpen, Music, Mic2, Users, RadioTower } from "lucide-react";

const PERIOD_INFO = [
  {
    time: "17:30",
    title: "晚自习开始",
    desc: "同学们进入教室，安静学习，准备迎接夜间的广播时段。",
    icon: BookOpen,
    color: "text-amber-500",
    bg: "bg-amber-50",
  },
  {
    time: "18:00",
    title: "广播前准备",
    desc: "广播站成员开始整理当日点歌单，调试设备，准备音乐广播。",
    icon: Mic2,
    color: "text-blue-500",
    bg: "bg-blue-50",
  },
  {
    time: "18:15",
    title: "音乐广播开始",
    desc: "校园之声正式开播！播放同学点歌、校园公告与美好祝福寄语。",
    icon: Music,
    color: "text-green-500",
    bg: "bg-green-50",
  },
  {
    time: "18:35",
    title: "音乐广播结束",
    desc: "广播结束，同学们回到安静的晚自习状态，继续努力学习。",
    icon: RadioTower,
    color: "text-purple-500",
    bg: "bg-purple-50",
  },
  {
    time: "20:10",
    title: "放学",
    desc: "今日晚自习结束，同学们有序离校，期待明天的校园广播！",
    icon: Users,
    color: "text-rose-500",
    bg: "bg-rose-50",
  },
];

export default function Schedule() {
  const { status, label } = useBroadcastStatus();
  const nowMinutes = toMinutes(new Date());

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Calendar className="h-6 w-6 text-primary" />广播安排
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">每日广播时间表与广播站工作安排</p>
      </div>

      {/* Current status banner */}
      <Card className="border-2 border-primary/30 bg-primary/5">
        <CardContent className="flex items-center gap-3 py-4">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shrink-0">
            <RadioTower className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-xs font-semibold text-primary/70 uppercase tracking-widest">当前状态</p>
            <p className="font-bold text-lg leading-tight">{label}</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Timeline */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">今日广播安排</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <div className="absolute left-[21px] top-4 bottom-4 w-0.5 bg-border" />
              <ol className="space-y-6">
                {SCHEDULE_ITEMS.map((item, idx) => {
                  const isPast = nowMinutes > item.minutes;
                  const isNext = !isPast && (idx === 0 || nowMinutes > SCHEDULE_ITEMS[idx - 1].minutes);
                  const pi = PERIOD_INFO[idx];
                  const Icon = pi.icon;

                  return (
                    <li key={item.time} className="flex gap-4 relative">
                      <div className={`w-10 h-10 rounded-full shrink-0 flex items-center justify-center z-10 transition-all ${
                        isNext ? "ring-4 ring-primary/20 " + pi.bg : isPast ? "bg-muted" : "bg-card border-2 border-border"
                      }`}>
                        <Icon className={`h-4 w-4 ${isNext ? pi.color : isPast ? "text-muted-foreground/40" : "text-muted-foreground/60"}`} />
                      </div>
                      <div className={`flex-1 pb-1 ${isPast && !isNext ? "opacity-50" : ""}`}>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className={`font-mono text-sm font-bold ${isNext ? "text-primary" : "text-muted-foreground"}`}>{item.time}</span>
                          {isNext && <span className="bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">即将</span>}
                          {isPast && <span className="bg-muted text-muted-foreground text-[10px] px-1.5 py-0.5 rounded-full">已过</span>}
                        </div>
                        <p className={`font-semibold text-sm ${isNext ? "text-primary" : ""}`}>{item.label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{pi.desc}</p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>
          </CardContent>
        </Card>

        {/* Info cards */}
        <div className="space-y-4">
          <Card className="shadow-sm border-l-4 border-l-primary">
            <CardContent className="py-4">
              <h3 className="font-bold mb-2 flex items-center gap-2"><Music className="h-4 w-4 text-primary" />关于音乐广播</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">每天 18:15—18:35，校园之声广播站准时播出20分钟精彩节目，内容包括同学点歌、校园公告、祝福寄语等。</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-l-4 border-l-blue-400">
            <CardContent className="py-4">
              <h3 className="font-bold mb-2 flex items-center gap-2"><Mic2 className="h-4 w-4 text-blue-500" />如何点歌</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">同学们可通过广播站"点歌审核"入口提交申请，填写歌曲名称、歌手、年级班级及祝福留言，广播站审核通过后将在当天或次日广播中播出。</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-l-4 border-l-amber-400">
            <CardContent className="py-4">
              <h3 className="font-bold mb-2 flex items-center gap-2"><Users className="h-4 w-4 text-amber-500" />加入广播站</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">校园之声广播站长期招募热爱音乐与播音的同学，欢迎有兴趣的同学联系班主任或到广播站办公室了解详情。</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
