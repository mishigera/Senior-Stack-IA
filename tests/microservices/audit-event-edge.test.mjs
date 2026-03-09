import test from "node:test";
import assert from "node:assert/strict";
import { buildAuditEvent } from "../../services/role-service/lib/auditEvent.js";

test("buildAuditEvent includes all required fields", () => {
  const event = buildAuditEvent({
    eventType: "role.assigned",
    userId: "user-456",
    action: "ASSIGN_ROLE",
    resource: "USER_ROLE",
    details: "Assigned role 2 to user u-1",
  });

  assert.equal(typeof event.eventType, "string");
  assert.equal(typeof event.userId, "string");
  assert.equal(typeof event.action, "string");
  assert.equal(typeof event.resource, "string");
  assert.equal(typeof event.details, "string");
  assert.equal(typeof event.createdAt, "string");
});

test("buildAuditEvent generates valid ISO timestamp", () => {
  const event = buildAuditEvent({
    eventType: "role.created",
    userId: "user-1",
    action: "CREATE_ROLE",
    resource: "ROLE",
    details: "test",
  });

  const parsed = new Date(event.createdAt);
  assert.ok(!isNaN(parsed.getTime()), "createdAt must be valid ISO date");
});

test("buildAuditEvent preserves all input data", () => {
  const input = {
    eventType: "role.created",
    userId: "abc",
    action: "TEST_ACTION",
    resource: "TEST_RESOURCE",
    details: "Some details",
  };

  const event = buildAuditEvent(input);

  assert.equal(event.eventType, input.eventType);
  assert.equal(event.userId, input.userId);
  assert.equal(event.action, input.action);
  assert.equal(event.resource, input.resource);
  assert.equal(event.details, input.details);
});
