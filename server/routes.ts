import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import { registerChatRoutes } from "./replit_integrations/chat";
import { registerImageRoutes } from "./replit_integrations/image";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup Authentication
  await setupAuth(app);
  registerAuthRoutes(app);

  // Setup Integrations
  registerChatRoutes(app);
  registerImageRoutes(app);

  // User Routes
  app.get(api.users.list.path, isAuthenticated, async (req, res) => {
    const users = await storage.getUsers();
    res.json(users);
  });

  app.get(api.users.get.path, isAuthenticated, async (req, res) => {
    const user = await storage.getUser(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  });

  // Role Routes
  app.get(api.roles.list.path, isAuthenticated, async (req, res) => {
    const roles = await storage.getRoles();
    res.json(roles);
  });

  app.post(api.roles.create.path, isAuthenticated, async (req, res) => {
    try {
      const input = api.roles.create.input.parse(req.body);
      const role = await storage.createRole(input);
      
      // Audit log
      const userId = (req.user as any)?.claims?.sub;
      if (userId) {
         await storage.createAuditLog({
           userId,
           action: "CREATE_ROLE",
           resource: "ROLE",
           details: `Role created: ${role.name}`
         });
      }

      res.status(201).json(role);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.post(api.roles.assign.path, isAuthenticated, async (req, res) => {
    try {
      const { roleId } = api.roles.assign.input.parse(req.body);
      const targetUserId = req.params.userId;
      
      const targetUser = await storage.getUser(targetUserId);
      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }

      await storage.assignRole(targetUserId, roleId);

      // Audit log
      const currentUserId = (req.user as any)?.claims?.sub;
      if (currentUserId) {
         await storage.createAuditLog({
           userId: currentUserId,
           action: "ASSIGN_ROLE",
           resource: "USER_ROLE",
           details: `Assigned role ${roleId} to user ${targetUserId}`
         });
      }

      res.status(200).json({ message: "Role assigned successfully" });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  // Audit Log Routes
  app.get(api.audit.list.path, isAuthenticated, async (req, res) => {
    const logs = await storage.getAuditLogs();
    res.json(logs);
  });

  return httpServer;
}
