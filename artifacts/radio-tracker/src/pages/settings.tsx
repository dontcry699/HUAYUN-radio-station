import { Settings, RadioTower, Clock, Music2, Shield, Bell, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const INFO_ITEMS = [
  { label: "系统名称", value: "校园之声广播站" },
  { label: "英文名称", value: "Voice of Campus Radio" },
  { label: "系统口号", value: "让音乐连接校园生活" },
  { label: "系统版本", value: "v1.0.0" },
];

const SCHEDULE_ITEMS = [
  { time: "17:30", label: "晚自习开始" },
  { time: "18:15", label: "音乐广播开始" },
  { time: "18:35", label: "音乐广播结束" },
  { time: "20:10", label: "放学" },
];

const ADMIN_FUNCTIONS = [
  { icon: Music2, label: "歌曲库管理", desc: "添加、编辑、删除曲库歌曲，记录播放历史" },
  { icon: Bell, label: "点歌审核", desc: "审核同学提交的点歌申请，通过或拒绝" },
  { icon: RadioTower, label: "公告发布", desc: "发布校园公告，管理通知的显示与隐藏" },
  { icon: Shield, label: "系统管理", desc: "管理广播站相关设置与数据" },
];

export default function SettingsPage() {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="h-6 w-6 text-muted-foreground" />系统设置
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">校园之声广播站管理系统</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* System Info */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Info className="h-4 w-4 text-primary" />系统信息
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-center py-4">
              <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-md">
                <RadioTower className="h-8 w-8 text-white" />
              </div>
            </div>
            <div className="divide-y divide-border">
              {INFO_ITEMS.map(({ label, value }) => (
                <div key={label} className="flex justify-between items-center py-2.5 text-sm">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium text-right">{value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Broadcast Schedule */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />广播时间设置
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">当前广播时间表（固定）</p>
              <div className="divide-y divide-border rounded-xl border overflow-hidden">
                {SCHEDULE_ITEMS.map(({ time, label }) => (
                  <div key={time} className="flex justify-between items-center px-4 py-3 text-sm bg-card">
                    <span className="font-mono font-bold text-primary">{time}</span>
                    <span className="text-foreground">{label}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">如需修改广播时间，请联系系统管理员。</p>
            </div>
          </CardContent>
        </Card>

        {/* Admin Functions */}
        <Card className="shadow-sm md:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />管理员功能
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-3">
              {ADMIN_FUNCTIONS.map(({ icon: Icon, label, desc }) => (
                <div key={label} className="flex gap-3 p-4 rounded-xl border bg-muted/30">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg shrink-0 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 p-4 rounded-xl border border-amber-200 bg-amber-50/50 text-sm">
              <p className="font-semibold text-amber-800 mb-1">关于管理员账号</p>
              <p className="text-amber-700/80">
                当前系统为单一管理界面模式。若需启用学生/管理员分权功能（管理员登录验证），请联系技术支持进行系统升级配置。
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
