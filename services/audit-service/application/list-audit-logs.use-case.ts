import type { IAuditLogRepository } from "../domain/audit-log.repository.js";
import type { AuditLog } from "../domain/audit-log.entity.js";

export class ListAuditLogsUseCase {
  constructor(private readonly repository: IAuditLogRepository) {}

  async execute(limit: number = 500): Promise<AuditLog[]> {
    return this.repository.findRecent(limit);
  }
}
