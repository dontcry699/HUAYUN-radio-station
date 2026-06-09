import { Link, useLocation } from "wouter";
import { Radio, Music, Inbox, Menu, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Dashboard", icon: Radio },
    { href: "/songs", label: "Library", icon: Music },
    { href: "/submissions", label: "Submissions", icon: Inbox },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      <Sheet>
        <div className="md:hidden flex items-center border-b px-4 py-3 bg-card sticky top-0 z-10">
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="mr-2">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <div className="font-bold text-lg tracking-tight uppercase flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            WXYC 89.3
          </div>
        </div>
        <SheetContent side="left" className="w-[240px] sm:w-[300px] p-0 border-r-0">
          <div className="flex flex-col h-full bg-sidebar">
            <div className="p-6 border-b border-sidebar-border">
              <div className="font-bold text-xl tracking-tighter uppercase flex items-center gap-2 text-sidebar-foreground">
                <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(240,60,30,0.8)]" />
                WXYC Tracker
              </div>
            </div>
            <nav className="flex-1 overflow-auto py-4">
              <ul className="space-y-1 px-3">
                {navItems.map((item) => {
                  const isActive = location === item.href;
                  return (
                    <li key={item.href}>
                      <Link href={item.href}>
                        <div
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors cursor-pointer ${
                            isActive
                              ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                              : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                          }`}
                        >
                          <item.icon className={`h-4 w-4 ${isActive ? "text-primary" : ""}`} />
                          {item.label}
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
            <div className="p-4 border-t border-sidebar-border">
              <Button variant="ghost" className="w-full justify-start gap-2 text-muted-foreground">
                <Settings className="h-4 w-4" />
                Settings
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <div className="hidden md:flex flex-col w-64 border-r bg-sidebar shrink-0 sticky top-0 h-screen">
        <div className="p-6 border-b border-sidebar-border">
          <div className="font-bold text-xl tracking-tighter uppercase flex items-center gap-2 text-sidebar-foreground">
            <div className="w-2.5 h-2.5 rounded-full bg-primary animate-[pulse_2s_ease-in-out_infinite] shadow-[0_0_8px_rgba(240,60,30,0.8)]" />
            WXYC Tracker
          </div>
        </div>
        <nav className="flex-1 py-6">
          <ul className="space-y-1 px-3">
            {navItems.map((item) => {
              const isActive = location === item.href;
              return (
                <li key={item.href}>
                  <Link href={item.href}>
                    <div
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors cursor-pointer ${
                        isActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                          : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                      }`}
                    >
                      <item.icon className={`h-4 w-4 ${isActive ? "text-primary" : ""}`} />
                      {item.label}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      <main className="flex-1 w-full max-w-[100vw] overflow-x-hidden min-h-0 bg-background">
        <div className="h-full p-4 md:p-8 max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
