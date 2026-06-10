import { Link, useLocation } from "wouter";
import { RadioTower, Music, ClipboardList, Calendar, Megaphone, Trophy, Settings, LayoutDashboard, Menu, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useBroadcastStatus } from "@/hooks/use-broadcast-status";

const navItems = [
  { href: "/", label: "广播中心", sublabel: "Dashboard", icon: LayoutDashboard },
  { href: "/library", label: "歌曲库", sublabel: "Library", icon: Music },
  { href: "/submissions", label: "点歌审核", sublabel: "Submissions", icon: ClipboardList },
  { href: "/dedications", label: "校园寄语", sublabel: "Dedications", icon: Heart },
  { href: "/schedule", label: "广播安排", sublabel: "Schedule", icon: Calendar },
  { href: "/announcements", label: "校园公告", sublabel: "Announcements", icon: Megaphone },
  { href: "/charts", label: "热门榜单", sublabel: "Charts", icon: Trophy },
  { href: "/settings", label: "系统设置", sublabel: "Settings", icon: Settings },
];

const statusColors: Record<string, { dot: string; text: string }> = {
  "school-not-started": { dot: "bg-gray-400", text: "text-gray-500" },
  "preparing": { dot: "bg-amber-400", text: "text-amber-600" },
  "live": { dot: "bg-green-500 live-dot", text: "text-green-600 font-bold" },
  "study-session": { dot: "bg-blue-400", text: "text-blue-600" },
  "ended": { dot: "bg-gray-400", text: "text-gray-500" },
};

function SidebarInner({ location }: { location: string }) {
  const { status, label, isLive } = useBroadcastStatus();
  const sc = statusColors[status];

  return (
    <div className="flex flex-col h-full bg-sidebar">
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shrink-0 shadow-sm">
            <RadioTower className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0">
            <div className="font-bold text-sm leading-tight text-sidebar-foreground truncate">校园之声广播站</div>
            <div className="text-[10px] text-muted-foreground leading-tight">让音乐连接校园生活</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-auto py-3">
        <ul className="space-y-0.5 px-2">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <li key={item.href}>
                <Link href={item.href}>
                  <div className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all cursor-pointer text-sm ${
                    isActive
                      ? "bg-primary text-white font-semibold shadow-sm"
                      : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  }`}>
                    <item.icon className="h-4 w-4 shrink-0" />
                    <div className="min-w-0">
                      <div className="leading-tight">{item.label}</div>
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-3 border-t border-sidebar-border space-y-2">
        <div className="flex items-center gap-2 px-2 py-2 rounded-lg bg-sidebar-accent/60">
          <div className={`w-2 h-2 rounded-full shrink-0 ${sc.dot}`} />
          <span className={`text-xs leading-tight truncate ${sc.text}`}>{label}</span>
        </div>
        <div className="text-center text-[10px] text-muted-foreground/60 pb-1">
          Voice of Campus Radio
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
            <Button variant="ghost" size="icon" className="mr-2 -ml-2">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
              <RadioTower className="h-4 w-4 text-white" />
            </div>
            <div>
              <div className="font-bold text-sm leading-tight">校园之声广播站</div>
              <div className="text-[10px] text-muted-foreground">让音乐连接校园生活</div>
            </div>
            {isLive && <div className="w-2 h-2 rounded-full bg-green-500 live-dot ml-1" />}
          </div>
        </div>
        <SheetContent side="left" className="w-[240px] p-0 border-r-0">
          <SidebarInner location={location} />
        </SheetContent>
      </Sheet>

      <div className="hidden md:flex flex-col w-56 border-r bg-sidebar shrink-0 sticky top-0 h-screen">
        <SidebarInner location={location} />
      </div>

      <main className="flex-1 w-full max-w-[100vw] overflow-x-hidden bg-background">
        <div className="min-h-full p-4 md:p-8 max-w-6xl mx-auto">
          {children}
        </div>
        <footer className="border-t bg-sidebar/50 py-4 px-6 text-center">
          <p className="text-sm font-semibold text-foreground/80">校园之声广播站</p>
          <p className="text-xs text-muted-foreground mt-0.5">让音乐连接校园生活 · Voice of Campus Radio</p>
        </footer>
      </main>
    </div>
  );
}
