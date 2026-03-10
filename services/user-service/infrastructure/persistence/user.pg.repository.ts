import type { Pool } from "pg";
import { desc, eq } from "drizzle-orm";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { pgTable, timestamp, varchar } from "drizzle-orm/pg-core";
import type { IUserRepository } from "../../domain/user.repository.js";
import type { UserPublic } from "../../domain/user.entity.js";

const usersTable = pgTable("users", {
  id: varchar("id").primaryKey(),
  username: varchar("username"),
  email: varchar("email"),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
});

type UserRow = {
  id: string;
  username: string | null;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
};

function toIso(value: Date | null): string | null {
  return value ? value.toISOString() : null;
}

function mapRow(row: UserRow): UserPublic {
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    firstName: row.firstName,
    lastName: row.lastName,
    profileImageUrl: row.profileImageUrl,
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  };
}

/**
 * Adaptador de infraestructura: implementación del repositorio de usuarios con PostgreSQL.
 */
export class UserPgRepository implements IUserRepository {
  private readonly db: NodePgDatabase;

  constructor(pool: Pool) {
    this.db = drizzle(pool);
  }

  async findAll(): Promise<UserPublic[]> {
    const rows = await this.db
      .select({
        id: usersTable.id,
        username: usersTable.username,
        email: usersTable.email,
        firstName: usersTable.firstName,
        lastName: usersTable.lastName,
        profileImageUrl: usersTable.profileImageUrl,
        createdAt: usersTable.createdAt,
        updatedAt: usersTable.updatedAt,
      })
      .from(usersTable)
      .orderBy(desc(usersTable.createdAt));

    return rows.map(mapRow);
  }

  async findById(id: string): Promise<UserPublic | null> {
    const [row] = await this.db
      .select({
        id: usersTable.id,
        username: usersTable.username,
        email: usersTable.email,
        firstName: usersTable.firstName,
        lastName: usersTable.lastName,
        profileImageUrl: usersTable.profileImageUrl,
        createdAt: usersTable.createdAt,
        updatedAt: usersTable.updatedAt,
      })
      .from(usersTable)
      .where(eq(usersTable.id, id))
      .limit(1);

    if (!row) return null;
    return mapRow(row);
  }
}
