import test from "node:test";
import assert from "node:assert/strict";
import { mapUserRow } from "../../services/user-service/lib/mappers.js";

test("mapUserRow handles null optional fields gracefully", () => {
  const row = {
    id: "u-2",
    username: "jane",
    email: null,
    first_name: null,
    last_name: null,
    profile_image_url: null,
    created_at: null,
    updated_at: null,
  };

  const mapped = mapUserRow(row);

  assert.equal(mapped.id, "u-2");
  assert.equal(mapped.username, "jane");
  assert.equal(mapped.email, null);
  assert.equal(mapped.firstName, null);
  assert.equal(mapped.lastName, null);
  assert.equal(mapped.profileImageUrl, null);
  assert.equal(mapped.password, undefined, "password must never leak");
});

test("mapUserRow never includes fields beyond the defined contract", () => {
  const row = {
    id: "u-3",
    username: "admin",
    email: "admin@test.com",
    first_name: "Admin",
    last_name: "Root",
    profile_image_url: null,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    password: "super-secret-hash",
    secret_internal: "should_not_leak",
  };

  const mapped = mapUserRow(row);
  const keys = Object.keys(mapped);

  assert.ok(!keys.includes("password"), "password must be excluded");
  assert.ok(!keys.includes("secret_internal"), "unknown fields must not propagate");

  const allowedKeys = ["id", "username", "email", "firstName", "lastName", "profileImageUrl", "createdAt", "updatedAt"];
  assert.deepEqual(keys.sort(), allowedKeys.sort());
});
