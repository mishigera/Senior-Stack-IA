import { describe, it, expect, vi } from "vitest";
import { RolePgRepository } from "../../services/role-service/infrastructure/persistence/role.pg.repository";

describe("RolePgRepository.assignRoleToUser", () => {
  it("replaces existing roles before inserting the selected role", async () => {
    const query = vi.fn().mockResolvedValue({ rows: [], rowCount: 1 });
    const repository = new RolePgRepository({ query } as any);

    await repository.assignRoleToUser("u-1", 2);

    expect(query).toHaveBeenCalled();

    const calls = query.mock.calls as [unknown, unknown[]][];
    const sqlText = calls
      .map(([sql]) => {
        if (typeof sql === "string") return sql;
        if (sql && typeof sql === "object" && "text" in (sql as Record<string, unknown>)) {
          return String((sql as Record<string, unknown>).text);
        }
        return String(sql);
      })
      .join("\n")
      .toLowerCase();

    expect(sqlText).toContain("delete from");
    expect(sqlText).toContain("user_roles");
    expect(sqlText).toContain("insert into");

    const insertCall = calls.find(([sql]) => {
      const text = typeof sql === "string"
        ? sql
        : (sql && typeof sql === "object" && "text" in (sql as Record<string, unknown>))
          ? String((sql as Record<string, unknown>).text)
          : "";
      return text.toLowerCase().includes("insert into") && text.toLowerCase().includes("user_roles");
    });

    expect(insertCall?.[1]).toEqual(["u-1", 2]);
  });
});
