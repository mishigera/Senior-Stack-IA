import type { Express, Request, Response } from "express";
import type { Server } from "http";
import { Readable } from "stream";
import { api } from "@shared/routes";
import { z } from "zod";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || "http://user-service:5101";
const ROLE_SERVICE_URL = process.env.ROLE_SERVICE_URL || "http://role-service:5102";
const AUDIT_SERVICE_URL = process.env.AUDIT_SERVICE_URL || "http://audit-service:5103";
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://ai-service:5104";

function getActorUserId(req: Request): string | undefined {
  const user = req.user as any;
  return user?.id ?? user?.claims?.sub;
}

function normalizeParam(value: string | string[] | undefined): string | undefined {
  if (!value) return undefined;
  return Array.isArray(value) ? value[0] : value;
}

async function forwardServiceResponse(serviceResponse: globalThis.Response, res: Response) {
  const contentType = serviceResponse.headers.get("content-type");
  if (contentType) {
    res.setHeader("Content-Type", contentType);
  }

  if (!serviceResponse.body) {
    const body = await serviceResponse.text();
    return res.status(serviceResponse.status).send(body);
  }

  const textBody = await serviceResponse.text();
  return res.status(serviceResponse.status).send(textBody);
}

function handleServiceError(res: Response, serviceName: string, error: unknown) {
  console.error(
    JSON.stringify({
      source: "gateway",
      level: "error",
      message: "service_unavailable",
      serviceName,
      error: error instanceof Error ? error.message : String(error),
    }),
  );

  return res.status(502).json({ message: `${serviceName} is unavailable` });
}

