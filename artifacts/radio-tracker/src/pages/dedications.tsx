import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useListSubmissions, getListSubmissionsQueryKey, useCreateSubmission } from "@workspace/api-client-react";
import { Heart, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const CARD_GRADIENTS = [
  "from-amber-50 to-orange-50 border-amber-100",
  "from-pink-50 to-rose-50 border-pink-100",
  "from-blue-50 to-sky-50 border-blue-100",
  "from-purple-50 to-violet-50 border-purple-100",
  "from-green-50 to-emerald-50 border-green-100",
  "from-yellow-50 to-amber-50 border-yellow-100",
];

const dedicationSchema = z.object({
  title: z.string().min(1, "Song title is required"),
  artist: z.string().min(1, "Artist is required"),
  isAnonymous: z.boolean().default(false),
  studentName: z.string().optional(),
  grade: z.string().optional(),
  className: z.string().optional(),
  dedicationTo: z.string().min(1, "Please enter who to dedicate this to"),
  dedicationMessage: z.string().optional(),
});
type DedicationFormValues = z.infer<typeof dedicationSchema>;

function DedicationForm({ onSuccess }: { onSuccess: () => void }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const createSubmission = useCreateSubmission();

  const form = useForm<DedicationFormValues>({
    resolver: zodResolver(dedicationSchema),
    defaultValues: { title: "", artist: "", isAnonymous: false, studentName: "", grade: "", className: "", dedicationTo: "", dedicationMessage: "" },
  });

  const isAnonymous = form.watch("isAnonymous");

  const onSubmit = (data: DedicationFormValues) => {
    createSubmission.mutate({
      data: {
        title: data.title,
        artist: data.artist,
        isAnonymous: data.isAnonymous,
        studentName: data.isAnonymous ? undefined : data.studentName || undefined,
        grade: data.grade || undefined,
        className: data.className || undefined,
        dedicationTo: data.dedicationTo,
        dedicationMessage: data.dedicationMessage || undefined,
      },
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListSubmissionsQueryKey() });
        form.reset();
        onSuccess();
        toast({ title: "Dedication sent!", description: "Your dedication will appear here once approved." });
      },
      onError: () => toast({ title: "Error", description: "Failed to send. Please try again.", variant: "destructive" }),
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="title" render={({ field }) => (
            <FormItem><FormLabel>Song Title <span className="text-destructive">*</span></FormLabel><FormControl><Input placeholder="e.g. Golden Hour" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="artist" render={({ field }) => (
            <FormItem><FormLabel>Artist <span className="text-destructive">*</span></FormLabel><FormControl><Input placeholder="e.g. JVKE" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
        </div>

        <FormField control={form.control} name="dedicationTo" render={({ field }) => (
          <FormItem>
            <FormLabel>Dedicate this song to <span className="text-destructive">*</span></FormLabel>
            <FormControl><Input placeholder="e.g. My best friend Alex" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="dedicationMessage" render={({ field }) => (
          <FormItem>
            <FormLabel>Your message (Optional)</FormLabel>
            <FormControl><Textarea placeholder="Write something special..." rows={3} {...field} /></FormControl>
          </FormItem>
        )} />

        <FormField control={form.control} name="isAnonymous" render={({ field }) => (
          <FormItem className="flex items-center gap-2 space-y-0">
            <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
            <FormLabel className="font-normal cursor-pointer">Send anonymously</FormLabel>
          </FormItem>
        )} />

        {!isAnonymous && (
          <div className="grid grid-cols-3 gap-3">
            <FormField control={form.control} name="studentName" render={({ field }) => (
              <FormItem><FormLabel>Your Name</FormLabel><FormControl><Input placeholder="Name" {...field} /></FormControl></FormItem>
            )} />
            <FormField control={form.control} name="grade" render={({ field }) => (
              <FormItem><FormLabel>Grade</FormLabel><FormControl><Input placeholder="Grade 8" {...field} /></FormControl></FormItem>
            )} />
            <FormField control={form.control} name="className" render={({ field }) => (
              <FormItem><FormLabel>Class</FormLabel><FormControl><Input placeholder="Class A" {...field} /></FormControl></FormItem>
            )} />
          </div>
        )}

        <DialogFooter>
          <Button type="submit" disabled={createSubmission.isPending} className="w-full">
            {createSubmission.isPending ? "Sending..." : "Send Dedication"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

export default function Dedications() {
  const [isOpen, setIsOpen] = useState(false);

  const { data: allSubmissions, isLoading } = useListSubmissions(
    { status: "approved" },
    { query: { queryKey: getListSubmissionsQueryKey({ status: "approved" }) } }
  );

  const dedications = allSubmissions?.filter(
    (s) => s.dedicationTo || s.dedicationMessage
  ) ?? [];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
            <Heart className="h-7 w-7 text-pink-500 fill-pink-100" />
            Campus Dedications
          </h1>
          <p className="text-muted-foreground mt-1">Approved song dedications from students — airing during the broadcast.</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="font-bold gap-2">
              <Send className="h-4 w-4" />
              Send a Dedication
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Send a Song Dedication</DialogTitle>
              <DialogDescription>Request a song and add a personal message to be shared on-air.</DialogDescription>
            </DialogHeader>
            <DedicationForm onSuccess={() => setIsOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border p-5 space-y-3">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ))}
        </div>
      ) : !dedications.length ? (
        <div className="text-center py-20 border border-dashed rounded-2xl">
          <Heart className="h-14 w-14 mx-auto mb-4 text-pink-200 fill-pink-50" />
          <h3 className="text-xl font-bold text-foreground">No dedications yet</h3>
          <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
            Be the first to send a song dedication to someone special on campus!
          </p>
          <Button className="mt-6 gap-2" onClick={() => setIsOpen(true)}>
            <Send className="h-4 w-4" />
            Send the first dedication
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {dedications.map((d, i) => {
            const gradient = CARD_GRADIENTS[i % CARD_GRADIENTS.length];
            return (
              <div key={d.id} className={`rounded-xl border bg-gradient-to-br p-5 space-y-3 hover:shadow-md transition-shadow ${gradient}`}>
                <div>
                  <p className="font-extrabold text-base leading-tight">{d.title}</p>
                  <p className="text-sm text-muted-foreground">{d.artist}</p>
                </div>

                <div className="flex items-center gap-1.5 text-sm font-medium text-pink-600">
                  <Heart className="h-3.5 w-3.5 fill-pink-200" />
                  To: <span className="font-bold">{d.dedicationTo || "Someone special"}</span>
                </div>

                {d.dedicationMessage && (
                  <blockquote className="italic text-sm text-foreground/80 border-l-2 border-pink-200 pl-3 leading-relaxed">
                    "{d.dedicationMessage}"
                  </blockquote>
                )}

                <div className="text-xs text-muted-foreground pt-1 border-t border-current/10">
                  From{" "}
                  <span className="font-semibold">
                    {d.isAnonymous ? "Anonymous" : (d.studentName || "A student")}
                  </span>
                  {(d.grade || d.className) && (
                    <span className="opacity-70"> · {[d.grade, d.className].filter(Boolean).join(", ")}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
