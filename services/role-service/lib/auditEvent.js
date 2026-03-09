export function buildAuditEvent({ eventType, userId, action, resource, details }) {
  return {
    eventType,
    userId,
    action,
    resource,
    details,
    createdAt: new Date().toISOString(),
  };
}
