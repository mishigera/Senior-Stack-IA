/**
 * Entidad de dominio (read model): AuditLog (Bounded Context: Audit).
 */
export interface AuditLog {
  id: string;
  userId: string | null;
  action: string;
  resource: string;
  details: string | null;
  createdAt: Date;
}
