import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useListAnnouncements, getListAnnouncementsQueryKey,
  useCreateAnnouncement, useUpdateAnnouncement, useDeleteAnnouncement,
} from "@workspace/api-client-react";
import { Megaphone, Plus, Trash2, Power, PowerOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const announcementSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  category: z.enum(["general", "music", "schedule", "other"]).default("general"),
  isActive: z.boolean().default(true),
});
type AnnouncementFormValues = z.infer<typeof announcementSchema>;

const CATEGORY_COLORS: Record<string, string> = {
  general: "bg-blue-100 text-blue-700 border-blue-200",
  music: "bg-amber-100 text-amber-700 border-amber-200",
  schedule: "bg-green-100 text-green-700 border-green-200",
  other: "bg-gray-100 text-gray-600 border-gray-200",
};

const CATEGORY_ACCENTS: Record<string, string> = {
  general: "border-l-blue-400",
  music: "border-l-amber-400",
  schedule: "border-l-green-400",
  other: "border-l-gray-300",
};

type CategoryFilter = "general" | "music" | "schedule" | "other" | "all";

export default function Announcements() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [category, setCategory] = useState<CategoryFilter>("all");

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: announcements, isLoading } = useListAnnouncements(
    { category: category === "all" ? undefined : category },
    { query: { queryKey: getListAnnouncementsQueryKey({ category: category === "all" ? undefined : category }) } }
  );

  const createAnnouncement = useCreateAnnouncement();
  const updateAnnouncement = useUpdateAnnouncement();
  const deleteAnnouncement = useDeleteAnnouncement();

  const form = useForm<AnnouncementFormValues>({
    resolver: zodResolver(announcementSchema),
    defaultValues: { title: "", content: "", category: "general", isActive: true },
  });

  const onSubmit = (data: AnnouncementFormValues) => {
    createAnnouncement.mutate({ data }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListAnnouncementsQueryKey() });
        setIsCreateOpen(false);
        form.reset();
        toast({ title: "Announcement posted" });
      },
      onError: () => toast({ title: "Error", description: "Failed to post announcement.", variant: "destructive" }),
    });
  };

  const toggleActive = (id: number, currentActive: boolean) => {
    updateAnnouncement.mutate({ id, data: { isActive: !currentActive } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListAnnouncementsQueryKey() });
        toast({ title: currentActive ? "Announcement deactivated" : "Announcement activated" });
      },
    });
  };

  const handleDelete = (id: number) => {
    if (!confirm("Delete this announcement permanently?")) return;
    deleteAnnouncement.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListAnnouncementsQueryKey() });
        toast({ title: "Announcement deleted" });
      },
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Announcements</h1>
          <p className="text-muted-foreground mt-1">Campus notices and radio broadcast announcements.</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="font-bold gap-2">
              <Plus className="h-4 w-4" />
              New Announcement
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Post Announcement</DialogTitle>
              <DialogDescription>Create a new campus announcement.</DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="title" render={({ field }) => (
                  <FormItem><FormLabel>Title <span className="text-destructive">*</span></FormLabel><FormControl><Input placeholder="e.g. Music Broadcast Tonight" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="content" render={({ field }) => (
                  <FormItem><FormLabel>Content <span className="text-destructive">*</span></FormLabel><FormControl><Textarea rows={4} placeholder="Write the announcement..." {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <div className="grid grid-cols-2 gap-4 items-end">
                  <FormField control={form.control} name="category" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="general">General</SelectItem>
                          <SelectItem value="music">Music</SelectItem>
                          <SelectItem value="schedule">Schedule</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="isActive" render={({ field }) => (
                    <FormItem className="flex items-center gap-3 pb-1">
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <FormLabel className="font-normal">Active</FormLabel>
                    </FormItem>
                  )} />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={createAnnouncement.isPending}>
                    {createAnnouncement.isPending ? "Posting..." : "Post Announcement"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={category} onValueChange={(v) => setCategory(v as CategoryFilter)}>
        <TabsList className="bg-card border">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="music">Music</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="other">Other</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-lg border p-5 space-y-2">
              <Skeleton className="h-5 w-1/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ))
        ) : !announcements?.length ? (
          <div className="text-center py-16 border border-dashed rounded-xl text-muted-foreground">
            <Megaphone className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <h3 className="text-lg font-semibold text-foreground">No announcements yet</h3>
            <p className="text-sm mt-1">Post the first campus announcement using the button above.</p>
          </div>
        ) : (
          announcements.map((a) => (
            <div
              key={a.id}
              className={`rounded-lg border border-l-4 bg-card p-5 transition-all hover:shadow-sm ${CATEGORY_ACCENTS[a.category] ?? "border-l-gray-300"} ${!a.isActive ? "opacity-55" : ""}`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${CATEGORY_COLORS[a.category]}`}>
                      {a.category}
                    </span>
                    {!a.isActive && (
                      <span className="px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-400 border-gray-200">
                        Inactive
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground ml-auto">
                      {formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <h3 className="font-bold text-base leading-tight">{a.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{a.content}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs"
                    onClick={() => toggleActive(a.id, a.isActive)}
                    disabled={updateAnnouncement.isPending}
                  >
                    {a.isActive
                      ? <><PowerOff className="h-3.5 w-3.5" /> Deactivate</>
                      : <><Power className="h-3.5 w-3.5 text-green-600" /> Activate</>
                    }
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => handleDelete(a.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
