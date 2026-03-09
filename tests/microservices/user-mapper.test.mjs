import test from "node:test";
import assert from "node:assert/strict";
import { mapUserRow } from "../../services/user-service/lib/mappers.js";

test("mapUserRow maps snake_case DB row into frontend shape", () => {
  const row = {
    id: "u-1",
    username: "john",
    password: "hash",
    email: "john@example.com",
    first_name: "John",
    last_name: "Doe",
    profile_image_url: "https://image",
    created_at: "2026-03-09T00:00:00.000Z",
    updated_at: "2026-03-09T00:00:00.000Z",
  };

  const mapped = mapUserRow(row);

  assert.deepEqual(mapped, {
    id: "u-1",
    username: "john",
    password: "hash",
    email: "john@example.com",
    firstName: "John",
    lastName: "Doe",
    profileImageUrl: "https://image",
    createdAt: "2026-03-09T00:00:00.000Z",
    updatedAt: "2026-03-09T00:00:00.000Z",
  });
});
