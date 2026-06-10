import { Switch, Route, Router as WouterRouter, useLocation, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { Layout } from "@/components/layout";
import Dashboard from "@/pages/dashboard";
import Songs from "@/pages/songs";
import Submissions from "@/pages/submissions";
import Dedications from "@/pages/dedications";
import Schedule from "@/pages/schedule";
import Announcements from "@/pages/announcements";
import Charts from "@/pages/charts";
import Settings from "@/pages/settings";
import LoginPage from "@/pages/login";
import UsersPage from "@/pages/users";
import { AuthProvider, useAuth } from "@/context/auth-context";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30000 } },
});

function BroadcasterRoute({ component: C }: { component: React.ComponentType }) {
  const { isBroadcaster } = useAuth();
  if (!isBroadcaster) return <Redirect to="/" />;
  return <C />;
}

function AdminRoute({ component: C }: { component: React.ComponentType }) {
  const { isAdmin } = useAuth();
  if (!isAdmin) return <Redirect to="/" />;
  return <C />;
}

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/library"><BroadcasterRoute component={Songs} /></Route>
        <Route path="/submissions" component={Submissions} />
        <Route path="/dedications" component={Dedications} />
        <Route path="/schedule" component={Schedule} />
        <Route path="/announcements" component={Announcements} />
        <Route path="/charts" component={Charts} />
        <Route path="/settings"><AdminRoute component={Settings} /></Route>
        <Route path="/users"><AdminRoute component={UsersPage} /></Route>
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Switch>
              <Route path="/login" component={LoginPage} />
              <Route component={Router} />
            </Switch>
          </WouterRouter>
        </AuthProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
