import test from "node:test";
import assert from "node:assert/strict";
import { buildAuditEvent } from "../../services/role-service/lib/auditEvent.js";

test("buildAuditEvent creates expected envelope", () => {
  const event = buildAuditEvent({
    eventType: "role.created",
    userId: "user-123",
    action: "CREATE_ROLE",
    resource: "ROLE",
    details: "Role created: admin",
  });

  assert.equal(event.eventType, "role.created");
  assert.equal(event.userId, "user-123");
  assert.equal(event.action, "CREATE_ROLE");
  assert.equal(event.resource, "ROLE");
  assert.equal(event.details, "Role created: admin");
  assert.ok(event.createdAt);
});
