import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";
import { buildUrl } from "@shared/routes";

describe("cn (className merge utility)", () => {
  it("merges multiple class names", () => {
    const result = cn("px-4", "py-2");
    expect(result).toContain("px-4");
    expect(result).toContain("py-2");
  });

  it("resolves Tailwind conflicts (last wins)", () => {
    const result = cn("px-4", "px-8");
    expect(result).toBe("px-8");
  });

  it("handles conditional classes", () => {
    const isActive = true;
    const result = cn("base", isActive && "active");
    expect(result).toContain("active");
  });

  it("filters out falsy values", () => {
    const result = cn("base", false, null, undefined, "extra");
    expect(result).toBe("base extra");
  });
});

describe("buildUrl (route parameter builder)", () => {
  it("replaces single parameter", () => {
    const url = buildUrl("/api/users/:id", { id: "abc" });
    expect(url).toBe("/api/users/abc");
  });

  it("replaces multiple parameters", () => {
    const url = buildUrl("/api/users/:userId/roles/:roleId", { userId: "u-1", roleId: 5 });
    expect(url).toBe("/api/users/u-1/roles/5");
  });

  it("returns original path when no params provided", () => {
    const url = buildUrl("/api/roles");
    expect(url).toBe("/api/roles");
  });

  it("leaves unmatched placeholders unchanged", () => {
    const url = buildUrl("/api/users/:id/roles/:roleId", { id: "u-1" });
    expect(url).toBe("/api/users/u-1/roles/:roleId");
  });
});
