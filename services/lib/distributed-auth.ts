import type { Request, RequestHandler } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";

declare global {
  namespace Express {
    interface Request {
      actorUserId?: string;
      actorTokenPayload?: JwtPayload;
    }
  }
}

const DEFAULT_JWT_SECRET = "your-distributed-secret-key";

function extractBearerToken(req: Request): string | null {
  const authorization = req.header("authorization");
  if (!authorization) return null;
  const [scheme, token] = authorization.split(" ");
  if (!scheme || !token || scheme.toLowerCase() !== "bearer") return null;
  return token;
}

export function getActorUserId(req: Request): string | undefined {
  return req.actorUserId;
}

export function requireDistributedJwt(source: string): RequestHandler {
  return (req, res, next) => {
    const token = extractBearerToken(req);
    if (!token) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET || DEFAULT_JWT_SECRET);
      if (!payload || typeof payload === "string" || typeof payload.sub !== "string") {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      req.actorUserId = payload.sub;
      req.actorTokenPayload = payload as JwtPayload;
      next();
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      console.error(
        JSON.stringify({
          source,
          level: "error",
          message: "jwt_validation_failed",
          error,
        }),
      );
      res.status(401).json({ message: "Unauthorized" });
    }
  };
}