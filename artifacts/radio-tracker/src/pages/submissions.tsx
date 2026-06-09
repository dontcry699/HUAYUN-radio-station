import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useListSubmissions, getListSubmissionsQueryKey,
  useCreateSubmission, useUpdateSubmission, useDeleteSubmission,
  ListSubmissionsStatus, SubmissionUpdateStatus, Submission,
} from "@workspace/api-client-react";
import { Inbox, CheckCircle, XCircle, Clock, Trash2, Check, X, MessageSquare, Send, Heart, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

const submitSongSchema = z.object({
  title: z.string().min(1, "Song title is required"),
  artist: z.string().min(1, "Artist is required"),
  isAnonymous: z.boolean().default(false),
  studentName: z.string().optional(),
  studentEmail: z.string().email("Invalid email").optional().or(z.literal("")),
  grade: z.string().optional(),
  className: z.string().optional(),
  message: z.string().optional(),
  hasDedication: z.boolean().default(false),
  dedicationTo: z.string().optional(),
  dedicationMessage: z.string().optional(),
});

type SubmitSongFormValues = z.infer<typeof submitSongSchema>;

function SubmitForm({ onSuccess }: { onSuccess: () => void }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const createSubmission = useCreateSubmission();

  const form = useForm<SubmitSongFormValues>({
    resolver: zodResolver(submitSongSchema),
    defaultValues: {
      title: "", artist: "", isAnonymous: false,
      studentName: "", studentEmail: "", grade: "", className: "",
      message: "", hasDedication: false, dedicationTo: "", dedicationMessage: "",
    },
  });

  const isAnonymous = form.watch("isAnonymous");
  const hasDedication = form.watch("hasDedication");

  const onSubmit = (data: SubmitSongFormValues) => {
    createSubmission.mutate({
      data: {
        title: data.title,
        artist: data.artist,
        isAnonymous: data.isAnonymous,
        studentName: data.isAnonymous ? undefined : data.studentName || undefined,
        studentEmail: data.isAnonymous ? undefined : data.studentEmail || undefined,
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
        toast({ title: "Request sent!", description: "Your song request has been received." });
      },
      onError: () => {
        toast({ title: "Error", description: "Failed to submit. Please try again.", variant: "destructive" });
      },
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="title" render={({ field }) => (
            <FormItem><FormLabel>Song Title <span className="text-destructive">*</span></FormLabel><FormControl><Input placeholder="e.g. Blinding Lights" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="artist" render={({ field }) => (
            <FormItem><FormLabel>Artist <span className="text-destructive">*</span></FormLabel><FormControl><Input placeholder="e.g. The Weeknd" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
        </div>

        <FormField control={form.control} name="isAnonymous" render={({ field }) => (
          <FormItem className="flex items-center gap-2 space-y-0">
            <FormControl>
              <Checkbox checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
            <FormLabel className="font-normal cursor-pointer">Submit anonymously</FormLabel>
          </FormItem>
        )} />

        {!isAnonymous && (
          <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="studentName" render={({ field }) => (
              <FormItem><FormLabel>Your Name</FormLabel><FormControl><Input placeholder="Full name" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="studentEmail" render={({ field }) => (
              <FormItem><FormLabel>Email (Optional)</FormLabel><FormControl><Input type="email" placeholder="you@school.edu" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="grade" render={({ field }) => (
            <FormItem><FormLabel>Grade (Optional)</FormLabel><FormControl><Input placeholder="e.g. Grade 8" {...field} /></FormControl></FormItem>
          )} />
          <FormField control={form.control} name="className" render={({ field }) => (
            <FormItem><FormLabel>Class (Optional)</FormLabel><FormControl><Input placeholder="e.g. Class A" {...field} /></FormControl></FormItem>
          )} />
        </div>

        <FormField control={form.control} name="message" render={({ field }) => (
          <FormItem><FormLabel>Message to Broadcast Team (Optional)</FormLabel><FormControl><Textarea placeholder="Why should we play this song?" rows={2} {...field} /></FormControl></FormItem>
        )} />

        <div className="border rounded-lg p-4 space-y-3 bg-accent/30">
          <FormField control={form.control} name="hasDedication" render={({ field }) => (
            <FormItem className="flex items-center gap-2 space-y-0">
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <FormLabel className="font-semibold cursor-pointer flex items-center gap-1.5">
                <Heart className="h-3.5 w-3.5 text-primary" />
                Add a dedication
              </FormLabel>
            </FormItem>
          )} />
          {hasDedication && (
            <div className="space-y-3">
              <FormField control={form.control} name="dedicationTo" render={({ field }) => (
                <FormItem><FormLabel>Dedicate this song to</FormLabel><FormControl><Input placeholder="e.g. My best friend Lily" {...field} /></FormControl></FormItem>
              )} />
              <FormField control={form.control} name="dedicationMessage" render={({ field }) => (
                <FormItem><FormLabel>Dedication message</FormLabel><FormControl><Textarea placeholder="Write a short message to go with the song..." rows={2} {...field} /></FormControl></FormItem>
              )} />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="submit" disabled={createSubmission.isPending} className="w-full">
            {createSubmission.isPending ? "Sending..." : "Send Song Request"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

const statusBadgeStyles: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700 border-amber-200",
  approved: "bg-green-100 text-green-700 border-green-200",
  rejected: "bg-red-100 text-red-700 border-red-200",
};

export default function Submissions() {
  const [status, setStatus] = useState<ListSubmissionsStatus>("pending");
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [reviewDialogOpenFor, setReviewDialogOpenFor] = useState<{ sub: Submission; action: "approve" | "reject" } | null>(null);
  const [reviewNote, setReviewNote] = useState("");

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: submissions, isLoading } = useListSubmissions(
    { status },
    { query: { queryKey: getListSubmissionsQueryKey({ status }) } }
  );

  const updateSubmission = useUpdateSubmission();
  const deleteSubmission = useDeleteSubmission();

  const handleReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewDialogOpenFor) return;
    const newStatus: SubmissionUpdateStatus = reviewDialogOpenFor.action === "approve" ? "approved" : "rejected";
    updateSubmission.mutate({ id: reviewDialogOpenFor.sub.id, data: { status: newStatus, reviewNote: reviewNote || undefined } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListSubmissionsQueryKey() });
        setReviewDialogOpenFor(null);
        setReviewNote("");
        toast({ title: `Request ${newStatus}`, description: reviewDialogOpenFor.action === "approve" ? "Song request approved." : "Request rejected." });
      },
    });
  };

  const handleDelete = (id: number) => {
    if (!confirm("Delete this submission permanently?")) return;
    deleteSubmission.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListSubmissionsQueryKey() });
        toast({ title: "Submission deleted" });
      },
    });
  };

  const StatusIcon = { pending: Clock, approved: CheckCircle, rejected: XCircle, all: Inbox }[status];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Song Requests</h1>
          <p className="text-muted-foreground mt-1">Review student song requests for the campus broadcast.</p>
        </div>
        <Dialog open={isSubmitOpen} onOpenChange={setIsSubmitOpen}>
          <DialogTrigger asChild>
            <Button variant="default" className="font-bold gap-2">
              <Send className="h-4 w-4" />
              Submit a Song Request
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Submit a Song Request</DialogTitle>
              <DialogDescription>Request a song to be played during today's broadcast (18:15 – 18:35).</DialogDescription>
            </DialogHeader>
            <SubmitForm onSuccess={() => setIsSubmitOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={status} onValueChange={(v) => setStatus(v as ListSubmissionsStatus)}>
        <TabsList className="bg-card border mb-4">
          <TabsTrigger value="pending"><Clock className="w-3.5 h-3.5 mr-1.5" /> Pending</TabsTrigger>
          <TabsTrigger value="approved"><CheckCircle className="w-3.5 h-3.5 mr-1.5" /> Approved</TabsTrigger>
          <TabsTrigger value="rejected"><XCircle className="w-3.5 h-3.5 mr-1.5" /> Rejected</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}><CardHeader><Skeleton className="h-6 w-3/4" /><Skeleton className="h-4 w-1/2 mt-1" /></CardHeader><CardContent><Skeleton className="h-16 w-full" /></CardContent></Card>
            ))
          ) : !submissions?.length ? (
            <div className="col-span-full py-14 text-center text-muted-foreground border border-dashed rounded-xl bg-card/50">
              <StatusIcon className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <h3 className="text-lg font-semibold text-foreground">No requests found</h3>
              <p className="text-sm mt-1">There are no {status === "all" ? "" : status} song requests right now.</p>
            </div>
          ) : (
            submissions.map((sub) => (
              <Card key={sub.id} className="flex flex-col overflow-hidden hover:shadow-md transition-shadow border-l-4"
                style={{ borderLeftColor: sub.status === "pending" ? "hsl(38 90% 48%)" : sub.status === "approved" ? "#22c55e" : "#ef4444" }}>
                <CardHeader className="pb-2 space-y-1.5">
                  <div className="flex justify-between items-start">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-semibold uppercase tracking-wider ${statusBadgeStyles[sub.status]}`}>
                      {sub.status}
                    </span>
                    <span className="text-xs text-muted-foreground font-mono">
                      {formatDistanceToNow(new Date(sub.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <CardTitle className="text-base leading-tight">{sub.title}</CardTitle>
                  <p className="text-sm text-muted-foreground font-medium">{sub.artist}</p>
                </CardHeader>

                <CardContent className="pb-3 flex-1 space-y-2 text-sm">
                  <div className="bg-muted/60 rounded-lg p-2.5 text-xs space-y-0.5">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <User className="h-3 w-3" />
                      <span className="font-semibold text-foreground">
                        {sub.isAnonymous ? "Anonymous" : (sub.studentName || "Unknown")}
                      </span>
                    </div>
                    {!sub.isAnonymous && sub.studentEmail && (
                      <div className="text-muted-foreground truncate pl-4">{sub.studentEmail}</div>
                    )}
                    {(sub.grade || sub.className) && (
                      <div className="text-muted-foreground pl-4">
                        {[sub.grade, sub.className].filter(Boolean).join(" · ")}
                      </div>
                    )}
                  </div>

                  {sub.message && (
                    <div className="flex gap-2 text-muted-foreground italic border rounded-lg p-2.5 bg-background text-xs">
                      <MessageSquare className="w-3.5 h-3.5 shrink-0 mt-0.5 text-primary" />
                      <p className="line-clamp-2">"{sub.message}"</p>
                    </div>
                  )}

                  {(sub.dedicationTo || sub.dedicationMessage) && (
                    <div className="border rounded-lg p-2.5 bg-pink-50/50 border-pink-100 text-xs space-y-1">
                      <div className="flex items-center gap-1 font-semibold text-pink-600">
                        <Heart className="h-3 w-3" />
                        Dedication
                        {sub.dedicationTo && <span className="font-normal text-pink-500"> — to {sub.dedicationTo}</span>}
                      </div>
                      {sub.dedicationMessage && <p className="text-pink-500 italic line-clamp-2">"{sub.dedicationMessage}"</p>}
                    </div>
                  )}

                  {sub.reviewNote && sub.status !== "pending" && (
                    <div className="text-xs border-l-2 pl-2 border-primary/50 text-foreground/70">
                      <strong>Note:</strong> {sub.reviewNote}
                    </div>
                  )}
                </CardContent>

                <CardFooter className="pt-3 border-t bg-muted/20 gap-2">
                  {sub.status === "pending" ? (
                    <>
                      <Button variant="default" className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs" size="sm" onClick={() => setReviewDialogOpenFor({ sub, action: "approve" })}>
                        <Check className="w-3.5 h-3.5 mr-1" /> Approve
                      </Button>
                      <Button variant="destructive" className="flex-1 text-xs" size="sm" onClick={() => setReviewDialogOpenFor({ sub, action: "reject" })}>
                        <X className="w-3.5 h-3.5 mr-1" /> Reject
                      </Button>
                    </>
                  ) : (
                    <Button variant="ghost" className="w-full text-destructive hover:text-destructive hover:bg-destructive/10 text-xs" size="sm" onClick={() => handleDelete(sub.id)}>
                      <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))
          )}
        </div>
      </Tabs>

      <Dialog open={!!reviewDialogOpenFor} onOpenChange={(open) => !open && setReviewDialogOpenFor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reviewDialogOpenFor?.action === "approve" ? "Approve" : "Reject"} — "{reviewDialogOpenFor?.sub.title}"
            </DialogTitle>
            <DialogDescription>
              {reviewDialogOpenFor?.action === "approve"
                ? "Approve this song request for the broadcast."
                : "Reject this request. You can add an optional note for the student."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleReview} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Review Note (Optional)</label>
              <Textarea value={reviewNote} onChange={(e) => setReviewNote(e.target.value)} placeholder="e.g. Great pick! Added to today's queue." />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setReviewDialogOpenFor(null)}>Cancel</Button>
              <Button
                type="submit"
                variant={reviewDialogOpenFor?.action === "approve" ? "default" : "destructive"}
                className={reviewDialogOpenFor?.action === "approve" ? "bg-green-600 hover:bg-green-700 text-white" : ""}
                disabled={updateSubmission.isPending}
              >
                {updateSubmission.isPending ? "Saving..." : reviewDialogOpenFor?.action === "approve" ? "Confirm Approval" : "Confirm Rejection"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
