# Senior-Stack-IA

Plataforma full-stack para gestión de usuarios con arquitectura de microservicios, mensajería asíncrona y agente IA con RAG.

## Arquitectura implementada

- `app`: API Gateway/BFF + autenticación
- `user-service`: consulta de usuarios + caché Redis
- `role-service`: alta/asignación de roles + publicación de eventos a RabbitMQ
- `audit-service`: consumo de eventos + persistencia de auditoría en MongoDB
- `ai-service`: chat, generación de imagen y RAG con Qdrant
- Infra: `postgres`, `redis`, `mongodb`, `rabbitmq`, `qdrant`

Detalles: [docs/architecture.md](docs/architecture.md)

## Requisitos

- Docker + Docker Compose

## Levantar con Docker

1. Crear `.env` desde `.env.example`:

```bash
cp .env.example .env
```

2. Construir y levantar toda la plataforma:

```bash
docker compose up --build
```

3. Endpoints útiles:

- App/Gateway: http://localhost:8080
- Health Gateway: http://localhost:8080/api/health
- RabbitMQ UI: http://localhost:15673
- Qdrant API: http://localhost:6333

## Variables de entorno clave

- `DATABASE_URL`, `JWT_SECRET`, `SESSION_SECRET`, `SESSION_COOKIE_SECURE`
- `AI_INTEGRATIONS_OPENAI_API_KEY`, `AI_INTEGRATIONS_OPENAI_BASE_URL`
- `AI_CHAT_MODEL`, `AI_RAG_MODEL`, `AI_EMBEDDING_MODEL`
- Puertos host (`APP_HOST_PORT`, `POSTGRES_HOST_PORT`, etc.)

## Tests

```bash
npm run test:all      # Backend + frontend
npm test              # Solo backend (node:test – 14 tests)
npm run test:frontend # Solo frontend (vitest – 30 tests)
npm run test:coverage # Cobertura backend + frontend (reportes en coverage/)
```

- Cobertura: `npm run test:coverage`. Backend (c8) sobre `services/**/*.js`; frontend (Vitest) con umbral 70% en `client/src/lib`. Ver [docs/coverage-report.md](docs/coverage-report.md).

## State management (front-end)

- **TanStack React Query:** estado de servidor (usuarios, roles, auditoría, conversaciones, auth).
- **Zustand:** estado de cliente/UI (p. ej. panel de conversaciones colapsado en la página Agent). Store: `client/src/store/ui-store.ts`.

## Microservicios (TypeScript + DDD)

Los microservicios están en `services/` en **TypeScript** con **Domain-Driven Design** y **Swagger** en cada uno.

- Compilar: `npm run build:services` (genera `services/dist/`).
- Con Docker, se compilan en la imagen y se ejecutan desde `services/dist/<servicio>/index.js`.
- Documentación Swagger por servicio:
  - User: http://localhost:5101/docs
  - Role: http://localhost:5102/docs
  - Audit: http://localhost:5103/docs
  - AI: http://localhost:5104/docs
- Gateway (API unificada): http://localhost:8080/api-docs

Detalle de capas DDD y rutas: [docs/microservices-ddd-swagger.md](docs/microservices-ddd-swagger.md).

## Notas operativas

- `app` ejecuta `npm run db:push` al iniciar para alinear esquema en Postgres.
- Sin API key de OpenAI, los endpoints IA responden `503` controlado (no se cae la plataforma).
- Passwords hasheados con `scrypt` (crypto nativo Node.js) y nunca expuestos en respuestas API.

## Entregables de la prueba

- Cobertura global: [docs/coverage-report.md](docs/coverage-report.md)
- Arquitectura y decisiones: [docs/architecture.md](docs/architecture.md)
- Prompt engineering: [docs/prompt-engineering.md](docs/prompt-engineering.md)
- Diagnóstico bajo presión: [docs/incident-diagnosis.md](docs/incident-diagnosis.md)
- API de RAG: [docs/rag-api.md](docs/rag-api.md)
