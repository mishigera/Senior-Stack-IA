# Role Service

Microservicio de gestión de roles del bounded context **Identity/Access**. Administra catálogo de roles y asignaciones, y publica eventos de auditoría en RabbitMQ.

## Responsabilidad

- Listar y crear roles.
- Asignar roles a usuarios.
- Publicar `AuditDomainEvent` al exchange configurado en RabbitMQ.

## Estructura (DDD)

- `domain/`: entidades y puertos (`Role`, `IRoleRepository`, `IAuditEventPublisher`).
- `application/`: casos de uso (`ListRolesUseCase`, `CreateRoleUseCase`, `AssignRoleToUserUseCase`).
- `infrastructure/`: Postgres (Drizzle ORM), publisher RabbitMQ, rutas HTTP y OpenAPI.
- `index.ts`: composición y arranque del servicio.

## Endpoints

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/health` | Estado del servicio |
| GET | `/roles` | Lista roles (requiere `Authorization: Bearer <jwt>`) |
| POST | `/roles` | Crea rol (requiere `Authorization: Bearer <jwt>`) |
| POST | `/users/:userId/roles` | Asigna rol a usuario (requiere `Authorization: Bearer <jwt>`) |

Swagger: `http://localhost:5102/docs`

## Variables de entorno

| Variable | Requerida | Default | Uso |
|---|---|---|---|
| `DATABASE_URL` | Sí | — | Conexión a Postgres |
| `RABBITMQ_URL` | No | `amqp://rabbitmq:5672` | Broker para eventos de auditoría |
| `AUDIT_EXCHANGE` | No | `audit.events` | Exchange topic de auditoría |
| `JWT_SECRET` | Sí | `your-distributed-secret-key` | Validación de JWT distribuido |
| `ROLE_SERVICE_PORT` | No | `5102` | Puerto principal del servicio |
| `PORT` | No | `5102` | Fallback de puerto |

## Ejecución local (desde raíz del repositorio)

```bash
npm install
npm run db:push
DATABASE_URL=postgres://postgres:postgres@localhost:5433/senior_stack_ia \
RABBITMQ_URL=amqp://localhost:5673 \
AUDIT_EXCHANGE=audit.events \
JWT_SECRET=change-me-jwt \
ROLE_SERVICE_PORT=5102 \
npx tsx services/role-service/index.ts
```

## Ejecución compilada

```bash
npm run build:services
DATABASE_URL=postgres://postgres:postgres@localhost:5433/senior_stack_ia \
RABBITMQ_URL=amqp://localhost:5673 \
AUDIT_EXCHANGE=audit.events \
JWT_SECRET=change-me-jwt \
ROLE_SERVICE_PORT=5102 \
node services/dist/role-service/index.js
```

## Docker

```bash
docker compose up --build role-service postgres rabbitmq
```

Servicio: `http://localhost:5102`  
Health: `http://localhost:5102/health`
