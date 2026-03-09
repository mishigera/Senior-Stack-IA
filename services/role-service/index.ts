import express from "express";
import pg from "pg";
import swaggerUi from "swagger-ui-express";
import { ListRolesUseCase } from "./application/list-roles.use-case.js";
import { CreateRoleUseCase } from "./application/create-role.use-case.js";
import { AssignRoleToUserUseCase } from "./application/assign-role-to-user.use-case.js";
import { RolePgRepository } from "./infrastructure/persistence/role.pg.repository.js";
import { RabbitMQAuditPublisher } from "./infrastructure/messaging/rabbitmq-audit.publisher.js";
import { registerRoleRoutes } from "./infrastructure/http/role.routes.js";
import { roleServiceOpenApi } from "./infrastructure/http/openapi.js";

const port = parseInt(process.env.ROLE_SERVICE_PORT ?? process.env.PORT ?? "5102", 10);
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const rabbitmqUrl = process.env.RABBITMQ_URL ?? "amqp://rabbitmq:5672";
const auditExchange = process.env.AUDIT_EXCHANGE ?? "audit.events";

const roleRepository = new RolePgRepository(pool);
const auditPublisher = new RabbitMQAuditPublisher(rabbitmqUrl, auditExchange);

const listRolesUseCase = new ListRolesUseCase(roleRepository);
const createRoleUseCase = new CreateRoleUseCase(roleRepository, auditPublisher);
const assignRoleToUserUseCase = new AssignRoleToUserUseCase(roleRepository, auditPublisher);

const app = express();
app.use(express.json());

app.use("/docs", swaggerUi.serve, swaggerUi.setup(roleServiceOpenApi as object, {
  customCss: ".swagger-ui .topbar { display: none }",
  customSiteTitle: "Role Service – API Docs",
}));

registerRoleRoutes(app, listRolesUseCase, createRoleUseCase, assignRoleToUserUseCase);

app.listen(port, "0.0.0.0", () => {
  console.log(JSON.stringify({ source: "role-service", message: `listening_on_${port}` }));
});
