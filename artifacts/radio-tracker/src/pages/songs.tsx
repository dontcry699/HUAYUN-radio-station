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
  ListSongsStatus, ListSongsSource, Song
} from "@workspace/api-client-react";
import { Music, Plus, Search, Play, MoreVertical, Trash2, Mic2, Edit2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

const songSchema = z.object({
  title: z.string().min(1, "Title is required"),
  artist: z.string().min(1, "Artist is required"),
  album: z.string().optional(),
  genre: z.string().optional(),
  notes: z.string().optional(),
});

type SongFormValues = z.infer<typeof songSchema>;

function EditSongDialog({ songId, open, onOpenChange }: { songId: number | null, open: boolean, onOpenChange: (o: boolean) => void }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const { data: song, isLoading } = useGetSong(
    songId || 0,
    { query: { enabled: !!songId, queryKey: getGetSongQueryKey(songId || 0) } }
  );

  const updateSong = useUpdateSong();

  const form = useForm<SongFormValues>({
    resolver: zodResolver(songSchema),
    defaultValues: { title: "", artist: "", album: "", genre: "", notes: "" },
  });

  useEffect(() => {
    if (song) {
      form.reset({
        title: song.title,
        artist: song.artist,
        album: song.album || "",
        genre: song.genre || "",
        notes: song.notes || "",
      });
    }
  }, [song, form]);

  const onSubmit = (data: SongFormValues) => {
    if (!songId) return;
    updateSong.mutate({ id: songId, data }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListSongsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetSongQueryKey(songId) });
        onOpenChange(false);
        toast({ title: "Song updated" });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Song</DialogTitle>
          <DialogDescription>Update track details.</DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="title" render={({ field }) => (
                <FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="artist" render={({ field }) => (
                <FormItem><FormLabel>Artist</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="album" render={({ field }) => (
                  <FormItem><FormLabel>Album</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="genre" render={({ field }) => (
                  <FormItem><FormLabel>Genre</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <FormField control={form.control} name="notes" render={({ field }) => (
                <FormItem><FormLabel>Notes</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                <Button type="submit" disabled={updateSong.isPending}>
                  {updateSong.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function Songs() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ListSongsStatus>("all");
  const [source, setSource] = useState<ListSongsSource>("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [playDialogOpenFor, setPlayDialogOpenFor] = useState<Song | null>(null);
  const [editDialogOpenFor, setEditDialogOpenFor] = useState<number | null>(null);
  const [djName, setDjName] = useState("");

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: songs, isLoading } = useListSongs(
    { status, source, search: search || undefined },
    { query: { queryKey: getListSongsQueryKey({ status, source, search: search || undefined }) } }
  );

  const createSong = useCreateSong();
  const deleteSong = useDeleteSong();
  const markPlayed = useMarkSongPlayed();

  const form = useForm<SongFormValues>({
    resolver: zodResolver(songSchema),
    defaultValues: { title: "", artist: "", album: "", genre: "", notes: "" },
  });

  const onSubmitCreate = (data: SongFormValues) => {
    createSong.mutate({ data: { ...data, isStudentSubmission: false, submittedBy: "Staff" } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListSongsQueryKey() });
        setIsCreateOpen(false);
        form.reset();
        toast({ title: "Song added", description: "Successfully added to the library." });
      },
      onError: () => {
        toast({ title: "Error", description: "Failed to add song.", variant: "destructive" });
      }
    });
  };

  const handleDelete = (id: number) => {
    if (!confirm("Are you sure you want to delete this song?")) return;
    deleteSong.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListSongsQueryKey() });
        toast({ title: "Song deleted" });
      }
    });
  };

  const handlePlay = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playDialogOpenFor) return;
    
    markPlayed.mutate({ id: playDialogOpenFor.id, data: { djName: djName || undefined } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListSongsQueryKey() });
        setPlayDialogOpenFor(null);
        setDjName("");
        toast({ title: "Song marked as played", description: "Broadcast log updated." });
      }
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Library</h1>
          <p className="text-muted-foreground mt-1">Manage the station's music catalog.</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="font-bold">
              <Plus className="mr-2 h-4 w-4" />
              Add Song
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Song to Library</DialogTitle>
              <DialogDescription>Manually enter a track for broadcast rotation.</DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmitCreate)} className="space-y-4">
                <FormField control={form.control} name="title" render={({ field }) => (
                  <FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="artist" render={({ field }) => (
                  <FormItem><FormLabel>Artist</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="album" render={({ field }) => (
                    <FormItem><FormLabel>Album (Optional)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="genre" render={({ field }) => (
                    <FormItem><FormLabel>Genre (Optional)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="notes" render={({ field }) => (
                  <FormItem><FormLabel>DJ Notes (Optional)</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <DialogFooter>
                  <Button type="submit" disabled={createSong.isPending}>
                    {createSong.isPending ? "Adding..." : "Add Song"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center bg-card p-4 rounded-lg border shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search title, artist, or album..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-background"
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Select value={status} onValueChange={(v: ListSongsStatus) => setStatus(v)}>
            <SelectTrigger className="w-[140px] bg-background">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="played">Played</SelectItem>
              <SelectItem value="unplayed">Unplayed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={source} onValueChange={(v: ListSongsSource) => setSource(v)}>
            <SelectTrigger className="w-[140px] bg-background">
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              <SelectItem value="staff">Staff</SelectItem>
              <SelectItem value="student">Student</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="w-[300px]">Track Info</TableHead>
              <TableHead>Genre / Source</TableHead>
              <TableHead className="text-right">Plays</TableHead>
              <TableHead>Last Played</TableHead>
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-10 w-full" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-10 ml-auto" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : !songs?.length ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center">
                    <Music className="h-8 w-8 mb-2 opacity-20" />
                    No songs found matching your filters.
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              songs.map((song) => (
                <TableRow key={song.id} className="group">
                  <TableCell>
                    <div className="font-medium text-foreground">{song.title}</div>
                    <div className="text-sm text-muted-foreground">{song.artist} {song.album && <span className="opacity-50">| {song.album}</span>}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col items-start gap-1">
                      {song.genre ? (
                        <Badge variant="outline" className="bg-background text-xs font-mono">{song.genre}</Badge>
                      ) : <span className="text-muted-foreground text-xs italic">—</span>}
                      {song.isStudentSubmission && (
                        <Badge variant="secondary" className="text-[10px] uppercase tracking-wider px-1.5 py-0">Student Req</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {song.playedCount > 0 ? (
                      <Badge variant="default" className="bg-primary/10 text-primary hover:bg-primary/20">{song.playedCount}</Badge>
                    ) : (
                      <span className="text-muted-foreground opacity-50">0</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">
                    {song.lastPlayedAt ? (
                      <div>
                        <div>{formatDistanceToNow(new Date(song.lastPlayedAt), { addSuffix: true })}</div>
                        {song.lastPlayedBy && <div className="text-xs text-muted-foreground">by DJ {song.lastPlayedBy}</div>}
                      </div>
                    ) : (
                      <span className="text-muted-foreground italic">Never</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button 
                        size="icon" 
                        variant="secondary" 
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => setPlayDialogOpenFor(song)}
                        title="Mark as played"
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon" variant="ghost" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setPlayDialogOpenFor(song)}>
                            <Mic2 className="h-4 w-4 mr-2" /> Mark as played...
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setEditDialogOpenFor(song.id)}>
                            <Edit2 className="h-4 w-4 mr-2" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(song.id)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                            <Trash2 className="h-4 w-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!playDialogOpenFor} onOpenChange={(open) => !open && setPlayDialogOpenFor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark "{playDialogOpenFor?.title}" as Played</DialogTitle>
            <DialogDescription>Log this track as broadcasted right now.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePlay} className="space-y-4">
            <div className="space-y-2">
              <FormLabel>DJ Name (Optional)</FormLabel>
              <Input 
                value={djName} 
                onChange={(e) => setDjName(e.target.value)} 
                placeholder="e.g. DJ Nightowl" 
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setPlayDialogOpenFor(null)}>Cancel</Button>
              <Button type="submit" disabled={markPlayed.isPending}>
                {markPlayed.isPending ? "Logging..." : "Log Play"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <EditSongDialog 
        songId={editDialogOpenFor} 
        open={!!editDialogOpenFor} 
        onOpenChange={(open) => !open && setEditDialogOpenFor(null)} 
      />
    </div>
  );
}
