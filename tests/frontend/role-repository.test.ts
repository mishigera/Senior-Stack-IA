import { describe, it, expect, vi } from "vitest";
import { RolePgRepository } from "../../services/role-service/infrastructure/persistence/role.pg.repository";

describe("RolePgRepository.assignRoleToUser", () => {
  it("replaces existing roles before inserting the selected role", async () => {
    const query = vi.fn().mockResolvedValue({ rows: [], rowCount: 1 });
    const repository = new RolePgRepository({ query } as any);

    await repository.assignRoleToUser("u-1", 2);

    expect(query).toHaveBeenCalledTimes(1);

    const [sql, params] = query.mock.calls[0] as [string, unknown[]];

    expect(sql).toContain("WITH deleted AS");
    expect(sql).toContain("DELETE FROM user_roles");
    expect(sql).toContain("INSERT INTO user_roles");
    expect(params).toEqual(["u-1", 2]);
  });
});
