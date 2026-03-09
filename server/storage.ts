import { eq } from "drizzle-orm";
import { db } from "./db";
import { users, roles, userRoles, auditLogs, type InsertRole, type InsertUserRole, type InsertAuditLog } from "@shared/schema";

export interface IStorage {
  // Users
  getUsers(): Promise<any[]>;
  getUser(id: string): Promise<any | undefined>;
  
  // Roles
  getRoles(): Promise<any[]>;
  createRole(role: InsertRole): Promise<any>;
  assignRole(userId: string, roleId: number): Promise<void>;
  
  // Audit Logs
  getAuditLogs(): Promise<any[]>;
  createAuditLog(log: InsertAuditLog): Promise<any>;
}

export class DatabaseStorage implements IStorage {
  async getUsers() {
    return await db.select().from(users);
  }
  
  async getUser(id: string) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  
  async getRoles() {
    return await db.select().from(roles);
  }
  
  async createRole(role: InsertRole) {
    const [newRole] = await db.insert(roles).values(role).returning();
    return newRole;
  }
  
  async assignRole(userId: string, roleId: number) {
    await db.insert(userRoles).values({ userId, roleId });
  }
  
  async getAuditLogs() {
    return await db.select().from(auditLogs);
  }
  
  async createAuditLog(log: InsertAuditLog) {
    const [newLog] = await db.insert(auditLogs).values(log).returning();
    return newLog;
  }
}

export const storage = new DatabaseStorage();
