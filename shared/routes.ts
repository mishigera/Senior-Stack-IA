import { z } from "zod";
import { insertRoleSchema, roles, users, auditLogs } from "./schema";

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
};

export const api = {
  auth: {
    register: {
      method: "POST" as const,
      path: "/api/register" as const,
      input: z.object({
        username: z.string().min(3),
        password: z.string().min(6),
        email: z.string().email(),
      }),
      responses: {
        201: z.any(),
        400: errorSchemas.validation,
      },
    },
    login: {
      method: "POST" as const,
      path: "/api/login" as const,
      input: z.object({
        username: z.string(),
        password: z.string(),
      }),
      responses: {
        200: z.any(),
        401: errorSchemas.unauthorized,
      },
    },
    logout: {
      method: "POST" as const,
      path: "/api/logout" as const,
      responses: {
        200: z.any(),
      },
    },
    user: {
      method: "GET" as const,
      path: "/api/auth/user" as const,
      responses: {
        200: z.any(),
        401: errorSchemas.unauthorized,
      },
    }
  },
  users: {
    list: {
      method: "GET" as const,
      path: "/api/users" as const,
      responses: {
        200: z.array(z.any()),
        401: errorSchemas.unauthorized,
      },
    },
    get: {
      method: "GET" as const,
      path: "/api/users/:id" as const,
      responses: {
        200: z.any(),
        404: errorSchemas.notFound,
        401: errorSchemas.unauthorized,
      },
    },
  },
  roles: {
    list: {
      method: "GET" as const,
      path: "/api/roles" as const,
      responses: {
        200: z.array(z.any()),
        401: errorSchemas.unauthorized,
      },
    },
    create: {
      method: "POST" as const,
      path: "/api/roles" as const,
      input: insertRoleSchema,
      responses: {
        201: z.any(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },
    assign: {
      method: "POST" as const,
      path: "/api/users/:userId/roles" as const,
      input: z.object({ roleId: z.number() }),
      responses: {
        200: z.object({ message: z.string() }),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
        401: errorSchemas.unauthorized,
      },
    }
  },
  audit: {
    list: {
      method: "GET" as const,
      path: "/api/audit-logs" as const,
      responses: {
        200: z.array(z.any()),
        401: errorSchemas.unauthorized,
      },
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
