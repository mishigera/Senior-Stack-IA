import type { Express } from "express";
import type { ListUsersUseCase } from "../../application/list-users.use-case.js";
import type { GetUserByIdUseCase } from "../../application/get-user-by-id.use-case.js";
import { requireDistributedJwt } from "../../../lib/distributed-auth.js";

const SOURCE = "user-service";
const requireActor = requireDistributedJwt(SOURCE);

export function registerUserRoutes(
  app: Express,
  listUsers: ListUsersUseCase,
  getUserById: GetUserByIdUseCase,
): void {
  app.get("/health", (_req, res) => {
    res.status(200).json({
      status: "ok",
      service: SOURCE,
      timestamp: new Date().toISOString(),
    });
  });

  app.get("/users", requireActor, async (_req, res) => {
    try {
      const users = await listUsers.execute();
      res.status(200).json(users);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(
        JSON.stringify({ source: SOURCE, level: "error", message: "list_users_failed", error: message }),
      );
      res.status(500).json({ message: "Failed to list users" });
    }
  });

  app.get("/users/:id", requireActor, async (req, res) => {
    const rawId = req.params.id;
    const id = typeof rawId === "string" ? rawId : (Array.isArray(rawId) ? rawId[0] : "");
    try {
      const user = await getUserById.execute(id);
      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }
      res.status(200).json(user);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(
        JSON.stringify({ source: SOURCE, level: "error", message: "get_user_failed", error: message }),
      );
      res.status(500).json({ message: "Failed to get user" });
    }
  });
}
