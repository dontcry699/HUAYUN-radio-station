import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  useListSubmissions, getListSubmissionsQueryKey,
  useCreateSubmission, useUpdateSubmission, useDeleteSubmission,
  ListSubmissionsStatus, SubmissionUpdateStatus, Submission
} from "@workspace/api-client-react";
import { Inbox, CheckCircle, XCircle, Clock, Trash2, Check, X, MessageSquare, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

const submitSongSchema = z.object({
  title: z.string().min(1, "Title is required"),
  artist: z.string().min(1, "Artist is required"),
  studentName: z.string().min(1, "Name is required"),
  studentEmail: z.string().email("Invalid email").optional().or(z.literal("")),
  message: z.string().optional(),
});

type SubmitSongFormValues = z.infer<typeof submitSongSchema>;

export default function Submissions() {
  const [status, setStatus] = useState<ListSubmissionsStatus>("pending");
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [reviewDialogOpenFor, setReviewDialogOpenFor] = useState<{ sub: Submission, action: "approve" | "reject" } | null>(null);
  const [reviewNote, setReviewNote] = useState("");

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: submissions, isLoading } = useListSubmissions(
    { status },
    { query: { queryKey: getListSubmissionsQueryKey({ status }) } }
  );

  const createSubmission = useCreateSubmission();
  const updateSubmission = useUpdateSubmission();
  const deleteSubmission = useDeleteSubmission();

  const form = useForm<SubmitSongFormValues>({
    resolver: zodResolver(submitSongSchema),
    defaultValues: {
      title: "",
      artist: "",
      studentName: "",
      studentEmail: "",
      message: "",
    },
  });

  const onSubmitCreate = (data: SubmitSongFormValues) => {
    createSubmission.mutate({ data: { ...data, studentEmail: data.studentEmail || undefined } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListSubmissionsQueryKey() });
        setIsSubmitOpen(false);
        form.reset();
        toast({ title: "Submission received", description: "Your song request has been sent to the booth." });
        setStatus("pending");
      },
      onError: () => {
        toast({ title: "Error", description: "Failed to submit request.", variant: "destructive" });
      }
    });
  };

  const handleReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewDialogOpenFor) return;
    
    const newStatus: SubmissionUpdateStatus = reviewDialogOpenFor.action === "approve" ? "approved" : "rejected";
    
    updateSubmission.mutate({ 
      id: reviewDialogOpenFor.sub.id, 
      data: { status: newStatus, reviewNote: reviewNote || undefined } 
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListSubmissionsQueryKey() });
        setReviewDialogOpenFor(null);
        setReviewNote("");
        toast({ 
          title: `Submission ${newStatus}`, 
          description: reviewDialogOpenFor.action === "approve" ? "Song added to library queue." : "Submission rejected." 
        });
      }
    });
  };

  const handleDelete = (id: number) => {
    if (!confirm("Are you sure you want to delete this submission permanently?")) return;
    deleteSubmission.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListSubmissionsQueryKey() });
        toast({ title: "Submission deleted" });
      }
    });
  };

  const StatusIcon = {
    pending: Clock,
    approved: CheckCircle,
    rejected: XCircle,
    all: Inbox
  }[status];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Submissions</h1>
          <p className="text-muted-foreground mt-1">Review student song requests for the station.</p>
        </div>
        <Dialog open={isSubmitOpen} onOpenChange={setIsSubmitOpen}>
          <DialogTrigger asChild>
            <Button variant="secondary" className="font-bold">
              <Send className="mr-2 h-4 w-4" />
              Student Submit Form
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Submit a Song Request</DialogTitle>
              <DialogDescription>Request a track to be played on WXYC 89.3.</DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmitCreate)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="title" render={({ field }) => (
                    <FormItem><FormLabel>Song Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="artist" render={({ field }) => (
                    <FormItem><FormLabel>Artist</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="studentName" render={({ field }) => (
                    <FormItem><FormLabel>Your Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="studentEmail" render={({ field }) => (
                    <FormItem><FormLabel>Email (Optional)</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="message" render={({ field }) => (
                  <FormItem><FormLabel>Message to DJ (Optional)</FormLabel><FormControl><Textarea placeholder="Why should we play this?" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <DialogFooter>
                  <Button type="submit" disabled={createSubmission.isPending}>
                    {createSubmission.isPending ? "Sending..." : "Send Request"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={status} onValueChange={(v) => setStatus(v as ListSubmissionsStatus)} className="w-full">
        <TabsList className="bg-card border mb-4">
          <TabsTrigger value="pending" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Clock className="w-4 h-4 mr-2" /> Pending
          </TabsTrigger>
          <TabsTrigger value="approved" className="data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground">
            <CheckCircle className="w-4 h-4 mr-2" /> Approved
          </TabsTrigger>
          <TabsTrigger value="rejected" className="data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground">
            <XCircle className="w-4 h-4 mr-2" /> Rejected
          </TabsTrigger>
          <TabsTrigger value="all" className="data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground">
            All
          </TabsTrigger>
        </TabsList>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <CardHeader className="pb-2"><Skeleton className="h-6 w-3/4" /><Skeleton className="h-4 w-1/2" /></CardHeader>
                <CardContent className="pb-2"><Skeleton className="h-4 w-full mb-2" /><Skeleton className="h-4 w-2/3" /></CardContent>
                <CardFooter className="pt-2 border-t"><Skeleton className="h-8 w-full" /></CardFooter>
              </Card>
            ))
          ) : !submissions?.length ? (
            <div className="col-span-full py-12 text-center text-muted-foreground border border-dashed rounded-lg bg-card/50">
              <StatusIcon className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <h3 className="text-lg font-medium text-foreground">No submissions found</h3>
              <p>There are no {status === 'all' ? '' : status} requests to display.</p>
            </div>
          ) : (
            submissions.map((sub) => (
              <Card key={sub.id} className="flex flex-col overflow-hidden transition-shadow hover:shadow-md border-t-4 data-[status=pending]:border-t-primary data-[status=approved]:border-t-green-500 data-[status=rejected]:border-t-destructive" data-status={sub.status}>
                <CardHeader className="pb-2 space-y-1">
                  <div className="flex justify-between items-start">
                    <Badge variant="outline" className="mb-2 font-mono text-[10px] uppercase tracking-wider bg-background">
                      {sub.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground font-mono">
                      {formatDistanceToNow(new Date(sub.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <CardTitle className="leading-tight">{sub.title}</CardTitle>
                  <p className="text-sm font-medium text-muted-foreground">{sub.artist}</p>
                </CardHeader>
                <CardContent className="pb-4 flex-1 text-sm">
                  <div className="bg-muted p-3 rounded-md mb-3 font-mono text-xs">
                    <div className="text-muted-foreground uppercase tracking-wide opacity-70 mb-1">Requested by</div>
                    <div className="font-bold text-foreground">{sub.studentName}</div>
                    {sub.studentEmail && <div className="truncate opacity-80">{sub.studentEmail}</div>}
                  </div>
                  {sub.message && (
                    <div className="flex gap-2 text-muted-foreground italic bg-background border p-2 rounded-md">
                      <MessageSquare className="w-4 h-4 shrink-0 mt-0.5" />
                      <p className="line-clamp-3">"{sub.message}"</p>
                    </div>
                  )}
                  {sub.reviewNote && sub.status !== 'pending' && (
                    <div className="mt-3 text-xs border-l-2 pl-2 border-primary/50 text-foreground/80">
                      <strong>DJ Note:</strong> {sub.reviewNote}
                    </div>
                  )}
                </CardContent>
                <CardFooter className="pt-3 border-t bg-muted/20 gap-2">
                  {sub.status === 'pending' ? (
                    <>
                      <Button variant="default" className="flex-1 bg-green-600 hover:bg-green-700 text-white" size="sm" onClick={() => setReviewDialogOpenFor({ sub, action: "approve" })}>
                        <Check className="w-4 h-4 mr-1" /> Approve
                      </Button>
                      <Button variant="destructive" className="flex-1" size="sm" onClick={() => setReviewDialogOpenFor({ sub, action: "reject" })}>
                        <X className="w-4 h-4 mr-1" /> Reject
                      </Button>
                    </>
                  ) : (
                    <Button variant="ghost" className="w-full text-destructive hover:text-destructive hover:bg-destructive/10" size="sm" onClick={() => handleDelete(sub.id)}>
                      <Trash2 className="w-4 h-4 mr-2" /> Delete Record
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
              {reviewDialogOpenFor?.action === 'approve' ? 'Approve' : 'Reject'} "{reviewDialogOpenFor?.sub.title}"
            </DialogTitle>
            <DialogDescription>
              {reviewDialogOpenFor?.action === 'approve' 
                ? 'This will mark the submission as approved and add it to the pending library.' 
                : 'This will reject the request. Provide a reason for the student if needed.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleReview} className="space-y-4">
            <div className="space-y-2">
              <FormLabel>Review Note (Optional)</FormLabel>
              <Textarea 
                value={reviewNote} 
                onChange={(e) => setReviewNote(e.target.value)} 
                placeholder="e.g. Added to rotation, thanks!" 
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setReviewDialogOpenFor(null)}>Cancel</Button>
              <Button 
                type="submit" 
                variant={reviewDialogOpenFor?.action === 'approve' ? 'default' : 'destructive'}
                className={reviewDialogOpenFor?.action === 'approve' ? 'bg-green-600 hover:bg-green-700 text-white' : ''}
                disabled={updateSubmission.isPending}
              >
                {updateSubmission.isPending ? "Saving..." : reviewDialogOpenFor?.action === 'approve' ? "Confirm Approval" : "Confirm Rejection"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
