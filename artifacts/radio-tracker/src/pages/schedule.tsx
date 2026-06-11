import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useBroadcastStatus, getScheduleItems, formatCountdown } from "@/hooks/use-broadcast-status";
import { ClockWidget } from "@/components/clock-widget";
import { bangkokParts } from "@/lib/time";
import { Calendar, BookOpen, Music, Mic2, Users, RadioTower } from "lucide-react";

const PERIOD_META = [
  { icon: BookOpen, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-950/20", desc: "同学们进入教室，课程正式开始，安静学习，广播站成员开始准备。" },
  { icon: Mic2,     color: "text-blue-500",  bg: "bg-blue-50 dark:bg-blue-950/20",   desc: "广播站成员整理当日点歌单，调试麦克风与音响设备，做好开播准备。" },
  { icon: Music,    color: "text-green-500", bg: "bg-green-50 dark:bg-green-950/20", desc: "校园之声正式开播！播放同学点歌、校园公告与美好祝福寄语。" },
  { icon: RadioTower, color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-950/20", desc: "今日广播结束，同学们回到安静的学习状态，继续努力加油。" },
  { icon: Users,    color: "text-rose-500",  bg: "bg-rose-50 dark:bg-rose-950/20",   desc: "今日课程结束，同学们有序离校，期待明天的校园广播！" },
];

export default function Schedule() {
  const { status, label, isLive, countdownSeconds, countdownLabel, cfg } = useBroadcastStatus();
  const [nowMin, setNowMin] = useState(() => bangkokParts().totalMinutes);
  const scheduleItems = getScheduleItems(cfg);

  useEffect(() => {
    const iv = setInterval(() => setNowMin(bangkokParts().totalMinutes), 5000);
    return () => clearInterval(iv);
  }, []);

  const STATUS_BADGE: Record<string, string> = {
    "school-not-started": "bg-gray-100 text-gray-600",
    "preparing": "bg-amber-100 text-amber-700",
    "live": "bg-green-100 text-green-700 font-bold",
    "study-session": "bg-blue-100 text-blue-700",
    "ended": "bg-gray-100 text-gray-500",
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Calendar className="h-6 w-6 text-primary" />广播安排
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">每日广播时间表与广播站工作安排</p>
      </div>

      {/* Status + Clock row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Current status */}
        <Card className="border-2 border-primary/30 bg-primary/5">
          <CardContent className="flex items-center gap-4 py-5">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shrink-0">
              <RadioTower className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-primary/70 uppercase tracking-widest mb-0.5">当前状态</p>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm ${STATUS_BADGE[status]}`}>
                  {isLive && <span className="w-2 h-2 rounded-full bg-green-500 live-dot" />}
                  {label}
                </span>
              </div>
              {countdownSeconds !== null && countdownSeconds > 0 && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{countdownLabel}：</span>
                  <span className="font-mono font-bold text-primary tabular-nums">{formatCountdown(countdownSeconds)}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <ClockWidget />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Timeline with ✓ ● ○ markers */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">今日广播时间表</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <div className="absolute left-[28px] top-5 bottom-5 w-0.5 bg-border" />
              <ol className="space-y-5">
                {scheduleItems.map((item, idx) => {
                  const isPast = nowMin > item.minutes;
                  const isCurrent = !isPast && (idx === 0 || nowMin >= scheduleItems[idx - 1].minutes);
                  const meta = PERIOD_META[idx];
                  const Icon = meta.icon;
                  const marker = isPast ? "✓" : isCurrent ? "●" : "○";

                  return (
                    <li key={item.time} className="flex gap-4 relative items-start">
                      {/* Circle icon */}
                      <div className={`w-14 h-14 rounded-full shrink-0 flex flex-col items-center justify-center z-10 border-2 transition-all ${
                        isCurrent ? `ring-4 ring-primary/20 border-primary ${meta.bg}` :
                        isPast ? "bg-muted border-border" : "bg-card border-border/60"
                      }`}>
                        <span className={`text-sm font-black ${isCurrent ? "text-primary" : isPast ? "text-muted-foreground/40" : "text-muted-foreground/50"}`}>
                          {marker}
                        </span>
                        <Icon className={`h-3.5 w-3.5 mt-0.5 ${isCurrent ? meta.color : isPast ? "text-muted-foreground/30" : "text-muted-foreground/40"}`} />
                      </div>

                      <div className={`flex-1 pb-1 ${isPast && !isCurrent ? "opacity-50" : ""}`}>
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <span className={`font-mono text-sm font-bold ${isCurrent ? "text-primary" : "text-muted-foreground"}`}>{item.time}</span>
                          {isCurrent && <span className="bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">当前</span>}
                          {isPast && !isCurrent && <span className="bg-muted text-muted-foreground text-[10px] px-1.5 py-0.5 rounded-full">已过</span>}
                        </div>
                        <p className={`font-semibold text-sm ${isCurrent ? "text-primary" : ""}`}>{item.label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{meta.desc}</p>
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
              <p className="text-sm text-muted-foreground leading-relaxed">每天 {cfg.broadcastStart}—{cfg.broadcastEnd}，校园之声广播站准时播出精彩节目，内容包括同学点歌、校园公告、祝福寄语等。</p>
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
          {/* Timezone note */}
          <Card className="shadow-sm border-l-4 border-l-green-400 bg-green-50/30">
            <CardContent className="py-4">
              <h3 className="font-bold mb-2 flex items-center gap-2 text-green-700">🕐 时区说明</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">所有时间均使用<strong>泰国时间（UTC+7，Asia/Bangkok）</strong>。广播状态与倒计时均实时更新。</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
