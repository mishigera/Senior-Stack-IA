import { useAuditLogs } from "@/hooks/use-audit";
import { SectionTitle, SectionDescription, Card } from "@/components/ui-wrappers";
import { Loader2, Database } from "lucide-react";
import { format } from "date-fns";

export default function AuditPage() {
  const { data: logs, isLoading } = useAuditLogs();

  if (isLoading) {
    return <div className="p-8 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <SectionTitle>Audit Logs</SectionTitle>
        <SectionDescription>Comprehensive trail of all administrative actions.</SectionDescription>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground border-b border-border">
              <tr>
                <th className="px-6 py-4 font-medium">Timestamp</th>
                <th className="px-6 py-4 font-medium">Action</th>
                <th className="px-6 py-4 font-medium">Resource</th>
                <th className="px-6 py-4 font-medium">Details</th>
                <th className="px-6 py-4 font-medium">User ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {logs?.map((log) => (
                <tr key={log.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs whitespace-nowrap text-muted-foreground">
                    {log.createdAt ? format(new Date(log.createdAt), "yyyy-MM-dd HH:mm:ss") : 'Unknown'}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-foreground font-medium">{log.resource}</td>
                  <td className="px-6 py-4 text-muted-foreground truncate max-w-xs" title={log.details || ""}>
                    {log.details || "-"}
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-muted-foreground">
                    {log.userId || "System"}
                  </td>
                </tr>
              ))}
              {!logs?.length && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center">
                      <Database className="h-12 w-12 mb-4 text-muted-foreground/50" />
                      <p>No audit records found.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
