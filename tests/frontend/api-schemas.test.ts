import { describe, it, expect } from "vitest";
import { api } from "@shared/routes";

describe("API route schemas", () => {
  it("defines correct auth paths", () => {
    expect(api.auth.register.path).toBe("/api/register");
    expect(api.auth.register.method).toBe("POST");
    expect(api.auth.login.path).toBe("/api/login");
    expect(api.auth.login.method).toBe("POST");
    expect(api.auth.logout.path).toBe("/api/logout");
    expect(api.auth.user.path).toBe("/api/auth/user");
  });

  it("defines correct user paths", () => {
    expect(api.users.list.path).toBe("/api/users");
    expect(api.users.list.method).toBe("GET");
    expect(api.users.get.path).toBe("/api/users/:id");
    expect(api.users.get.method).toBe("GET");
  });

  it("defines correct role paths", () => {
    expect(api.roles.list.path).toBe("/api/roles");
    expect(api.roles.create.path).toBe("/api/roles");
    expect(api.roles.create.method).toBe("POST");
    expect(api.roles.assign.path).toBe("/api/users/:userId/roles");
    expect(api.roles.assign.method).toBe("POST");
  });

  it("defines correct audit path", () => {
    expect(api.audit.list.path).toBe("/api/audit-logs");
    expect(api.audit.list.method).toBe("GET");
  });

  it("validates register input schema", () => {
    const valid = api.auth.register.input.safeParse({
      username: "johndoe",
      password: "secure123",
      email: "john@example.com",
    });
    expect(valid.success).toBe(true);
  });

  it("rejects invalid register input", () => {
    const invalid = api.auth.register.input.safeParse({
      username: "ab",
      password: "12345",
      email: "not-an-email",
    });
    expect(invalid.success).toBe(false);
  });

  it("validates role create input", () => {
    const valid = api.roles.create.input.safeParse({
      name: "Admin",
      description: "Administrator role",
    });
    expect(valid.success).toBe(true);
  });

  it("requires role name field to be a string", () => {
    const invalid = api.roles.create.input.safeParse({
      name: 12345,
    });
    expect(invalid.success).toBe(false);
  });

  it("validates role assign input", () => {
    const valid = api.roles.assign.input.safeParse({ roleId: 1 });
    expect(valid.success).toBe(true);
  });
});
