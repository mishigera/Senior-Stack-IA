# AI Service

Microservicio del bounded context **AI Assistant**. Gestiona conversaciones, generación de imágenes y capacidades RAG usando OpenAI + Qdrant.

## Responsabilidad

- CRUD básico de conversaciones y mensajes.
- Respuestas de chat por streaming SSE.
- Generación de imágenes por prompt.
- Indexación y consulta RAG con embeddings y búsqueda vectorial.

## Estructura (DDD)

- `domain/`: entidades/puertos de conversación y utilidades RAG.
- `infrastructure/`: repositorio Postgres (Drizzle ORM), OpenAPI y adaptadores externos.
- `lib/`: utilidades compartidas del servicio.
- `index.ts`: composición, validación, HTTP y orquestación de integraciones.

## Endpoints

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/health` | Estado del servicio |
| GET | `/conversations` | Lista conversaciones (requiere `Authorization: Bearer <jwt>`) |
| GET | `/conversations/:id` | Obtiene conversación + mensajes |
| POST | `/conversations` | Crea conversación |
| DELETE | `/conversations/:id` | Elimina conversación |
| POST | `/conversations/:id/messages` | Envía mensaje (SSE) |
| POST | `/generate-image` | Genera imagen con OpenAI |
| POST | `/rag/documents` | Indexa documento en Qdrant |
| POST | `/rag/query` | Ejecuta consulta RAG |

Swagger: `http://localhost:5104/docs`

## Variables de entorno

| Variable | Requerida | Default | Uso |
|---|---|---|---|
| `AI_SERVICE_PORT` | No | `5104` | Puerto principal del servicio |
| `PORT` | No | `5104` | Fallback de puerto |
| `DATABASE_URL` | Sí | — | Persistencia de conversaciones/mensajes (Postgres) |
| `QDRANT_URL` | No | `http://qdrant:6333` | Vector DB |
| `QDRANT_COLLECTION` | No | `knowledge_base` | Colección vectorial |
| `AI_INTEGRATIONS_OPENAI_API_KEY` | Requerida para chat/imagen/RAG | — | API key OpenAI |
| `AI_INTEGRATIONS_OPENAI_BASE_URL` | No | `https://api.openai.com/v1` | URL base proveedor LLM |
| `AI_CHAT_MODEL` | No | `gpt-4.1-mini` | Modelo para chat |
| `AI_RAG_MODEL` | No | `gpt-4.1-mini` | Modelo para respuesta RAG |
| `AI_EMBEDDING_MODEL` | No | `text-embedding-3-small` | Modelo de embeddings |
| `JWT_SECRET` | Sí | `your-distributed-secret-key` | Validación de JWT distribuido |

## Comportamiento importante

- Si `AI_INTEGRATIONS_OPENAI_API_KEY` no existe, endpoints de IA responden `503` de forma controlada.
- Endpoints RAG requieren disponibilidad de Qdrant; si no está listo, responden `503`.
- Todos los endpoints de negocio exigen `Authorization: Bearer <jwt>`.

## Ejecución local (desde raíz del repositorio)

```bash
npm install
npm run db:push
DATABASE_URL=postgres://postgres:postgres@localhost:5433/senior_stack_ia \
QDRANT_URL=http://localhost:6333 \
QDRANT_COLLECTION=knowledge_base \
AI_INTEGRATIONS_OPENAI_API_KEY=tu_api_key \
AI_INTEGRATIONS_OPENAI_BASE_URL=https://api.openai.com/v1 \
AI_CHAT_MODEL=gpt-4.1-mini \
AI_RAG_MODEL=gpt-4.1-mini \
AI_EMBEDDING_MODEL=text-embedding-3-small \
JWT_SECRET=change-me-jwt \
AI_SERVICE_PORT=5104 \
npx tsx services/ai-service/index.ts
```

## Ejecución compilada

```bash
npm run build:services
DATABASE_URL=postgres://postgres:postgres@localhost:5433/senior_stack_ia \
QDRANT_URL=http://localhost:6333 \
QDRANT_COLLECTION=knowledge_base \
AI_INTEGRATIONS_OPENAI_API_KEY=tu_api_key \
JWT_SECRET=change-me-jwt \
AI_SERVICE_PORT=5104 \
node services/dist/ai-service/index.js
```

## Docker

```bash
docker compose up --build ai-service postgres qdrant
```

Servicio: `http://localhost:5104`  
Health: `http://localhost:5104/health`
