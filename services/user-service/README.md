# User Service

Microservicio de consulta de usuarios del bounded context **Identity/Access**. Expone endpoints de lectura y aplica caché en Redis (opcional).

## Responsabilidad

- Exponer usuarios públicos (sin contraseña).
- Validar autenticación técnica con el header `x-actor-user-id`.
- Reducir latencia con caché Redis (`TTL = 30s`) cuando está disponible.

## Estructura (DDD)

- `domain/`: entidades y contratos (`User`, `UserPublic`, `IUserRepository`).
- `application/`: casos de uso (`ListUsersUseCase`, `GetUserByIdUseCase`).
- `infrastructure/`: adaptadores HTTP, Postgres y caché Redis.
- `index.ts`: composición y arranque del servicio.

## Endpoints

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/health` | Estado del servicio |
| GET | `/users` | Lista usuarios (requiere `x-actor-user-id`) |
| GET | `/users/:id` | Obtiene usuario por id (requiere `x-actor-user-id`) |

Swagger: `http://localhost:5101/docs`

## Variables de entorno

| Variable | Requerida | Default | Uso |
|---|---|---|---|
| `DATABASE_URL` | Sí | — | Conexión a Postgres |
| `REDIS_URL` | No | — | Habilita caché en Redis |
| `USER_SERVICE_PORT` | No | `5101` | Puerto principal del servicio |
| `PORT` | No | `5101` | Fallback de puerto |

## Ejecución local (desde raíz del repositorio)

```bash
npm install
npm run db:push
DATABASE_URL=postgres://postgres:postgres@localhost:5433/senior_stack_ia \
REDIS_URL=redis://localhost:6380 \
USER_SERVICE_PORT=5101 \
npx tsx services/user-service/index.ts
```

## Ejecución compilada

```bash
npm run build:services
DATABASE_URL=postgres://postgres:postgres@localhost:5433/senior_stack_ia \
REDIS_URL=redis://localhost:6380 \
USER_SERVICE_PORT=5101 \
node services/dist/user-service/index.js
```

## Docker

```bash
docker compose up --build user-service postgres redis
```

Servicio: `http://localhost:5101`  
Health: `http://localhost:5101/health`
