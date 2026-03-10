/**
 * OpenAPI 3 spec para User Service (Swagger UI).
 */
export const userServiceOpenApi = {
  openapi: "3.0.3",
  info: {
    title: "User Service",
    description: "Consulta de usuarios con caché Redis. DDD: dominio Identity/Access.",
    version: "1.0.0",
  },
  servers: [{ url: "/" }],
  paths: {
    "/health": {
      get: {
        summary: "Health check",
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string" },
                    service: { type: "string" },
                    timestamp: { type: "string", format: "date-time" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/users": {
      get: {
        summary: "Listar usuarios",
        parameters: [
          {
            name: "Authorization",
            in: "header",
            required: true,
            schema: { type: "string" },
            description: "Bearer JWT distribuido (Authorization: Bearer <token>)",
          },
        ],
        responses: {
          "200": {
            description: "Lista de usuarios (sin password)",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/UserPublic" },
                },
              },
            },
          },
          "401": { description: "Falta Authorization Bearer token" },
          "500": { description: "Error interno" },
        },
      },
    },
    "/users/{id}": {
      get: {
        summary: "Obtener usuario por ID",
        parameters: [
          { name: "Authorization", in: "header", required: true, schema: { type: "string" }, description: "Bearer JWT distribuido" },
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          "200": {
            description: "Usuario",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/UserPublic" } },
            },
          },
          "401": { description: "No autorizado" },
          "404": { description: "Usuario no encontrado" },
          "500": { description: "Error interno" },
        },
      },
    },
  },
  components: {
    schemas: {
      UserPublic: {
        type: "object",
        properties: {
          id: { type: "string" },
          username: { type: "string" },
          email: { type: "string" },
          firstName: { type: "string" },
          lastName: { type: "string" },
          profileImageUrl: { type: "string" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
    },
  },
} as const;
