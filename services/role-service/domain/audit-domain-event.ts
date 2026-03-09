/**
 * Evento de dominio (DDD): evento de auditoría para publicación asíncrona.
 */
export interface AuditDomainEvent {
  eventType: string;
  userId: string | undefined;
  action: string;
  resource: string;
  details: string | null;
  createdAt: string;
}

export function buildAuditEvent(p: {
  eventType: string;
  userId: string | undefined;
  action: string;
  resource: string;
  details: string | null;
}): AuditDomainEvent {
  return {
    ...p,
    createdAt: new Date().toISOString(),
  };
}
