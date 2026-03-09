# Microservicios – DDD y Swagger

Los microservicios están implementados en **TypeScript** con **Domain-Driven Design (DDD)** y documentación **OpenAPI (Swagger)** en cada uno.

## Estructura DDD por servicio

Cada microservicio sigue capas claras:

- **domain/** – Entidades, value objects, eventos de dominio y **puertos** (interfaces de repositorios/adaptadores).
- **application/** – Casos de uso que orquestan la lógica de dominio y usan los puertos.
- **infrastructure/** – Adaptadores: persistencia (PG/Mongo), mensajería (RabbitMQ), HTTP (Express + Swagger).

### User Service (puerto 5101)

| Capa | Contenido |
|------|-----------|
| Domain | `User`, `UserPublic`, `IUserRepository` |
| Application | `ListUsersUseCase`, `GetUserByIdUseCase` |
| Infrastructure | `UserPgRepository`, `CachedUserRepository` (Redis), rutas HTTP, OpenAPI |

- **Swagger:** `http://localhost:5101/docs`

### Role Service (puerto 5102)

| Capa | Contenido |
|------|-----------|
| Domain | `Role`, `AuditDomainEvent`, `buildAuditEvent`, `IRoleRepository`, `IAuditEventPublisher` |
| Application | `ListRolesUseCase`, `CreateRoleUseCase`, `AssignRoleToUserUseCase` |
| Infrastructure | `RolePgRepository`, `RabbitMQAuditPublisher`, rutas HTTP, OpenAPI |

- **Swagger:** `http://localhost:5102/docs`

### Audit Service (puerto 5103)

| Capa | Contenido |
|------|-----------|
| Domain | `AuditLog`, `IAuditLogRepository` |
| Application | `ListAuditLogsUseCase` |
| Infrastructure | `AuditMongoRepository`, consumidor RabbitMQ, rutas HTTP, OpenAPI |

- **Swagger:** `http://localhost:5103/docs`

### AI Service (puerto 5104)

| Capa | Contenido |
|------|-----------|
| Domain | `Conversation`, `Message`, `IConversationRepository`, `buildRagSystemPrompt`, `buildRagUserPrompt`, `RagContextDocument` |
| Application | Casos de uso implícitos en el index (list/create/delete conversaciones, mensajes, RAG, imagen) |
| Infrastructure | `ConversationPgRepository`, cliente OpenAI, Qdrant, rutas HTTP, OpenAPI |

- **Swagger:** `http://localhost:5104/docs`

## API Gateway (BFF)

- **Swagger:** `http://localhost:8080/api-docs` (o el puerto configurado en `APP_HOST_PORT`).

Documenta todos los endpoints que expone el gateway hacia el frontend (auth, users, roles, audit, conversations, RAG, etc.).

## Build y ejecución

```bash
# Compilar microservicios (TypeScript → JavaScript en services/dist/)
npm run build:services

# Con Docker, el Dockerfile.service compila y ejecuta los .js generados
docker compose up --build
```

Los contenedores arrancan los servicios desde `services/dist/<servicio>/index.js`.

## Principios DDD aplicados

- **Bounded contexts:** Identity/Access (user, role), Audit, AI Assistant.
- **Puertos y adaptadores:** Repositorios y publicadores definidos como interfaces en domain; la infraestructura los implementa.
- **Eventos de dominio:** En role-service, `AuditDomainEvent` se publica de forma asíncrona vía RabbitMQ; audit-service los consume y persiste.
- **Sin lógica de dominio en HTTP:** Las rutas solo validan entrada, llaman casos de uso y formatean respuestas.
