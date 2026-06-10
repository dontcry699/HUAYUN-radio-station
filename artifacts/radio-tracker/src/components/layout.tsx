import { Link, useLocation } from "wouter";
import {
  RadioTower, Music, ClipboardList, Calendar, Megaphone,
  Trophy, Settings, LayoutDashboard, Menu, Heart,
  LogIn, LogOut, Users, ShieldCheck, Mic2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useBroadcastStatus } from "@/hooks/use-broadcast-status";
import { useAuth } from "@/context/auth-context";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: Array<"broadcaster" | "admin" | "public">;
}

const ALL_NAV: NavItem[] = [
  { href: "/", label: "广播中心", icon: LayoutDashboard, roles: ["public", "broadcaster", "admin"] },
  { href: "/library", label: "歌曲库", icon: Music, roles: ["broadcaster", "admin"] },
  { href: "/submissions", label: "点歌审核", icon: ClipboardList, roles: ["public", "broadcaster", "admin"] },
  { href: "/dedications", label: "校园寄语", icon: Heart, roles: ["public", "broadcaster", "admin"] },
  { href: "/schedule", label: "广播安排", icon: Calendar, roles: ["public", "broadcaster", "admin"] },
  { href: "/announcements", label: "校园公告", icon: Megaphone, roles: ["public", "broadcaster", "admin"] },
  { href: "/charts", label: "热门榜单", icon: Trophy, roles: ["public", "broadcaster", "admin"] },
  { href: "/users", label: "用户管理", icon: Users, roles: ["admin"] },
  { href: "/settings", label: "系统设置", icon: Settings, roles: ["admin"] },
];

const statusColors: Record<string, { dot: string; text: string }> = {
  "school-not-started": { dot: "bg-gray-400", text: "text-gray-500" },
  "preparing": { dot: "bg-amber-400", text: "text-amber-600" },
  "live": { dot: "bg-green-500 live-dot", text: "text-green-600 font-bold" },
  "study-session": { dot: "bg-blue-400", text: "text-blue-600" },
  "ended": { dot: "bg-gray-400", text: "text-gray-500" },
};

const ROLE_LABEL: Record<string, string> = { admin: "管理员", broadcaster: "播音员" };
const ROLE_ICON: Record<string, typeof ShieldCheck> = { admin: ShieldCheck, broadcaster: Mic2 };

function SidebarInner({ location, onNavClick }: { location: string; onNavClick?: () => void }) {
  const { status, label } = useBroadcastStatus();
  const { user, isBroadcaster, isAdmin, logout } = useAuth();
  const sc = statusColors[status];

  const visibleItems = ALL_NAV.filter(item => {
    if (!item.roles) return true;
    if (item.roles.includes("public")) return true;
    if (isAdmin && item.roles.includes("admin")) return true;
    if (isBroadcaster && item.roles.includes("broadcaster")) return true;
    return false;
  });

  const RoleIcon = user ? (ROLE_ICON[user.role] ?? ShieldCheck) : null;

  return (
    <div className="flex flex-col h-full bg-sidebar">
      {/* Logo */}
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

      {/* Nav */}
      <nav className="flex-1 overflow-auto py-3">
        <ul className="space-y-0.5 px-2">
          {visibleItems.map((item) => {
            const isActive = location === item.href;
            return (
              <li key={item.href}>
                <Link href={item.href} onClick={onNavClick}>
                  <div className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all cursor-pointer text-sm ${
                    isActive
                      ? "bg-primary text-white font-semibold shadow-sm"
                      : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  }`}>
                    <item.icon className="h-4 w-4 shrink-0" />
                    <span className="leading-tight">{item.label}</span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom: user info + status */}
      <div className="p-3 border-t border-sidebar-border space-y-2">
        {/* Status indicator */}
        <div className="flex items-center gap-2 px-2 py-2 rounded-lg bg-sidebar-accent/60">
          <div className={`w-2 h-2 rounded-full shrink-0 ${sc.dot}`} />
          <span className={`text-xs leading-tight truncate ${sc.text}`}>{label}</span>
        </div>

        {/* User / Login */}
        {user ? (
          <div className="bg-sidebar-accent rounded-lg p-2.5 space-y-2">
            <div className="flex items-center gap-2">
              {RoleIcon && (
                <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                  <RoleIcon className="h-3.5 w-3.5 text-primary" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate">{user.name}</p>
                <p className="text-[10px] text-muted-foreground">{ROLE_LABEL[user.role] ?? user.role}</p>
              </div>
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="w-full text-xs h-7 gap-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              onClick={logout}
            >
              <LogOut className="h-3 w-3" />退出登录
            </Button>
          </div>
        ) : (
          <Link href="/login" onClick={onNavClick}>
            <div className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-dashed border-primary/40 text-primary text-xs font-semibold hover:bg-primary/5 transition-colors cursor-pointer">
              <LogIn className="h-3.5 w-3.5" />工作人员登录
            </div>
          </Link>
        )}

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
