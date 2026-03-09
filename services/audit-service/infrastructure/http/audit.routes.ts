import type { Express, Request, Response } from "express";
import type { ListAuditLogsUseCase } from "../../application/list-audit-logs.use-case.js";

const SOURCE = "audit-service";

function requireActor(req: Request, res: Response, next: () => void): void {
  if (!req.header("x-actor-user-id")) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
  next();
}

export function registerAuditRoutes(
  app: Express,
  listAuditLogs: ListAuditLogsUseCase,
  isStorageReady: () => boolean,
): void {
  app.get("/audit-logs", requireActor, async (_req, res) => {
    if (!isStorageReady()) {
      res.status(503).json({ message: "Audit storage is not ready" });
      return;
    }
    try {
      const logs = await listAuditLogs.execute(500);
      res.status(200).json(logs);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(JSON.stringify({ source: SOURCE, level: "error", message: "list_audit_logs_failed", error: msg }));
      res.status(500).json({ message: "Failed to list audit logs" });
    }
  });
}
