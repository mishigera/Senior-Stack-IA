import type { Collection } from "mongodb";
import type { IAuditLogRepository } from "../../domain/audit-log.repository.js";
import type { AuditLog } from "../../domain/audit-log.entity.js";

export interface MongoAuditDoc {
  _id?: unknown;
  userId?: string | null;
  action: string;
  resource: string;
  details?: string | null;
  eventType?: string;
  createdAt: Date;
}

export class AuditMongoRepository implements IAuditLogRepository {
  constructor(private readonly collection: Collection<MongoAuditDoc>) {}

  async findRecent(limit: number): Promise<AuditLog[]> {
    const docs = await this.collection
      .find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();
    return docs.map((d) => ({
      id: String(d._id),
      userId: d.userId ?? null,
      action: d.action,
      resource: d.resource,
      details: d.details ?? null,
      createdAt: d.createdAt,
    }));
  }
}
