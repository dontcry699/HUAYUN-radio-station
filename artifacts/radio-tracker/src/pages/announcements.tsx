import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useListAnnouncements, getListAnnouncementsQueryKey,
  useCreateAnnouncement, useUpdateAnnouncement, useDeleteAnnouncement,
  ListAnnouncementsCategory,
} from "@workspace/api-client-react";
import { Megaphone, Plus, Trash2, Eye, EyeOff, Pin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

const announcementSchema = z.object({
  title: z.string().min(1, "请填写公告标题"),
  content: z.string().min(1, "请填写公告内容"),
  category: z.enum(["general", "music", "schedule", "other"]).default("general"),
});
type AnnouncementFormValues = z.infer<typeof announcementSchema>;

const CATEGORY_LABEL: Record<string, string> = {
  general: "综合通知",
  music: "音乐活动",
  schedule: "广播安排",
  other: "其他",
};
const CATEGORY_COLOR: Record<string, string> = {
  general: "bg-blue-100 text-blue-700 border-blue-200",
  music: "bg-purple-100 text-purple-700 border-purple-200",
  schedule: "bg-amber-100 text-amber-700 border-amber-200",
  other: "bg-gray-100 text-gray-600 border-gray-200",
};
const CATEGORY_BORDER: Record<string, string> = {
  general: "border-l-blue-400",
  music: "border-l-purple-400",
  schedule: "border-l-amber-400",
  other: "border-l-gray-300",
};

export default function Announcements() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const queryParams = categoryFilter === "all" ? {} : { category: categoryFilter as ListAnnouncementsCategory };
  const { data: announcements, isLoading } = useListAnnouncements(
    queryParams,
    { query: { queryKey: getListAnnouncementsQueryKey(queryParams) } }
  );

  const createAnnouncement = useCreateAnnouncement();
  const updateAnnouncement = useUpdateAnnouncement();
  const deleteAnnouncement = useDeleteAnnouncement();

  const form = useForm<AnnouncementFormValues>({
    resolver: zodResolver(announcementSchema),
    defaultValues: { title: "", content: "", category: "general" },
  });

  const onSubmit = (data: AnnouncementFormValues) => {
    createAnnouncement.mutate({ data: { ...data, isActive: true } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListAnnouncementsQueryKey() });
        setIsCreateOpen(false);
        form.reset();
        toast({ title: "公告已发布" });
      },
      onError: () => toast({ title: "发布失败", variant: "destructive" }),
    });
  };

  const toggleActive = (id: number, current: boolean) => {
    updateAnnouncement.mutate({ id, data: { isActive: !current } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListAnnouncementsQueryKey() });
        toast({ title: !current ? "公告已显示" : "公告已隐藏" });
      },
    });
  };

  const handleDelete = (id: number) => {
    deleteAnnouncement.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListAnnouncementsQueryKey() });
        setDeleteConfirmId(null);
        toast({ title: "公告已删除" });
      },
    });
  };

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Megaphone className="h-6 w-6 text-primary" />校园公告
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">广播站通知与校园动态</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="font-semibold gap-2">
              <Plus className="h-4 w-4" />发布公告
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>发布新公告</DialogTitle>
              <DialogDescription>在校园广播页面发布新的通知或公告</DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="title" render={({ field }) => (
                  <FormItem><FormLabel>公告标题 *</FormLabel><FormControl><Input placeholder="例：广播站招募新成员" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="category" render={({ field }) => (
                  <FormItem>
                    <FormLabel>分类</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="general">综合通知</SelectItem>
                          <SelectItem value="music">音乐活动</SelectItem>
                          <SelectItem value="schedule">广播安排</SelectItem>
                          <SelectItem value="other">其他</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="content" render={({ field }) => (
                  <FormItem><FormLabel>公告内容 *</FormLabel><FormControl><Textarea placeholder="填写公告详细内容…" rows={4} {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>取消</Button>
                  <Button type="submit" disabled={createAnnouncement.isPending}>
                    {createAnnouncement.isPending ? "发布中…" : "立即发布"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        {["all", "general", "music", "schedule", "other"].map(cat => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-3 py-1.5 rounded-full text-sm border transition-all font-medium ${
              categoryFilter === cat
                ? "bg-primary text-white border-primary shadow-sm"
                : "bg-card border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
            }`}
          >
            {cat === "all" ? "全部" : CATEGORY_LABEL[cat]}
          </button>
        ))}
      </div>

      {/* Cards */}
      {isLoading ? (
        <div className="space-y-4">{Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}><CardHeader><Skeleton className="h-5 w-2/3" /><Skeleton className="h-4 w-1/3 mt-1" /></CardHeader><CardContent><Skeleton className="h-16 w-full" /></CardContent></Card>
        ))}</div>
      ) : !announcements?.length ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed rounded-2xl text-muted-foreground">
          <Megaphone className="h-14 w-14 mb-4 opacity-20" />
          <h3 className="text-lg font-semibold text-foreground">暂无公告</h3>
          <p className="text-sm mt-1">点击右上角"发布公告"添加第一条通知</p>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map(ann => (
            <Card key={ann.id} className={`border-l-4 shadow-sm hover:shadow-md transition-shadow ${CATEGORY_BORDER[ann.category] ?? "border-l-gray-200"} ${!ann.isActive ? "opacity-60" : ""}`}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <CardTitle className="text-base leading-tight">{ann.title}</CardTitle>
                      {!ann.isActive && <Badge variant="outline" className="text-[10px] border-dashed">已隐藏</Badge>}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${CATEGORY_COLOR[ann.category] ?? ""}`}>
                        {CATEGORY_LABEL[ann.category] ?? ann.category}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(ann.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pb-3">
                <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{ann.content}</p>
              </CardContent>
              <CardFooter className="pt-2 border-t bg-muted/20 gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs gap-1"
                  onClick={() => toggleActive(ann.id, ann.isActive)}
                >
                  {ann.isActive ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  {ann.isActive ? "隐藏" : "显示"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-xs gap-1 text-destructive hover:text-destructive hover:bg-destructive/10 ml-auto"
                  onClick={() => setDeleteConfirmId(ann.id)}
                >
                  <Trash2 className="h-3 w-3" />删除
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={deleteConfirmId !== null} onOpenChange={open => !open && setDeleteConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>删除确认</DialogTitle>
            <DialogDescription>确定要删除这条公告吗？此操作不可撤销。</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>取消</Button>
            <Button variant="destructive" onClick={() => deleteConfirmId !== null && handleDelete(deleteConfirmId)} disabled={deleteAnnouncement.isPending}>
              {deleteAnnouncement.isPending ? "删除中…" : "确认删除"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