function getActorHeader(req: Request): Record<string, string> | null {
  const actorUserId = getActorUserId(req);
  if (!actorUserId) {
    return null;
  }

  return {
    "x-actor-user-id": actorUserId,
  };
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.get("/api/health", (_req, res) => {
    res.status(200).json({
      status: "ok",
      timestamp: new Date().toISOString(),
      architecture: "api-gateway-microservices",
      services: {
        users: USER_SERVICE_URL,
        roles: ROLE_SERVICE_URL,
        audit: AUDIT_SERVICE_URL,
        ai: AI_SERVICE_URL,
      },
    });
  });

  // Setup Authentication
  await setupAuth(app);
  registerAuthRoutes(app);

  // User Routes
  app.get(api.users.list.path, isAuthenticated, async (req, res) => {
    const actorHeader = getActorHeader(req);
    if (!actorHeader) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const serviceResponse = await fetch(`${USER_SERVICE_URL}/users`, {
        method: "GET",
        headers: actorHeader,
      });

      return forwardServiceResponse(serviceResponse, res);
    } catch (error) {
      return handleServiceError(res, "user-service", error);
    }
  });

  app.get(api.users.get.path, isAuthenticated, async (req, res) => {
    const actorHeader = getActorHeader(req);
    const userId = normalizeParam(req.params.id);

    if (!actorHeader) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!userId) {
      return res.status(400).json({ message: "Missing user id" });
    }

    try {
      const serviceResponse = await fetch(`${USER_SERVICE_URL}/users/${encodeURIComponent(userId)}`, {
        method: "GET",
        headers: actorHeader,
      });

      return forwardServiceResponse(serviceResponse, res);
    } catch (error) {
      return handleServiceError(res, "user-service", error);
    }
  });

  // Role Routes
  app.get(api.roles.list.path, isAuthenticated, async (req, res) => {
    const actorHeader = getActorHeader(req);
    if (!actorHeader) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const serviceResponse = await fetch(`${ROLE_SERVICE_URL}/roles`, {
        method: "GET",
        headers: actorHeader,
      });

      return forwardServiceResponse(serviceResponse, res);
    } catch (error) {
      return handleServiceError(res, "role-service", error);
    }
  });

  app.post(api.roles.create.path, isAuthenticated, async (req, res) => {
    try {
      const actorHeader = getActorHeader(req);
      if (!actorHeader) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const input = api.roles.create.input.parse(req.body);

      const serviceResponse = await fetch(`${ROLE_SERVICE_URL}/roles`, {
        method: "POST",
        headers: {
          ...actorHeader,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(input),
      });

      return forwardServiceResponse(serviceResponse, res);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }

      return handleServiceError(res, "role-service", err);
    }
  });

  app.post(api.roles.assign.path, isAuthenticated, async (req, res) => {
    try {
      const actorHeader = getActorHeader(req);
      if (!actorHeader) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { roleId } = api.roles.assign.input.parse(req.body);
      const targetUserId = normalizeParam(req.params.userId);

      if (!targetUserId) {
        return res.status(400).json({ message: "Missing user id" });
      }

      const serviceResponse = await fetch(
        `${ROLE_SERVICE_URL}/users/${encodeURIComponent(targetUserId)}/roles`,
        {
          method: "POST",
          headers: {
            ...actorHeader,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ roleId }),
        },
      );

      return forwardServiceResponse(serviceResponse, res);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }

      return handleServiceError(res, "role-service", err);
    }
  });

  // Audit Log Routes
  app.get(api.audit.list.path, isAuthenticated, async (req, res) => {
    const actorHeader = getActorHeader(req);
    if (!actorHeader) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const serviceResponse = await fetch(`${AUDIT_SERVICE_URL}/audit-logs`, {
        method: "GET",
        headers: actorHeader,
      });

      return forwardServiceResponse(serviceResponse, res);
    } catch (error) {
      return handleServiceError(res, "audit-service", error);
    }
  });

  // AI Routes
  app.get("/api/conversations", isAuthenticated, async (req, res) => {
    const actorHeader = getActorHeader(req);
    if (!actorHeader) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const serviceResponse = await fetch(`${AI_SERVICE_URL}/conversations`, {
        method: "GET",
        headers: actorHeader,
      });

      return forwardServiceResponse(serviceResponse, res);
    } catch (error) {
      return handleServiceError(res, "ai-service", error);
    }
  });

  app.get("/api/conversations/:id", isAuthenticated, async (req, res) => {
    const actorHeader = getActorHeader(req);
    const conversationId = normalizeParam(req.params.id);

    if (!actorHeader) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!conversationId) {
      return res.status(400).json({ message: "Missing conversation id" });
    }

    try {
      const serviceResponse = await fetch(`${AI_SERVICE_URL}/conversations/${encodeURIComponent(conversationId)}`, {
        method: "GET",
        headers: actorHeader,
      });

      return forwardServiceResponse(serviceResponse, res);
    } catch (error) {
      return handleServiceError(res, "ai-service", error);
    }
  });

  app.post("/api/conversations", isAuthenticated, async (req, res) => {
    const actorHeader = getActorHeader(req);
    if (!actorHeader) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const serviceResponse = await fetch(`${AI_SERVICE_URL}/conversations`, {
        method: "POST",
        headers: {
          ...actorHeader,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(req.body ?? {}),
      });

      return forwardServiceResponse(serviceResponse, res);
    } catch (error) {
      return handleServiceError(res, "ai-service", error);
    }
  });

  app.delete("/api/conversations/:id", isAuthenticated, async (req, res) => {
    const actorHeader = getActorHeader(req);
    const conversationId = normalizeParam(req.params.id);

    if (!actorHeader) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!conversationId) {
      return res.status(400).json({ message: "Missing conversation id" });
    }

    try {
      const serviceResponse = await fetch(`${AI_SERVICE_URL}/conversations/${encodeURIComponent(conversationId)}`, {
        method: "DELETE",
        headers: actorHeader,
      });

      return forwardServiceResponse(serviceResponse, res);
    } catch (error) {
      return handleServiceError(res, "ai-service", error);
    }
  });

  app.post("/api/conversations/:id/messages", isAuthenticated, async (req, res) => {
    const actorHeader = getActorHeader(req);
    const conversationId = normalizeParam(req.params.id);

    if (!actorHeader) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!conversationId) {
      return res.status(400).json({ message: "Missing conversation id" });
    }

    try {
      const serviceResponse = await fetch(`${AI_SERVICE_URL}/conversations/${encodeURIComponent(conversationId)}/messages`, {
        method: "POST",
        headers: {
          ...actorHeader,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(req.body ?? {}),
      });

      res.status(serviceResponse.status);
      const contentType = serviceResponse.headers.get("content-type");
      const cacheControl = serviceResponse.headers.get("cache-control");
      const connectionHeader = serviceResponse.headers.get("connection");

      if (contentType) res.setHeader("Content-Type", contentType);
      if (cacheControl) res.setHeader("Cache-Control", cacheControl);
      if (connectionHeader) res.setHeader("Connection", connectionHeader);

      if (!serviceResponse.body) {
        const body = await serviceResponse.text();
        return res.send(body);
      }

      const stream = Readable.fromWeb(serviceResponse.body as any);
      stream.pipe(res);
      return;
    } catch (error) {
      return handleServiceError(res, "ai-service", error);
    }
  });

  app.post("/api/generate-image", isAuthenticated, async (req, res) => {
    const actorHeader = getActorHeader(req);
    if (!actorHeader) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const serviceResponse = await fetch(`${AI_SERVICE_URL}/generate-image`, {
        method: "POST",
        headers: {
          ...actorHeader,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(req.body ?? {}),
      });

      return forwardServiceResponse(serviceResponse, res);
    } catch (error) {
      return handleServiceError(res, "ai-service", error);
    }
  });

  app.post("/api/rag/documents", isAuthenticated, async (req, res) => {
    const actorHeader = getActorHeader(req);
    if (!actorHeader) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const serviceResponse = await fetch(`${AI_SERVICE_URL}/rag/documents`, {
        method: "POST",
        headers: {
          ...actorHeader,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(req.body ?? {}),
      });

      return forwardServiceResponse(serviceResponse, res);
    } catch (error) {
      return handleServiceError(res, "ai-service", error);
    }
  });

  app.post("/api/rag/query", isAuthenticated, async (req, res) => {
    const actorHeader = getActorHeader(req);
    if (!actorHeader) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const serviceResponse = await fetch(`${AI_SERVICE_URL}/rag/query`, {
        method: "POST",
        headers: {
          ...actorHeader,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(req.body ?? {}),
      });

      return forwardServiceResponse(serviceResponse, res);
    } catch (error) {
      return handleServiceError(res, "ai-service", error);
    }
  });

  return httpServer;
}
