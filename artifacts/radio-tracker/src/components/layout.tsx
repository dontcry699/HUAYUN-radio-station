import { Link, useLocation } from "wouter";
import { RadioTower, Music, Inbox, Heart, Calendar, Megaphone, Menu, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useBroadcastStatus } from "@/hooks/use-broadcast-status";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/library", label: "Library", icon: Music },
  { href: "/submissions", label: "Submissions", icon: Inbox },
  { href: "/dedications", label: "Dedications", icon: Heart },
  { href: "/schedule", label: "Schedule", icon: Calendar },
  { href: "/announcements", label: "Announcements", icon: Megaphone },
];

function SidebarContent({ location }: { location: string }) {
  const { isLive, label, status } = useBroadcastStatus();

  const statusColor = {
    "school-not-started": "bg-gray-400",
    "preparing": "bg-amber-400",
    "live": "bg-green-500 live-dot",
    "study-session": "bg-blue-400",
    "ended": "bg-gray-400",
  }[status];

  const statusText = {
    "school-not-started": "text-gray-500",
    "preparing": "text-amber-600",
    "live": "text-green-600 font-bold",
    "study-session": "text-blue-600",
    "ended": "text-gray-500",
  }[status];

  return (
    <div className="flex flex-col h-full bg-sidebar">
      <div className="p-5 border-b border-sidebar-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shrink-0">
            <RadioTower className="h-4 w-4 text-white" />
          </div>
          <div>
            <div className="font-bold text-base leading-tight text-sidebar-foreground">Campus Radio</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-widest">Broadcasting Platform</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-auto py-4">
        <ul className="space-y-0.5 px-3">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <li key={item.href}>
                <Link href={item.href}>
                  <div
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all cursor-pointer text-sm ${
                      isActive
                        ? "bg-primary text-white font-semibold shadow-sm"
                        : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
                    }`}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    {item.label}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-2 rounded-lg bg-sidebar-accent/60">
          <div className={`w-2 h-2 rounded-full shrink-0 ${statusColor}`} />
          <span className={`text-xs leading-tight ${statusText}`}>{label}</span>
        </div>
      </div>
    </div>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { isLive } = useBroadcastStatus();

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      <Sheet>
        <div className="md:hidden flex items-center border-b px-4 py-3 bg-sidebar sticky top-0 z-10">
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="mr-2">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
              <RadioTower className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-bold text-base text-sidebar-foreground">Campus Radio</span>
            {isLive && <div className="w-2 h-2 rounded-full bg-green-500 live-dot" />}
          </div>
        </div>

        <SheetContent side="left" className="w-[260px] sm:w-[300px] p-0 border-r-0">
          <SidebarContent location={location} />
        </SheetContent>
      </Sheet>

      <div className="hidden md:flex flex-col w-60 border-r bg-sidebar shrink-0 sticky top-0 h-screen">
        <SidebarContent location={location} />
      </div>

      <main className="flex-1 w-full max-w-[100vw] overflow-x-hidden min-h-0 bg-background">
        <div className="h-full p-4 md:p-8 max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
