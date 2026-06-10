import { useListSubmissions, getListSubmissionsQueryKey } from "@workspace/api-client-react";
import { Heart, MessageSquare, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";

const ART_PALETTES: [string, string][] = [
  ["#F59E0B","#EF4444"],["#3B82F6","#8B5CF6"],["#10B981","#3B82F6"],
  ["#F97316","#EC4899"],["#6366F1","#A78BFA"],["#14B8A6","#3B82F6"],
  ["#F43F5E","#F97316"],["#8B5CF6","#06B6D4"],
];
function artColors(s: string): [string, string] {
  const h = s.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return ART_PALETTES[h % ART_PALETTES.length];
}

export default function Dedications() {
  const { data: submissions, isLoading } = useListSubmissions(
    { status: "approved" },
    { query: { queryKey: getListSubmissionsQueryKey({ status: "approved" }) } }
  );

  const withDedications = submissions?.filter(s => s.dedicationTo || s.dedicationMessage || s.message) ?? [];

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Heart className="h-6 w-6 text-pink-500" />校园寄语
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">同学们在点歌时留下的美好祝福</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardContent className="pt-5 space-y-3">
                <Skeleton className="h-12 w-12 rounded-xl" />
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !withDedications.length ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed rounded-2xl text-muted-foreground">
          <Heart className="h-14 w-14 mb-4 text-pink-200" />
          <h3 className="text-lg font-semibold text-foreground">暂无校园寄语</h3>
          <p className="text-sm mt-1 max-w-sm">同学们在点歌时填写寄语后，会在这里展示</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {withDedications.map(sub => {
            const [c1, c2] = artColors(sub.title);
            return (
              <Card key={sub.id} className="overflow-hidden hover:shadow-md transition-all hover:-translate-y-0.5 border">
                <div className="h-1.5 w-full" style={{ background: `linear-gradient(90deg,${c1},${c2})` }} />
                <CardContent className="pt-4 pb-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl shrink-0 flex items-center justify-center text-white font-black text-base" style={{ background: `linear-gradient(135deg,${c1},${c2})` }}>
                      {sub.title.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-sm truncate">《{sub.title}》</p>
                      <p className="text-xs text-muted-foreground">{sub.artist}</p>
                    </div>
                  </div>

                  {(sub.dedicationTo || sub.dedicationMessage) && (
                    <div className="bg-pink-50 border border-pink-100 rounded-xl p-3 space-y-1.5">
                      {sub.dedicationTo && (
                        <p className="text-xs font-bold text-pink-600 flex items-center gap-1">
                          <Heart className="h-3 w-3" />送给：{sub.dedicationTo}
                        </p>
                      )}
                      {sub.dedicationMessage && (
                        <p className="text-sm text-gray-700 italic leading-relaxed">"{sub.dedicationMessage}"</p>
                      )}
                    </div>
                  )}

                  {sub.message && !sub.dedicationMessage && (
                    <div className="flex gap-2 text-sm text-muted-foreground border rounded-xl p-3">
                      <MessageSquare className="w-3.5 h-3.5 shrink-0 mt-0.5 text-primary" />
                      <p className="italic leading-relaxed">"{sub.message}"</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      <span>
                        {sub.isAnonymous ? "匿名同学" : (sub.studentName || "同学")}
                        {(sub.grade || sub.className) && `  ${sub.grade ?? ""}${sub.className ? `（${sub.className}班）` : ""}`}
                      </span>
                    </div>
                    <span>{formatDistanceToNow(new Date(sub.createdAt), { addSuffix: true })}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
