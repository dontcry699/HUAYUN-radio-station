import { useState } from "react";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Music, Users, Megaphone, History, ClipboardList, MessageSquarePlus, Loader2, HardDrive, ShieldCheck } from "lucide-react";
import { formatBangkokDate } from "@/lib/time";

const EXPORTS = [
  { key: "songs",         label: "歌曲库",    icon: Music,            desc: "所有曲库歌曲及播放统计" },
  { key: "users",         label: "用户账号",  icon: Users,            desc: "工作人员账号（不含密码）" },
  { key: "announcements", label: "校园公告",  icon: Megaphone,        desc: "全部公告内容及状态" },
  { key: "history",       label: "播放历史",  icon: History,          desc: "广播播放详细记录" },
  { key: "submissions",   label: "点歌申请",  icon: ClipboardList,    desc: "全部点歌审核记录" },
  { key: "feedback",      label: "意见反馈",  icon: MessageSquarePlus,desc: "Beta 测试期间的反馈记录" },
];

export default function BackupPage() {
  const { authFetch } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const BASE = (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");

  const exportData = async (key: string, format: "json" | "csv") => {
    setLoading(l => ({ ...l, [`${key}-${format}`]: true }));
    try {
      const r = await authFetch(`${BASE}/api/export/${key}?format=${format}`);
      if (!r.ok) { toast({ title: "导出失败", variant: "destructive" }); return; }
      const blob = await r.blob();
      const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
      const filename = `campus-radio-${key}-${ts}.${format}`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
      URL.revokeObjectURL(url);
      toast({ title: `已导出 ${filename}` });
    } catch { toast({ title: "导出失败，请检查网络", variant: "destructive" }); }
    finally { setLoading(l => ({ ...l, [`${key}-${format}`]: false })); }
  };

  const exportAll = async (format: "json" | "csv") => {
    for (const { key } of EXPORTS) {
      await exportData(key, format);
      await new Promise(r => setTimeout(r, 300));
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <HardDrive className="h-6 w-6 text-muted-foreground" />数据备份
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">导出系统数据，防止数据丢失。支持 JSON 和 CSV 格式。</p>
      </div>

      {/* Safety notice */}
      <Card className="border-amber-200 bg-amber-50/50">
        <CardContent className="flex items-start gap-3 py-4">
          <ShieldCheck className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">数据安全提示</p>
            <p className="text-xs text-amber-700/80 mt-0.5">导出文件包含敏感数据，请妥善保管。用户密码字段已排除，不会出现在导出文件中。</p>
          </div>
        </CardContent>
      </Card>

      {/* One-click export all */}
      <Card className="shadow-sm">
        <CardContent className="py-5 flex flex-col sm:flex-row items-center gap-4">
          <div className="flex-1">
            <p className="font-bold">一键全量备份</p>
            <p className="text-sm text-muted-foreground">导出所有数据表为独立文件。备份时间：{formatBangkokDate(new Date())}</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button variant="outline" className="gap-2" onClick={() => exportAll("json")}>
              <Download className="h-4 w-4" />全部 JSON
            </Button>
            <Button variant="outline" className="gap-2" onClick={() => exportAll("csv")}>
              <Download className="h-4 w-4" />全部 CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Individual exports */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {EXPORTS.map(({ key, label, icon: Icon, desc }) => (
          <Card key={key} className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Icon className="h-4 w-4 text-primary" />{label}
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-3 space-y-3">
              <p className="text-xs text-muted-foreground">{desc}</p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 text-xs gap-1.5"
                  disabled={loading[`${key}-json`]}
                  onClick={() => exportData(key, "json")}
                >
                  {loading[`${key}-json`] ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
                  JSON
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 text-xs gap-1.5"
                  disabled={loading[`${key}-csv`]}
                  onClick={() => exportData(key, "csv")}
                >
                  {loading[`${key}-csv`] ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
                  CSV
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-center text-xs text-muted-foreground pt-2">
        建议每周备份一次数据，CSV 格式可直接用 Excel 打开（含 UTF-8 BOM）
      </div>
    </div>
  );
}
