import { Switch, Route, Redirect, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import { ProtectedLayout } from "@/components/layout/protected-layout";
import { useAuth } from "@/hooks/use-auth";

// Pages
import LandingPage from "@/pages/landing";
import DashboardPage from "@/pages/dashboard";
import UsersPage from "@/pages/users";
import RolesPage from "@/pages/roles";
import AuditPage from "@/pages/audit";
import AgentPage from "@/pages/agent";

function ProtectedRoutes() {
  const { user, isLoading } = useAuth();
  const [location] = useLocation();

  if (isLoading) return null; // handled by layout
  if (!user) return <Redirect to="/" />;

  const roleNames = user.roleNames ?? [];
  const canAccessUsersOrAudit = roleNames.some((r) => r === "Admin" || r === "Manager");
  const canAccessRoles = roleNames.includes("Admin");
  if ((location === "/users" || location === "/audit") && !canAccessUsersOrAudit) return <Redirect to="/" />;
  if (location === "/roles" && !canAccessRoles) return <Redirect to="/" />;

  return (
    <ProtectedLayout>
      <Switch>
        <Route path="/" component={DashboardPage} />
        <Route path="/users" component={UsersPage} />
        <Route path="/roles" component={RolesPage} />
        <Route path="/audit" component={AuditPage} />
        <Route path="/agent" component={AgentPage} />
        <Route component={NotFound} />
      </Switch>
    </ProtectedLayout>
  );
}

function Router() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse flex items-center gap-3 font-display font-bold text-xl text-primary">
          Loading TokaAI...
        </div>
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/">
        {user ? <ProtectedRoutes /> : <LandingPage />}
      </Route>
      {/* Catch all other routes and push through protected checks */}
      <Route path="/:rest*">
        {user ? <ProtectedRoutes /> : <Redirect to="/" />}
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
