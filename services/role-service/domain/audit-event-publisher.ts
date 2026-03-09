import type { AuditDomainEvent } from "../domain/audit-domain-event.js";

/**
 * Puerto de dominio: publicación de eventos de auditoría (infra implementa con RabbitMQ).
 */
export interface IAuditEventPublisher {
  publish(event: AuditDomainEvent): Promise<void>;
}
