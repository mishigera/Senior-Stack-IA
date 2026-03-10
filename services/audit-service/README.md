# Audit Service

Microservicio de auditoría del bounded context **Audit**. Consume eventos desde RabbitMQ y los persiste en MongoDB para consulta.

## Responsabilidad

- Consumir eventos del exchange de auditoría.
- Persistir logs en MongoDB.
- Exponer endpoint de consulta de auditoría para el gateway.

## Estructura (DDD)

- `domain/`: entidad y contrato (`AuditLog`, `IAuditLogRepository`).
- `application/`: caso de uso (`ListAuditLogsUseCase`).
- `infrastructure/`: repositorio Mongo, consumidor RabbitMQ, HTTP/OpenAPI.
- `index.ts`: inicialización de Mongo + consumer + servidor HTTP.

## Endpoints

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/health` | Estado del servicio (`consumerReady` incluido) |
| GET | `/audit-logs` | Lista últimos logs (requiere `x-actor-user-id`) |

Swagger: `http://localhost:5103/docs`

## Variables de entorno

| Variable | Requerida | Default | Uso |
|---|---|---|---|
| `AUDIT_SERVICE_PORT` | No | `5103` | Puerto principal del servicio |
| `PORT` | No | `5103` | Fallback de puerto |
| `RABBITMQ_URL` | No | `amqp://rabbitmq:5672` | Broker de eventos |
| `AUDIT_EXCHANGE` | No | `audit.events` | Exchange topic |
| `AUDIT_QUEUE` | No | `audit.logs` | Cola de consumo |
| `MONGODB_URL` | No | `mongodb://admin:admin@mongodb:27017` | Conexión Mongo |
| `MONGODB_DB` | No | `senior_stack_ia` | Base Mongo |
| `MONGODB_AUDIT_COLLECTION` | No | `audit_logs` | Colección de auditoría |

## Ejecución local (desde raíz del repositorio)

```bash
npm install
AUDIT_SERVICE_PORT=5103 \
RABBITMQ_URL=amqp://localhost:5673 \
AUDIT_EXCHANGE=audit.events \
AUDIT_QUEUE=audit.logs \
MONGODB_URL=mongodb://admin:admin@localhost:27018 \
MONGODB_DB=senior_stack_ia \
MONGODB_AUDIT_COLLECTION=audit_logs \
npx tsx services/audit-service/index.ts
```

## Ejecución compilada

```bash
npm run build:services
AUDIT_SERVICE_PORT=5103 \
RABBITMQ_URL=amqp://localhost:5673 \
AUDIT_EXCHANGE=audit.events \
AUDIT_QUEUE=audit.logs \
MONGODB_URL=mongodb://admin:admin@localhost:27018 \
MONGODB_DB=senior_stack_ia \
MONGODB_AUDIT_COLLECTION=audit_logs \
node services/dist/audit-service/index.js
```

## Docker

```bash
docker compose up --build audit-service rabbitmq mongodb
```

Servicio: `http://localhost:5103`  
Health: `http://localhost:5103/health`
