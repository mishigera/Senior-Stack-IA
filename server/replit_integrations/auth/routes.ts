import type { Express } from "express";
import { authStorage } from "./storage";
import { optionalAuth } from "./replitAuth";
import { db } from "../../db";
import { userRoles, roles } from "@shared/schema";
import { eq } from "drizzle-orm";

export function registerAuthRoutes(app: Express): void {
  app.get("/api/auth/user", optionalAuth, async (req: any, res) => {
    try {
      if (!req.user) {
        return res.status(200).json({ user: null });
      }
      const userId = req.user.id;
      const user = await authStorage.getUser(userId);
      if (!user) {
        return res.status(200).json({ user: null });
      }
      const roleRows = await db
        .select({ name: roles.name })
        .from(userRoles)
        .innerJoin(roles, eq(userRoles.roleId, roles.id))
        .where(eq(userRoles.userId, userId));
      const roleNames = roleRows.map((r) => r.name);
      const { password: _p, ...safeUser } = user as { password?: string; [k: string]: unknown };
      return res.status(200).json({ user: { ...safeUser, roleNames } });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
}
