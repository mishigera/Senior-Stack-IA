/**
 * OpenAPI 3 spec para Audit Service (Swagger).
 */
export const auditServiceOpenApi = {
  openapi: "3.0.3",
  info: {
    title: "Audit Service",
    description: "Consulta de logs de auditoría. Consume eventos desde RabbitMQ y persiste en MongoDB. DDD: Bounded Context Audit.",
    version: "1.0.0",
  },
  servers: [{ url: "/" }],
  paths: {
    "/health": {
      get: {
        summary: "Health check",
        responses: {
          "200": {
            description: "OK; incluye consumerReady (RabbitMQ)",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string" },
                    service: { type: "string" },
                    consumerReady: { type: "boolean" },
                    timestamp: { type: "string", format: "date-time" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/audit-logs": {
      get: {
        summary: "Listar logs de auditoría",
        parameters: [{ name: "Authorization", in: "header", required: true, schema: { type: "string" }, description: "Bearer JWT distribuido" }],
        responses: {
          "200": {
            description: "Lista de eventos (últimos 500)",
            content: {
              "application/json": {
                schema: { type: "array", items: { $ref: "#/components/schemas/AuditLog" } },
              },
            },
          },
          "401": {},
          "503": { description: "Almacenamiento no listo" },
          "500": {},
        },
      },
    },
  },
  components: {
    schemas: {
      AuditLog: {
        type: "object",
        properties: {
          id: { type: "string" },
          userId: { type: "string" },
          action: { type: "string" },
          resource: { type: "string" },
          details: { type: "string" },
          createdAt: { type: "string", format: "date-time" },
        },
      },
    },
  },
} as const;
