import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useListSubmissions, getListSubmissionsQueryKey,
  useCreateSubmission, useUpdateSubmission, useDeleteSubmission,
  Submission,
} from "@workspace/api-client-react";
import { ClipboardList, CheckCircle, XCircle, Clock, Trash2, Check, X, MessageSquare, Send, Heart, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

const ART_PALETTES: [string, string][] = [
  ["#F59E0B","#EF4444"],["#3B82F6","#8B5CF6"],["#10B981","#3B82F6"],
  ["#F97316","#EC4899"],["#6366F1","#A78BFA"],["#14B8A6","#3B82F6"],
];
function artColors(s: string): [string, string] {
  const h = s.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return ART_PALETTES[h % ART_PALETTES.length];
}

const submitSchema = z.object({
  title: z.string().min(1, "请填写歌曲名称"),
  artist: z.string().min(1, "请填写歌手名称"),
  isAnonymous: z.boolean().default(false),
  studentName: z.string().optional(),
  grade: z.string().optional(),
  className: z.string().optional(),
  message: z.string().optional(),
  hasDedication: z.boolean().default(false),
  dedicationTo: z.string().optional(),
  dedicationMessage: z.string().optional(),
});
type SubmitFormValues = z.infer<typeof submitSchema>;

function SubmitForm({ onSuccess }: { onSuccess: () => void }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const createSubmission = useCreateSubmission();

  const form = useForm<SubmitFormValues>({
    resolver: zodResolver(submitSchema),
    defaultValues: {
      title: "", artist: "", isAnonymous: false, studentName: "", grade: "",
      className: "", message: "", hasDedication: false, dedicationTo: "", dedicationMessage: "",
    },
  });

  const isAnonymous = form.watch("isAnonymous");
  const hasDedication = form.watch("hasDedication");

  const onSubmit = (data: SubmitFormValues) => {
    createSubmission.mutate({
      data: {
        title: data.title,
        artist: data.artist,
        isAnonymous: data.isAnonymous,
        studentName: data.isAnonymous ? undefined : data.studentName || undefined,
        grade: data.grade || undefined,
        className: data.className || undefined,
        message: data.message || undefined,
        dedicationTo: data.hasDedication ? data.dedicationTo || undefined : undefined,
        dedicationMessage: data.hasDedication ? data.dedicationMessage || undefined : undefined,
      },
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListSubmissionsQueryKey() });
        form.reset();
        onSuccess();
        toast({ title: "点歌成功！", description: "您的申请已提交，等待广播站审核。" });
      },
      onError: () => toast({ title: "提交失败", description: "请稍后再试。", variant: "destructive" }),
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
        <div className="grid grid-cols-2 gap-3">
          <FormField control={form.control} name="title" render={({ field }) => (
            <FormItem><FormLabel>歌曲名称 *</FormLabel><FormControl><Input placeholder="例：稻香" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="artist" render={({ field }) => (
            <FormItem><FormLabel>歌手 *</FormLabel><FormControl><Input placeholder="例：周杰伦" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
        </div>

        <FormField control={form.control} name="isAnonymous" render={({ field }) => (
          <FormItem className="flex items-center gap-2 space-y-0">
            <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
            <FormLabel className="font-normal cursor-pointer">匿名投稿</FormLabel>
          </FormItem>
        )} />

        {!isAnonymous && (
          <FormField control={form.control} name="studentName" render={({ field }) => (
            <FormItem><FormLabel>投稿人</FormLabel><FormControl><Input placeholder="您的姓名" {...field} /></FormControl></FormItem>
          )} />
        )}

        <div className="grid grid-cols-2 gap-3">
          <FormField control={form.control} name="grade" render={({ field }) => (
            <FormItem><FormLabel>年级（选填）</FormLabel><FormControl><Input placeholder="例：高二" {...field} /></FormControl></FormItem>
          )} />
          <FormField control={form.control} name="className" render={({ field }) => (
            <FormItem><FormLabel>班级（选填）</FormLabel><FormControl><Input placeholder="例：三班" {...field} /></FormControl></FormItem>
          )} />
        </div>

        <FormField control={form.control} name="message" render={({ field }) => (
          <FormItem><FormLabel>祝福留言（选填）</FormLabel><FormControl><Textarea placeholder="向广播站说点什么…" rows={2} {...field} /></FormControl></FormItem>
        )} />

        <div className="border rounded-xl p-4 space-y-3 bg-pink-50/50">
          <FormField control={form.control} name="hasDedication" render={({ field }) => (
            <FormItem className="flex items-center gap-2 space-y-0">
              <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
              <FormLabel className="font-semibold cursor-pointer flex items-center gap-1.5">
                <Heart className="h-3.5 w-3.5 text-pink-500" />添加寄语
              </FormLabel>
            </FormItem>
          )} />
          {hasDedication && (
            <div className="space-y-3">
              <FormField control={form.control} name="dedicationTo" render={({ field }) => (
                <FormItem><FormLabel>送给</FormLabel><FormControl><Input placeholder="例：高三全体同学" {...field} /></FormControl></FormItem>
              )} />
              <FormField control={form.control} name="dedicationMessage" render={({ field }) => (
                <FormItem><FormLabel>寄语内容</FormLabel><FormControl><Textarea placeholder="写下您的祝福…" rows={2} {...field} /></FormControl></FormItem>
              )} />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="submit" disabled={createSubmission.isPending} className="w-full">
            {createSubmission.isPending ? "提交中…" : "提交点歌"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

type StatusTab = "pending" | "approved" | "rejected" | "all";
const STATUS_BORDER: Record<string, string> = {
  pending: "border-l-amber-400",
  approved: "border-l-green-500",
  rejected: "border-l-red-400",
};
const STATUS_LABEL: Record<string, string> = { pending: "待审核", approved: "已通过", rejected: "已拒绝" };
const STATUS_CLS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700 border-amber-200",
  approved: "bg-green-100 text-green-700 border-green-200",
  rejected: "bg-red-100 text-red-700 border-red-200",
};

export default function Submissions() {
  const [tab, setTab] = useState<StatusTab>("pending");
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [reviewFor, setReviewFor] = useState<{ sub: Submission; action: "approve" | "reject" } | null>(null);
  const [reviewNote, setReviewNote] = useState("");

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: submissions, isLoading } = useListSubmissions(
    { status: tab },
    { query: { queryKey: getListSubmissionsQueryKey({ status: tab }) } }
  );
  const updateSubmission = useUpdateSubmission();
  const deleteSubmission = useDeleteSubmission();

  const handleReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewFor) return;
    const newStatus = reviewFor.action === "approve" ? "approved" : "rejected";
    updateSubmission.mutate({ id: reviewFor.sub.id, data: { status: newStatus, reviewNote: reviewNote || undefined } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListSubmissionsQueryKey() });
        setReviewFor(null);
        setReviewNote("");
        toast({ title: reviewFor.action === "approve" ? "已通过审核" : "已拒绝申请" });
      },
      onError: () => toast({ title: "操作失败", variant: "destructive" }),
    });
  };

  const handleDelete = (id: number) => {
    deleteSubmission.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListSubmissionsQueryKey() });
        toast({ title: "已删除" });
      },
    });
  };

  const emptyIcons: Record<string, typeof Clock> = { pending: Clock, approved: CheckCircle, rejected: XCircle, all: ClipboardList };
  const EmptyIcon = emptyIcons[tab];

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">点歌审核</h1>
          <p className="text-muted-foreground text-sm mt-0.5">审核同学提交的歌曲申请</p>
        </div>
        <Dialog open={isSubmitOpen} onOpenChange={setIsSubmitOpen}>
          <DialogTrigger asChild>
            <Button className="font-semibold gap-2">
              <Send className="h-4 w-4" />我要点歌
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>我要点歌</DialogTitle>
              <DialogDescription>向校园广播站推荐你喜欢的歌曲（18:15 广播时段播出）</DialogDescription>
            </DialogHeader>
            <SubmitForm onSuccess={() => setIsSubmitOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={tab} onValueChange={v => setTab(v as StatusTab)}>
        <TabsList className="bg-card border">
          <TabsTrigger value="pending"><Clock className="w-3.5 h-3.5 mr-1.5" />待审核</TabsTrigger>
          <TabsTrigger value="approved"><CheckCircle className="w-3.5 h-3.5 mr-1.5" />已通过</TabsTrigger>
          <TabsTrigger value="rejected"><XCircle className="w-3.5 h-3.5 mr-1.5" />已拒绝</TabsTrigger>
          <TabsTrigger value="all">全部</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}><CardHeader><Skeleton className="h-6 w-3/4" /><Skeleton className="h-4 w-1/2 mt-1" /></CardHeader><CardContent><Skeleton className="h-16 w-full" /></CardContent></Card>
          ))
        ) : !submissions?.length ? (
          <div className="col-span-full py-14 text-center text-muted-foreground border border-dashed rounded-xl">
            <EmptyIcon className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <h3 className="text-lg font-semibold text-foreground">暂无点歌申请</h3>
            <p className="text-sm mt-1">{tab === "all" ? "还没有任何点歌记录" : `没有${STATUS_LABEL[tab]}的申请`}</p>
          </div>
        ) : (
          submissions.map(sub => {
            const [c1, c2] = artColors(sub.title);
            return (
              <Card key={sub.id} className={`flex flex-col overflow-hidden hover:shadow-md transition-shadow border-l-4 ${STATUS_BORDER[sub.status] ?? "border-l-gray-200"}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 rounded-xl shrink-0 flex items-center justify-center text-white font-black text-lg" style={{ background: `linear-gradient(135deg,${c1},${c2})` }}>
                      {sub.title.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base leading-tight truncate">{sub.title}</CardTitle>
                      <p className="text-sm text-muted-foreground">{sub.artist}</p>
                    </div>
                    <span className={`shrink-0 px-2 py-0.5 rounded-full border text-[10px] font-bold ${STATUS_CLS[sub.status]}`}>
                      {STATUS_LABEL[sub.status]}
                    </span>
                  </div>
                </CardHeader>

                <CardContent className="pb-3 flex-1 space-y-2 text-sm">
                  <div className="bg-muted/50 rounded-lg p-2.5 text-xs space-y-0.5">
                    <div className="flex items-center gap-1.5 font-semibold">
                      <User className="h-3 w-3 text-muted-foreground" />
                      投稿人：{sub.isAnonymous ? "匿名" : (sub.studentName || "未填写")}
                    </div>
                    {(sub.grade || sub.className) && (
                      <div className="text-muted-foreground pl-4">
                        {[sub.grade, sub.className ? `${sub.className}班` : ""].filter(Boolean).join("（") + (sub.className ? "）" : "")}
                      </div>
                    )}
                    <div className="text-muted-foreground pl-4">{formatDistanceToNow(new Date(sub.createdAt), { addSuffix: true })}</div>
                  </div>

                  {sub.message && (
                    <div className="flex gap-2 text-xs border rounded-lg p-2.5 bg-background">
                      <MessageSquare className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                      <p className="italic text-muted-foreground line-clamp-2">"{sub.message}"</p>
                    </div>
                  )}

                  {(sub.dedicationTo || sub.dedicationMessage) && (
                    <div className="border rounded-lg p-2.5 bg-pink-50/60 border-pink-100 text-xs space-y-1">
                      <div className="flex items-center gap-1 font-semibold text-pink-600">
                        <Heart className="h-3 w-3" />送给：{sub.dedicationTo || "—"}
                      </div>
                      {sub.dedicationMessage && <p className="text-pink-500 italic line-clamp-2">"{sub.dedicationMessage}"</p>}
                    </div>
                  )}

                  {sub.reviewNote && sub.status !== "pending" && (
                    <div className="text-xs border-l-2 pl-2 border-primary/50 text-foreground/70">
                      <span className="font-semibold">审核意见：</span>{sub.reviewNote}
                    </div>
                  )}
                </CardContent>

                <CardFooter className="pt-2 border-t bg-muted/20 gap-2">
                  {sub.status === "pending" ? (
                    <>
                      <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs gap-1" onClick={() => setReviewFor({ sub, action: "approve" })}>
                        <Check className="w-3.5 h-3.5" />通过审核
                      </Button>
                      <Button size="sm" variant="destructive" className="flex-1 text-xs gap-1" onClick={() => setReviewFor({ sub, action: "reject" })}>
                        <X className="w-3.5 h-3.5" />拒绝申请
                      </Button>
                    </>
                  ) : (
                    <Button size="sm" variant="ghost" className="w-full text-xs text-destructive hover:text-destructive hover:bg-destructive/10 gap-1" onClick={() => handleDelete(sub.id)}>
                      <Trash2 className="w-3.5 h-3.5" />删除记录
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })
        )}
      </div>

      {/* Review Dialog */}
      <Dialog open={!!reviewFor} onOpenChange={open => { if (!open) { setReviewFor(null); setReviewNote(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reviewFor?.action === "approve" ? "通过审核" : "拒绝申请"} — 《{reviewFor?.sub.title}》
            </DialogTitle>
            <DialogDescription>
              {reviewFor?.action === "approve" ? "确认通过此歌曲的点歌申请。" : "拒绝此申请，可填写拒绝理由。"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleReview} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">审核意见（选填）</label>
              <Textarea value={reviewNote} onChange={e => setReviewNote(e.target.value)} placeholder={reviewFor?.action === "approve" ? "例：好歌！已加入播放列表" : "例：歌词内容不适合校园广播"} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setReviewFor(null); setReviewNote(""); }}>取消</Button>
              <Button
                type="submit"
                disabled={updateSubmission.isPending}
                className={reviewFor?.action === "approve" ? "bg-green-600 hover:bg-green-700 text-white" : ""}
                variant={reviewFor?.action === "approve" ? "default" : "destructive"}
              >
                {updateSubmission.isPending ? "处理中…" : reviewFor?.action === "approve" ? "确认通过" : "确认拒绝"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
