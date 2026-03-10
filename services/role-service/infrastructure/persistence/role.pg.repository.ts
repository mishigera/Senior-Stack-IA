import type { Pool } from "pg";
import { asc, eq } from "drizzle-orm";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { integer, pgTable, serial, text, varchar } from "drizzle-orm/pg-core";
import type { IRoleRepository } from "../../domain/role.repository.js";
import type { Role } from "../../domain/role.entity.js";

const rolesTable = pgTable("roles", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  description: text("description"),
});

const userRolesTable = pgTable("user_roles", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  roleId: integer("role_id").notNull(),
});

const usersTable = pgTable("users", {
  id: varchar("id").primaryKey(),
});

export class RolePgRepository implements IRoleRepository {
  private readonly db: NodePgDatabase;

  constructor(pool: Pool) {
    this.db = drizzle(pool);
  }

  async findAll(): Promise<Role[]> {
    return this.db
      .select({
        id: rolesTable.id,
        name: rolesTable.name,
        description: rolesTable.description,
      })
      .from(rolesTable)
      .orderBy(asc(rolesTable.id));
  }

  async create(name: string, description: string | null): Promise<Role> {
    const [role] = await this.db
      .insert(rolesTable)
      .values({ name, description })
      .returning({
        id: rolesTable.id,
        name: rolesTable.name,
        description: rolesTable.description,
      });

    if (!role) {
      throw new Error("Failed to create role");
    }

    return role;
  }

  async assignRoleToUser(userId: string, roleId: number): Promise<void> {
    await this.db.transaction(async (tx) => {
      await tx.delete(userRolesTable).where(eq(userRolesTable.userId, userId));
      await tx.insert(userRolesTable).values({ userId, roleId });
    });
  }

  async existsUser(userId: string): Promise<boolean> {
    const [user] = await this.db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);

    return !!user;
  }
}
