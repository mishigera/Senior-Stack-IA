import type { AuditLog } from "./audit-log.entity.js";

/**
 * Puerto de dominio: repositorio de logs de auditoría.
 */
export interface IAuditLogRepository {
  findRecent(limit: number): Promise<AuditLog[]>;
}
