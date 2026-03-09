import React from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./app-sidebar";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

export function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    // Should be handled by router, but just in case
    return null;
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background/50">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0 bg-secondary/30">
          <header className="h-16 flex items-center gap-4 px-6 bg-background/80 backdrop-blur-sm border-b border-border/50 sticky top-0 z-10">
            <SidebarTrigger className="hover:bg-muted p-2 rounded-lg transition-colors" />
            <div className="ml-auto flex items-center space-x-4">
              <span className="text-sm font-medium text-muted-foreground">
                Workspace
              </span>
            </div>
          </header>
          <main className="flex-1 p-6 lg:p-8 max-w-7xl mx-auto w-full">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
