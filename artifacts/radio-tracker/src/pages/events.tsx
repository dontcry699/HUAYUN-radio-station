import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Pencil, Trash2, Star, StarOff, CalendarDays, Loader2 } from "lucide-react";

interface Event {
  id: number;
  name: string;
  eventType: string;
  description: string | null;
  bannerColor: string;
  emoji: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

const EVENT_TYPES = [
  { value: "general", label: "常规活动" },
  { value: "holiday", label: "节日庆典" },
  { value: "ceremony", label: "典礼活动" },
  { value: "sports", label: "体育活动" },
  { value: "academic", label: "学术活动" },
];

const COLOR_PRESETS = [
  "#7C3AED", "#2563EB", "#059669", "#DC2626", "#D97706",
  "#DB2777", "#0891B2", "#65A30D",
];

const EMOJI_PRESETS = ["🎉", "🏆", "🎓", "🌸", "⭐", "🎵", "🎊", "🌟", "🏅", "🎭"];

function EventForm({ initial, onSave, onCancel, saving }: {
  initial?: Partial<Event>;
  onSave: (data: Partial<Event>) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<Partial<Event>>({
    name: "", eventType: "general", description: "", bannerColor: "#7C3AED",
    emoji: "🎉", startDate: "", endDate: "", isActive: true,
    ...initial,
  });
  const set = (k: keyof Event) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="text-sm font-medium">活动名称 *</label>
          <Input className="mt-1" placeholder="例：教师节特别广播" value={form.name ?? ""} onChange={set("name")} />
        </div>
        <div>
          <label className="text-sm font-medium">活动类型</label>
          <select className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.eventType} onChange={set("eventType")}>
            {EVENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium">活动图标</label>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {EMOJI_PRESETS.map(e => (
              <button key={e} type="button" onClick={() => setForm(f => ({ ...f, emoji: e }))}
                className={`w-8 h-8 rounded-lg text-lg flex items-center justify-center border-2 transition-all ${form.emoji === e ? "border-primary bg-primary/10" : "border-transparent hover:border-muted-foreground/30"}`}>
                {e}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-sm font-medium">开始日期 *</label>
          <Input type="date" className="mt-1" value={form.startDate ?? ""} onChange={set("startDate")} />
        </div>
        <div>
          <label className="text-sm font-medium">结束日期 *</label>
          <Input type="date" className="mt-1" value={form.endDate ?? ""} onChange={set("endDate")} />
        </div>
        <div className="col-span-2">
          <label className="text-sm font-medium">主题颜色</label>
          <div className="mt-1 flex gap-2 items-center flex-wrap">
            {COLOR_PRESETS.map(c => (
              <button key={c} type="button" onClick={() => setForm(f => ({ ...f, bannerColor: c }))}
                className={`w-7 h-7 rounded-full border-2 transition-all ${form.bannerColor === c ? "scale-125 border-foreground" : "border-transparent"}`}
                style={{ background: c }} />
            ))}
            <Input type="color" value={form.bannerColor} onChange={set("bannerColor")} className="h-7 w-12 p-0 cursor-pointer" />
          </div>
        </div>
        <div className="col-span-2">
          <label className="text-sm font-medium">活动介绍（选填）</label>
          <Textarea className="mt-1" rows={3} placeholder="活动的简要说明，将显示在首页横幅上" value={form.description ?? ""} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>取消</Button>
        <Button onClick={() => onSave(form)} disabled={saving || !form.name || !form.startDate || !form.endDate}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
          {initial?.id ? "保存修改" : "创建活动"}
        </Button>
      </DialogFooter>
    </div>
  );
}

export default function EventsPage() {
  const { authFetch } = useAuth();
  const { toast } = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editEvent, setEditEvent] = useState<Event | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const BASE = (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");

  const reload = async () => {
    setLoading(true);
    try {
      const r = await authFetch(`${BASE}/api/events`);
      setEvents(await r.json());
    } catch { toast({ title: "加载失败", variant: "destructive" }); }
    finally { setLoading(false); }
  };

  useEffect(() => { reload(); }, []);

  const handleCreate = async (data: Partial<Event>) => {
    setSaving(true);
    try {
      const r = await authFetch(`${BASE}/api/events`, { method: "POST", body: JSON.stringify(data) });
      if (!r.ok) { toast({ title: "创建失败", variant: "destructive" }); return; }
      setCreateOpen(false); await reload();
      toast({ title: "活动已创建" });
    } finally { setSaving(false); }
  };

  const handleEdit = async (data: Partial<Event>) => {
    if (!editEvent) return;
    setSaving(true);
    try {
      const r = await authFetch(`${BASE}/api/events/${editEvent.id}`, { method: "PATCH", body: JSON.stringify(data) });
      if (!r.ok) { toast({ title: "保存失败", variant: "destructive" }); return; }
      setEditEvent(null); await reload();
      toast({ title: "活动已更新" });
    } finally { setSaving(false); }
  };

  const toggleActive = async (ev: Event) => {
    await authFetch(`${BASE}/api/events/${ev.id}`, { method: "PATCH", body: JSON.stringify({ isActive: !ev.isActive }) });
    await reload();
    toast({ title: ev.isActive ? "活动已停用" : "活动已启用" });
  };

  const handleDelete = async (id: number) => {
    await authFetch(`${BASE}/api/events/${id}`, { method: "DELETE" });
    setDeleteId(null); await reload();
    toast({ title: "活动已删除" });
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><CalendarDays className="h-6 w-6 text-primary" />活动管理</h1>
          <p className="text-muted-foreground text-sm mt-0.5">管理校园特别活动，活动期间首页显示专属横幅</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" />新建活动</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>新建校园活动</DialogTitle><DialogDescription>创建后将在指定日期范围内自动在首页显示</DialogDescription></DialogHeader>
            <EventForm onSave={handleCreate} onCancel={() => setCreateOpen(false)} saving={saving} />
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 gap-4">{[1,2,3,4].map(i => <Card key={i}><CardHeader><Skeleton className="h-5 w-2/3" /></CardHeader><CardContent><Skeleton className="h-12 w-full" /></CardContent></Card>)}</div>
      ) : !events.length ? (
        <div className="text-center py-20 border border-dashed rounded-2xl text-muted-foreground">
          <CalendarDays className="h-14 w-14 mx-auto mb-4 opacity-20" />
          <p className="font-semibold text-lg text-foreground">暂无活动</p>
          <p className="text-sm mt-1">点击「新建活动」创建第一个校园特别活动</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {events.map(ev => {
            const isDateActive = ev.startDate <= today && ev.endDate >= today;
            const isCurrentlyActive = ev.isActive && isDateActive;
            return (
              <Card key={ev.id} className={`overflow-hidden border-l-4 ${isCurrentlyActive ? "border-l-green-500" : "border-l-muted-foreground/20"}`}>
                <div className="h-2" style={{ background: ev.bannerColor }} />
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xl">{ev.emoji}</span>
                        <CardTitle className="text-base">{ev.name}</CardTitle>
                        {isCurrentlyActive && <Badge className="bg-green-500 text-white text-[10px]">进行中</Badge>}
                        {!ev.isActive && <Badge variant="outline" className="text-[10px]">已停用</Badge>}
                        {ev.isActive && !isDateActive && <Badge variant="secondary" className="text-[10px]">{ev.startDate > today ? "未开始" : "已结束"}</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{ev.startDate} — {ev.endDate}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pb-2">
                  {ev.description && <p className="text-sm text-muted-foreground line-clamp-2">{ev.description}</p>}
                  <div className="mt-2 flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ background: ev.bannerColor }} />
                    <span className="text-xs text-muted-foreground">{EVENT_TYPES.find(t => t.value === ev.eventType)?.label ?? ev.eventType}</span>
                  </div>
                </CardContent>
                <CardFooter className="pt-2 border-t bg-muted/20 gap-2">
                  <Button size="sm" variant="outline" className="text-xs gap-1" onClick={() => toggleActive(ev)}>
                    {ev.isActive ? <StarOff className="h-3 w-3" /> : <Star className="h-3 w-3" />}
                    {ev.isActive ? "停用" : "启用"}
                  </Button>
                  <Button size="sm" variant="ghost" className="text-xs gap-1" onClick={() => setEditEvent(ev)}>
                    <Pencil className="h-3 w-3" />编辑
                  </Button>
                  <Button size="sm" variant="ghost" className="text-xs gap-1 text-destructive hover:text-destructive hover:bg-destructive/10 ml-auto" onClick={() => setDeleteId(ev.id)}>
                    <Trash2 className="h-3 w-3" />删除
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editEvent} onOpenChange={o => !o && setEditEvent(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>编辑活动</DialogTitle></DialogHeader>
          {editEvent && <EventForm initial={editEvent} onSave={handleEdit} onCancel={() => setEditEvent(null)} saving={saving} />}
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={deleteId !== null} onOpenChange={o => !o && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>删除确认</DialogTitle><DialogDescription>确定要删除此活动吗？此操作不可撤销。</DialogDescription></DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>取消</Button>
            <Button variant="destructive" onClick={() => deleteId !== null && handleDelete(deleteId)}>确认删除</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
