import { RadioTower, Mic2, BookOpen, Users, Music, Heart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useBroadcastStatus, SCHEDULE_ITEMS, toMinutes } from "@/hooks/use-broadcast-status";

const ITEM_ICONS = [Users, Music, RadioTower, BookOpen, Users];

export default function Schedule() {
  const { status } = useBroadcastStatus();
  const nowMinutes = toMinutes(new Date());

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Broadcast Schedule</h1>
        <p className="text-muted-foreground mt-1">Today's campus broadcasting timetable.</p>
      </div>

      {/* Timeline */}
      <Card className="overflow-hidden shadow-sm">
        <CardContent className="p-0">
          <ol className="relative">
            {SCHEDULE_ITEMS.map((item, i) => {
              const isPast = nowMinutes > item.minutes;
              const isNext = !isPast && (i === 0 || nowMinutes > SCHEDULE_ITEMS[i - 1].minutes);
              const Icon = ITEM_ICONS[i] ?? Music;

              const isHighlighted =
                (item.label === "Music Broadcast Starts" && status === "live") ||
                (item.label === "Pre-Broadcast Prep" && status === "preparing") ||
                isNext;

              return (
                <li
                  key={item.time}
                  className={`flex gap-5 px-6 py-6 border-b last:border-0 transition-colors ${
                    isHighlighted ? "bg-primary/5" : isPast ? "opacity-50" : ""
                  }`}
                >
                  <div className="flex flex-col items-center gap-2 shrink-0">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-sm ${
                      isHighlighted
                        ? "bg-primary text-white"
                        : isPast
                        ? "bg-muted text-muted-foreground"
                        : "bg-card border-2 border-border text-muted-foreground"
                    }`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    {i < SCHEDULE_ITEMS.length - 1 && (
                      <div className={`w-0.5 flex-1 min-h-6 ${isPast ? "bg-muted" : "bg-border"}`} />
                    )}
                  </div>

                  <div className="flex-1 pt-2.5">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className={`font-mono font-bold text-lg ${isHighlighted ? "text-primary" : ""}`}>
                        {item.time}
                      </span>
                      {isHighlighted && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-bold border border-green-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500 live-dot" />
                          NOW
                        </span>
                      )}
                      {isPast && !isHighlighted && (
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">Done</span>
                      )}
                    </div>
                    <h3 className={`text-lg font-bold mt-0.5 ${isHighlighted ? "text-primary" : ""}`}>
                      {item.label}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </CardContent>
      </Card>

      {/* What to expect */}
      <div>
        <h2 className="text-xl font-bold mb-5">About the Campus Broadcast</h2>
        <div className="grid gap-5 sm:grid-cols-3">
          <Card className="shadow-sm hover:shadow-md transition-shadow border-t-4 border-t-primary">
            <CardContent className="pt-5 space-y-2">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <Music className="h-4 w-4 text-primary" />
              </div>
              <h3 className="font-bold">How to Request a Song</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Head to the Song Requests page and fill in the song title and artist. You can also submit anonymously.
                Requests are reviewed by the broadcast team before airing.
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-sm hover:shadow-md transition-shadow border-t-4 border-t-pink-400">
            <CardContent className="pt-5 space-y-2">
              <div className="w-9 h-9 rounded-lg bg-pink-50 flex items-center justify-center">
                <Heart className="h-4 w-4 text-pink-500" />
              </div>
              <h3 className="font-bold">How Dedications Work</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                When submitting a song request, toggle "Add a dedication" to include a personal message
                dedicated to a classmate or friend. Approved dedications are displayed on the Dedications page.
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-sm hover:shadow-md transition-shadow border-t-4 border-t-blue-400">
            <CardContent className="pt-5 space-y-2">
              <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                <RadioTower className="h-4 w-4 text-blue-500" />
              </div>
              <h3 className="font-bold">Who Runs the Broadcast</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                The campus Radio Club is responsible for curating and airing songs each evening from 18:15 to 18:35.
                Interested in joining? Speak to your teacher.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
