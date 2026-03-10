import { users, roles, userRoles, type User, type InsertUser } from "@shared/schema";
import { db } from "../../db";
import { eq, sql } from "drizzle-orm";

export interface IAuthStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  upsertUser(user: any): Promise<User>;
}

class AuthStorage implements IAuthStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const user = await db.transaction(async (tx) => {
      const [createdUser] = await tx.insert(users).values(userData).returning();

      const [existingAdminRole] = await tx
        .select({ id: roles.id })
        .from(roles)
        .where(sql`lower(${roles.name}) = 'admin'`)
        .limit(1);

      const adminRole =
        existingAdminRole ??
        (
          await tx
            .insert(roles)
            .values({
              name: "Admin",
              description: "Full access to the system",
            })
            .returning({ id: roles.id })
        )[0];

      await tx.insert(userRoles).values({
        userId: createdUser.id,
        roleId: adminRole.id,
      });

      return createdUser;
    });

    return user;
  }

  async upsertUser(userData: any): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: { ...userData, updatedAt: new Date() },
      })
      .returning();
    return user;
  }
}

export const authStorage = new AuthStorage();
