import type { Express, Request, Response } from "express";
import { z } from "zod";
import type { ListRolesUseCase } from "../../application/list-roles.use-case.js";
import type { CreateRoleUseCase } from "../../application/create-role.use-case.js";
import type { AssignRoleToUserUseCase } from "../../application/assign-role-to-user.use-case.js";
import { AssignRoleError } from "../../application/assign-role-to-user.use-case.js";

const SOURCE = "role-service";
const createRoleSchema = z.object({ name: z.string().min(1), description: z.string().optional().nullable() });
const assignRoleSchema = z.object({ roleId: z.number().int().positive() });

function requireActor(req: Request, res: Response, next: () => void): void {
  if (!req.header("x-actor-user-id")) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
  next();
}

export function registerRoleRoutes(
  app: Express,
  listRoles: ListRolesUseCase,
  createRole: CreateRoleUseCase,
  assignRoleToUser: AssignRoleToUserUseCase,
): void {
  app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok", service: SOURCE, timestamp: new Date().toISOString() });
  });

  app.get("/roles", requireActor, async (_req, res) => {
    try {
      const roles = await listRoles.execute();
      res.status(200).json(roles);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(JSON.stringify({ source: SOURCE, level: "error", message: "list_roles_failed", error: msg }));
      res.status(500).json({ message: "Failed to list roles" });
    }
  });

  app.post("/roles", requireActor, async (req, res) => {
    try {
      const input = createRoleSchema.parse(req.body);
      const actorUserId = req.header("x-actor-user-id") ?? undefined;
      const role = await createRole.execute(
        { name: input.name, description: input.description ?? null },
        actorUserId,
      );
      res.status(201).json(role);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0]?.message ?? "Invalid request" });
        return;
      }
      if (err && typeof err === "object" && "code" in err && (err as { code: string }).code === "23505") {
        res.status(409).json({ message: "Role already exists" });
        return;
      }
      const msg = err instanceof Error ? err.message : String(err);
      console.error(JSON.stringify({ source: SOURCE, level: "error", message: "create_role_failed", error: msg }));
      res.status(500).json({ message: "Failed to create role" });
    }
  });

  app.post("/users/:userId/roles", requireActor, async (req, res) => {
    try {
      const rawUserId = req.params.userId;
      const userId = typeof rawUserId === "string" ? rawUserId : (Array.isArray(rawUserId) ? rawUserId[0] : "");
      const { roleId } = assignRoleSchema.parse(req.body);
      const actorUserId = req.header("x-actor-user-id") ?? undefined;
      await assignRoleToUser.execute(userId, roleId, actorUserId);
      res.status(200).json({ message: "Role assigned successfully" });
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0]?.message ?? "Invalid request" });
        return;
      }
      if (err instanceof AssignRoleError) {
        res.status(err.code).json({ message: err.message });
        return;
      }
      const msg = err instanceof Error ? err.message : String(err);
      console.error(JSON.stringify({ source: SOURCE, level: "error", message: "assign_role_failed", error: msg }));
      res.status(500).json({ message: "Failed to assign role" });
    }
  });
}
