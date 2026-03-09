import { useUsers } from "@/hooks/use-users";
import { useRoles } from "@/hooks/use-roles";
import { useAuditLogs } from "@/hooks/use-audit";
import { SectionTitle, SectionDescription, Card } from "@/components/ui-wrappers";
import { Users, Shield, ActivitySquare, ArrowUpRight } from "lucide-react";
import { format } from "date-fns";

export default function Dashboard() {
  const { data: users } = useUsers();
  const { data: roles } = useRoles();
  const { data: logs } = useAuditLogs();

  const recentLogs = logs?.slice(0, 5) || [];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <SectionTitle>Dashboard Overview</SectionTitle>
        <SectionDescription>High-level metrics and recent activity across your organization.</SectionDescription>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-background to-primary/5 border-primary/10">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Users</p>
              <h3 className="text-3xl font-display font-bold text-foreground">{users?.length || 0}</h3>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-background to-accent/5 border-accent/10">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active Roles</p>
              <h3 className="text-3xl font-display font-bold text-foreground">{roles?.length || 0}</h3>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-background to-green-500/5 border-green-500/10">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-green-500/10 flex items-center justify-center text-green-600">
              <ActivitySquare className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Audit Events</p>
              <h3 className="text-3xl font-display font-bold text-foreground">{logs?.length || 0}</h3>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card className="h-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold font-display">Recent Audit Logs</h3>
              <button className="text-sm text-primary font-medium flex items-center hover:underline">
                View all <ArrowUpRight className="h-4 w-4 ml-1" />
              </button>
            </div>
            <div className="space-y-4">
              {recentLogs.map((log) => (
                <div key={log.id} className="flex items-start gap-4 p-4 rounded-xl bg-muted/50 border border-border/50">
                  <div className="mt-0.5 h-2 w-2 rounded-full bg-primary" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{log.action}</p>
                    <p className="text-xs text-muted-foreground mt-1">Resource: {log.resource}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(log.createdAt), "MMM d, HH:mm")}
                  </span>
                </div>
              ))}
              {recentLogs.length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm">No recent activity</div>
              )}
            </div>
          </Card>
        </div>
        
        <div className="lg:col-span-1">
          {/* landing page hero scenic mountain landscape */}
          <div className="relative rounded-2xl overflow-hidden shadow-lg h-full min-h-[300px] group">
            <img 
              src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=80" 
              alt="Workspace"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 p-6 text-white">
              <div className="flex items-center gap-2 text-primary-foreground/80 text-sm font-medium mb-2">
                <ActivitySquare className="h-4 w-4" /> System Online
              </div>
              <h3 className="text-xl font-display font-bold mb-2">Workspace Active</h3>
              <p className="text-sm text-white/70">All services are running normally. AI agent is ready to assist.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
