import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { MessageSquarePlus, Bug, Lightbulb, Sparkles, CheckCircle, Clock, Trash2, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Feedback {
  id: number;
  type: string;
  title: string;
  content: string;
  submitterName: string | null;
  submitterRole: string;
  status: string;
  adminNote: string | null;
  createdAt: string;
}

const TYPE_META: Record<string, { label: string; icon: typeof Bug; color: string; bg: string }> = {
  bug:        { label: "缺陷报告", icon: Bug,        color: "text-red-600",    bg: "bg-red-50 border-red-200" },
  suggestion: { label: "改进建议", icon: Lightbulb,  color: "text-amber-600",  bg: "bg-amber-50 border-amber-200" },
  feature:    { label: "功能请求", icon: Sparkles,   color: "text-purple-600", bg: "bg-purple-50 border-purple-200" },
};

const STATUS_META: Record<string, { label: string; color: string }> = {
  pending:  { label: "待处理", color: "bg-amber-100 text-amber-700" },
  reviewed: { label: "已查看", color: "bg-blue-100 text-blue-700" },
  resolved: { label: "已解决", color: "bg-green-100 text-green-700" },
};

const ROLE_LABELS: Record<string, string> = { student: "同学", teacher: "老师", broadcaster: "播音员", other: "其他" };

export default function FeedbackPage() {
  const { isBroadcaster, isAdmin, authFetch } = useAuth();
  const { toast } = useToast();
  const [submitOpen, setSubmitOpen] = useState(false);
  const [list, setList] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [noteFor, setNoteFor] = useState<Feedback | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [filterType, setFilterType] = useState<string>("all");

  const [form, setForm] = useState({ type: "suggestion", title: "", content: "", submitterName: "", submitterRole: "student" });
  const BASE = (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");

  const reload = async () => {
    if (!isBroadcaster) return;
    setLoading(true);
    try {
      const r = await authFetch(`${BASE}/api/feedback`);
      setList(await r.json());
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  useEffect(() => { reload(); }, [isBroadcaster]);

  const handleSubmit = async () => {
    if (!form.title || !form.content) { toast({ title: "请填写标题和内容", variant: "destructive" }); return; }
    setSubmitting(true);
    try {
      const r = await fetch(`${BASE}/api/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!r.ok) { toast({ title: "提交失败", variant: "destructive" }); return; }
      toast({ title: "反馈已提交！", description: "感谢您的宝贵意见，广播站团队将认真阅读。" });
      setSubmitOpen(false);
      setForm({ type: "suggestion", title: "", content: "", submitterName: "", submitterRole: "student" });
      if (isBroadcaster) reload();
    } finally { setSubmitting(false); }
  };

  const updateStatus = async (id: number, status: string, note?: string) => {
    await authFetch(`${BASE}/api/feedback/${id}`, { method: "PATCH", body: JSON.stringify({ status, adminNote: note }) });
    await reload(); toast({ title: "已更新" });
    setNoteFor(null); setAdminNote("");
  };

  const handleDelete = async (id: number) => {
    await authFetch(`${BASE}/api/feedback/${id}`, { method: "DELETE" });
    setDeleteId(null); await reload(); toast({ title: "已删除" });
  };

  const filtered = filterType === "all" ? list : list.filter(f => f.type === filterType);
  const typeCounts = { all: list.length, bug: list.filter(f => f.type === "bug").length, suggestion: list.filter(f => f.type === "suggestion").length, feature: list.filter(f => f.type === "feature").length };

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><MessageSquarePlus className="h-6 w-6 text-primary" />意见反馈</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Beta 测试期间，欢迎提交问题报告和改进建议</p>
        </div>
        <Dialog open={submitOpen} onOpenChange={setSubmitOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><MessageSquarePlus className="h-4 w-4" />提交反馈</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>提交反馈</DialogTitle><DialogDescription>帮助我们改善校园广播平台</DialogDescription></DialogHeader>
            <div className="space-y-4">
              {/* Type */}
              <div>
                <label className="text-sm font-medium">反馈类型</label>
                <div className="mt-2 flex gap-2">
                  {Object.entries(TYPE_META).map(([k, v]) => (
                    <button key={k} type="button" onClick={() => setForm(f => ({ ...f, type: k }))}
                      className={`flex-1 flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 transition-all text-xs font-semibold ${form.type === k ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}>
                      <v.icon className={`h-5 w-5 ${v.color}`} />
                      {v.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">标题 *</label>
                <Input className="mt-1" placeholder="简短描述问题或建议" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium">详细描述 *</label>
                <Textarea className="mt-1" rows={4} placeholder="请详细描述您遇到的问题或您的建议…" value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">您的身份</label>
                  <select className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.submitterRole} onChange={e => setForm(f => ({ ...f, submitterRole: e.target.value }))}>
                    {Object.entries(ROLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">姓名（选填）</label>
                  <Input className="mt-1" placeholder="匿名可不填" value={form.submitterName} onChange={e => setForm(f => ({ ...f, submitterName: e.target.value }))} />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSubmitOpen(false)}>取消</Button>
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}提交
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Staff view */}
      {isBroadcaster ? (
        <>
          {/* Filter tabs */}
          <div className="flex gap-2 flex-wrap">
            {[["all", "全部"], ["bug", "缺陷报告"], ["suggestion", "改进建议"], ["feature", "功能请求"]].map(([k, v]) => (
              <button key={k} onClick={() => setFilterType(k)}
                className={`px-3 py-1.5 rounded-full text-sm border font-medium transition-all ${filterType === k ? "bg-primary text-white border-primary" : "bg-card border-border text-muted-foreground hover:border-primary/40"}`}>
                {v} <span className="ml-1 opacity-70">({typeCounts[k as keyof typeof typeCounts]})</span>
              </button>
            ))}
          </div>

          {loading ? (
            <div className="space-y-3">{[1,2,3].map(i => <Card key={i}><CardContent className="p-4"><Skeleton className="h-16 w-full" /></CardContent></Card>)}</div>
          ) : !filtered.length ? (
            <div className="text-center py-16 border border-dashed rounded-2xl text-muted-foreground">
              <MessageSquarePlus className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p className="font-semibold text-foreground">暂无反馈</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map(fb => {
                const meta = TYPE_META[fb.type] ?? TYPE_META.suggestion;
                const sMeta = STATUS_META[fb.status] ?? STATUS_META.pending;
                return (
                  <Card key={fb.id} className={`border-l-4 border-l-${fb.type === "bug" ? "red" : fb.type === "feature" ? "purple" : "amber"}-400`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2 flex-wrap">
                          <meta.icon className={`h-4 w-4 ${meta.color} shrink-0`} />
                          <span className="font-semibold text-sm">{fb.title}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${sMeta.color}`}>{sMeta.label}</span>
                          <span className="text-[10px] text-muted-foreground px-2 py-0.5 rounded-full bg-muted">{ROLE_LABELS[fb.submitterRole] ?? fb.submitterRole}{fb.submitterName ? ` · ${fb.submitterName}` : ""}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(fb.createdAt), { addSuffix: true })}</span>
                      </div>
                      <p className="text-sm text-foreground/80 mt-2 leading-relaxed">{fb.content}</p>
                      {fb.adminNote && <p className="text-xs text-primary bg-primary/5 rounded-lg px-3 py-2 mt-2 border border-primary/10">💬 {fb.adminNote}</p>}
                      {isAdmin && (
                        <div className="flex gap-2 mt-3 flex-wrap">
                          {fb.status === "pending" && <Button size="sm" variant="outline" className="text-xs gap-1 h-7" onClick={() => updateStatus(fb.id, "reviewed")}><CheckCircle className="h-3 w-3" />标记已查看</Button>}
                          {fb.status !== "resolved" && <Button size="sm" variant="outline" className="text-xs gap-1 h-7 text-green-600 border-green-300 hover:bg-green-50" onClick={() => updateStatus(fb.id, "resolved")}><CheckCircle className="h-3 w-3" />标记已解决</Button>}
                          <Button size="sm" variant="outline" className="text-xs gap-1 h-7" onClick={() => { setNoteFor(fb); setAdminNote(fb.adminNote ?? ""); }}><MessageSquarePlus className="h-3 w-3" />添加备注</Button>
                          <Button size="sm" variant="ghost" className="text-xs gap-1 h-7 text-destructive hover:bg-destructive/10 ml-auto" onClick={() => setDeleteId(fb.id)}><Trash2 className="h-3 w-3" />删除</Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      ) : (
        /* Public view */
        <div className="grid md:grid-cols-3 gap-4 mt-4">
          {Object.entries(TYPE_META).map(([k, v]) => (
            <Card key={k} className={`border ${v.bg} shadow-sm`}>
              <CardContent className="p-5 text-center">
                <v.icon className={`h-8 w-8 mx-auto mb-2 ${v.color}`} />
                <h3 className="font-bold mb-1">{v.label}</h3>
                <p className="text-xs text-muted-foreground">
                  {k === "bug" ? "发现系统错误？告诉我们！" : k === "suggestion" ? "有改进想法？欢迎分享！" : "想要新功能？提出来！"}
                </p>
              </CardContent>
            </Card>
          ))}
          <p className="col-span-full text-center text-sm text-muted-foreground pt-2">点击右上角「提交反馈」按钮提交您的意见，广播站团队将认真查看每一条反馈。</p>
        </div>
      )}

      {/* Admin note dialog */}
      <Dialog open={!!noteFor} onOpenChange={o => !o && setNoteFor(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>添加处理备注</DialogTitle></DialogHeader>
          <Textarea rows={3} value={adminNote} onChange={e => setAdminNote(e.target.value)} placeholder="写下处理备注…" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setNoteFor(null)}>取消</Button>
            <Button onClick={() => noteFor && updateStatus(noteFor.id, noteFor.status, adminNote)}>保存备注</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={deleteId !== null} onOpenChange={o => !o && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>删除确认</DialogTitle><DialogDescription>确定要删除此反馈记录？</DialogDescription></DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>取消</Button>
            <Button variant="destructive" onClick={() => deleteId !== null && handleDelete(deleteId)}>确认删除</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
