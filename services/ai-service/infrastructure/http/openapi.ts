/**
 * OpenAPI 3 spec para AI Service (Swagger).
 */
export const aiServiceOpenApi = {
  openapi: "3.0.3",
  info: {
    title: "AI Service",
    description: "Chat, generación de imagen y RAG (Qdrant + OpenAI). DDD: Bounded Context AI Assistant.",
    version: "1.0.0",
  },
  servers: [{ url: "/" }],
  paths: {
    "/health": { get: { summary: "Health check", responses: { "200": { description: "OK" } } } },
    "/conversations": {
      get: {
        summary: "Listar conversaciones",
        parameters: [{ name: "Authorization", in: "header", required: true, schema: { type: "string" }, description: "Bearer JWT distribuido" }],
        responses: {
          "200": {
            description: "Lista",
            content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Conversation" } } } },
          },
          "401": {},
          "500": {},
        },
      },
      post: {
        summary: "Crear conversación",
        parameters: [{ name: "Authorization", in: "header", required: true, schema: { type: "string" }, description: "Bearer JWT distribuido" }],
        requestBody: { content: { "application/json": { schema: { type: "object", properties: { title: { type: "string" } } } } } },
        responses: { "201": { content: { "application/json": { schema: { $ref: "#/components/schemas/Conversation" } } } }, "401": {}, "500": {} },
      },
    },
    "/conversations/{id}": {
      get: {
        summary: "Obtener conversación con mensajes",
        parameters: [
          { name: "Authorization", in: "header", required: true, schema: { type: "string" }, description: "Bearer JWT distribuido" },
          { name: "id", in: "path", required: true, schema: { type: "integer" } },
        ],
        responses: {
          "200": { content: { "application/json": { schema: { type: "object", properties: { id: {}, title: {}, createdAt: {}, messages: { type: "array" } } } } } },
          "401": {},
          "404": {},
          "500": {},
        },
      },
      delete: {
        summary: "Eliminar conversación",
        parameters: [
          { name: "Authorization", in: "header", required: true, schema: { type: "string" }, description: "Bearer JWT distribuido" },
          { name: "id", in: "path", required: true, schema: { type: "integer" } },
        ],
        responses: { "204": {}, "401": {}, "500": {} },
      },
    },
    "/conversations/{id}/messages": {
      post: {
        summary: "Enviar mensaje (streaming SSE)",
        parameters: [
          { name: "Authorization", in: "header", required: true, schema: { type: "string" }, description: "Bearer JWT distribuido" },
          { name: "id", in: "path", required: true, schema: { type: "integer" } },
        ],
        requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["content"], properties: { content: { type: "string" } } } } } },
        responses: { "200": { description: "text/event-stream" }, "400": {}, "401": {}, "500": {}, "503": {} },
      },
    },
    "/generate-image": {
      post: {
        summary: "Generar imagen (OpenAI)",
        parameters: [{ name: "Authorization", in: "header", required: true, schema: { type: "string" }, description: "Bearer JWT distribuido" }],
        requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["prompt"], properties: { prompt: { type: "string" }, size: { type: "string" } } } } } },
        responses: { "200": { content: { "application/json": { schema: { type: "object", properties: { url: {}, b64_json: {} } } } } }, "400": {}, "401": {}, "500": {}, "503": {} },
      },
    },
    "/rag/documents": {
      post: {
        summary: "Indexar documento para RAG",
        parameters: [{ name: "Authorization", in: "header", required: true, schema: { type: "string" }, description: "Bearer JWT distribuido" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { type: "object", required: ["text"], properties: { id: { type: "string" }, text: { type: "string" }, metadata: { type: "object" } } },
            },
          },
        },
        responses: { "201": { description: "indexed" }, "400": {}, "401": {}, "502": {}, "503": {} },
      },
    },
    "/rag/query": {
      post: {
        summary: "Consulta RAG",
        parameters: [{ name: "Authorization", in: "header", required: true, schema: { type: "string" }, description: "Bearer JWT distribuido" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { type: "object", required: ["query"], properties: { query: { type: "string" }, topK: { type: "integer", minimum: 1, maximum: 10 } } },
            },
          },
        },
        responses: {
          "200": {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { answer: {}, contextDocuments: {}, metrics: { type: "object", properties: { latencyMs: {}, tokens: {}, quality: { type: "object", properties: { valid: { type: "boolean" }, checks: {} } } } } },
                },
              },
            },
          },
          "400": {}, "401": {}, "502": {}, "503": {},
        },
      },
    },
  },
  components: {
    schemas: {
      Conversation: { type: "object", properties: { id: { type: "integer" }, title: { type: "string" }, createdAt: { type: "string", format: "date-time" } } },
      Message: { type: "object", properties: { id: {}, conversationId: {}, role: {}, content: {}, createdAt: {} } },
    },
  },
} as const;
