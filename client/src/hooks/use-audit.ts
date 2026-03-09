import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { AuditLog } from "@shared/schema";

export function useAuditLogs() {
  return useQuery<AuditLog[]>({
    queryKey: [api.audit.list.path],
    queryFn: async () => {
      const res = await fetch(api.audit.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch audit logs");
      return res.json();
    },
  });
}
