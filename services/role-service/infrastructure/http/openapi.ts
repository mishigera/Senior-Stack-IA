/**
 * OpenAPI 3 spec para Role Service (Swagger).
 */
export const roleServiceOpenApi = {
  openapi: "3.0.3",
  info: {
    title: "Role Service",
    description: "Gestión de roles y asignación a usuarios. Publica eventos de auditoría vía RabbitMQ. DDD: Identity/Access.",
    version: "1.0.0",
  },
  servers: [{ url: "/" }],
  paths: {
    "/health": {
      get: { summary: "Health check", responses: { "200": { description: "OK" } } },
    },
    "/roles": {
      get: {
        summary: "Listar roles",
        parameters: [{ name: "Authorization", in: "header", required: true, schema: { type: "string" }, description: "Bearer JWT distribuido" }],
        responses: {
          "200": {
            description: "Lista de roles",
            content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Role" } } } },
          },
          "401": {},
          "500": {},
        },
      },
      post: {
        summary: "Crear rol",
        parameters: [{ name: "Authorization", in: "header", required: true, schema: { type: "string" }, description: "Bearer JWT distribuido" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { type: "object", required: ["name"], properties: { name: { type: "string" }, description: { type: "string" } } },
            },
          },
        },
        responses: {
          "201": { description: "Rol creado", content: { "application/json": { schema: { $ref: "#/components/schemas/Role" } } } },
          "400": {},
          "401": {},
          "409": { description: "Rol ya existe" },
          "500": {},
        },
      },
    },
    "/users/{userId}/roles": {
      post: {
        summary: "Asignar rol a usuario",
        parameters: [
          { name: "Authorization", in: "header", required: true, schema: { type: "string" }, description: "Bearer JWT distribuido" },
          { name: "userId", in: "path", required: true, schema: { type: "string" } },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { type: "object", required: ["roleId"], properties: { roleId: { type: "integer" } } } },
          },
        },
        responses: { "200": { description: "Rol asignado" }, "400": {}, "401": {}, "404": { description: "Usuario no encontrado" }, "500": {} },
      },
    },
  },
  components: {
    schemas: {
      Role: { type: "object", properties: { id: { type: "integer" }, name: { type: "string" }, description: { type: "string" } } },
    },
  },
} as const;
