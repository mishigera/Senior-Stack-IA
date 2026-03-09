import type { Pool } from "pg";
import type { IRoleRepository } from "../../domain/role.repository.js";
import type { Role } from "../../domain/role.entity.js";

export class RolePgRepository implements IRoleRepository {
  constructor(private readonly pool: Pool) {}

  async findAll(): Promise<Role[]> {
    const result = await this.pool.query<Role & { description: string | null }>(
      "SELECT id, name, description FROM roles ORDER BY id ASC",
    );
    return result.rows;
  }

  async create(name: string, description: string | null): Promise<Role> {
    const result = await this.pool.query<Role & { description: string | null }>(
      "INSERT INTO roles (name, description) VALUES ($1, $2) RETURNING id, name, description",
      [name, description],
    );
    return result.rows[0]!;
  }

  async assignRoleToUser(userId: string, roleId: number): Promise<void> {
    await this.pool.query(
      "INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)",
      [userId, roleId],
    );
  }

  async existsUser(userId: string): Promise<boolean> {
    const result = await this.pool.query(
      "SELECT 1 FROM users WHERE id = $1 LIMIT 1",
      [userId],
    );
    return (result.rowCount ?? 0) > 0;
  }
}
