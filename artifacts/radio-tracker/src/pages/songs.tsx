import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useListSongs, getListSongsQueryKey,
  useCreateSong, useDeleteSong, useMarkSongPlayed,
  useGetSong, getGetSongQueryKey, useUpdateSong,
  Song,
} from "@workspace/api-client-react";
import { Music, Plus, Search, Play, Trash2, Mic2, Edit2, Fire } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

const ART_PALETTES: [string, string][] = [
  ["#F59E0B","#EF4444"],["#3B82F6","#8B5CF6"],["#10B981","#3B82F6"],
  ["#F97316","#EC4899"],["#6366F1","#A78BFA"],["#14B8A6","#3B82F6"],
  ["#F43F5E","#F97316"],["#8B5CF6","#06B6D4"],
];
function artColors(s: string): [string, string] {
  const h = s.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return ART_PALETTES[h % ART_PALETTES.length];
}

const songSchema = z.object({
  title: z.string().min(1, "请填写歌曲名称"),
  artist: z.string().min(1, "请填写歌手名称"),
  album: z.string().optional(),
  genre: z.string().optional(),
  notes: z.string().optional(),
});
type SongFormValues = z.infer<typeof songSchema>;

function EditSongDialog({ songId, open, onOpenChange }: { songId: number | null; open: boolean; onOpenChange: (o: boolean) => void }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: song, isLoading } = useGetSong(
    songId ?? 0,
    { query: { enabled: !!songId && songId > 0, queryKey: getGetSongQueryKey(songId ?? 0) } }
  );
  const updateSong = useUpdateSong();
  const form = useForm<SongFormValues>({
    resolver: zodResolver(songSchema),
    defaultValues: { title: "", artist: "", album: "", genre: "", notes: "" },
  });

  useEffect(() => {
    if (song && open) {
      form.reset({ title: song.title, artist: song.artist, album: song.album || "", genre: song.genre || "", notes: song.notes || "" });
    }
  }, [song, open, form]);

  const onSubmit = (data: SongFormValues) => {
    if (!songId) return;
    updateSong.mutate({ id: songId, data }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListSongsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetSongQueryKey(songId) });
        onOpenChange(false);
        toast({ title: "歌曲信息已更新" });
      },
      onError: () => toast({ title: "更新失败", variant: "destructive" }),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>编辑歌曲</DialogTitle>
          <DialogDescription>修改歌曲信息</DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <div className="space-y-3"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="title" render={({ field }) => (
                <FormItem><FormLabel>歌曲名称</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="artist" render={({ field }) => (
                <FormItem><FormLabel>歌手</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="grid grid-cols-2 gap-3">
                <FormField control={form.control} name="album" render={({ field }) => (
                  <FormItem><FormLabel>专辑（选填）</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="genre" render={({ field }) => (
                  <FormItem><FormLabel>分类（选填）</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <FormField control={form.control} name="notes" render={({ field }) => (
                <FormItem><FormLabel>备注（选填）</FormLabel><FormControl><Textarea {...field} rows={2} /></FormControl><FormMessage /></FormItem>
              )} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
                <Button type="submit" disabled={updateSong.isPending}>{updateSong.isPending ? "保存中…" : "保存修改"}</Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}

type StatusFilter = "all" | "played" | "unplayed";
type SourceFilter = "all" | "student" | "staff";

export default function Songs() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [playDialogFor, setPlayDialogFor] = useState<Song | null>(null);
  const [editDialogFor, setEditDialogFor] = useState<number | null>(null);
  const [deleteConfirmFor, setDeleteConfirmFor] = useState<Song | null>(null);
  const [djName, setDjName] = useState("");

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: songs, isLoading } = useListSongs(
    { status: statusFilter, source: sourceFilter, search: search || undefined },
    { query: { queryKey: getListSongsQueryKey({ status: statusFilter, source: sourceFilter, search: search || undefined }) } }
  );

  const createSong = useCreateSong();
  const deleteSong = useDeleteSong();
  const markPlayed = useMarkSongPlayed();

  const form = useForm<SongFormValues>({
    resolver: zodResolver(songSchema),
    defaultValues: { title: "", artist: "", album: "", genre: "", notes: "" },
  });

  const onSubmitCreate = (data: SongFormValues) => {
    createSong.mutate({ data: { ...data, isStudentSubmission: false } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListSongsQueryKey() });
        setIsCreateOpen(false);
        form.reset();
        toast({ title: "歌曲已添加到曲库" });
      },
      onError: () => toast({ title: "添加失败", variant: "destructive" }),
    });
  };

  const handleDelete = (song: Song) => {
    deleteSong.mutate({ id: song.id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListSongsQueryKey() });
        setDeleteConfirmFor(null);
        toast({ title: `《${song.title}》已从曲库删除` });
      },
      onError: () => toast({ title: "删除失败", variant: "destructive" }),
    });
  };

  const handlePlay = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playDialogFor) return;
    markPlayed.mutate({ id: playDialogFor.id, data: { djName: djName || undefined } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListSongsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListSongsQueryKey({}) });
        setPlayDialogFor(null);
        setDjName("");
        toast({ title: `《${playDialogFor.title}》已记录播放` });
      },
      onError: () => toast({ title: "记录失败", variant: "destructive" }),
    });
  };

  function getSongBadge(song: Song) {
    if (song.playedCount >= 8) return { label: "热门歌曲", cls: "bg-red-100 text-red-600 border-red-200" };
    if (song.isStudentSubmission) return { label: "同学推荐", cls: "bg-blue-100 text-blue-600 border-blue-200" };
    return null;
  }

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">歌曲库</h1>
          <p className="text-muted-foreground text-sm mt-0.5">管理校园广播歌曲资源</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="font-semibold gap-2">
              <Plus className="h-4 w-4" />添加歌曲
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>添加歌曲</DialogTitle>
              <DialogDescription>向曲库手动添加一首歌曲</DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmitCreate)} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <FormField control={form.control} name="title" render={({ field }) => (
                    <FormItem><FormLabel>歌曲名称 *</FormLabel><FormControl><Input placeholder="例：稻香" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="artist" render={({ field }) => (
                    <FormItem><FormLabel>歌手 *</FormLabel><FormControl><Input placeholder="例：周杰伦" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <FormField control={form.control} name="album" render={({ field }) => (
                    <FormItem><FormLabel>专辑（选填）</FormLabel><FormControl><Input placeholder="例：魔杰座" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="genre" render={({ field }) => (
                    <FormItem><FormLabel>分类（选填）</FormLabel><FormControl><Input placeholder="例：流行" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="notes" render={({ field }) => (
                  <FormItem><FormLabel>备注（选填）</FormLabel><FormControl><Textarea placeholder="广播站内部备注…" rows={2} {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>取消</Button>
                  <Button type="submit" disabled={createSong.isPending}>{createSong.isPending ? "添加中…" : "确认添加"}</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center bg-card p-3 rounded-xl border shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索歌曲、歌手或专辑…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 bg-background"
          />
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={v => setStatusFilter(v as StatusFilter)}>
            <SelectTrigger className="w-[120px] bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部状态</SelectItem>
              <SelectItem value="played">已播放</SelectItem>
              <SelectItem value="unplayed">未播放</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sourceFilter} onValueChange={v => setSourceFilter(v as SourceFilter)}>
            <SelectTrigger className="w-[120px] bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部来源</SelectItem>
              <SelectItem value="staff">广播站</SelectItem>
              <SelectItem value="student">同学推荐</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="w-[280px]">歌曲信息</TableHead>
              <TableHead>分类</TableHead>
              <TableHead className="text-right">播放次数</TableHead>
              <TableHead>最近播放</TableHead>
              <TableHead className="text-center w-[160px]">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><div className="flex gap-3"><Skeleton className="h-10 w-10 rounded-lg" /><div className="space-y-1.5"><Skeleton className="h-4 w-28" /><Skeleton className="h-3 w-20" /></div></div></TableCell>
                  <TableCell><Skeleton className="h-5 w-14" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-10 ml-auto" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-full" /></TableCell>
                </TableRow>
              ))
            ) : !songs?.length ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                  <Music className="h-8 w-8 mx-auto mb-2 opacity-20" />
                  <p>未找到匹配的歌曲</p>
                </TableCell>
              </TableRow>
            ) : (
              songs.map(song => {
                const [c1, c2] = artColors(song.title);
                const badge = getSongBadge(song);
                return (
                  <TableRow key={song.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg shrink-0 flex items-center justify-center text-white font-black text-sm" style={{ background: `linear-gradient(135deg,${c1},${c2})` }}>
                          {song.title.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-sm truncate flex items-center gap-1.5">
                            {song.title}
                            {badge && <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border ${badge.cls}`}>{badge.label}</span>}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">{song.artist}{song.album && ` · ${song.album}`}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {song.genre && <Badge variant="outline" className="text-xs font-normal">{song.genre}</Badge>}
                        {song.isStudentSubmission && <div><Badge variant="secondary" className="text-[10px]">同学推荐</Badge></div>}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {song.playedCount > 0 ? (
                        <span className="inline-flex items-center gap-1 font-bold text-primary">{song.playedCount}</span>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {song.lastPlayedAt ? (
                        <div>
                          <div className="text-sm">{formatDistanceToNow(new Date(song.lastPlayedAt), { addSuffix: true })}</div>
                          {song.lastPlayedBy && <div className="text-xs text-muted-foreground">{song.lastPlayedBy}</div>}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm italic">未播放</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1.5">
                        <Button size="sm" variant="default" className="h-7 px-2 text-xs gap-1" onClick={() => setPlayDialogFor(song)}>
                          <Play className="h-3 w-3" />播放
                        </Button>
                        <Button size="sm" variant="outline" className="h-7 px-2 text-xs gap-1" onClick={() => setEditDialogFor(song.id)}>
                          <Edit2 className="h-3 w-3" />编辑
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => setDeleteConfirmFor(song)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mark as Played Dialog */}
      <Dialog open={!!playDialogFor} onOpenChange={open => { if (!open) { setPlayDialogFor(null); setDjName(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>记录播放 — 《{playDialogFor?.title}》</DialogTitle>
            <DialogDescription>将此歌曲记录为当前播出，更新播放次数。</DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePlay} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">播音员（选填）</label>
              <Input value={djName} onChange={e => setDjName(e.target.value)} placeholder="例：播音部" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setPlayDialogFor(null); setDjName(""); }}>取消</Button>
              <Button type="submit" disabled={markPlayed.isPending}>{markPlayed.isPending ? "记录中…" : "确认播放"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={!!deleteConfirmFor} onOpenChange={open => !open && setDeleteConfirmFor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>删除确认</DialogTitle>
            <DialogDescription>确定要从曲库删除《{deleteConfirmFor?.title}》吗？此操作不可撤销。</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmFor(null)}>取消</Button>
            <Button variant="destructive" onClick={() => deleteConfirmFor && handleDelete(deleteConfirmFor)} disabled={deleteSong.isPending}>
              {deleteSong.isPending ? "删除中…" : "确认删除"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <EditSongDialog songId={editDialogFor} open={!!editDialogFor} onOpenChange={open => !open && setEditDialogFor(null)} />
    </div>
  );
}
