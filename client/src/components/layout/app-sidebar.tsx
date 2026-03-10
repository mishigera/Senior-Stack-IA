import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import {
  LayoutDashboard,
  Users,
  Shield,
  ActivitySquare,
  Bot,
  LogOut,
  ChevronRight
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const navigationAll: { name: string; href: string; icon: any; roles: string[] | null }[] = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard, roles: null },
  { name: "Users", href: "/users", icon: Users, roles: ["Admin", "Manager"] },
  { name: "Roles", href: "/roles", icon: Shield, roles: ["Admin"] },
  { name: "Audit Logs", href: "/audit", icon: ActivitySquare, roles: ["Admin", "Manager"] },
  { name: "AI Agent", href: "/agent", icon: Bot, roles: null },
];
function getNavigationForUser(roleNames: string[] | undefined) {
  if (!roleNames?.length) return navigationAll.filter((i) => i.roles === null);
  return navigationAll.filter((i) => i.roles === null || (i.roles && i.roles.some((r) => roleNames.includes(r))));
}

export function AppSidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { state } = useSidebar();
  
  const getInitials = (name?: string) => name ? name.substring(0, 2).toUpperCase() : "U";

  return (
    <Sidebar variant="inset" className="border-r border-border/50">
      <SidebarHeader className="h-16 flex items-center justify-center border-b border-border/50 px-6">
        <div className="flex items-center gap-3 font-display font-bold text-xl tracking-tight text-primary w-full">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
            <Bot className="h-5 w-5 text-primary-foreground" />
          </div>
          {state !== "collapsed" && <span>Toka<span className="text-foreground">AI</span></span>}
        </div>
      </SidebarHeader>

      <SidebarContent className="py-6">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold tracking-wider uppercase text-muted-foreground/70 mb-2 px-6">
            Management
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="px-3 gap-1">
              {getNavigationForUser(user?.roleNames).map((item) => {
                const isActive = location === item.href;
                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton asChild tooltip={item.name}>
                      <Link 
                        href={item.href}
                        className={cn(
                          "h-11 px-3 rounded-xl transition-all duration-200 group flex items-center gap-3",
                          isActive 
                            ? "bg-primary/10 text-primary font-medium shadow-sm" 
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        <item.icon className={cn("h-5 w-5", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                        <span>{item.name}</span>
                        {isActive && <ChevronRight className="h-4 w-4 ml-auto opacity-50" />}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border/50 p-4">
        {user && (
          <div className="flex items-center gap-3 px-2 mb-4">
            <Avatar className="h-9 w-9 ring-2 ring-background shadow-sm">
              <AvatarImage src={user.profileImageUrl || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                {getInitials(((user as { username?: string }).username || user.email || undefined)?.toString())}
              </AvatarFallback>
            </Avatar>
            {state !== "collapsed" && (
              <div className="flex flex-col truncate">
                <span className="text-sm font-medium leading-none truncate">
                  {(user as { username?: string }).username ?? user.email ?? "User"}
                </span>
                <span className="text-xs text-muted-foreground truncate">{user.email ?? (user as { username?: string }).username}</span>
              </div>
            )}
          </div>
        )}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <button 
                onClick={() => logout()}
                className="w-full h-10 px-3 rounded-xl text-destructive hover:bg-destructive/10 transition-colors flex items-center gap-3"
              >
                <LogOut className="h-5 w-5" />
                <span>Log out</span>
              </button>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
