import { useState, useEffect } from "react";
import { Settings, RadioTower, Clock, Shield, Info, Save, RotateCcw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  loadScheduleConfig,
  saveScheduleConfig,
  ScheduleConfig,
} from "@/hooks/use-broadcast-status";

const DEFAULT: ScheduleConfig = {
  schoolStart: "17:30",
  broadcastStart: "18:15",
  broadcastEnd: "18:35",
  schoolEnd: "20:10",
};

const SCHEDULE_FIELDS: { key: keyof ScheduleConfig; label: string; desc: string }[] = [
  { key: "schoolStart", label: "上课时间", desc: "每日晚间课程开始时间" },
  { key: "broadcastStart", label: "广播开始", desc: "音乐广播正式开始时间" },
  { key: "broadcastEnd", label: "广播结束", desc: "音乐广播结束时间" },
  { key: "schoolEnd", label: "放学时间", desc: "课程结束，学生离校时间" },
];

const ADMIN_FUNCTIONS = [
  { label: "歌曲库管理", desc: "添加、编辑、删除曲库歌曲，记录播放历史", role: "播音员+" },
  { label: "点歌审核", desc: "审核同学提交的点歌申请，通过或拒绝", role: "播音员+" },
  { label: "公告发布", desc: "发布校园公告，管理通知的显示与隐藏", role: "播音员+" },
  { label: "用户管理", desc: "创建、编辑、禁用工作人员账号", role: "管理员" },
  { label: "系统设置", desc: "配置广播时间、查看系统状态", role: "管理员" },
];

export default function SettingsPage() {
  const { toast } = useToast();
  const [cfg, setCfg] = useState<ScheduleConfig>(DEFAULT);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setCfg(loadScheduleConfig());
  }, []);

  const handleSave = () => {
    saveScheduleConfig(cfg);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    // Dispatch storage event so other tabs update
    window.dispatchEvent(new StorageEvent("storage", { key: "cr-schedule" }));
    toast({ title: "广播时间设置已保存", description: "刷新页面后全站生效" });
  };

  const handleReset = () => {
    setCfg(DEFAULT);
    saveScheduleConfig(DEFAULT);
    window.dispatchEvent(new StorageEvent("storage", { key: "cr-schedule" }));
    toast({ title: "已恢复默认广播时间" });
  };

  const update = (k: keyof ScheduleConfig) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setCfg(prev => ({ ...prev, [k]: e.target.value }));

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="h-6 w-6 text-muted-foreground" />系统设置
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">校园之声广播站管理系统配置</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* System Info */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Info className="h-4 w-4 text-primary" />系统信息
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-4 mb-2">
              <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-md">
                <RadioTower className="h-8 w-8 text-white" />
              </div>
            </div>
            <div className="divide-y divide-border">
              {[
                ["系统名称", "校园之声广播站"],
                ["英文名称", "Voice of Campus Radio"],
                ["系统口号", "让音乐连接校园生活"],
                ["版本", "v2.0.0"],
                ["权限系统", "角色访问控制（RBAC）"],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between items-center py-2.5 text-sm">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium text-right">{value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Configurable Schedule */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />广播时间配置
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">修改后将更新全站广播状态显示。</p>
            <div className="space-y-3">
              {SCHEDULE_FIELDS.map(({ key, label, desc }) => (
                <div key={key} className="flex items-center gap-3">
                  <div className="flex-1">
                    <label className="text-sm font-medium">{label}</label>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                  <Input
                    type="time"
                    value={cfg[key]}
                    onChange={update(key)}
                    className="w-32 text-center font-mono font-bold"
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" size="sm" className="gap-1.5" onClick={handleReset}>
                <RotateCcw className="h-3.5 w-3.5" />重置默认
              </Button>
              <Button size="sm" className="flex-1 gap-1.5" onClick={handleSave}>
                <Save className="h-3.5 w-3.5" />{saved ? "已保存 ✓" : "保存设置"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Role Permissions */}
        <Card className="shadow-sm md:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />权限说明
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-3 gap-3 mb-4">
              {[
                { role: "同学（无账号）", perms: ["查看公告", "查看排行榜", "查看广播安排", "提交点歌申请", "查看寄语"], color: "border-gray-200 bg-gray-50" },
                { role: "播音员", perms: ["歌曲库管理", "点歌审核", "发布公告", "查看所有功能"], color: "border-blue-200 bg-blue-50" },
                { role: "管理员", perms: ["播音员所有权限", "用户管理", "系统设置配置", "完整访问权限"], color: "border-purple-200 bg-purple-50" },
              ].map(({ role, perms, color }) => (
                <div key={role} className={`rounded-xl border p-3 ${color}`}>
                  <p className="font-bold text-sm mb-2">{role}</p>
                  <ul className="space-y-1">
                    {perms.map(p => (
                      <li key={p} className="text-xs text-gray-600 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary/60 shrink-0" />{p}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 text-sm">
              <p className="font-semibold text-amber-800 mb-1">默认账号</p>
              <p className="text-amber-700/80">管理员：<code className="bg-amber-100 px-1 rounded">admin / admin2024</code>　播音员：<code className="bg-amber-100 px-1 rounded">broadcaster / bc2024</code>　登录后可在「用户管理」页面修改密码。</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
