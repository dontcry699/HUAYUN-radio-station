import { useState, useEffect } from "react";
import { Settings, RadioTower, Clock, Shield, Info, Save, RotateCcw, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth-context";
import { useScheduleConfig, invalidateScheduleCache, DEFAULT_SCHEDULE, ScheduleConfig } from "@/hooks/use-broadcast-status";

const SCHEDULE_FIELDS: { key: keyof ScheduleConfig; label: string; desc: string }[] = [
  { key: "schoolStart",     label: "上课时间",  desc: "每日课程开始时间" },
  { key: "broadcastStart",  label: "广播开始",  desc: "音乐广播正式开始时间" },
  { key: "broadcastEnd",    label: "广播结束",  desc: "音乐广播结束时间" },
  { key: "schoolEnd",       label: "放学时间",  desc: "课程结束，学生离校时间" },
];

export default function SettingsPage() {
  const { authFetch } = useAuth();
  const { toast } = useToast();
  const { cfg: remoteCfg, loading } = useScheduleConfig();
  const [local, setLocal] = useState<ScheduleConfig>(DEFAULT_SCHEDULE);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!loading) setLocal(remoteCfg);
  }, [loading, remoteCfg]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await authFetch("/api/config/schedule", {
        method: "PUT",
        body: JSON.stringify(local),
      });
      if (!res.ok) { const d = await res.json(); toast({ title: d.error || "保存失败", variant: "destructive" }); return; }
      invalidateScheduleCache();
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      toast({ title: "广播时间设置已保存", description: "所有页面将使用新时间。" });
    } catch {
      toast({ title: "保存失败，请检查网络", variant: "destructive" });
    } finally { setSaving(false); }
  };

  const handleReset = async () => {
    setLocal(DEFAULT_SCHEDULE);
    setSaving(true);
    try {
      await authFetch("/api/config/schedule", { method: "PUT", body: JSON.stringify(DEFAULT_SCHEDULE) });
      invalidateScheduleCache();
      toast({ title: "已恢复默认广播时间" });
    } catch { /* ignore */ } finally { setSaving(false); }
  };

  const update = (k: keyof ScheduleConfig) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setLocal(prev => ({ ...prev, [k]: e.target.value }));

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
            <CardTitle className="text-base flex items-center gap-2"><Info className="h-4 w-4 text-primary" />系统信息</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-3 mb-3">
              <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center shadow-md">
                <RadioTower className="h-7 w-7 text-white" />
              </div>
            </div>
            <div className="divide-y divide-border">
              {[
                ["系统名称", "校园之声广播站"],
                ["英文名称", "Voice of Campus Radio"],
                ["系统口号", "让音乐连接校园生活"],
                ["版本", "v2.1.0"],
                ["时区", "泰国时间（UTC+7）"],
                ["权限系统", "RBAC 角色访问控制"],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between items-center py-2.5 text-sm">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium text-right">{value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Configurable Schedule — saved to DB */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />广播时间配置
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">设置后立即生效，全站所有状态将使用新时间。</p>
            {loading ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />加载中…
              </div>
            ) : (
              <div className="space-y-3">
                {SCHEDULE_FIELDS.map(({ key, label, desc }) => (
                  <div key={key} className="flex items-center gap-3">
                    <div className="flex-1">
                      <label className="text-sm font-medium">{label}</label>
                      <p className="text-xs text-muted-foreground">{desc}</p>
                    </div>
                    <Input
                      type="time"
                      value={local[key]}
                      onChange={update(key)}
                      className="w-32 text-center font-mono font-bold"
                    />
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2 pt-2">
              <Button variant="outline" size="sm" className="gap-1.5" onClick={handleReset} disabled={saving}>
                <RotateCcw className="h-3.5 w-3.5" />重置默认
              </Button>
              <Button size="sm" className="flex-1 gap-1.5" onClick={handleSave} disabled={saving || loading}>
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                {saved ? "已保存 ✓" : saving ? "保存中…" : "保存设置"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Role Permissions */}
        <Card className="shadow-sm md:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2"><Shield className="h-4 w-4 text-primary" />权限说明</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-3 gap-3 mb-5">
              {[
                { role: "同学（无账号）", perms: ["查看公告（已发布）", "查看广播安排", "查看热门榜单", "提交点歌申请", "查看校园寄语"], color: "border-gray-200 bg-gray-50" },
                { role: "播音员", perms: ["歌曲库管理", "点歌审核（通过/拒绝）", "发布/隐藏公告", "查看所有内容"], color: "border-blue-200 bg-blue-50" },
                { role: "管理员", perms: ["播音员所有权限", "用户账号管理", "广播时间配置", "系统设置完整权限"], color: "border-purple-200 bg-purple-50" },
              ].map(({ role, perms, color }) => (
                <div key={role} className={`rounded-xl border p-3 ${color}`}>
                  <p className="font-bold text-sm mb-2">{role}</p>
                  <ul className="space-y-1">
                    {perms.map(p => <li key={p} className="text-xs text-gray-600 flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-primary/60 shrink-0" />{p}</li>)}
                  </ul>
                </div>
              ))}
            </div>
            <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 text-sm">
              <p className="font-semibold text-amber-800 mb-1">🔑 默认账号</p>
              <p className="text-amber-700/80">管理员：<code className="bg-amber-100 px-1.5 rounded font-mono">admin / admin2024</code>　　播音员：<code className="bg-amber-100 px-1.5 rounded font-mono">broadcaster / bc2024</code></p>
              <p className="text-amber-600/70 text-xs mt-1.5">登录后可在「用户管理」页面修改密码或创建新账号。</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
