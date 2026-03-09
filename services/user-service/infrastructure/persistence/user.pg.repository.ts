import type { Pool } from "pg";
import type { IUserRepository } from "../../domain/user.repository.js";
import type { UserPublic } from "../../domain/user.entity.js";

function mapRow(row: Record<string, unknown>): UserPublic {
  return {
    id: String(row.id),
    username: row.username != null ? String(row.username) : null,
    email: row.email != null ? String(row.email) : null,
    firstName: row.first_name != null ? String(row.first_name) : null,
    lastName: row.last_name != null ? String(row.last_name) : null,
    profileImageUrl: row.profile_image_url != null ? String(row.profile_image_url) : null,
    createdAt: row.created_at != null ? String(row.created_at) : null,
    updatedAt: row.updated_at != null ? String(row.updated_at) : null,
  };
}

/**
 * Adaptador de infraestructura: implementación del repositorio de usuarios con PostgreSQL.
 */
export class UserPgRepository implements IUserRepository {
  constructor(private readonly pool: Pool) {}

  async findAll(): Promise<UserPublic[]> {
    const result = await this.pool.query<Record<string, unknown>>(
      `SELECT id, username, email, first_name, last_name, profile_image_url, created_at, updated_at
       FROM users ORDER BY created_at DESC`,
    );
    return result.rows.map(mapRow);
  }

  async findById(id: string): Promise<UserPublic | null> {
    const result = await this.pool.query<Record<string, unknown>>(
      `SELECT id, username, email, first_name, last_name, profile_image_url, created_at, updated_at
       FROM users WHERE id = $1 LIMIT 1`,
      [id],
    );
    if (result.rowCount === 0) return null;
    return mapRow(result.rows[0]);
  }
}
